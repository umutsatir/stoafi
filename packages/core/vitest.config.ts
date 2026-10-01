import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/**/*.test.ts",
      "kernel/**/*.test.ts",
      "modules/**/*.test.ts",
      "strategies/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: ["kernel/**/*.ts", "modules/**/*.ts", "strategies/**/*.ts"],
      exclude: ["**/*.test.ts", "src/**"],
      // SPEC acceptance: core coverage stays at or above 90% (lines and branches).
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
