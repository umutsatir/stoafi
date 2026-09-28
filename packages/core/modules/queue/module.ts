import type { Module } from "../../kernel/module";
import { QueueItemSchema } from "./schema";
import { costInWorkHours, costPerUse, eisenhowerQuadrant } from "./selectors";
import { cooldownStatus } from "./cooldown";
import { toDraftCommitment } from "./to-commitment";
import { scheduleQueue } from "./scheduler";

export const queueModule: Module<typeof QueueItemSchema> = {
  id: "queue",
  version: 1,
  schema: QueueItemSchema,
  migrations: [],
  selectors: {
    costInWorkHours,
    costPerUse,
    eisenhowerQuadrant,
    cooldownStatus,
    toDraftCommitment,
    scheduleQueue,
  },
};
