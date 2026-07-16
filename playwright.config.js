import { defineConfig, devices } from '@playwright/test';

const PORT = 3456;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // TODO(e2e) [review:2026-09-16]: this project ships with a known red baseline (~12 unannotated failures) and runs nowhere in CI — either fix the baseline or mark the known failures test.fail(), then gate mobile in CI alongside chromium. !p1 #testing
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: `npx serve public -l ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
