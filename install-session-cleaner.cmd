@echo off
rem Install dsh-session-cleaner into the desktop profile.
rem IMPORTANT: fully quit DeepSeek Harness first, then run this file,
rem then start DeepSeek Harness again.
setlocal
set "PLUGIN_DIR=%~dp0"
set "DSH_CLI=%LOCALAPPDATA%\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd"

if not exist "%DSH_CLI%" (
  echo [ERROR] DeepSeek Harness CLI not found at:
  echo         %DSH_CLI%
  echo         Update the DSH_CLI path in this script if your installation
  echo         lives elsewhere.
  pause
  exit /b 1
)

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
