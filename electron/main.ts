import { app, BrowserWindow, dialog, shell, ipcMain, net as electronNet, session } from "electron"
import path from "path"
import { createServer } from "http"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { pathToFileURL } from "url"
import * as net from "net"
import { vaultExists, readVault, writeVault, clearVault } from "./vault.js"

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
function applyEnv(config: Record<string, string>): void {
  const envMap: Record<string, string> = {
    SUPABASE_URL: config.supabaseUrl,
    SUPABASE_ANON_KEY: config.supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: config.serviceRoleKey,
    POWERSYNC_URL: config.powersyncUrl,
    FLW_PUBLIC_KEY: config.flutterwavePublicKey,
    FLW_SECRET_KEY: config.flutterwaveSecretKey,
    COMMS_SDK_USERNAME: config.egoSmsUsername,
    COMMS_SDK_API_KEY: config.egoSmsApiKey,
  }
  for (const [key, val] of Object.entries(envMap)) {
    if (val && !(key in process.env)) process.env[key] = val
  }
}

function loadEnv(): void {
  if (isDev) return

  if (vaultExists()) {
    try {
      const config = readVault()
      applyEnv(config)

      // If the vault was created before serviceRoleKey was added,
      // supplement it from .env so the app doesn't break.
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supplementFromEnv("SUPABASE_SERVICE_ROLE_KEY")
      }
      return
    } catch {
      console.error("[ENV] Vault corrupted — will try .env fallback.")
    }
  }

  // Look for .env file — check userData, then project root
  // (Packaged resources deliberately excluded — secrets must not be bundled)
  const candidates = [
    path.join(app.getPath("userData"), ".env"),
    path.join(app.getPath("userData"), ".env.local"),
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      console.log("[ENV] No vault found — seeding from", candidate)
      seedVaultFromEnv(candidate)
      const config = readVault()
      applyEnv(config)
      return
    }
  }

  console.log("[ENV] No vault or .env found — starting in first-launch mode.")
}

/** Read a single key from the first available .env file and set it on process.env. */
function supplementFromEnv(key: string): void {
  const candidates = [
    path.join(app.getPath("userData"), ".env"),
    path.join(app.getPath("userData"), ".env.local"),
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ]
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue
    const content = readFileSync(candidate, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const k = trimmed.slice(0, eq).trim()
      if (k === key) {
        process.env[key] = trimmed.slice(eq + 1).trim()
        return
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Find the first free TCP port starting from `start`
// ---------------------------------------------------------------------------
function findFreePort(start: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
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

  const dynamicImport = new Function("specifier", "return import(specifier)")
  await dynamicImport(pathToFileURL(serverScript).href)

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

  // Login — authenticate against Supabase directly and store session in vault
  ipcMain.handle("login", async (_event, email: string, password: string) => {
    const config = vaultExists() ? readVault() : null
    const supabaseUrl = process.env.SUPABASE_URL || config?.supabaseUrl
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || config?.supabaseAnonKey

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured. Run scripts/setup-env.sh first.")
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const body: any = await response.json().catch(() => ({}))
        throw new Error(body?.error_description || body?.msg || "Invalid email or password.")
      }

      const session = (await response.json()) as { access_token: string; refresh_token: string }

      // Read existing vault config (keep previously stored keys)
      const vaultConfig = vaultExists() ? readVault() : {}
      writeVault({
        supabaseUrl: supabaseUrl,
        supabaseAnonKey: supabaseAnonKey,
        serviceRoleKey: vaultConfig.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        powersyncUrl: vaultConfig.powersyncUrl || process.env.POWERSYNC_URL || "",
        flutterwavePublicKey: vaultConfig.flutterwavePublicKey || process.env.FLW_PUBLIC_KEY || "",
        flutterwaveSecretKey: vaultConfig.flutterwaveSecretKey || process.env.FLW_SECRET_KEY || "",
        egoSmsUsername: vaultConfig.egoSmsUsername || process.env.COMMS_SDK_USERNAME || "",
        egoSmsApiKey: vaultConfig.egoSmsApiKey || process.env.COMMS_SDK_API_KEY || "",
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      })

      // Refresh env so Next.js server picks up the new config
      applyEnv({
        supabaseUrl,
        supabaseAnonKey,
        serviceRoleKey: vaultConfig.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        powersyncUrl: vaultConfig.powersyncUrl || process.env.POWERSYNC_URL || "",
        flutterwavePublicKey: vaultConfig.flutterwavePublicKey || process.env.FLW_PUBLIC_KEY || "",
        flutterwaveSecretKey: vaultConfig.flutterwaveSecretKey || process.env.FLW_SECRET_KEY || "",
        egoSmsUsername: vaultConfig.egoSmsUsername || process.env.COMMS_SDK_USERNAME || "",
        egoSmsApiKey: vaultConfig.egoSmsApiKey || process.env.COMMS_SDK_API_KEY || "",
      })

      return { success: true }
    } finally {
      clearTimeout(timeout)
    }
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

  // Graceful database flush — renderer calls this back after closing PowerSync
  ipcMain.handle("db:flushed", () => {
    // Main process proceeds with quit
  })

  // Expose the persistent data path to the renderer
  ipcMain.handle("get-data-path", () => app.getPath("userData"))
}

// ---------------------------------------------------------------------------
// Vault seeding from .env file (headless)
// ---------------------------------------------------------------------------
function seedVaultFromEnv(envPath: string): void {
  const envMap: Record<string, string> = {}
  const content = readFileSync(envPath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    envMap[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }

  const vaultData: Record<string, string> = {
    supabaseUrl: envMap.SUPABASE_URL ?? "",
    supabaseAnonKey: envMap.SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: envMap.SUPABASE_SERVICE_ROLE_KEY ?? "",
    powersyncUrl: envMap.POWERSYNC_URL ?? "",
    flutterwavePublicKey: envMap.FLW_PUBLIC_KEY ?? "",
    flutterwaveSecretKey: envMap.FLW_SECRET_KEY ?? "",
    egoSmsUsername: envMap.COMMS_SDK_USERNAME ?? "",
    egoSmsApiKey: envMap.COMMS_SDK_API_KEY ?? "",
    accessToken: "",
    refreshToken: "",
  }

  writeVault(vaultData)
  console.log("[VAULT] Seeded successfully from", envPath)
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
const seedIndex = process.argv.indexOf("--seed-vault")
if (seedIndex !== -1 && process.argv[seedIndex + 1]) {
  app.whenReady().then(() => {
    seedVaultFromEnv(process.argv[seedIndex + 1])
    app.quit()
  })
} else {
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
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

// Graceful shutdown — tell the renderer to flush PowerSync before quitting.
app.on("before-quit", () => {
  const win = BrowserWindow.getAllWindows()[0]
  if (win && !win.isDestroyed()) {
    win.webContents.send("db:flush")
  }
})

app.on("will-quit", () => {
  // Force-sync any remaining pending data to disk
  try {
    session.defaultSession.flushStorageData()
  } catch {
    // Not available in all Electron versions
  }
})
