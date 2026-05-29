type CacheEntry<T> = { data: T; expiry: number }

const store = new Map<string, CacheEntry<unknown>>()

export function cached<T>(
  key: string,
  ttlMs: number,
  fetch: () => Promise<T>
): Promise<T> {
  const existing = store.get(key)
  if (existing && existing.expiry > Date.now()) {
    return Promise.resolve(existing.data as T)
  }
  return fetch().then((data) => {
    store.set(key, { data, expiry: Date.now() + ttlMs })
    return data
  })
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    store.clear()
    return
  }
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) store.delete(key)
  }
}
