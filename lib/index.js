// @deepseek-ai/dsh-session-cleaner — host half.
//
// Serves the browser surface (see lib/client.js) with three HTTP endpoints on
// the profile's webserver:
//   GET  /api/session-cleaner/sessions  — every known session with metadata
//   POST /api/session-cleaner/delete    — { sessionIds, includeLive? }
//   POST /api/session-cleaner/archive   — { sessionIds } (archive = hide, keep data)
//
// Deletion semantics:
//   * Non-live sessions: the on-disk session directory is removed, the
//     projection-cache record is dropped, workspace.json accounting is
//     cleaned, and `api-session/removed` refreshes the live UI.
//   * Live sessions (currently held in memory, i.e. opened during this app
//     run): refused unless the request opts in with includeLive: true. When
//     opted in, background activity is stopped, the log is flushed, and the
//     directory is removed; the in-memory conversation keeps working until
//     the app restarts, after which the conversation is gone.
import { Service } from "@deepseek-ai/cordis";
import { promises as fsp } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LIST_PATH = "/api/session-cleaner/sessions";
const DELETE_PATH = "/api/session-cleaner/delete";
const ARCHIVE_PATH = "/api/session-cleaner/archive";
const MAX_BODY_BYTES = 1 << 20;

const SESSION_ID_PATTERN = /^session-[0-9a-zA-Z-]{8,}$/;

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  res.end(body);
}

