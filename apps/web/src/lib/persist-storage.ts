export type PersistState = "persisted" | "not-persisted" | "unsupported";

interface StorageManagerLike {
  persist?: () => Promise<boolean>;
  persisted?: () => Promise<boolean>;
}

const defaultStorage = (): StorageManagerLike | undefined =>
  typeof navigator === "undefined" ? undefined : navigator.storage;

/** Whether the browser has promised not to clear this site's data when it runs low on space. */
export async function persistState(
  storage: StorageManagerLike | undefined = defaultStorage(),
): Promise<PersistState> {
  if (!storage?.persisted || !storage.persist) return "unsupported";
  try {
    return (await storage.persisted()) ? "persisted" : "not-persisted";
  } catch {
    return "unsupported";
  }
}

/**
 * Asks the browser not to clear the data. Some browsers grant it at once, some decide from how the app is
 * used (installed to the home screen, visited often), some refuse; the answer is what it is.
 */
export async function requestPersistence(
  storage: StorageManagerLike | undefined = defaultStorage(),
): Promise<PersistState> {
  const current = await persistState(storage);
  if (current !== "not-persisted" || !storage?.persist) return current;
  try {
    return (await storage.persist()) ? "persisted" : "not-persisted";
  } catch {
    return "not-persisted";
  }
}
