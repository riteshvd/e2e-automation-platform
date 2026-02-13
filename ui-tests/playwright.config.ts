import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  timeout: 30 * 1000,

  expect: {
    timeout: 5000,
  },

  reporter: [
    ['line'],
    ['html', { outputFolder: '../reports/ui-html', open: 'never' }],
    ['junit', { outputFile: '../reports/ui-junit.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000,
  },

  workers: process.env.CI ? 2 : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
});
