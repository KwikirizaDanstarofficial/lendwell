export async function downloadPdf(blob: Blob, filename: string): Promise<void> {
  try {
    const el = (window as any).electron
    if (el?.saveFile) {
      const buffer = await blob.arrayBuffer()
      const result = await el.saveFile(Array.from(new Uint8Array(buffer)), filename)
      if (result.success || result.cancelled) return
    }
  } catch {}
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
