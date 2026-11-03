import { loadHandle, saveHandle } from "./browser-copies";

/** The slice of the File System Access API the app uses. */
export interface BackupFileHandle {
  name: string;
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
  queryPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
}

type SavePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<BackupFileHandle>;

export function backupFileSupported(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

/** Lets the user pick the file to keep up to date, and remembers it. Returns its name. */
export async function pickBackupFile(): Promise<string | null> {
  if (!backupFileSupported()) return null;
  const picker = (window as unknown as { showSaveFilePicker: SavePicker }).showSaveFilePicker;
  try {
    const handle = await picker({
      suggestedName: "stoafi-backup.json",
      types: [{ description: "Stoafi backup", accept: { "application/json": [".json"] } }],
    });
    await saveHandle(handle);
    return handle.name;
  } catch {
    // The user closed the picker.
    return null;
  }
}

export async function chosenBackupFileName(): Promise<string | null> {
  try {
    return (await loadHandle<BackupFileHandle>())?.name ?? null;
  } catch {
    return null;
  }
}

/** Writes the backup into the chosen file when there is one and the browser still allows it. */
export async function writeBackupFile(json: string): Promise<boolean> {
  try {
    const handle = await loadHandle<BackupFileHandle>();
    if (!handle) return false;
    if ((await handle.queryPermission?.({ mode: "readwrite" })) === "denied") return false;
    if ((await handle.queryPermission?.({ mode: "readwrite" })) === "prompt") return false;
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}
