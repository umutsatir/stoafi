import { defineConfig } from "@playwright/test";

const port = 4173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    // Where a browser was installed outside Playwright's own cache (e.g. the cloud sandbox).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  // Needs `pnpm build` first: the tests run against the static export, like a real install.
  webServer: {
    command: "node e2e/serve.mjs",
    port,
    reuseExistingServer: true,
  },
});
