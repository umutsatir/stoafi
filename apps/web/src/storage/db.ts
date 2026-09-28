import Dexie, { type EntityTable } from "dexie";

/**
 * Singleton-shaped tables (profile, plan, guards) always store their one
 * row under this fixed id, since their core Zod schemas describe a single
 * object rather than a list of records.
 */
export const SINGLETON_ID = "singleton";

export interface SingletonRow {
  id: typeof SINGLETON_ID;
  data: unknown;
}

export interface ListRow {
  id: string;
  [key: string]: unknown;
}

export class StoafiDb extends Dexie {
  profile!: EntityTable<SingletonRow, "id">;
  plan!: EntityTable<SingletonRow, "id">;
  guards!: EntityTable<SingletonRow, "id">;
  queue!: EntityTable<ListRow, "id">;
  sinkingFunds!: EntityTable<ListRow, "id">;
  cards!: EntityTable<ListRow, "id">;
  decisions!: EntityTable<ListRow, "id">;

  constructor(name = "stoafi") {
    super(name);
    this.version(1).stores({
      profile: "id",
      plan: "id",
      guards: "id",
      queue: "id",
      sinkingFunds: "id",
      cards: "id",
      decisions: "id",
    });
  }
}
