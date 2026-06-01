# Electron Desktop Build Guide — Lendwell

Steps taken to package the Next.js app as a Linux desktop app (`.AppImage` + `.deb`).

---

## 1. Install Dependencies

```bash
npm install --save-dev electron electron-builder concurrently wait-on
```

> If the Electron binary download times out during install, set this env var first:
> ```bash
> ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install --save-dev electron electron-builder concurrently wait-on
> ```

---

## 2. Create the Electron Main Process

**`electron/main.ts`** — loads env vars, starts the Next.js standalone server, and opens a `BrowserWindow`.

Key points:
- In production, reads config from `~/.config/Lendwell/.env` (never bundled in the app)
- Starts `server.js` from the packaged Next.js standalone output
- Waits for the server port to open before showing the window

**`electron/preload.ts`** — minimal `contextBridge` exposing platform info only.

---

## 3. Fix CommonJS/ESM Conflict

The root `package.json` has `"type": "module"` but Electron's main process requires CommonJS.

Fix: create **`electron/package.json`** with:
```json
{ "type": "commonjs" }
```

This overrides ESM for the `electron/` directory only.

---

## 4. Electron TypeScript Config

**`electron/tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

> Do NOT add `outExtension` — that is an esbuild option, not a `tsc` option.

---

## 5. Next.js Standalone Output

In **`next.config.js`**, add:
```js
output: "standalone"
```

This makes `next build` produce a self-contained `server.js` at `.next/standalone/`.

---

## 6. Configure `package.json`

Add these fields to the root **`package.json`**:

```json
{
  "main": "electron/dist/main.js",
  "author": {
    "name": "Lendwell",
    "email": "kwikirizadan55@gmail.com"
  },
  "description": "Cooperative Management Platform",
  "scripts": {
    "electron:compile": "tsc -p electron/tsconfig.json",
    "electron:build": "npm run build && npm run electron:compile && electron-builder",
    "electron:build:linux": "npm run build && npm run electron:compile && electron-builder --linux"
  },
  "build": {
    "appId": "com.lendwell.desktop",
    "productName": "Lendwell",
    "asar": true,
    "files": [
      "electron/dist/**",
      "!**/*.ts",
      "!**/*.map",
      "!.env*"
    ],
    "extraResources": [
      { "from": ".next/standalone", "to": "nextapp/.next/standalone", "filter": ["**/*"] },
      { "from": ".next/static", "to": "nextapp/.next/standalone/.next/static" },
      { "from": "public", "to": "nextapp/.next/standalone/public" }
    ],
    "linux": {
      "target": [
        { "target": "AppImage", "arch": ["x64"] },
        { "target": "deb", "arch": ["x64"] }
      ],
      "icon": "public/icons/icon-512x512.png",
      "category": "Office"
    },
    "publish": null
  }
}
```

> **Important:** `author.email` is required for `.deb` builds — electron-builder will fail without it.

> **Note:** `.rpm` target requires `rpmbuild` installed on the build machine (`sudo apt-get install rpm`). Remove it from targets if not available.

---

## 7. Remove Google Fonts (Build-Time Network Issue)

`next/font/google` fetches fonts from `fonts.googleapis.com` at build time. This fails in offline or restricted network environments.

Fix: remove all Google Font imports and add system font stacks in **`app/globals.css`**:

```css
:root {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco,
    Consolas, "Liberation Mono", "Courier New", monospace;
}
```

---

## 8. Download the Electron Binary (One-Time)

electron-builder needs the Electron runtime ZIP (~112 MB) to package the app. It downloads automatically but can time out on slow connections.

**Manual download (cache it once):**
```bash
mkdir -p ~/.cache/electron
wget -c --timeout=300 --tries=10 \
  https://github.com/electron/electron/releases/download/v36.9.5/electron-v36.9.5-linux-x64.zip \
  -O ~/.cache/electron/electron-v36.9.5-linux-x64.zip
```

Once cached at `~/.cache/electron/`, all future builds reuse it — no re-download needed.

> A copy of this ZIP is saved at `/home/dan/Desktop/electron-v36.9.5-linux-x64.zip`.

---

## 9. Build

```bash
npm run electron:build:linux
```

This runs three steps in sequence:
1. `next build` — compiles the Next.js app with standalone output
2. `tsc -p electron/tsconfig.json` — compiles the Electron main/preload scripts
3. `electron-builder --linux` — packages everything into `.AppImage` and `.deb`

---

## 10. Output

Built files are in `dist/`:

| File | Format | Use |
|------|--------|-----|
| `Lendwell-0.0.1.AppImage` | AppImage | Runs on any Linux — no install needed |
| `sacco-manager_0.0.1_amd64.deb` | Debian package | Ubuntu/Debian install via `dpkg -i` |

---

## 11. First Run — Environment Variables

The app reads secrets from a `.env` file in the OS user data directory (never bundled):

**Linux:** `~/.config/Lendwell/.env`

Create it with the same content as your development `.env.local`:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
POWERSYNC_URL=...
FLW_PUBLIC_KEY=...
FLW_SECRET_KEY=...
APP_URL=http://localhost:3123
SACCO_NAME=Your SACCO Name
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `author 'email' is missed` | Add `"author": { "name": "...", "email": "..." }` to `package.json` |
| `Need executable 'rpmbuild'` | Remove `rpm` target or run `sudo apt-get install rpm` |
| `EAI_AGAIN fonts.googleapis.com` | Remove `next/font/google` imports; use CSS system fonts |
| `outExtension` red line in tsconfig | Remove it — it's an esbuild option, not a `tsc` option |
| `baseUrl` red line in tsconfig | Remove `"baseUrl": "."` when using `"moduleResolution": "bundler"` |
| Electron binary download timeout | Download manually to `~/.cache/electron/` — see Step 8 |
