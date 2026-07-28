/** Offline draft queue. */

export interface OfflineDraft {
  id?: number;
  clientId: string;
  payload: any;
  method: string;
  url: string;
  timestamp: number;
  attempts: number;
}

const DB_NAME = "igaFundDB";
const STORE_NAME = "draftQueue";

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e) => reject(e);
  });
}

function newClientId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveDraftOffline(url: string, method: string, payload: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({
      url,
      method,
      payload,
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

function getAll(db: IDBDatabase): Promise<OfflineDraft[]> {
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
  const drafts = (await getAll(db)).sort((a, b) => a.timestamp - b.timestamp);
  let synced = 0;

  for (const draft of drafts) {
    try {
      await apiCall(draft.url, {
        method: draft.method,
        body: JSON.stringify({ ...draft.payload, client_id: draft.clientId }),
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
