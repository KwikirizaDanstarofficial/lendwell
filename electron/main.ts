import { app, BrowserWindow, dialog, shell } from "electron"
import path from "path"
import { createServer } from "http"
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs"
import * as net from "net"

app.setName("Lendwell")

const isDev = !app.isPackaged
const PORT = 3123 // avoid conflict with Next.js dev server on 3000

// ---------------------------------------------------------------------------
// Env loading — sensitive vars live in userData, never in the app bundle
// ---------------------------------------------------------------------------
function loadEnv(): void {
  if (isDev) return // Next.js loads .env.local automatically in dev

  const userDataEnv = path.join(app.getPath("userData"), ".env")
  const resourcesEnv = path.join(process.resourcesPath, ".env")

  const envFile = existsSync(userDataEnv)
    ? userDataEnv
    : existsSync(resourcesEnv)
      ? resourcesEnv
      : null

  if (!envFile) {
    const configPath = userDataEnv
    dialog.showErrorBox(
      "Configuration missing",
      `No .env file found.\n\nCreate one at:\n${configPath}\n\nSee .env.example in the source repo for required variables.`
    )
    app.quit()
    return
  }

  for (const line of readFileSync(envFile, "utf-8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (key && !(key in process.env)) process.env[key] = val
  }
}

// ---------------------------------------------------------------------------
// Wait until a TCP port accepts connections
// ---------------------------------------------------------------------------
function waitForPort(port: number, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    const attempt = () => {
      const sock = net.connect(port, "127.0.0.1")
      sock.on("connect", () => { sock.destroy(); resolve() })
      sock.on("error", () => {
        sock.destroy()
        if (Date.now() >= deadline) {
          reject(new Error(`Port ${port} did not open within ${timeoutMs}ms`))
        } else {
          setTimeout(attempt, 500)
        }
      })
    }
    attempt()
  })
}

// ---------------------------------------------------------------------------
// Start the Next.js standalone server in production
// ---------------------------------------------------------------------------
async function startNextServer(): Promise<void> {
  // Standalone build outputs a self-contained server.js
  const serverScript = path.join(
    process.resourcesPath,
    "nextapp",
    "server.js"
  )

  if (!existsSync(serverScript)) {
    dialog.showErrorBox(
      "Build missing",
      `Next.js standalone server not found at:\n${serverScript}\n\nRun "npm run build" before packaging.`
    )
    app.quit()
    return
  }

  process.env.PORT = String(PORT)
  process.env.HOSTNAME = "127.0.0.1"

  // Next.js standalone server.js resolves files relative to cwd
  process.chdir(path.dirname(serverScript))

  // Run server.js in the same Node.js process (Electron main == Node.js)
  require(serverScript)

  await waitForPort(PORT)
}

// ---------------------------------------------------------------------------
// Browser window
// ---------------------------------------------------------------------------
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    title: "Lendwell",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  // Show as soon as the page is painted, or after 10s as a safety fallback
  win.once("ready-to-show", () => win.show())
  win.webContents.once("did-fail-load", () => win.show())
  setTimeout(() => { if (!win.isVisible()) win.show() }, 10_000)

  // In dev, Next.js dev server is already running on 3000
  const url = isDev
    ? "http://localhost:3000"
    : `http://127.0.0.1:${PORT}`

  win.loadURL(url)

  // Open external links in the OS browser, not in the app
  win.webContents.setWindowOpenHandler(({ url: href }) => {
    shell.openExternal(href)
    return { action: "deny" }
  })

  if (isDev) win.webContents.openDevTools()

  return win
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(async () => {
  loadEnv()

  if (!isDev) {
    await startNextServer().catch((err) => {
      console.error("Failed to start server:", err)
      dialog.showErrorBox("Server error", String(err))
      app.quit()
    })
  }

  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
