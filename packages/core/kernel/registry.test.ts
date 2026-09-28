import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createRegistry } from "./registry";
import type { Module } from "./module";

function makeModule(id: string, guards: { id: string }[] = []): Module {
  return {
    id,
    version: 1,
    schema: z.object({}),
    migrations: [],
    selectors: {},
    contributes: guards.length > 0 ? { guards } : undefined,
  };
}

describe("createRegistry", () => {
  it("registers and retrieves a module by id", () => {
    const registry = createRegistry();
    registry.register(makeModule("profile"));
    expect(registry.getModule("profile")?.id).toBe("profile");
  });

  it("throws when registering two modules with the same id", () => {
    const registry = createRegistry();
    registry.register(makeModule("profile"));
    expect(() => registry.register(makeModule("profile"))).toThrow();
  });

  it("lists modules in registration order", () => {
    const registry = createRegistry();
    registry.register(makeModule("a"));
    registry.register(makeModule("b"));
    registry.register(makeModule("c"));
    expect(registry.listModules().map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("collects contributes.guards across all registered modules", () => {
    const registry = createRegistry();
    registry.register(makeModule("guards", [{ id: "rule-1" }]));
    registry.register(makeModule("cards", [{ id: "rule-2" }]));
    registry.register(makeModule("profile"));

    const guards = registry.listModules().flatMap((m) => m.contributes?.guards ?? []);
    expect(guards.map((g) => g.id)).toEqual(["rule-1", "rule-2"]);
  });
});
