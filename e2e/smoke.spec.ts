import { expect, test } from '@playwright/test';

import { E2E_PREFIX } from './constants';

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

test('smoke: create client → project → task → complete reminder', async ({
  page,
}) => {
  const runId = Date.now();
  const clientName = `${E2E_PREFIX}Client ${runId}`;
  const projectName = `${E2E_PREFIX}Project ${runId}`;
  const taskTitle = `${E2E_PREFIX}Task ${runId}`;
  const reminderTitle = `${E2E_PREFIX}Reminder ${runId}`;

  // -- Create a client ------------------------------------------------
  await page.goto('/clients');
  // The header and empty-state render the same trigger when the list is empty.
  await page.getByRole('button', { name: 'New client' }).first().click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Name').fill(clientName);
  await dialog.getByRole('button', { name: 'Create client' }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: clientName })).toBeVisible();

  // -- Create a project linked to the client --------------------------
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project' }).first().click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Name').fill(projectName);
  await dialog.getByRole('combobox').filter({ hasText: 'No client' }).click();
  await page.getByRole('option', { name: clientName }).click();
  await dialog.getByRole('button', { name: 'Create project' }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: projectName })).toBeVisible();

  // -- Create a task in the project -----------------------------------
  await page.getByRole('link', { name: projectName }).click();
  await expect(page).toHaveURL(/\/projects\//);
  await page.getByRole('tab', { name: 'Tasks' }).click();
  await page.getByRole('button', { name: 'Add task' }).first().click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Title').fill(taskTitle);
  await dialog.getByRole('combobox').filter({ hasText: 'Medium' }).click();
  await page.getByRole('option', { name: 'High' }).click();
  await dialog.getByRole('button', { name: 'Create task' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('row', { name: new RegExp(taskTitle) })
  ).toBeVisible();

  // -- Create an overdue reminder, then complete it -------------------
  await page.goto('/reminders');
  await page.getByRole('button', { name: 'New reminder' }).first().click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Title').fill(reminderTitle);
  // One hour in the past so it shows as overdue in the dashboard widget.
  await dialog
    .getByLabel('Due date and time')
    .fill(toDatetimeLocal(new Date(Date.now() - 60 * 60 * 1000)));
  await dialog.getByRole('button', { name: 'Create reminder' }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('row', { name: new RegExp(reminderTitle) })
  ).toBeVisible();

  await page.goto('/');
  const reminderItem = page.locator('li').filter({ hasText: reminderTitle });
  await expect(
    reminderItem.getByRole('button', { name: 'Mark as done' })
  ).toBeVisible();
  await reminderItem.getByRole('button', { name: 'Mark as done' }).click();

  // Wait for the server action to commit before re-reading the reminders page.
  await expect(page.getByText('Reminder completed')).toBeVisible();

  // Completing moves the reminder to the "Completed / dismissed" section.
  await page.goto('/reminders');
  const completedSection = page
    .getByRole('heading', { name: 'Completed / dismissed' })
    .locator('xpath=ancestor::section');
  await expect(completedSection.getByText(reminderTitle)).toBeVisible();
  await expect(
    page.getByRole('row', { name: new RegExp(reminderTitle) })
  ).toHaveCount(1);
});
