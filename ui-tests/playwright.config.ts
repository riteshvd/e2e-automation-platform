import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  timeout: 30_000,              // prevent hanging tests
  expect: { timeout: 10_000 },  // auto-wait for assertions

  retries: process.env.CI ? 1 : 0,   // retry ONLY in CI
  workers: process.env.CI ? 4 : 2,   // parallelism

  reporter: [
    ['list'],
    ['junit', { outputFile: '../reports/ui-junit.xml' }],
    ['html', { outputFolder: '../reports/ui-html', open: 'never' }]
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    headless: !!process.env.CI,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
