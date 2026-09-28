import { StoafiDb } from "./db";

/** The app's single Dexie connection. Tests build their own StoafiDb instead. */
export const db = new StoafiDb();
