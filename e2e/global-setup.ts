import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import 'dotenv/config';

import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_NAME,
  E2E_ADMIN_PASSWORD,
} from './constants';

// Runs before the test projects. Ensures the e2e admin exists (the shared dev
// DB may be clean) by re-running the idempotent admin seed.
export default function globalSetup() {
  mkdirSync('e2e/.auth', { recursive: true });

  const seed = spawnSync('pnpm', ['exec', 'tsx', 'src/db/seed.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ADMIN_EMAIL: E2E_ADMIN_EMAIL,
      ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
      ADMIN_NAME: E2E_ADMIN_NAME,
    },
  });

  if (seed.status !== 0) {
    throw new Error(
      `E2E seed failed (exit ${seed.status}) — is DATABASE_URL set in .env and the DB migrated?`
    );
  }
}
