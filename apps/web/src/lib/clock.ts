import type { Month } from "@stoafi/core";

/** Local calendar date as YYYY-MM-DD. Called only at the app boundary; core never reads the clock. */
export function localIsoDate(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function monthOf(isoDate: string): Month {
  return isoDate.slice(0, 7) as Month;
}
