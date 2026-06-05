/**
 * Server-side SMS queue backed by a local JSON file.
 * Works offline because it uses the local filesystem, not Supabase.
 * The file lives in the OS temp directory so it survives server restarts.
 */

import { readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"
import os from "os"

export interface QueuedSms {
  id:        string
  to:        string
  message:   string
  queuedAt:  number
  retries:   number
  saccoId?:  string
  context?:  string
}

const QUEUE_FILE = path.join(os.tmpdir(), "lendwell_sms_queue.json")

function readQueue(): QueuedSms[] {
  try {
    if (!existsSync(QUEUE_FILE)) return []
    return JSON.parse(readFileSync(QUEUE_FILE, "utf-8")) as QueuedSms[]
  } catch {
    return []
  }
}

function writeQueue(queue: QueuedSms[]): void {
  try {
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8")
  } catch (err) {
    console.error("[SMS Queue] Failed to write queue file:", err)
  }
}

export function enqueueSms(payload: Omit<QueuedSms, "id" | "queuedAt" | "retries">): void {
  const queue = readQueue()
  queue.push({
    ...payload,
    id:       crypto.randomUUID(),
    queuedAt: Date.now(),
    retries:  0,
  })
  writeQueue(queue)
  console.log(`[SMS Queue] Queued SMS to ${payload.to} — queue size: ${queue.length}`)
}

export function getPendingQueue(): QueuedSms[] {
  return readQueue().filter((m) => m.retries < 5)
}

export function markSent(id: string): void {
  writeQueue(readQueue().filter((m) => m.id !== id))
}

export function markFailed(id: string): void {
  const queue = readQueue()
  const idx = queue.findIndex((m) => m.id === id)
  if (idx !== -1) {
    queue[idx].retries += 1
    writeQueue(queue)
  }
}

export function getQueueSize(): number {
  return getPendingQueue().length
}
