@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "ENV_FILE=%SCRIPT_DIR%.env.local"

if not exist "%ENV_FILE%" (
  echo [ERROR] .env.local not found in %SCRIPT_DIR%
  echo Create it with your keys and try again.
  pause
  exit /b 1
)

set "USERDATA_DIR=%APPDATA%\lendwell"
if not exist "%USERDATA_DIR%" mkdir "%USERDATA_DIR%"

copy /y "%ENV_FILE%" "%USERDATA_DIR%\.env" >nul
echo [OK] Copied .env.local to %USERDATA_DIR%\.env

REM Find Lendwell.exe
set "EXE="
for %%p in (
  "%PROGRAMFILES%\Lendwell\Lendwell.exe"
  "%PROGRAMFILES(X86)%\Lendwell\Lendwell.exe"
  "%LOCALAPPDATA%\Programs\Lendwell\Lendwell.exe"
  "%~dp0Lendwell.exe"
) do (
  if exist %%p set "EXE=%%~p"
)

if not defined EXE (
  echo [WARN] Lendwell.exe not found automatically.
  echo   Running vault seed only. Now launch Lendwell.exe
  echo   or drag-and-drop Lendwell.exe onto this batch file next time.
  pause
  exit /b 0
)

echo [OK] Found Lendwell.exe at: %EXE%

REM Seed vault silently
start /wait "" "%EXE%" --seed-vault "%USERDATA_DIR%\.env"
echo [OK] Vault seeded. Launching Lendwell...

REM Launch app
start "" "%EXE%"
