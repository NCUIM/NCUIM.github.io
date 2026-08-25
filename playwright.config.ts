import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "retain-on-failure",
    // The e2e specs assert the zh-TW UI. Without a locale the default en-US
    // browser would flip the app to the en-US fallback (see src/i18n).
    locale: "zh-TW",
  },
  webServer: {
    command: "npm run dev:e2e",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
