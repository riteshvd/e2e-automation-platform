import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TodoPage } from '../pages/TodoPage';

test('user can add a todo', async ({ page }) => {
  const login = new LoginPage(page);
  const todo = new TodoPage(page);

  await login.goto();
  await login.login('testuser', 'password123');

  const title = `todo-${Date.now()}`;
  await todo.addTodo(title);

  await expect(todo.todoByTitle(title)).toBeVisible();
});
