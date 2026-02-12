import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },

  // Stability strategy
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  fullyParallel: true,

  // Observability artifacts
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },

  // Reporters for Jenkins + dashboard generator
  reporter: [
    ["line"],
    ["html", { outputFolder: "../reports/ui-html", open: "never" }],
    ["junit", { outputFile: "../reports/ui-junit.xml" }],
    ["json", { outputFile: "../reports/ui-results.json" }],
  ],
});
