/**
 * Automatic backup to a file the user picks, in browsers that allow it (Chrome and Edge on a computer).
 * The file can live in a folder that Google Drive, iCloud or Dropbox syncs, so there is a second copy
 * without Stoafi having any server. The browser only remembers the file after the user chose it, and asks
 * again for permission now and then; that has to be a click, so it is offered as a button.
 */

export interface PermissionDescriptor {
  mode: "readwrite";
}

export interface WritableLike {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

export interface FileHandleLike {
  name: string;
  createWritable(): Promise<WritableLike>;
  queryPermission(descriptor: PermissionDescriptor): Promise<"granted" | "denied" | "prompt">;
  requestPermission(descriptor: PermissionDescriptor): Promise<"granted" | "denied" | "prompt">;
}

export const BACKUP_FILE_NAME = "stoafi-backup.json";

export type AutoBackupStatus = "unsupported" | "off" | "needs-permission" | "on";

interface PickerWindow {
  showSaveFilePicker?: (options: unknown) => Promise<FileHandleLike>;
}

export function supportsFileBackup(win: PickerWindow | undefined = globalWindow()): boolean {
  return typeof win?.showSaveFilePicker === "function";
}

function globalWindow(): PickerWindow | undefined {
  return typeof window === "undefined" ? undefined : (window as unknown as PickerWindow);
}

// --- where the browser-granted file handle is kept: its own tiny database, apart from the app's data ---

const DB_NAME = "stoafi-backup-handle";
const STORE = "handles";
const KEY = "file";

function openHandleDb(factory: IDBFactory = indexedDB): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
  factory?: IDBFactory,
): Promise<T> {
  const database = await openHandleDb(factory);
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(database.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function saveHandle(handle: FileHandleLike, factory?: IDBFactory): Promise<void> {
  await withStore("readwrite", (store) => store.put(handle, KEY), factory);
}

export async function loadHandle(factory?: IDBFactory): Promise<FileHandleLike | null> {
  try {
    return (
      ((await withStore("readonly", (store) => store.get(KEY), factory)) as
        FileHandleLike | undefined) ?? null
    );
  } catch {
    return null;
  }
}

export async function forgetHandle(factory?: IDBFactory): Promise<void> {
  await withStore("readwrite", (store) => store.delete(KEY), factory);
}

// --- using it ---

const READ_WRITE: PermissionDescriptor = { mode: "readwrite" };

/** Lets the user pick the file; the browser asks for permission as part of the picker. */
export async function chooseBackupFile(
  win: PickerWindow | undefined = globalWindow(),
): Promise<FileHandleLike | null> {
  if (!win?.showSaveFilePicker) return null;
  try {
    return await win.showSaveFilePicker({
      suggestedName: BACKUP_FILE_NAME,
      types: [{ description: "Stoafi backup", accept: { "application/json": [".json"] } }],
    });
  } catch {
    return null; // the user closed the picker
  }
}

export async function handlePermission(
  handle: FileHandleLike,
): Promise<"granted" | "needs-permission"> {
  try {
    return (await handle.queryPermission(READ_WRITE)) === "granted"
      ? "granted"
      : "needs-permission";
  } catch {
    return "needs-permission";
  }
}

/** Asks for permission again; call it from a click. */
export async function reGrant(handle: FileHandleLike): Promise<boolean> {
  try {
    return (await handle.requestPermission(READ_WRITE)) === "granted";
  } catch {
    return false;
  }
}

/** Writes the backup into the chosen file, replacing what was there. */
export async function writeBackup(
  handle: FileHandleLike,
  json: string,
): Promise<"written" | "needs-permission" | "failed"> {
  if ((await handlePermission(handle)) !== "granted") return "needs-permission";
  try {
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    return "written";
  } catch {
    return "failed";
  }
}
