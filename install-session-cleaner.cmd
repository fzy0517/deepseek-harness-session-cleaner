@echo off
rem Install dsh-session-cleaner into the desktop profile.
rem IMPORTANT: fully quit DeepSeek Harness first, then run this file,
rem then start DeepSeek Harness again.
setlocal
set "PLUGIN_DIR=%~dp0"
set "DSH_CLI="

for %%B in (
  "%LOCALAPPDATA%\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd"
  "D:\Users\%USERNAME%\AppData\Local\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd"
  "%USERPROFILE%\AppData\Local\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd"
) do if not defined DSH_CLI if exist "%%~B" set "DSH_CLI=%%~B"

if not defined DSH_CLI (
  echo [ERROR] DeepSeek Harness CLI not found.
  echo         Update the candidate list in this script if your
  echo         installation lives elsewhere.
  pause
  exit /b 1
)

echo Found DeepSeek Harness CLI:
echo   %DSH_CLI%
echo Installing dsh-session-cleaner into the desktop profile...
call "%DSH_CLI%" plugin --profile desktop add "file:%PLUGIN_DIR%"
if errorlevel 1 (
  echo.
  echo [ERROR] installation failed. See the messages above.
) else (
  echo.
  echo [OK] installed. Restart DeepSeek Harness: a trash-can icon
  echo      appears at the bottom of the left sidebar.
)
pause
