/** Offline draft queue — payloads are AES-GCM encrypted at rest (FR6.2). */

interface StoredDraft {
  id?: number;
  clientId: string;
  url: string;
  method: string;
  timestamp: number;
  attempts: number;
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
}

const DB_NAME = "igaFundDB";
const DB_VERSION = 2;
const STORE_NAME = "draftQueue";
const KEY_STORE_NAME = "cryptoKeys";
const KEY_RECORD_ID = "primary";

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME);
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e) => reject(e);
  });
}

// A single non-extractable AES-GCM key, generated once and kept only inside
// IndexedDB. It never leaves the browser as raw bytes, so a copy of the
// on-disk store (or a JSON dump of it) never exposes readable draft content.
async function getOrCreateKey(db: IDBDatabase): Promise<CryptoKey> {
  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const req = db.transaction(KEY_STORE_NAME, "readonly").objectStore(KEY_STORE_NAME).get(KEY_RECORD_ID);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (existing) return existing;

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(KEY_STORE_NAME, "readwrite");
    tx.objectStore(KEY_STORE_NAME).put(key, KEY_RECORD_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return key;
}

async function encryptPayload(key: CryptoKey, payload: any): Promise<{ iv: ArrayBuffer; ciphertext: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return { iv: iv.buffer, ciphertext };
}

async function decryptPayload(key: CryptoKey, iv: ArrayBuffer, ciphertext: ArrayBuffer): Promise<any> {
  const bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(bytes));
}

function newClientId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveDraftOffline(url: string, method: string, payload: any): Promise<void> {
  const db = await initDB();
  const key = await getOrCreateKey(db);
  const { iv, ciphertext } = await encryptPayload(key, payload);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({
      url,
      method,
      iv,
      ciphertext,
      clientId: newClientId(),
      timestamp: Date.now(),
      attempts: 0,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function countOfflineDrafts(): Promise<number> {
  try {
    const db = await initDB();
    return await new Promise((resolve) => {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

function getAll(db: IDBDatabase): Promise<StoredDraft[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

function remove(db: IDBDatabase, id: number): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/** Replays queued drafts one at a time, in the order they were captured. */
export async function syncOfflineDrafts(
  apiCall: (path: string, options: RequestInit) => Promise<any>,
): Promise<number> {
  const db = await initDB();
  const key = await getOrCreateKey(db);
  const drafts = (await getAll(db)).sort((a, b) => a.timestamp - b.timestamp);
  let synced = 0;

  for (const draft of drafts) {
    try {
      const payload = await decryptPayload(key, draft.iv, draft.ciphertext);
      await apiCall(draft.url, {
        method: draft.method,
        body: JSON.stringify({ ...payload, client_id: draft.clientId }),
      });
      if (draft.id !== undefined) await remove(db, draft.id);
      synced += 1;
    } catch (e: any) {
      // A rejection the server will never accept (duplicate, validation) must not
      // block the rest of the queue forever — drop it after a few attempts.
      const status = e?.status;
      if (status === 409 || status === 400 || draft.attempts >= 3) {
        if (draft.id !== undefined) await remove(db, draft.id);
      }
      // Anything else (offline again, server down) stays queued for next time.
    }
  }

  return synced;
}
