export interface OfflineDraft {
  id?: number;
  payload: any;
  method: string;
  url: string;
  timestamp: number;
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

export async function saveDraftOffline(url: string, method: string, payload: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add({ url, method, payload, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncOfflineDrafts(apiCall: (path: string, options: RequestInit) => Promise<any>): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const drafts: OfflineDraft[] = request.result;
      for (const draft of drafts) {
        try {
          await apiCall(draft.url, {
            method: draft.method,
            body: JSON.stringify(draft.payload),
          });
          
          // If successful, delete from DB
          const deleteTx = db.transaction(STORE_NAME, "readwrite");
          deleteTx.objectStore(STORE_NAME).delete(draft.id!);
        } catch (e) {
          console.error("Failed to sync draft", draft, e);
        }
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}
