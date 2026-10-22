import UIComponent from "./UIComponent.js";

export default class ToDoWidget extends UIComponent {
  constructor(id, title = "Задачи", initialTasks = []) {
    super(id, title);

    this.type = "todo";
    this.tasks = Array.isArray(initialTasks)
      ? initialTasks
          .filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            task.text.trim() &&
            typeof task.completed === "boolean"
          )
          .map(task => ({
            id: task.id,
            text: task.text,
            completed: task.completed
          }))
      : [];
  }

  render() {
    const card = super.render();

    if (this._rendered) return card;
    this._rendered = true;

    const status = document.createElement("div");
    status.className = "widget-status";
    status.textContent = "СПИСОК ЗАДАЧ";

    const form = document.createElement("form");
    form.className = "todo-form";

    const input = document.createElement("input");
    input.className = "todo-input";
    input.type = "text";
    input.name = "task";
    input.placeholder = "Например, проверить маршрут...";
    input.maxLength = 180;
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Новая задача");

    const addButton = document.createElement("button");
    addButton.className = "task-add-button";
    addButton.type = "submit";
    addButton.textContent = "Добавить";

    form.append(input, addButton);

    const list = document.createElement("ul");
    list.className = "task-list";

    const empty = document.createElement("p");
    empty.className = "widget-empty";
    empty.textContent = "Задач пока нет.";

    const summary = document.createElement("div");
    summary.className = "todo-summary";

    const total = document.createElement("span");
    const completed = document.createElement("span");

    summary.append(total, completed);

    this.body.append(status, form, empty, list, summary);

    this.listen(form, "submit", event => {
      event.preventDefault();

      const text = input.value.trim();

      if (!text) {
        input.focus();
        return;
      }

      this.tasks.push({
        id: this.createTaskId(),
        text,
        completed: false
      });

      input.value = "";
      input.focus();

      this.renderTasks();
      this.onChange?.();
    });

    this.listen(list, "change", event => {
      const checkbox = event.target.closest("[data-task-check]");

      if (!checkbox || !list.contains(checkbox)) return;

      const task = this.tasks.find(
        item => item.id === checkbox.dataset.taskCheck
      );

      if (!task) return;

      task.completed = checkbox.checked;

      this.renderTasks();
      this.onChange?.();
    });

    this.listen(list, "click", event => {
      const button = event.target.closest("[data-task-delete]");

      if (!button || !list.contains(button)) return;

      const taskId = button.dataset.taskDelete;

      this.tasks = this.tasks.filter(task => task.id !== taskId);

      this.renderTasks();
      this.onChange?.();
    });

    this.renderTasks();

    return card;
  }

  createTaskId() {
    return globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  renderTasks() {
    if (!this.body || this.destroyed) return;

    const list = this.body.querySelector(".task-list");
    const empty = this.body.querySelector(".widget-empty");
    const total = this.body.querySelector(".todo-summary span:first-child");
    const completed = this.body.querySelector(".todo-summary span:last-child");

    list.replaceChildren();

    for (const task of this.tasks) {
      const item = document.createElement("li");
      item.className = "task-item";

      if (task.completed) {
        item.classList.add("is-complete");
      }

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-check";
      checkbox.checked = task.completed;
      checkbox.dataset.taskCheck = task.id;
      checkbox.setAttribute("aria-label", "Отметить выполнение");

      const text = document.createElement("span");
      text.className = "task-text";
      text.textContent = task.text;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "task-delete";
      deleteButton.dataset.taskDelete = task.id;
      deleteButton.setAttribute("aria-label", "Удалить задачу");
      deleteButton.textContent = "×";

      item.append(checkbox, text, deleteButton);
      list.append(item);
    }

    empty.hidden = this.tasks.length > 0;

    total.textContent = `ВСЕГО: ${this.tasks.length}`;

    completed.textContent =
      `ГОТОВО: ${this.tasks.filter(task => task.completed).length}`;
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      tasks: this.tasks.map(task => ({ ...task }))
    };
  }

  destroy() {
    this.onChange = null;
    super.destroy();
  }
}