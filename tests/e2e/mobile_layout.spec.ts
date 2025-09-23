import { test, expect } from '@playwright/test';

test.describe('Mobile layout', () => {
  test('hides header and shows quadrants on iPhone 11 Pro Max', async ({ page }) => {
    await page.goto('/');

    // Header elements should be hidden on mobile
    await expect(page.getByText('Priority Matrix')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Reports' })).toBeHidden();
    await expect(page.getByTestId('header-add-task')).toBeHidden();

    // Quadrant titles should be visible
    await expect(page.getByText('Do First')).toBeVisible();
    await expect(page.getByText('Schedule')).toBeVisible();
    await expect(page.getByText('Delegate')).toBeVisible();
    await expect(page.getByText('Eliminate')).toBeVisible();
  });
});
