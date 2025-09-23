import { test, expect } from '@playwright/test';

test.describe('Quick schedule menu', () => {
  test('sets due Today and Tomorrow from card menu', async ({ page }) => {
    await page.goto('/');

    // Open sidebar and add a new task via modal
    await page.getByTitle('Open menu').click();
    await page.locator('aside').getByRole('button', { name: 'Add task', exact: true }).click();

    // Modal appears; enter title and submit
    const title = 'Test task ' + Math.random().toString(36).slice(2, 6);
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('What needs to be done?').fill(title);
    await dialog.getByRole('button', { name: 'Add Task', exact: true }).click();

    // Locate the card by title
    const card = page.getByText(title, { exact: true });
    await expect(card).toBeVisible();

    const cardContainer = page.locator('[id^="task-"]', { hasText: title }).first();
    await cardContainer.getByTitle('Quick schedule').click();
    await page.getByTestId('qs-menu').waitFor();
    const todayOption = page.getByTestId('qs-today');
    await todayOption.scrollIntoViewIfNeeded();
    await todayOption.click();
    await page.getByTestId('qs-menu').waitFor({ state: 'detached' });
    await expect(cardContainer.locator('[title="Scheduled start"]:has-text("Today")').first()).toBeVisible();

    // Change to Tomorrow
    await cardContainer.getByTitle('Quick schedule').click();
    await page.getByTestId('qs-menu').waitFor();
    const tomorrowOption = page.getByTestId('qs-tomorrow');
    await tomorrowOption.scrollIntoViewIfNeeded();
    await tomorrowOption.click();
    await page.getByTestId('qs-menu').waitFor({ state: 'detached' });
    await expect(cardContainer.locator('[title="Scheduled start"]:has-text("Tomorrow")').first()).toBeVisible();

    // Update priority via quick menu
    await cardContainer.getByTitle('Quick schedule').click();
    await page.getByTestId('qs-menu').waitFor();
    const priorityCritical = page.getByTestId('qs-priority-p1');
    await priorityCritical.scrollIntoViewIfNeeded();
    await priorityCritical.click();
    await page.getByTestId('qs-menu').waitFor({ state: 'detached' });
    await expect(cardContainer.locator('[data-priority-pill][data-priority-level="p1"]').first()).toBeVisible();

    // Completing the task should hide schedule badges
    await cardContainer.getByRole('button', { name: 'Mark complete' }).click();
    await expect(cardContainer.locator('[title="Scheduled start"]')).toHaveCount(0);
    await expect(cardContainer.locator('[title="Deadline"]')).toHaveCount(0);
  });
});
