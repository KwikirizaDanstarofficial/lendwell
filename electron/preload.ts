import { contextBridge, ipcRenderer } from "electron"

// ipcRenderer IS available in sandboxed preloads.
// We ask the main process (where net.isOnline() always works) via sync IPC.
contextBridge.exposeInMainWorld("electronApp", {
  platform: process.platform,
  version: process.env.npm_package_version ?? "",
  isOnline: (): boolean => {
    try {
      return ipcRenderer.sendSync("net:is-online") as boolean
    } catch {
      return true // safe default — prevents false offline-mode when IPC fails
    }
  },
})
