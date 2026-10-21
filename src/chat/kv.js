// Minimal IndexedDB key-value store for chat device metadata (device id, the random
// key that encrypts the crypto store, sync tokens). Deliberately not localStorage.
const DB_NAME = 'pinclone-chat'
const STORE = 'meta'

let dbPromise = null

const open = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(STORE)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  return dbPromise
}

const run = async (mode, fn) => {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(request?.result)
    tx.onerror = () => reject(tx.error)
  })
}

export const kvGet = (key) => run('readonly', (store) => store.get(key))
export const kvSet = (key, value) => run('readwrite', (store) => store.put(value, key))
export const kvDelete = (key) => run('readwrite', (store) => store.delete(key))

// Scoped view used by the crypto engine for its sync state
export const scopedKv = (prefix) => ({
  get: (key) => kvGet(`${prefix}:${key}`),
  set: (key, value) => kvSet(`${prefix}:${key}`, value),
})

export const deleteDatabase = (name) =>
  new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = request.onerror = request.onblocked = () => resolve()
  })
