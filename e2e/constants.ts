// The smoke tests run against the shared dev DB, so every row they create is
// namespaced with this prefix and removed again in global-teardown.
export const E2E_PREFIX = 'E2E ';

export const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e@vmtek.test';
export const E2E_ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? 'E2ePass123!';
export const E2E_ADMIN_NAME = process.env.E2E_ADMIN_NAME ?? 'E2E Admin';

export const STORAGE_STATE = './e2e/.auth/user.json';
