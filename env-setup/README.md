# Lendwell – Environment Setup

## Step 1 – Edit keys
Edit `.env.local` in this folder with your API keys. **This is the single source of
truth for all secrets.**

## Step 2 – Run the batch file
Double-click `seed-vault.bat`. It will:

1. **Auto-detect** your installed `Lendwell.exe` (searches common install paths,
   PATH, and Windows Registry).
2. **Seed the vault** by running `Lendwell.exe --seed-vault .env.local`, which
   encrypts your keys into `%APPDATA%\Lendwell\vault.enc`.
3. **Launch** the app.

No plaintext `.env` files are stored in `%APPDATA%` — the vault is encrypted with
the OS crypto API.

## Manual mode
If `Lendwell.exe` isn't found automatically, drag-and-drop the `.exe` onto
`seed-vault.bat` from Explorer, or launch it directly:

```cmd
Lendwell.exe --seed-vault "C:\path\to\env-setup\.env.local"
```
