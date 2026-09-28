import { describe, expect, it } from "vitest";
import { BucketSchema } from "./bucket";

describe("BucketSchema", () => {
  it.each(["needs", "wants", "savings", "investing"])("accepts %s", (bucket) => {
    expect(BucketSchema.safeParse(bucket).success).toBe(true);
  });

  it("rejects an invalid bucket string", () => {
    expect(BucketSchema.safeParse("groceries").success).toBe(false);
  });
});
