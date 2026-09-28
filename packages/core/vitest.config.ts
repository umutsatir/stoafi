import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/**/*.test.ts",
      "kernel/**/*.test.ts",
      "modules/**/*.test.ts",
      "strategies/**/*.test.ts",
    ],
  },
});
