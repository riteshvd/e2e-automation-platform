import { Page, Locator } from '@playwright/test';

export class TodoPage {
  readonly page: Page;
  readonly todoInput: Locator;
  readonly addBtn: Locator;
  readonly todoList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.todoInput = page.getByTestId('todo-input');
    this.addBtn = page.getByTestId('add-btn');
    this.todoList = page.getByTestId('todo-list');
  }

  async addTodo(title: string) {
    await this.todoInput.fill(title);
    await this.addBtn.click();
  }

  todoByTitle(title: string) {
    return this.page.getByText(title);
  }
}
