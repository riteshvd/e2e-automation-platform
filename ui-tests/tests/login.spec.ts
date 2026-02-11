import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('user can login', async ({ page }) => {
  const login = new LoginPage(page);

  await login.goto();
  await login.login('testuser', 'password123');

  await expect(page.locator('#todoCard')).toBeVisible();
});
