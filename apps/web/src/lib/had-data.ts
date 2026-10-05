/**
 * A small mark outside the database: "this device has held the user's data since this date". If the
 * database is later empty while the mark is there, the data was lost (the browser cleared it, or the
 * user did) and the app can offer to restore a backup instead of silently starting from nothing.
 */
const KEY = "stoafi:data-since";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const defaultStorage = (): StorageLike | undefined => {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined; // blocked storage, e.g. a private window
  }
};

/** The date (YYYY-MM-DD) data was first seen on this device, or null. */
export function dataSince(storage: StorageLike | undefined = defaultStorage()): string | null {
  try {
    return storage?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

/** Notes that there is data now; the first date stays. */
export function rememberData(
  today: string,
  storage: StorageLike | undefined = defaultStorage(),
): void {
  try {
    if (storage && storage.getItem(KEY) === null) storage.setItem(KEY, today);
  } catch {
    // Without the mark the app just cannot tell if data was lost; nothing else depends on it.
  }
}

/** Forgets the mark, when the user themself emptied the data. */
export function forgetData(storage: StorageLike | undefined = defaultStorage()): void {
  try {
    storage?.removeItem(KEY);
  } catch {
    // see rememberData
  }
}

/** True when this device held data before but the database has none now. */
export function dataLooksLost(
  hasDataNow: boolean,
  storage: StorageLike | undefined = defaultStorage(),
): boolean {
  return !hasDataNow && dataSince(storage) !== null;
}
