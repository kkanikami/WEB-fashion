import ToDoWidget from "./ToDoWidget.js";
import WeatherWidget from "./WeatherWidget.js";
import CurrencyWidget from "./CurrencyWidget.js";

const STORAGE_KEY = "zone-travel-dashboard-v1";

const WIDGET_TYPES = {
  todo: {
    title: "Задачи",
    create: (id, saved) =>
      new ToDoWidget(id, "Задачи", saved?.tasks ?? [])
  },

  weather: {
    title: "Погода",
    create: id => new WeatherWidget(id, "Погода")
  },

  currency: {
    title: "Курс валют",
    create: id => new CurrencyWidget(id, "Курс валют")
  }
};

export default class Dashboard {
  constructor(container, countElement, messageElement) {
    this.container = container;
    this.countElement = countElement;
    this.messageElement = messageElement;

    this.widgets = new Map();
    this.initialized = false;
    this.messageTimer = null;
  }

  init() {
    if (this.initialized) return;

    this.initialized = true;

    const stored = this.readState();

    if (stored.found) {
      for (const saved of stored.widgets) {
        if (!WIDGET_TYPES[saved.type]) continue;

        this.addWidget(saved.type, saved);
      }
    } else {
      this.addWidget("todo");
      this.addWidget("weather");
      this.addWidget("currency");
    }

    this.updateCount();
  }

  addWidget(type, saved = null) {
    const definition = WIDGET_TYPES[type];

    if (!definition) {
      this.showMessage("Неизвестный тип виджета.");
      return null;
    }

    if (this.widgets.has(type)) {
      this.showMessage(
        `Виджет «${definition.title}» уже добавлен.`
      );
      return null;
    }

    const widget = definition.create(type, saved);

    widget.onRemove = id => {
      this.removeWidget(id);
    };

    if (widget.type === "todo") {
      widget.onChange = () => {
        this.saveState();
      };
    }

    this.widgets.set(type, widget);

    try {
      this.container.append(widget.render());
    } catch (error) {
      this.widgets.delete(type);
      widget.destroy();

      this.showMessage(
        `Не удалось создать виджет: ${error.message}`
      );

      this.updateCount();
      return null;
    }

    this.updateCount();
    this.saveState();
    this.showMessage(`Виджет «${definition.title}» добавлен.`);

    return widget;
  }

  removeWidget(id) {
    const widget = this.widgets.get(id);

    if (!widget) return;

    this.widgets.delete(id);
    widget.destroy();

    this.updateCount();
    this.saveState();
    this.showMessage(`Виджет «${widget.title}» удалён.`);
  }

  updateCount() {
    if (!this.countElement) return;

    this.countElement.textContent =
      `${this.widgets.size} / ${Object.keys(WIDGET_TYPES).length}`;

    for (const [type] of Object.entries(WIDGET_TYPES)) {
      const button = document.querySelector(
        `[data-add-widget="${type}"]`
      );

      if (!button) continue;

      const exists = this.widgets.has(type);
      button.disabled = exists;
      button.setAttribute("aria-pressed", String(exists));

      button.title = exists
        ? "Этот виджет уже находится на панели"
        : "Добавить виджет";
    }
  }

  showMessage(message) {
    if (!this.messageElement) return;

    this.messageElement.textContent = message;

    if (this.messageTimer !== null) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }

    this.messageTimer = setTimeout(() => {
      if (this.messageElement) {
        this.messageElement.textContent = "";
      }

      this.messageTimer = null;
    }, 4000);
  }

  saveState() {
    try {
      const state = {
        version: 1,
        widgets: Array.from(this.widgets.values(), widget =>
          widget.type === "todo"
            ? widget.serialize()
            : {
                id: widget.id,
                type: widget.type,
                title: widget.title
              }
        )
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      return true;
    } catch (error) {
      // Например, хранилище запрещено настройками браузера.
      console.warn("Не удалось сохранить состояние панели:", error);
      return false;
    }
  }

  readState() {
    let raw;

    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Не удалось прочитать localStorage:", error);
      return { found: false, widgets: [] };
    }

    if (raw === null) {
      return { found: false, widgets: [] };
    }

    try {
      const state = JSON.parse(raw);

      if (
        !state ||
        state.version !== 1 ||
        !Array.isArray(state.widgets)
      ) {
        throw new Error("Неподдерживаемый формат сохранения.");
      }

      const unique = new Set();
      const widgets = [];

      for (const saved of state.widgets) {
        if (
          !saved ||
          typeof saved.type !== "string" ||
          !WIDGET_TYPES[saved.type] ||
          unique.has(saved.type)
        ) {
          continue;
        }

        unique.add(saved.type);

        widgets.push({
          ...saved,
          id: saved.type
        });
      }

      return { found: true, widgets };
    } catch (error) {
      console.warn("Сохранённые данные повреждены:", error);

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Панель продолжит работать без доступа к хранилищу.
      }

      return { found: false, widgets: [] };
    }
  }
}