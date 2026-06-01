import { contextBridge } from "electron"

// Expose a minimal safe API to the renderer (Next.js runs in the browser context)
contextBridge.exposeInMainWorld("electronApp", {
  platform: process.platform,
  version: process.env.npm_package_version ?? "",
})
