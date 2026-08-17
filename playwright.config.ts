import { defineConfig } from '@playwright/test';

// E2E smoke tests run against a production build of the app on a dedicated
// port. The webServer command builds and starts Next in production mode (more
// realistic and stable than dev mode) against the real Neon DB configured in
// .env. The DB must already be migrated (pnpm db:migrate).
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  // The smoke flow is a single sequential scenario sharing one login; run it
  // on one worker to avoid concurrent writes to the shared dev DB.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    // Login once in the setup project and persist the session cookie.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'smoke',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
      use: { storageState: './e2e/.auth/user.json' },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
