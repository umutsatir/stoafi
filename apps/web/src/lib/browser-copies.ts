/**
 * Small extras kept in the browser's own IndexedDB (separate from the app data): backup copies the
 * app makes by itself, and the handle of a backup file the user picked. Nothing leaves the device.
 */

const DB_NAME = "stoafi-extras";
const COPIES = "copies";
const HANDLES = "handles";
const HANDLE_KEY = "backup-file";

export type CopyKind = "daily" | "beforeImport";

export interface BrowserCopy {
  id: string;
  kind: CopyKind;
  /** YYYY-MM-DD the copy was made. */
  date: string;
  json: string;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(COPIES, { keyPath: "id" });
      db.createObjectStore(HANDLES);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function wrap<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** The newest daily copies and the last pre-import copy are kept; older ones are dropped. */
const KEEP_DAILY = 3;

export async function saveCopy(kind: CopyKind, date: string, json: string): Promise<void> {
  const db = await open();
  try {
    const store = db.transaction(COPIES, "readwrite").objectStore(COPIES);
    // One copy per kind and day for "daily"; "beforeImport" always replaces the previous one.
    const id = kind === "daily" ? `daily-${date}` : "beforeImport";
    await wrap(store.put({ id, kind, date, json } satisfies BrowserCopy));
    const all = (await wrap(store.getAll())) as BrowserCopy[];
    const daily = all
      .filter((c) => c.kind === "daily")
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const old of daily.slice(KEEP_DAILY)) await wrap(store.delete(old.id));
  } finally {
    db.close();
  }
}

export async function listCopies(): Promise<BrowserCopy[]> {
  const db = await open();
  try {
    const all = (await wrap(
      db.transaction(COPIES, "readonly").objectStore(COPIES).getAll(),
    )) as BrowserCopy[];
    return all.sort((a, b) => b.date.localeCompare(a.date));
  } finally {
    db.close();
  }
}

export async function hasDailyCopy(date: string): Promise<boolean> {
  const copies = await listCopies();
  return copies.some((c) => c.kind === "daily" && c.date === date);
}

export async function saveHandle(handle: unknown): Promise<void> {
  const db = await open();
  try {
    await wrap(db.transaction(HANDLES, "readwrite").objectStore(HANDLES).put(handle, HANDLE_KEY));
  } finally {
    db.close();
  }
}

export async function loadHandle<T>(): Promise<T | undefined> {
  const db = await open();
  try {
    return (await wrap(
      db.transaction(HANDLES, "readonly").objectStore(HANDLES).get(HANDLE_KEY),
    )) as T | undefined;
  } finally {
    db.close();
  }
}
