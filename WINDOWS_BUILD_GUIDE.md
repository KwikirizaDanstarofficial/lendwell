# Windows Build Guide — Lendwell Desktop

Building a Windows `.exe` installer from Linux requires either Wine + NSIS
installed locally, or a Windows CI runner via GitHub Actions.

---

## Why Extra Tools Are Needed

electron-builder compiles Windows packages (NSIS installer, portable `.exe`)
using Windows-specific tooling. On Linux, it uses **Wine** to emulate the
Windows environment and **NSIS** (Nullsoft Scriptable Install System) to
generate the installer.

---

## Option A — Build Locally with Wine + NSIS

### 1. Install Wine and NSIS

```bash
sudo apt-get install -y wine64 nsis
```

### 2. Build

```bash
npm run build && npm run electron:compile && npx electron-builder --win
```

### Output

```
dist/
  Lendwell Setup 0.0.1.exe   ← NSIS installer (recommended for distribution)
  Lendwell 0.0.1.exe         ← Portable (no install needed, just run)
```

### Known Limitations

- Code signing is not included — Windows will show a "Unknown Publisher" warning
- Some native Node modules may not cross-compile correctly via Wine
- The portable `.exe` may trigger Windows Defender on first run (no signature)

---

## Option B — GitHub Actions (Recommended for Production)

Build on a real Windows runner — no Wine required, cleaner output.

### 1. Create `.github/workflows/build-windows.yml`

```yaml
name: Build Windows

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci --ignore-scripts

      - name: Build Next.js
        run: npm run build

      - name: Compile Electron
        run: npm run electron:compile

      - name: Package Windows
        run: npx electron-builder --win
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: windows-packages
          path: |
            dist/*.exe
            dist/*.msi
          retention-days: 14
```

### 2. Trigger the build

Either push a tag:
```bash
git tag v0.0.1 && git push origin v0.0.1
```

Or go to **GitHub → Actions → Build Windows → Run workflow**.

### Output

The `.exe` files are available under **Actions → your run → Artifacts → windows-packages**.

### Advantages over Wine

- Built on a real Windows environment
- Native module compilation works correctly
- Can add code signing via certificate secrets
- No local setup required

---

## Code Signing (Optional but Recommended)

Without a code signature, Windows shows "Windows protected your PC" on first run.
To sign:

1. Purchase a **Code Signing Certificate** (DigiCert, Sectigo, etc.)
2. Add to GitHub Secrets:
   - `WIN_CSC_LINK` — base64-encoded `.p12` certificate
   - `WIN_CSC_KEY_PASSWORD` — certificate password
3. Add to `package.json` build config:

```json
"win": {
  "certificateFile": "${env.WIN_CSC_LINK}",
  "certificatePassword": "${env.WIN_CSC_KEY_PASSWORD}"
}
```

---

## Current Windows Config (`package.json`)

```json
"win": {
  "target": [
    { "target": "nsis",     "arch": ["x64"] },
    { "target": "portable", "arch": ["x64"] }
  ],
  "icon": "build/icons/icon.ico"
},
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "installerIcon": "build/icons/icon.ico"
}
```

The `.ico` file (`build/icons/icon.ico`) contains the Lendwell LW logo at
16, 32, 48, 64, 128, and 256 px — all sizes required by Windows.

---

## Quick Reference

| Goal | Command |
|---|---|
| Build Windows locally (needs Wine) | `sudo apt-get install -y wine64 nsis` then `npx electron-builder --win` |
| Build Linux + Windows together | `npx electron-builder --linux --win` |
| Trigger GitHub Actions build | Push a `v*` tag or run workflow manually |
| Build all platforms | `npm run electron:build:all` |
