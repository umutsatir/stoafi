/**
 * A small mirror, like the theme one, that remembers this browser once held the user's data. If the
 * database is later empty while the mirror is set, the browser has probably cleared it: the app then
 * offers to restore from a backup instead of silently starting over. The database stays the truth.
 */
export const HAD_DATA_KEY = "stoafi-had-data";

export function markHadData(storage: Pick<Storage, "setItem"> = localStorage): void {
  try {
    storage.setItem(HAD_DATA_KEY, "1");
  } catch {
    // Private mode or blocked storage: the check is simply skipped.
  }
}

export function clearHadData(storage: Pick<Storage, "removeItem"> = localStorage): void {
  try {
    storage.removeItem(HAD_DATA_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function hadData(storage: Pick<Storage, "getItem"> = localStorage): boolean {
  try {
    return storage.getItem(HAD_DATA_KEY) === "1";
  } catch {
    return false;
  }
}
