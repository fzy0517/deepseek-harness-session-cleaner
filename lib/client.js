// @deepseek-ai/dsh-session-cleaner — browser half (prebuilt bundle format).
// Registers a "删除对话" sidebar panel (main slot key `session-cleaner`)
// listing every conversation — including ungrouped ones — with multi-select
// delete and archive actions over /api/session-cleaner/*.
window.__ModuleLoader__.load({
  id: "dsh-session-cleaner",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var jsxRuntime = require("react/jsx-runtime");
    var jsx = jsxRuntime.jsx;
    var jsxs = jsxRuntime.jsxs;
    var Fragment = jsxRuntime.Fragment;

    // ── locale dictionaries ────────────────────────────────────────────────
    var NS = "session-cleaner";
    var zh = {
      "panel.label": "删除对话",
      "panel.title": "删除对话记录",
      "panel.subtitle": "选择要删除的对话记录（包括未分组的对话）",
      "action.refresh": "刷新",
      "action.delete": "删除",
      "action.archive": "归档",
      "action.confirmDelete": "确认删除",
      "action.cancel": "取消",
      "action.selectAll": "全选",
      "action.clearSelection": "取消选择",
      "search.placeholder": "搜索标题或工作区…",
      "filter.all": "全部",
      "filter.ungrouped": "未分组",
      "filter.archived": "已归档",
      "filter.live": "使用中",
      "option.includeLive": "同时删除正在运行的对话",
      "empty.title": "没有对话记录",
      "empty.hint": "当前没有任何可删除的对话记录",
      "loading": "加载中…",
      "error.title": "加载失败",
      "confirm.title": "确认删除 {n} 个对话记录？",
      "confirm.warningLive": "其中包含正在使用/运行的对话：删除后请勿继续使用这些对话窗口，重启应用后它们将彻底消失。",
      "confirm.hint": "删除操作不可恢复。",
      "result.deleted": "已删除 {n} 个对话",
      "result.skippedLive": "{n} 个对话正在使用中，未删除（可勾选“同时删除正在运行的对话”后重试，或改为归档）",
      "result.failed": "{n} 个对话删除失败",
      "result.archived": "已归档 {n} 个对话（可在侧栏“已归档”中找回）",
      "result.none": "请先选择要删除的对话",
      "badge.ungrouped": "未分组",
      "badge.archived": "已归档",
      "badge.pinned": "置顶",
      "badge.running": "运行中",
      "badge.live": "已打开",
      "meta.turns": "{n} 轮",
      "meta.untitled": "未命名对话",
      "meta.noCwd": "无工作目录",
      "row.delete": "删除该对话",
      "row.archive": "归档该对话",
      "row.open": "打开该对话",
      "notice.failedReason": "{id}：{reason}",
    };
    var en = {
      "panel.label": "Delete chats",
      "panel.title": "Delete conversation records",
      "panel.subtitle": "Select conversations to delete, including ungrouped ones",
      "action.refresh": "Refresh",
      "action.delete": "Delete",
      "action.archive": "Archive",
      "action.confirmDelete": "Confirm delete",
      "action.cancel": "Cancel",
      "action.selectAll": "Select all",
      "action.clearSelection": "Clear selection",
      "search.placeholder": "Search title or workspace…",
      "filter.all": "All",
      "filter.ungrouped": "Ungrouped",
      "filter.archived": "Archived",
      "filter.live": "In use",
      "option.includeLive": "Also delete running conversations",
      "empty.title": "No conversations",
      "empty.hint": "There are no conversation records to delete",
      "loading": "Loading…",
      "error.title": "Failed to load",
      "confirm.title": "Delete {n} conversation record(s)?",
      "confirm.warningLive": "Some conversations are open/running: after deletion, do not keep using those windows — they disappear permanently after the app restarts.",
      "confirm.hint": "Deletion cannot be undone.",
      "result.deleted": "Deleted {n} conversation(s)",
      "result.skippedLive": "{n} conversation(s) are in use and were not deleted (retry with “Also delete running conversations”, or archive them instead)",
      "result.failed": "{n} conversation(s) failed to delete",
      "result.archived": "Archived {n} conversation(s) (recoverable from the sidebar archive filter)",
      "result.none": "Select conversations to delete first",
      "badge.ungrouped": "Ungrouped",
      "badge.archived": "Archived",
      "badge.pinned": "Pinned",
      "badge.running": "Running",
      "badge.live": "Open",
      "meta.turns": "{n} turns",
      "meta.untitled": "Untitled",
      "meta.noCwd": "No working directory",
      "row.delete": "Delete this conversation",
      "row.archive": "Archive this conversation",
      "row.open": "Open this conversation",
      "notice.failedReason": "{id}: {reason}",
    };

    // ── small helpers ──────────────────────────────────────────────────────
    function fmtBytes(n) {
      if (!(n > 0)) return "0 B";
      var units = ["B", "KB", "MB", "GB"];
      var i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
      return (n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + units[i];
    }
    function fmtDate(ts) {
      if (ts === null || ts === void 0) return "";
      var d = new Date(ts);
      var p = function (x) { return String(x).padStart(2, "0"); };
      return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
    }
    function fmtRel(ts, now) {
      if (ts === null || ts === void 0) return "";
      var diff = Math.max(0, now - ts);
      var min = Math.floor(diff / 60000);
      if (min < 1) return "刚刚";
      if (min < 60) return min + " 分钟前";
      var hours = Math.floor(min / 60);
      if (hours < 24) return hours + " 小时前";
      var days = Math.floor(hours / 24);
      if (days < 30) return days + " 天前";
      return fmtDate(ts);
    }

    // ── icon ───────────────────────────────────────────────────────────────
    function TrashIcon(props) {
      var size = props.size || 18;
      return jsx("svg", {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true",
        children: jsxs(Fragment, { children: [
          jsx("path", { d: "M4 7h16", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }),
          jsx("path", { d: "M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }),
          jsx("path", { d: "M6.5 7.5 7.4 19a1.8 1.8 0 0 0 1.8 1.6h5.6a1.8 1.8 0 0 0 1.8-1.6l.9-11.5", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }),
          jsx("path", { d: "M10 11v5.5M14 11v5.5", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }),
        ] }),
      });
    }

    // ── panel ──────────────────────────────────────────────────────────────
    function MainPanel(props) {
      var t = props.t;
      var [loading, setLoading] = react.useState(true);
      var [error, setError] = react.useState(null);
      var [sessions, setSessions] = react.useState([]);
      var [selected, setSelected] = react.useState(new Set());
      var [query, setQuery] = react.useState("");
      var [filter, setFilter] = react.useState("all");
      var [includeLive, setIncludeLive] = react.useState(false);
      var [pending, setPending] = react.useState(null);
      var [busy, setBusy] = react.useState(false);
      var [notice, setNotice] = react.useState(null);
      var [now, setNow] = react.useState(Date.now());

      react.useEffect(function () {
        var timer = setInterval(function () { setNow(Date.now()); }, 60000);
        return function () { clearInterval(timer); };
      }, []);

      var refresh = react.useCallback(function () {
        setLoading(true);
        setError(null);
        fetch("/api/session-cleaner/sessions", { cache: "no-store" })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (!data || data.ok !== true) throw new Error((data && data.error) || "bad response");
            setSessions(data.sessions || []);
            setLoading(false);
          })
          .catch(function (err) {
            setError(String(err && err.message ? err.message : err));
            setLoading(false);
          });
      }, []);

      react.useEffect(function () { refresh(); }, [refresh]);

      var toggle = react.useCallback(function (id) {
        setSelected(function (prev) {
          var next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      }, []);

      var visible = react.useMemo(function () {
        var q = query.trim().toLowerCase();
        return sessions.filter(function (s) {
          if (filter === "ungrouped" && s.workspace !== null) return false;
          if (filter === "archived" && !s.archived) return false;
          if (filter === "live" && !s.live) return false;
          if (q.length === 0) return true;
          var hay = (s.title + " " + (s.workspace ? s.workspace.title + " " + s.workspace.path : "") + " " + (s.cwd || "")).toLowerCase();
          return hay.indexOf(q) !== -1;
        });
      }, [sessions, query, filter]);

      var visibleIds = react.useMemo(function () {
        return visible.map(function (s) { return s.id; });
      }, [visible]);

      var selectableVisible = react.useMemo(function () {
        return visible.filter(function (s) { return !s.live || includeLive; });
      }, [visible, includeLive]);

      var selectedCount = react.useMemo(function () {
        var count = 0;
        selected.forEach(function (id) {
          if (sessions.some(function (s) { return s.id === id; })) count++;
        });
        return count;
      }, [selected, sessions]);

      var toggleAll = react.useCallback(function () {
        setSelected(function (prev) {
          var next = new Set();
          var allSelected = selectableVisible.every(function (s) { return prev.has(s.id); });
          if (!allSelected) {
            selectableVisible.forEach(function (s) { next.add(s.id); });
            prev.forEach(function (id) { next.add(id); });
          }
          return next;
        });
      }, [selectableVisible]);

      var runDelete = react.useCallback(function (ids, withLive) {
        setBusy(true);
        setNotice(null);
        setPending(null);
        fetch("/api/session-cleaner/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionIds: ids, includeLive: withLive === true }),
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            setBusy(false);
            if (!data || data.ok !== true) throw new Error((data && data.error) || "bad response");
            var results = data.results || [];
            var deleted = results.filter(function (r) { return r.ok; }).length;
            var liveSkipped = results.filter(function (r) { return !r.ok && r.reason === "live"; }).length;
            var failed = results.length - deleted - liveSkipped;
            var parts = [];
            if (deleted > 0) parts.push(t("result.deleted", { n: deleted }));
            if (liveSkipped > 0) parts.push(t("result.skippedLive", { n: liveSkipped }));
            if (failed > 0) parts.push(t("result.failed", { n: failed }));
            setNotice({ kind: failed > 0 ? "error" : "ok", text: parts.join("；") || t("result.none") });
            setSelected(function (prev) {
              var next = new Set(prev);
              results.forEach(function (r) { next.delete(r.id); });
              return next;
            });
            refresh();
          })
          .catch(function (err) {
            setBusy(false);
            setNotice({ kind: "error", text: String(err && err.message ? err.message : err) });
          });
      }, [t, refresh]);

      var runArchive = react.useCallback(function (ids) {
        setBusy(true);
        setNotice(null);
        fetch("/api/session-cleaner/archive", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionIds: ids }),
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            setBusy(false);
            var ok = data && data.ok === true;
            var count = ok ? (data.results || []).filter(function (r) { return r.ok; }).length : 0;
            setNotice({
              kind: ok ? "ok" : "error",
              text: ok ? t("result.archived", { n: count }) : String((data && data.error) || "failed"),
            });
            refresh();
          })
          .catch(function (err) {
            setBusy(false);
            setNotice({ kind: "error", text: String(err && err.message ? err.message : err) });
          });
      }, [t, refresh]);

      var requestDelete = react.useCallback(function (ids, withLive) {
        if (ids.length === 0) {
          setNotice({ kind: "warn", text: t("result.none") });
          return;
        }
        setPending({ ids: ids, includeLive: withLive });
      }, [t]);

      var pendingLive = react.useMemo(function () {
        if (pending === null) return false;
        return pending.ids.some(function (id) {
          var s = sessions.find(function (x) { return x.id === id; });
          return s !== void 0 && s.live;
        });
      }, [pending, sessions]);

      // ── render ──
      var header = jsxs("div", { className: "scl-header", children: [
        jsx("div", { className: "scl-title-row", children: jsxs("div", { children: [
          jsx("div", { className: "scl-title", children: t("panel.title") }),
          jsx("div", { className: "scl-subtitle", children: t("panel.subtitle") }),
        ] }) }),
        jsx("div", { className: "scl-tools", children: jsxs(Fragment, { children: [
          jsx("input", {
            className: "scl-search", type: "search", placeholder: t("search.placeholder"),
            value: query, onChange: function (e) { setQuery(e.target.value); },
          }),
          jsx("select", {
            className: "scl-select", value: filter,
            onChange: function (e) { setFilter(e.target.value); },
            children: jsxs(Fragment, { children: [
              jsx("option", { value: "all", children: t("filter.all") }),
              jsx("option", { value: "ungrouped", children: t("filter.ungrouped") }),
              jsx("option", { value: "archived", children: t("filter.archived") }),
              jsx("option", { value: "live", children: t("filter.live") }),
            ] }),
          }),
          jsx("button", {
            type: "button", className: "scl-btn", disabled: busy,
            onClick: function () { refresh(); }, children: t("action.refresh"),
          }),
        ] }) }),
      ] });

      var bar = jsx("div", { className: "scl-bar", children: jsxs(Fragment, { children: [
        jsx("button", {
          type: "button", className: "scl-btn", disabled: busy || selectableVisible.length === 0,
          onClick: function () { toggleAll(); },
          children: t("action.selectAll"),
        }),
        jsx("label", { className: "scl-check", children: jsxs(Fragment, { children: [
          jsx("input", {
            type: "checkbox", checked: includeLive,
            onChange: function (e) { setIncludeLive(e.target.checked); },
          }),
          jsx("span", { children: t("option.includeLive") }),
        ] }) }),
        jsx("span", { className: "scl-spacer" }),
        jsx("button", {
          type: "button", className: "scl-btn", disabled: busy || selectedCount === 0,
          onClick: function () { runArchive(Array.from(selected)); },
          children: t("action.archive"),
        }),
        jsx("button", {
          type: "button", className: "scl-btn scl-btn-danger", disabled: busy || selectedCount === 0,
          onClick: function () { requestDelete(Array.from(selected), includeLive); },
          children: t("action.delete") + " (" + selectedCount + ")",
        }),
      ] }) });

      var confirmBar = pending === null ? null : jsxs("div", { className: "scl-confirm", children: [
          jsx("div", { className: "scl-confirm-text", children: jsxs(Fragment, { children: [
            jsx("div", { children: t("confirm.title", { n: pending.ids.length }) }),
            pendingLive ? jsx("div", { className: "scl-confirm-warn", children: t("confirm.warningLive") }) : null,
            jsx("div", { children: t("confirm.hint") }),
          ] }) }),
        jsx("button", {
          type: "button", className: "scl-btn scl-btn-danger",
          disabled: busy, onClick: function () { runDelete(pending.ids, pending.includeLive); },
          children: t("action.confirmDelete"),
        }),
        jsx("button", {
          type: "button", className: "scl-btn", disabled: busy,
          onClick: function () { setPending(null); }, children: t("action.cancel"),
        }),
      ] });

      var noticeBar = notice === null ? null : jsx("div", {
        className: "scl-notice" + (notice.kind === "error" ? " scl-notice-error" : notice.kind === "warn" ? " scl-notice-warn" : " scl-notice-ok"),
        children: jsxs(Fragment, { children: [
          jsx("span", { children: notice.text }),
          jsx("button", {
            type: "button", className: "scl-notice-close",
            onClick: function () { setNotice(null); }, children: "×",
          }),
        ] }),
      });

      var body;
      if (loading) {
        body = jsx("div", { className: "scl-state", children: t("loading") });
      } else if (error !== null) {
        body = jsxs("div", { className: "scl-state", children: [
          jsx("div", { className: "scl-state-title", children: t("error.title") }),
          jsx("div", { children: error }),
        ] });
      } else if (visible.length === 0) {
        body = jsxs("div", { className: "scl-state", children: [
          jsx("div", { className: "scl-state-title", children: t("empty.title") }),
          jsx("div", { children: t("empty.hint") }),
        ] });
      } else {
        var rows = visible.map(function (s) {
          var isSelected = selected.has(s.id);
          var selectable = !s.live || includeLive;
          var badges = [];
          if (s.workspace === null) badges.push(jsx("span", { key: "u", className: "scl-badge scl-badge-ungrouped", children: t("badge.ungrouped") }));
          if (s.archived) badges.push(jsx("span", { key: "a", className: "scl-badge", children: t("badge.archived") }));
          if (s.pinned) badges.push(jsx("span", { key: "p", className: "scl-badge", children: t("badge.pinned") }));
          if (s.running) badges.push(jsx("span", { key: "r", className: "scl-badge scl-badge-running", children: t("badge.running") }));
          else if (s.live) badges.push(jsx("span", { key: "l", className: "scl-badge scl-badge-live", children: t("badge.live") }));

          var metaParts = [];
          if (s.workspace !== null) metaParts.push(s.workspace.title || s.workspace.path);
          else if (s.cwd) metaParts.push(s.cwd);
          if (typeof s.turns === "number") metaParts.push(t("meta.turns", { n: s.turns }));
          metaParts.push(fmtBytes(s.sizeBytes));
          metaParts.push(fmtRel(s.lastPromptAt, now) || fmtDate(s.createdAt));

          return jsxs("div", {
            key: s.id,
            className: "scl-row" + (isSelected ? " scl-row-selected" : "") + (selectable ? "" : " scl-row-live"),
            children: [
              jsx("input", {
                type: "checkbox", className: "scl-row-check",
                checked: isSelected, disabled: !selectable,
                onChange: function () { toggle(s.id); },
                title: selectable ? "" : t("option.includeLive"),
              }),
              jsxs("div", { className: "scl-row-main", children: [
                jsx("button", {
                  type: "button", className: "scl-row-title",
                  title: t("row.open"), onClick: function () { props.openSession(s.id); },
                  children: s.title,
                }),
                jsx("div", { className: "scl-row-meta", children: jsxs(Fragment, { children: [
                  badges.length > 0 ? jsx("span", { className: "scl-badges", children: badges }) : null,
                  jsx("span", { className: "scl-row-meta-text", children: metaParts.join(" · ") }),
                ] }) }),
              ] }),
              jsx("div", { className: "scl-row-actions", children: jsxs(Fragment, { children: [
                jsx("button", {
                  type: "button", className: "scl-btn scl-btn-sm", disabled: busy,
                  title: t("row.archive"), onClick: function () { runArchive([s.id]); },
                  children: t("action.archive"),
                }),
                jsx("button", {
                  type: "button", className: "scl-btn scl-btn-sm scl-btn-danger", disabled: busy,
                  title: t("row.delete"), onClick: function () { requestDelete([s.id], includeLive); },
                  children: t("action.delete"),
                }),
              ] }) }),
            ],
          });
        });
        body = jsx("div", { className: "scl-list", children: rows });
      }

      return jsx("div", { className: "scl-root", children: jsxs(Fragment, { children: [
        jsx("style", { children: CSS }),
        header,
        bar,
        confirmBar,
        noticeBar,
        body,
      ] }) });
    }

    var CSS = [
      ".scl-root{flex:1 1 auto;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;}",
      ".scl-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px 10px;}",
      ".scl-title{font-size:15px;font-weight:600;}",
      ".scl-subtitle{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:2px;}",
      ".scl-tools{display:flex;gap:8px;align-items:center;}",
      ".scl-search{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;color:var(--dsw-alias-label-primary);padding:5px 10px;font-size:12.5px;width:200px;outline:none;}",
      ".scl-search:focus{border-color:var(--dsw-alias-brand-primary);}",
      ".scl-select{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;color:var(--dsw-alias-label-primary);padding:5px 8px;font-size:12.5px;outline:none;}",
      ".scl-bar{display:flex;align-items:center;gap:12px;padding:8px 16px;border-top:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);}",
      ".scl-spacer{flex:1;}",
      ".scl-btn{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;color:var(--dsw-alias-label-primary);padding:5px 12px;font-size:12.5px;cursor:pointer;}",
      ".scl-btn:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary);}",
      ".scl-btn:disabled{opacity:.45;cursor:default;}",
      ".scl-btn-sm{padding:3px 8px;font-size:11.5px;}",
      ".scl-btn-danger{color:var(--dsw-alias-state-error-primary);}",
      ".scl-check{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none;}",
      ".scl-confirm{display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--dsw-alias-bg-layer-1);border-bottom:1px solid var(--dsw-alias-state-warn-primary);}",
      ".scl-confirm-text{flex:1;font-size:12.5px;}",
      ".scl-confirm-warn{color:var(--dsw-alias-state-warn-primary);margin-top:2px;}",
      ".scl-notice{display:flex;align-items:center;gap:8px;padding:8px 16px;font-size:12.5px;border-bottom:1px solid var(--dsw-alias-border-l1);}",
      ".scl-notice-ok{color:var(--dsw-alias-state-success-primary);}",
      ".scl-notice-warn{color:var(--dsw-alias-state-warn-primary);}",
      ".scl-notice-error{color:var(--dsw-alias-state-error-primary);}",
      ".scl-notice-close{margin-left:auto;background:none;border:none;color:inherit;font-size:16px;cursor:pointer;}",
      ".scl-list{flex:1;overflow-y:auto;padding:6px 8px 16px;}",
      ".scl-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;border:1px solid transparent;}",
      ".scl-row:hover{background:var(--dsw-alias-bg-layer-1);}",
      ".scl-row-selected{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-brand-primary);}",
      ".scl-row-check{flex:none;accent-color:var(--dsw-alias-brand-primary);}",
      ".scl-row-main{flex:1;min-width:0;}",
      ".scl-row-title{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:none;border:none;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;cursor:pointer;padding:0;text-align:left;}",
      ".scl-row-title:hover{color:var(--dsw-alias-brand-primary);}",
      ".scl-row-meta{display:flex;align-items:center;gap:8px;margin-top:3px;font-size:11.5px;color:var(--dsw-alias-label-secondary);min-width:0;}",
      ".scl-row-meta-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".scl-badges{display:inline-flex;gap:4px;flex:none;}",
      ".scl-badge{display:inline-block;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);font-size:10.5px;line-height:16px;color:var(--dsw-alias-label-secondary);}",
      ".scl-badge-ungrouped{color:var(--dsw-alias-state-idle-primary);}",
      ".scl-badge-running{color:var(--dsw-alias-state-success-primary);}",
      ".scl-badge-live{color:var(--dsw-alias-state-warn-primary);}",
      ".scl-row-actions{flex:none;display:flex;gap:6px;opacity:0;transition:opacity .1s;}",
      ".scl-row:hover .scl-row-actions,.scl-row-selected .scl-row-actions{opacity:1;}",
      ".scl-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--dsw-alias-label-secondary);padding:24px;}",
      ".scl-state-title{font-size:14px;color:var(--dsw-alias-label-primary);}",
    ].join("\n");

    // ── plugin entry ───────────────────────────────────────────────────────
    var inject = ["slots", "locale", "layout", "uiWorkspace"];

    function apply(ctx) {
      ctx.effect(function () { return ctx.locale.register(NS, { zh: zh, en: en }); }, "session-cleaner: dictionaries");
      var t = ctx.locale.bind(NS);
      ctx.slots.inject("main", function () {
        return ctx.slots.register({
          name: "main",
          key: "session-cleaner",
          locale: NS,
          inject: function () {
            return {
              t: t,
              openSession: function (sessionId) {
                try {
                  ctx.uiWorkspace.openSession(sessionId);
                } catch (error) {
                  /* non-fatal: the conversation may have vanished */
                }
              },
            };
          },
        }, MainPanel);
      });
      ctx.slots.inject("sidebar.panellist", function () {
        return ctx.slots.register({
          name: "sidebar.panellist",
          id: "session-cleaner",
          order: 90,
          label: function () { return t("panel.label"); },
          locale: NS,
          inject: function () { return {}; },
        }, TrashIcon);
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
