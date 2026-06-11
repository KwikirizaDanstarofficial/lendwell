# Lendwell – Environment Setup for Windows

## Step 1 – Edit keys
Create `.env.local` in this folder with your API keys.

## Step 2 – Run the batch file
Double-click `seed-vault.bat`. It will:

1. Copy `.env.local` → `%APPDATA%\lendwell\.env`
2. Auto-detect and run `Lendwell.exe --seed-vault`
3. Launch the app

If the .exe isn't found automatically, drag-and-drop `Lendwell.exe` onto `seed-vault.bat`.
