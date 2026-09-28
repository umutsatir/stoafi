import {
  cardsModule,
  createRegistry,
  decisionsModule,
  guardsModule,
  planModule,
  profileModule,
  queueModule,
  sinkingFundsModule,
} from "@stoafi/core";

export function createAppRegistry() {
  const registry = createRegistry();
  registry.register(profileModule);
  registry.register(planModule);
  registry.register(guardsModule);
  registry.register(queueModule);
  registry.register(sinkingFundsModule);
  registry.register(cardsModule);
  registry.register(decisionsModule);
  return registry;
}

/** Maps a core module id to its Dexie table name (camelCase vs. kebab-case). */
export const MODULE_ID_TO_TABLE = {
  profile: "profile",
  plan: "plan",
  guards: "guards",
  queue: "queue",
  "sinking-funds": "sinkingFunds",
  cards: "cards",
  decisions: "decisions",
} as const;

export const SINGLETON_MODULE_IDS = new Set(["profile", "plan", "guards"]);
