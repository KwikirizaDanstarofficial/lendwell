import { app, BrowserWindow, dialog, shell, ipcMain, net as electronNet } from "electron"
import path from "path"
import { createServer } from "http"
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs"
import * as net from "net"
import { vaultExists, readVault, writeVault, clearVault } from "./vault"
import { loginAndFetchConfig, getApiUrl } from "./fetchConfig"

app.setName("Lendwell")

const isDev = !app.isPackaged
const PORT = 3123

// ---------------------------------------------------------------------------
// Offline queue — persists pending mutations when the network is unavailable
// ---------------------------------------------------------------------------
const QUEUE_PATH = path.join(app.getPath("userData"), "offline-queue.json")

function loadOfflineQueue(): any[] {
  try {
    if (existsSync(QUEUE_PATH)) {
      return JSON.parse(readFileSync(QUEUE_PATH, "utf-8"))
    }
  } catch { /* corrupt file — start fresh */ }
  return []
}

function saveOfflineQueue(queue: any[]): void {
  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2))
}

// ---------------------------------------------------------------------------
// Env loading — from vault (preferred) or .env file (legacy fallback)
// ---------------------------------------------------------------------------
function loadEnv(): void {
  if (isDev) return

  // Try vault first
  if (vaultExists()) {
    try {
      const config = readVault()
      const envMap: Record<string, string> = {
        SUPABASE_URL: config.supabaseUrl,
        SUPABASE_ANON_KEY: config.supabaseAnonKey,
        POWERSYNC_URL: config.powersyncUrl,
        FLW_PUBLIC_KEY: config.flutterwavePublicKey,
        FLW_SECRET_KEY: config.flutterwaveSecretKey,
        COMMS_SDK_USERNAME: config.egoSmsUsername,
        COMMS_SDK_API_KEY: config.egoSmsApiKey,
      }
      for (const [key, val] of Object.entries(envMap)) {
        if (val && !(key in process.env)) process.env[key] = val
      }
      return
    } catch {
      // Vault corrupted or decryption failed — fall through to .env
    }
  }

  // Legacy .env fallback
  const userDataEnv = path.join(app.getPath("userData"), ".env")
  const resourcesEnv = path.join(process.resourcesPath, ".env")

  const envFile = existsSync(userDataEnv)
    ? userDataEnv
    : existsSync(resourcesEnv)
      ? resourcesEnv
      : null

  if (!envFile) {
    console.log("[ENV] No .env or vault found — starting in first-launch mode. Login will use Railway API.")
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
// Find the first free TCP port starting from `start`
// ---------------------------------------------------------------------------
function findFreePort(start: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = require("net").createServer()
    server.listen(start, "127.0.0.1", () => {
      const { port } = server.address() as net.AddressInfo
      server.close(() => resolve(port))
    })
    server.on("error", () => {
      findFreePort(start + 1).then(resolve).catch(reject)
    })
  })
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
let activePort = PORT

async function startNextServer(): Promise<void> {
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

  activePort = await findFreePort(PORT)

  process.env.PORT = String(activePort)
  process.env.HOSTNAME = "127.0.0.1"

  process.chdir(path.dirname(serverScript))

  require(serverScript)

  await waitForPort(activePort)
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

  win.once("ready-to-show", () => win.show())
  win.webContents.once("did-fail-load", () => win.show())
  setTimeout(() => { if (!win.isVisible()) win.show() }, 10_000)

  const url = isDev
    ? "http://localhost:3000"
    : `http://127.0.0.1:${activePort}`

  win.loadURL(url)

  win.webContents.setWindowOpenHandler(({ url: href }) => {
    shell.openExternal(href)
    return { action: "deny" }
  })

  if (isDev) win.webContents.openDevTools()

  return win
}

// ---------------------------------------------------------------------------
// IPC Handlers
// ---------------------------------------------------------------------------
function registerIpcHandlers(): void {
  // Existing network check
  ipcMain.on("net:is-online", (event) => {
    try { event.returnValue = electronNet.isOnline() } catch { event.returnValue = true }
  })

  // Vault — check if vault exists (for startup routing)
  ipcMain.handle("vault-exists", () => vaultExists())

  // Login — fetch config from Railway and store in vault
  ipcMain.handle("login", async (_event, email: string, password: string) => {
    const { accessToken, refreshToken, config } = await loginAndFetchConfig(email, password)
    writeVault({ ...config, accessToken, refreshToken })
    // Refresh env so Next.js server picks up the new config
    const envMap: Record<string, string> = {
      SUPABASE_URL: config.supabaseUrl,
      SUPABASE_ANON_KEY: config.supabaseAnonKey,
      POWERSYNC_URL: config.powersyncUrl,
      FLW_PUBLIC_KEY: config.flutterwavePublicKey,
      FLW_SECRET_KEY: config.flutterwaveSecretKey,
      COMMS_SDK_USERNAME: config.egoSmsUsername,
      COMMS_SDK_API_KEY: config.egoSmsApiKey,
    }
    for (const [key, val] of Object.entries(envMap)) {
      if (val) process.env[key] = val
    }
    return { success: true }
  })

  // Get full config from vault
  ipcMain.handle("get-config", () => readVault())

  // Clear vault (logout)
  ipcMain.handle("clear-vault", () => {
    clearVault()
    return { success: true }
  })

  // Flutterwave payment verification
  ipcMain.handle("verify-payment", async (_event, transactionId: string) => {
    const config = readVault()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: { Authorization: `Bearer ${config.flutterwaveSecretKey}` },
          signal: controller.signal,
        }
      )
      return response.json()
    } finally {
      clearTimeout(timeout)
    }
  })

  // Send SMS via EgoSMS
  ipcMain.handle("send-sms", async (_event, to: string, message: string) => {
    const config = readVault()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch('https://www.egosms.co/api/v1/plain/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: config.egoSmsUsername,
          password: config.egoSmsApiKey,
          number: to,
          message,
          sender: 'Lendwell',
        }),
        signal: controller.signal,
      })
      return response.json()
    } finally {
      clearTimeout(timeout)
    }
  })

  // Offline queue — persist mutations when offline
  ipcMain.handle("offline-queue:get", () => loadOfflineQueue())

  ipcMain.handle("offline-queue:add", (_event, item: any) => {
    const queue = loadOfflineQueue()
    queue.push({ ...item, timestamp: Date.now() })
    saveOfflineQueue(queue)
    return { success: true }
  })

  ipcMain.handle("offline-queue:clear", () => {
    saveOfflineQueue([])
    return { success: true }
  })

  // Platform info
  ipcMain.handle("get-platform", () => process.platform)
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(async () => {
  registerIpcHandlers()
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
