const DB_NAME = 'dream-recordings';
const STORE_NAME = 'blobs';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRecording(id: string, blob: Blob, timestamp: Date, duration: number) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put({
    id,
    blob,
    timestamp: timestamp.toISOString(),
    duration,
  });
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadRecordings(): Promise<{ id: string; blob: Blob; timestamp: Date; duration: number }[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const req = tx.objectStore(STORE_NAME).getAll();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      resolve(
        (req.result || []).map((r: { id: string; blob: Blob; timestamp: string; duration: number }) => ({
          id: r.id,
          blob: r.blob,
          timestamp: new Date(r.timestamp),
          duration: r.duration,
        }))
      );
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecording(id: string) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
