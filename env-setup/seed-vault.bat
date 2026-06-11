@echo off
setlocal enabledelayedexpansion

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

REM Try to find Lendwell.exe
set "EXE="

REM 1. Common install paths
for %%p in (
  "%PROGRAMFILES%\Lendwell\Lendwell.exe"
  "%PROGRAMFILES(X86)%\Lendwell\Lendwell.exe"
  "%LOCALAPPDATA%\Programs\Lendwell\Lendwell.exe"
  "%LOCALAPPDATA%\Lendwell\Lendwell.exe"
  "%APPDATA%\Lendwell\Lendwell.exe"
  "%USERPROFILE%\AppData\Local\Programs\Lendwell\Lendwell.exe"
  "%USERPROFILE%\AppData\Roaming\Lendwell\Lendwell.exe"
  "%~dp0Lendwell.exe"
  "%PROGRAMFILES%\Lendwell\resources\Lendwell.exe"
) do (
  if exist %%p set "EXE=%%~p"
)

REM 2. PATH / where
if not defined EXE (
  where Lendwell.exe 2>nul | findstr . >nul && (
    for /f "delims=" %%p in ('where Lendwell.exe 2^>nul') do (
      if not defined EXE set "EXE=%%p"
    )
  )
)

REM 3. Registry (64-bit)
if not defined EXE (
  for /f "skip=2 tokens=2,*" %%a in (
    'reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" /s /f "Lendwell" 2^>nul ^| findstr "DisplayIcon"'
  ) do (
    if not defined EXE set "EXE=%%b"
  )
)

REM 4. Registry (32-bit on 64-bit OS)
if not defined EXE (
  for /f "skip=2 tokens=2,*" %%a in (
    'reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall" /s /f "Lendwell" 2^>nul ^| findstr "DisplayIcon"'
  ) do (
    if not defined EXE set "EXE=%%b"
  )
)

REM 5. Recursive search near common roots as last resort
if not defined EXE (
  for %%r in ("%PROGRAMFILES%" "%LOCALAPPDATA%\Programs" "%USERPROFILE%") do (
    if not defined EXE (
      for /f "delims=" %%f in ('dir /s /b "%%~r\Lendwell.exe" 2^>nul') do (
        if not defined EXE set "EXE=%%f"
      )
    )
  )
)

if not defined EXE (
  echo [WARN] Lendwell.exe not found automatically.
  echo   Vault seed complete. Now launch Lendwell.exe manually
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
