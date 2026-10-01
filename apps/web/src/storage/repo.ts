import type { z } from "zod";
import type { StoafiDb } from "./db";
import { SINGLETON_ID, type ListRow } from "./db";

type SingletonTableName = "profile" | "plan" | "guards" | "settings";
type ListTableName = "queue" | "sinkingFunds" | "cards" | "decisions" | "holdings";

/** Validates `value` against `schema` and writes it as the table's one row. */
export async function putSingleton<Schema extends z.ZodTypeAny>(
  db: StoafiDb,
  table: SingletonTableName,
  schema: Schema,
  value: unknown,
): Promise<z.infer<Schema>> {
  const parsed = schema.parse(value) as z.infer<Schema>;
  await db[table].put({ id: SINGLETON_ID, data: parsed });
  return parsed;
}

export async function getSingleton<Schema extends z.ZodTypeAny>(
  db: StoafiDb,
  table: SingletonTableName,
  schema: Schema,
): Promise<z.infer<Schema> | undefined> {
  const row = await db[table].get(SINGLETON_ID);
  return row ? (schema.parse(row.data) as z.infer<Schema>) : undefined;
}

/** Validates `value` against `schema` (which must include an `id` field) and upserts it. */
export async function putListItem<Schema extends z.ZodTypeAny>(
  db: StoafiDb,
  table: ListTableName,
  schema: Schema,
  value: unknown,
): Promise<z.infer<Schema>> {
  const parsed = schema.parse(value) as z.infer<Schema>;
  await db[table].put(parsed as ListRow);
  return parsed;
}

export async function listItems<Schema extends z.ZodTypeAny>(
  db: StoafiDb,
  table: ListTableName,
  schema: Schema,
): Promise<z.infer<Schema>[]> {
  const rows = await db[table].toArray();
  return rows.map((row) => schema.parse(row) as z.infer<Schema>);
}
