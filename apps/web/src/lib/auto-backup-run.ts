import {
  chooseBackupFile,
  forgetHandle,
  handlePermission,
  loadHandle,
  reGrant,
  saveHandle,
  supportsFileBackup,
  writeBackup,
  type AutoBackupStatus,
  type FileHandleLike,
} from "./auto-backup";

/** The browser pieces the controller uses; tests replace them. */
export interface AutoBackupDeps {
  supported: () => boolean;
  load: () => Promise<FileHandleLike | null>;
  save: (handle: FileHandleLike) => Promise<void>;
  forget: () => Promise<void>;
  choose: () => Promise<FileHandleLike | null>;
}

export const realDeps: AutoBackupDeps = {
  supported: () => supportsFileBackup(),
  load: () => loadHandle(),
  save: (handle) => saveHandle(handle),
  forget: () => forgetHandle(),
  choose: () => chooseBackupFile(),
};

/** What the settings screen should show right now. */
export async function currentStatus(deps: AutoBackupDeps = realDeps): Promise<AutoBackupStatus> {
  if (!deps.supported()) return "unsupported";
  const handle = await deps.load();
  if (!handle) return "off";
  return (await handlePermission(handle)) === "granted" ? "on" : "needs-permission";
}

/** Lets the user pick the file and remembers it. The picker itself asks for permission. */
export async function enableAutoBackup(deps: AutoBackupDeps = realDeps): Promise<AutoBackupStatus> {
  if (!deps.supported()) return "unsupported";
  const handle = await deps.choose();
  if (!handle) return currentStatus(deps);
  await deps.save(handle);
  return "on";
}

/** After the browser forgot the permission: asks again. Call from a click. */
export async function allowAutoBackup(deps: AutoBackupDeps = realDeps): Promise<AutoBackupStatus> {
  const handle = await deps.load();
  if (!handle) return "off";
  return (await reGrant(handle)) ? "on" : "needs-permission";
}

export async function disableAutoBackup(deps: AutoBackupDeps = realDeps): Promise<void> {
  await deps.forget();
}

/** Writes the JSON into the remembered file, if there is one. */
export async function writeToChosenFile(
  json: string,
  deps: AutoBackupDeps = realDeps,
): Promise<"written" | "needs-permission" | "failed" | "off"> {
  if (!deps.supported()) return "off";
  const handle = await deps.load();
  if (!handle) return "off";
  return writeBackup(handle, json);
}
