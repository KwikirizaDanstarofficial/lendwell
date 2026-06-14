import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronApp", {
  platform: process.platform,
  version: process.env.npm_package_version ?? "",
  isOnline: (): boolean => {
    try {
      return ipcRenderer.sendSync("net:is-online") as boolean
    } catch {
      return true
    }
  },
})

contextBridge.exposeInMainWorld("electron", {
  vaultExists:   ()                              => ipcRenderer.invoke("vault-exists"),
  login:         (email: string, pwd: string)   => ipcRenderer.invoke("login", email, pwd),
  getConfig:     ()                              => ipcRenderer.invoke("get-config"),
  setConfig:     (cfg: Record<string, string>)  => ipcRenderer.invoke("set-config", cfg),
  clearVault:    ()                              => ipcRenderer.invoke("clear-vault"),
  verifyPayment: (transactionId: string)         => ipcRenderer.invoke("verify-payment", transactionId),
  sendSms:       (to: string, message: string)  => ipcRenderer.invoke("send-sms", to, message),
  getOfflineQueue:     ()                        => ipcRenderer.invoke("offline-queue:get"),
  addToOfflineQueue:   (item: any)               => ipcRenderer.invoke("offline-queue:add", item),
  clearOfflineQueue:   ()                        => ipcRenderer.invoke("offline-queue:clear"),
  getPlatform:         ()                        => ipcRenderer.invoke("get-platform"),
  getDataPath:         ()                        => ipcRenderer.invoke("get-data-path"),
  saveFile:            (data: number[], defaultName: string) => ipcRenderer.invoke("save-file", data, defaultName),
  onFlushDb:           (cb: () => void)          => ipcRenderer.on("db:flush", cb),
  removeFlushDbListener: ()                      => ipcRenderer.removeAllListeners("db:flush"),
  dbFlushed:           ()                        => ipcRenderer.invoke("db:flushed"),
})
