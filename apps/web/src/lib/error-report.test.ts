import { describe, expect, it } from "vitest";
import { buildErrorReport } from "./error-report";

const context = {
  version: "0.0.0",
  time: "2026-10-01T10:00:00.000Z",
  path: "/queue",
  userAgent: "TestBrowser/1",
};

describe("buildErrorReport", () => {
  it("records what failed, where and in which version", () => {
    const report = buildErrorReport(new TypeError("x is not a function"), context);
    expect(report).toMatchObject({
      app: "stoafi",
      version: "0.0.0",
      path: "/queue",
      error: { name: "TypeError", message: "x is not a function" },
    });
    expect(report.error.stack.length).toBeGreaterThan(0);
  });

  it("keeps a long message and a long stack to a sensible size", () => {
    const error = new Error("m".repeat(5000));
    error.stack = Array.from({ length: 200 }, (_, i) => `at line ${i}`).join("\n");
    const report = buildErrorReport(error, context);
    expect(report.error.message).toHaveLength(300);
    expect(report.error.stack).toHaveLength(12);
  });

  it("keeps the digest Next.js gives a server error, and leaves it out otherwise", () => {
    const withDigest = Object.assign(new Error("boom"), { digest: "abc123" });
    expect(buildErrorReport(withDigest, context).error.digest).toBe("abc123");
    expect("digest" in buildErrorReport(new Error("boom"), context).error).toBe(false);
  });

  it("copes with an error that has no stack", () => {
    const error = new Error("no stack");
    delete error.stack;
    expect(buildErrorReport(error, context).error.stack).toEqual([""]);
  });

  it("contains nothing from the user's finances, only the fields listed", () => {
    const report = buildErrorReport(new Error("boom"), context);
    expect(Object.keys(report).sort()).toEqual([
      "app",
      "error",
      "path",
      "time",
      "userAgent",
      "version",
    ]);
  });
});
