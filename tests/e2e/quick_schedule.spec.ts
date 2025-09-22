import { test, expect } from '@playwright/test';

test.describe('Quick schedule menu', () => {
  test('sets due Today and Tomorrow from card menu', async ({ page }) => {
    await page.goto('/');

    // Open sidebar and add a new task via modal
    await page.getByTitle('Open menu').click();
    await page.getByRole('button', { name: 'Add task', exact: true }).click();

    // Modal appears; enter title and submit
    const title = 'Test task ' + Math.random().toString(36).slice(2, 6);
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('What needs to be done?').fill(title);
    await dialog.getByRole('button', { name: 'Add Task', exact: true }).click();

    // Locate the card by title
    const card = page.getByText(title, { exact: true });
    await expect(card).toBeVisible();

    // Open quick schedule menu (calendar button) - find nearest by role/title
    // Move to parent card container then click calendar icon within
    const cardContainer = card.locator('..').locator('..').locator('..');
    await cardContainer.getByTitle('Quick schedule').click();
    await page.getByTestId('qs-menu').waitFor();
    await page.getByTestId('qs-today').click();
    // Close menu and check chip
    await cardContainer.getByTitle('Quick schedule').click();
    await expect(cardContainer.locator('div:has-text("Today")').first()).toBeVisible();

    // Change to Tomorrow
    await cardContainer.getByTitle('Quick schedule').click();
    await page.getByTestId('qs-menu').waitFor();
    await page.getByTestId('qs-tomorrow').click();
    await cardContainer.getByTitle('Quick schedule').click();
    await expect(cardContainer.locator('div:has-text("Tomorrow")').first()).toBeVisible();
  });
});
