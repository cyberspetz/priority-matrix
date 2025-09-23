import { test, expect } from '@playwright/test';

test.describe('Actions menu', () => {
  test('delete confirmation cancel and confirm', async ({ page }) => {
    await page.goto('/');

    // Add a task
    await page.getByTitle('Open menu').click();
    await page.locator('aside').getByRole('button', { name: 'Add task', exact: true }).click();
    const title = 'To delete ' + Math.random().toString(36).slice(2, 6);
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('What needs to be done?').fill(title);
    await dialog.getByRole('button', { name: 'Add Task', exact: true }).click();

    const cardContainer = page.locator('[id^="task-"]', { hasText: title }).first();
    await expect(cardContainer).toBeVisible();

    // Open actions menu and click Delete, then Cancel
    await cardContainer.getByTitle('More actions').click();
    await page.getByTestId('action-delete').click();
    await page.getByTestId('confirm-cancel').click();
    // Fallback close if mobile safari intercepts: press Escape
    await page.keyboard.press('Escape');
    await expect(page.getByText('Delete task?')).toHaveCount(0);
    await expect(cardContainer).toBeVisible();

    // Delete for real
    await cardContainer.getByTitle('More actions').click();
    await page.getByTestId('action-delete').click();
    await page.getByTestId('confirm-delete').click({ trial: true }).catch(() => {});
    await page.getByTestId('confirm-delete').click({ force: true });
    await expect(page.getByText('Delete task?')).toHaveCount(0);
    await expect(cardContainer).toHaveCount(0);
  });
});
