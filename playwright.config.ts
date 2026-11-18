import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * По умолчанию поднимается только Chromium, и окно не открывается.
 *
 * Другие браузеры включаются явно — `ALL_BROWSERS=1 pnpm test:e2e`, и перед
 * этим их надо поставить: `pnpm exec playwright install firefox webkit`.
 * Видимое окно для отладки — `HEADED=1 pnpm test:e2e`.
 */
const allBrowsers = process.env.ALL_BROWSERS === '1'
const headed = process.env.HEADED === '1'

const extraBrowsers = allBrowsers
  ? [
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ]
  : []

export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Локально тесты идут без окна: оно мешает и замедляет прогон. */
    headless: !headed,
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }, ...extraBrowsers],

  /* Run your local dev server before starting the tests */
  webServer: {
    /**
     * Use the dev server by default for faster feedback loop.
     * Use the preview server on CI for more realistic testing.
     * Playwright will re-use the local server if there is already a dev-server running.
     */
    command: process.env.CI ? 'npm run preview' : 'npm run dev',
    port: process.env.CI ? 4173 : 5173,
    reuseExistingServer: !process.env.CI,
  },
})
