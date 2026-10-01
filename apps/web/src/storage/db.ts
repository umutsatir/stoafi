import Dexie, { type EntityTable } from "dexie";
import { migrateProfileV1ToV2, migrateProfileV2ToV3 } from "./migrations";

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
  settings!: EntityTable<SingletonRow, "id">;
  holdings!: EntityTable<ListRow, "id">;
  snapshots!: EntityTable<ListRow, "id">;

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

    // v2 demonstrates the migration pattern; see migrations.ts.
    this.version(2)
      .stores({
        profile: "id",
        plan: "id",
        guards: "id",
        queue: "id",
        sinkingFunds: "id",
        cards: "id",
        decisions: "id",
      })
      .upgrade(migrateProfileV1ToV2);

    // v3 reshapes the profile row to the T9.1 model; same tables.
    this.version(3)
      .stores({
        profile: "id",
        plan: "id",
        guards: "id",
        queue: "id",
        sinkingFunds: "id",
        cards: "id",
        decisions: "id",
      })
      .upgrade(migrateProfileV2ToV3);

    // v4 adds the settings table (language and currency); existing rows are untouched.
    this.version(4).stores({
      profile: "id",
      plan: "id",
      guards: "id",
      queue: "id",
      sinkingFunds: "id",
      cards: "id",
      decisions: "id",
      settings: "id",
    });

    // v5 adds the holdings table (investments); existing rows are untouched.
    this.version(5).stores({
      profile: "id",
      plan: "id",
      guards: "id",
      queue: "id",
      sinkingFunds: "id",
      cards: "id",
      decisions: "id",
      settings: "id",
      holdings: "id",
    });

    // v6 adds the monthly snapshots table; existing rows are untouched.
    this.version(6).stores({
      profile: "id",
      plan: "id",
      guards: "id",
      queue: "id",
      sinkingFunds: "id",
      cards: "id",
      decisions: "id",
      settings: "id",
      holdings: "id",
      snapshots: "id",
    });
  }
}