async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error("request body too large");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export default class SessionCleaner extends Service {
  _routeDisposers = [];

  constructor(ctx, config) {
    super(ctx, "sessionCleaner");
    // Register routes as soon as the webserver is visible. This row declares
    // no inject, so it may activate before the webserver row mounts; the
    // `internal/service` hook covers that case (it fires whenever a service
    // is provided), and the handlers re-check as a last resort.
    this.tryRegisterRoutes();
    ctx.on("internal/service", () => {
      this.tryRegisterRoutes();
    });
    ctx.effect(() => () => {
      for (const dispose of this._routeDisposers) {
        try {
          dispose();
        } catch {
          /* already gone */
        }
      }
      this._routeDisposers = [];
    }, "session-cleaner: web routes");
  }

  tryRegisterRoutes() {
    if (this._routesRegistered) return true;
    const webServer = this.ctx.get("webServer");
    if (webServer === void 0) return false;
    try {
      this._routeDisposers.push(webServer.register({
        kind: "exact",
        path: LIST_PATH,
        handler: (req, res) => this.handleList(req, res),
      }));
      this._routeDisposers.push(webServer.register({
        kind: "exact",
        path: DELETE_PATH,
        handler: (req, res) => this.handleDelete(req, res),
      }));
      this._routeDisposers.push(webServer.register({
        kind: "exact",
        path: ARCHIVE_PATH,
        handler: (req, res) => this.handleArchive(req, res),
      }));
    } catch (error) {
      this.ctx.logger.warn(`session-cleaner: route registration failed: ${error}`);
      return false;
    }
    this._routesRegistered = true;
    return true;
  }

  ensureRoutes() {
    return this._routesRegistered || this.tryRegisterRoutes();
  }

  /** The harness home (sessions live under <home>/sessions). */
  home() {
    const profileContext = this.ctx.get("profileContext");
    if (profileContext?.home) return profileContext.home;
    if (process.env.DSH_HOME) return process.env.DSH_HOME;
    return join(homedir(), ".dsh");
  }

  async handleList(req, res) {
    if (!this.ensureRoutes()) {
      json(res, 503, { ok: false, error: "web server unavailable" });
      return;
    }
    try {
      const sessions = await this.collectSessions();
      json(res, 200, { ok: true, sessions });
    } catch (error) {
      this.ctx.logger.error(`session-cleaner: list failed: ${error}`);
      json(res, 500, { ok: false, error: String(error) });
    }
  }

  async handleDelete(req, res) {
    if (!this.ensureRoutes()) {
      json(res, 503, { ok: false, error: "web server unavailable" });
      return;
    }
    try {
      const body = await readJsonBody(req);
      const ids = Array.isArray(body.sessionIds)
        ? body.sessionIds.filter((id) => typeof id === "string")
        : [];
      const includeLive = body.includeLive === true;
      const results = [];
      for (const id of ids) results.push(await this.deleteOne(id, includeLive));
      const deleted = results.filter((result) => result.ok).length;
      json(res, 200, { ok: true, results, deleted, skipped: results.length - deleted });
    } catch (error) {
      this.ctx.logger.error(`session-cleaner: delete failed: ${error}`);
      json(res, 400, { ok: false, error: String(error) });
    }
  }

  async handleArchive(req, res) {
    if (!this.ensureRoutes()) {
      json(res, 503, { ok: false, error: "web server unavailable" });
      return;
    }
    try {
      const body = await readJsonBody(req);
      const ids = Array.isArray(body.sessionIds)
        ? body.sessionIds.filter((id) => typeof id === "string")
        : [];
      const registry = this.ctx.get("workspaceRegistry");
      if (registry === void 0) {
        json(res, 500, { ok: false, error: "workspace registry unavailable" });
        return;
      }
      const results = [];
      for (const id of ids) {
        try {
          await registry.archiveSession(id, { stopActivity: true });
          results.push({ id, ok: true });
        } catch (error) {
          results.push({ id, ok: false, reason: String(error) });
        }
      }
      json(res, 200, { ok: true, results });
    } catch (error) {
      this.ctx.logger.error(`session-cleaner: archive failed: ${error}`);
      json(res, 400, { ok: false, error: String(error) });
    }
  }

  async collectSessions() {
    const persistence = this.ctx.get("sessionPersistence");
    const registry = this.ctx.get("workspaceRegistry");
    const sessionStore = this.ctx.get("sessions");
    const agents = this.ctx.get("agents");
    const storageDomain = this.ctx.get("storageDomain");

    if (persistence === void 0) throw new Error("session persistence unavailable");

    const snapshots = await persistence.list();
    const liveIds = new Set(sessionStore?.list().map((session) => session.id) ?? []);
    const archived = new Set(registry?.archivedSessionIds ?? []);
    const pinned = new Set(registry?.pinnedSessionIds ?? []);

    const wsBySession = new Map();
    for (const workspace of registry?.list() ?? []) {
      for (const sessionId of workspace.sessionIds) {
        if (!wsBySession.has(sessionId)) {
          wsBySession.set(sessionId, {
            id: workspace.id,
            title: workspace.title,
            path: workspace.path,
          });
        }
      }
    }

    let projTable;
    try {
      projTable = storageDomain?.get("session_projcache")?.table("sessions");
    } catch {
      projTable = void 0;
    }

    const sessions = snapshots.map((snapshot) => {
      const { header } = snapshot;
      const id = header.id;
      const projection = typeof projTable?.get === "function" ? projTable.get(id) : void 0;
      const rows = projection?.rows ?? projection?.record?.rows ?? {};
      const titleVal = rows.title?.val;
      const firstPrompt = rows.titleInput?.val?.first?.text;
      const stats = rows.sessionStats?.val;
      const usage = rows.tokenUsage?.val?.totals;
      const meta = rows.sessionListMetadata?.val;
      const agent = agents?.get(id);
      return {
        id,
        title: typeof titleVal === "string" && titleVal.length > 0
          ? titleVal
          : typeof firstPrompt === "string" && firstPrompt.length > 0
            ? firstPrompt.slice(0, 120)
            : "未命名对话",
        cwd: header.cwd ?? null,
        createdAt: header.createdAt ?? null,
        lastPromptAt: typeof meta?.lastPromptAt === "number" ? meta.lastPromptAt : null,
        sizeBytes: typeof snapshot.sizeBytes === "number" ? snapshot.sizeBytes : 0,
        turns: typeof stats?.turns === "number" ? stats.turns : null,
        outputTokens: typeof usage?.outputTokens === "number" ? usage.outputTokens : null,
        workspace: wsBySession.get(id) ?? null,
        archived: archived.has(id),
        pinned: pinned.has(id),
        live: liveIds.has(id),
        running: agent?.status === "running",
      };
    });

    sessions.sort((left, right) => {
      const l = left.lastPromptAt ?? left.createdAt ?? 0;
      const r = right.lastPromptAt ?? right.createdAt ?? 0;
      return r - l;
    });
    return sessions;
  }

  async deleteOne(id, includeLive) {
    if (!SESSION_ID_PATTERN.test(id)) return { id, ok: false, reason: "invalid-id" };
    const sessionStore = this.ctx.get("sessions");
    const liveSession = sessionStore?.get(id);

    if (liveSession !== void 0 && !includeLive) {
      return { id, ok: false, reason: "live" };
    }

    try {
      if (liveSession !== void 0) {
        // Stop background activity (best effort), then flush buffered events
        // before the log directory disappears.
        try {
          await this.ctx.parallel("workspace/session-stop", { sessionId: id });
        } catch (error) {
          this.ctx.logger.warn(`session-cleaner: stopping session "${id}" failed: ${error}`);
        }
        try {
          await sessionStore.flush(liveSession);
        } catch (error) {
          this.ctx.logger.warn(`session-cleaner: flushing session "${id}" failed: ${error}`);
        }
      }

      const dir = await this.findSessionDir(id);
      if (dir !== void 0) {
        await fsp.rm(dir, { recursive: true, force: true });
      }

      await this.dropProjectionCache(id);
      await this.cleanWorkspaceAccounting(id);

      // Refresh the live UI: the session-controller treats this exactly like a
      // disposed session and drops the sidebar row.
      try {
        this.ctx.emit("api-session/removed", id);
      } catch {
        /* listener failures are not ours to fix */
      }
      return { id, ok: true };
    } catch (error) {
      return { id, ok: false, reason: String(error) };
    }
  }

  /** Locate the on-disk session directory (<home>/sessions/<project>/<id>). */
  async findSessionDir(id) {
    const root = join(this.home(), "sessions");
    let projects;
    try {
      projects = await fsp.readdir(root, { withFileTypes: true });
    } catch {
      return void 0;
    }
    for (const project of projects) {
      if (!project.isDirectory()) continue;
      const candidate = join(root, project.name, id);
      try {
        const stat = await fsp.stat(candidate);
        if (stat.isDirectory()) return candidate;
      } catch {
        /* not this one */
      }
    }
    return void 0;
  }

  async dropProjectionCache(id) {
    const storageDomain = this.ctx.get("storageDomain");
    if (storageDomain !== void 0) {
      const domain = storageDomain.get("session_projcache");
      if (domain !== void 0) {
        try {
          await domain.table("sessions").delete(id);
          return;
        } catch (error) {
          this.ctx.logger.warn(`session-cleaner: projection-cache delete for "${id}" failed: ${error}`);
        }
      }
    }
    // Fallback: remove the cache document directly.
    const file = join(this.home(), "storages", "session_projcache", "sessions", `${id}.json`);
    try {
      await fsp.rm(file, { force: true });
    } catch {
      /* absent is fine */
    }
  }

  /** Remove the deleted session from workspace.json accounting (and pins/archive). */
  async cleanWorkspaceAccounting(id) {
    const storageDomain = this.ctx.get("storageDomain");
    if (storageDomain === void 0) return;
    const domain = storageDomain.get("workspace");
    if (domain === void 0) return;
    try {
      const table = domain.table("workspaces");
      for (const [workspaceId, record] of [...table.entries()]) {
        if (!Array.isArray(record.sessionIds) || !record.sessionIds.includes(id)) continue;
        await table.update(workspaceId, (current) => ({
          ...current,
          sessionIds: current.sessionIds.filter((sessionId) => sessionId !== id),
        }));
      }
    } catch (error) {
      this.ctx.logger.warn(`session-cleaner: workspace table cleanup for "${id}" failed: ${error}`);
    }
    try {
      const state = domain.global.get();
      const archived = Array.isArray(state.archivedSessionIds)
        ? state.archivedSessionIds.filter((sessionId) => sessionId !== id)
        : state.archivedSessionIds;
      const pinned = Array.isArray(state.pinnedSessionIds)
        ? state.pinnedSessionIds.filter((sessionId) => sessionId !== id)
        : state.pinnedSessionIds;
      if (
        (Array.isArray(state.archivedSessionIds) && state.archivedSessionIds.length !== archived.length) ||
        (Array.isArray(state.pinnedSessionIds) && state.pinnedSessionIds.length !== pinned.length)
      ) {
        await domain.global.set({ ...state, archivedSessionIds: archived, pinnedSessionIds: pinned });
      }
    } catch (error) {
      this.ctx.logger.warn(`session-cleaner: workspace global cleanup for "${id}" failed: ${error}`);
    }
  }
}
