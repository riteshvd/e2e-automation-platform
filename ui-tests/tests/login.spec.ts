import { test, expect } from "@playwright/test";

test("user can login @smoke @critical", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("username").fill("testuser");
  await page.getByTestId("password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Todos")).toBeVisible();
});

test("broken test @quarantine", async ({ page }) => {
  // ...
});
