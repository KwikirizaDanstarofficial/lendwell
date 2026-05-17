declare global {
  interface Window {
    Flutterwave: any
  }
}

let loaded = false

export function loadFlutterWave() {
  if (typeof window === "undefined" || loaded) return

  const existing = document.getElementById("flutterwave-script")
  if (existing) {
    loaded = true
    return
  }

  const script = document.createElement("script")
  script.id = "flutterwave-script"
  script.src = "https://checkout.flutterwave.com/v3.js"
  script.async = true
  script.onload = () => {
    loaded = true
    console.log("Flutterwave script loaded")
  }
  script.onerror = () => {
    console.error("Failed to load Flutterwave script")
  }
  document.head.appendChild(script)
}

export async function initializeFlutterWave() {
  if (typeof window === "undefined") {
    return null
  }

  const publicKey = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || "FLWPUBK-XXXX"

  if (!window.Flutterwave) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (window.Flutterwave) {
          clearInterval(check)
          resolve()
        }
      }, 100)
      setTimeout(() => {
        clearInterval(check)
        resolve()
      }, 5000)
    })
  }

  if (!window.Flutterwave) {
    console.error("Flutterwave not available")
    return null
  }

  return window.Flutterwave(publicKey)
}
