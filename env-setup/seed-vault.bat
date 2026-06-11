@echo off
setlocal

REM ─────────────────────────────────────────────────────────
REM Lendwell – Seed vault from .env.local (same folder)
REM ─────────────────────────────────────────────────────────
REM Place this .bat together with your .env.local file.
REM Run the .bat after installation to load config into
REM the Lendwell secure vault.
REM ─────────────────────────────────────────────────────────

set "SCRIPT_DIR=%~dp0"
set "ENV_FILE=%SCRIPT_DIR%.env.local"

if not exist "%ENV_FILE%" (
  echo [ERROR] .env.local not found next to this batch file.
  echo         Place it at: %ENV_FILE%
  pause
  exit /b 1
)

set "USERDATA_DIR=%APPDATA%\lendwell"
if not exist "%USERDATA_DIR%" mkdir "%USERDATA_DIR%"

copy /y "%ENV_FILE%" "%USERDATA_DIR%\.env" >nul
echo [OK] Copied .env.local ^→ %USERDATA_DIR%\.env

echo.
echo Now run your Lendwell.exe with the --seed-vault flag:
echo.
echo   "%%PROGRAMFILES%%\Lendwell\Lendwell.exe" --seed-vault "%USERDATA_DIR%\.env"
echo.
echo Or simply double-click Lendwell.exe afterwards to start normally.
echo.
pause
