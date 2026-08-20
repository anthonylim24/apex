import { defineConfig, devices } from '@playwright/test';

/**
 * E2E configuration: tests run against the static Expo web export
 * (`bun run export:web`), served locally — the same artifact a CDN would
 * serve. Works headlessly in CI/cloud with no device or emulator.
 *
 * `PW_BASE_URL` overrides the target (e.g. an already-running Metro dev
 * server on :8081) for faster local iteration.
 */
const baseURL = process.env.PW_BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 390, height: 844 }, // iPhone-ish portrait
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: 'bunx serve dist -l 4173 --no-clipboard',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
