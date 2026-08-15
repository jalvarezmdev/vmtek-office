import { expect, test as setup } from '@playwright/test';

import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  STORAGE_STATE,
} from './constants';

// Login step of the smoke flow. Runs once in the 'setup' project; the session
// is persisted to storageState and reused by the 'smoke' project.
setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(E2E_ADMIN_EMAIL);
  await page.getByLabel('Password').fill(E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Successful login redirects to the dashboard with the authenticated shell.
  // exact: true — the dashboard "Active projects" widget link also contains
  // "projects" and would otherwise match.
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('link', { name: 'Projects', exact: true })
  ).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
