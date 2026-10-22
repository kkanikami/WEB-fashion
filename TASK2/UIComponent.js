export default class UIComponent {
    constructor(id, title) {
        this.id = id;
        this.title = title;
        this.element = null;
        this.body = null;
        this.destroyed = false;
        this.collapsed = false;

        this._listeners = [];
        this._timers = new Set();
        this._abortController = new AbortController();
    }

    render() {
        if (this.destroyed) {
            throw new Error("Нельзя отобразить удалённый компонент.");
        }

        if (this.element) {
            return this.element;
        }

        const card = document.createElement("article");
        card.className = "widget-card";
        card.dataset.widgetId = this.id;

        const header = document.createElement("header");
        header.className = "widget-header";

        const heading = document.createElement("div");
        heading.className = "widget-heading";

        const index = document.createElement("span");
        index.className = "widget-index";
        index.textContent = this.getIndexLabel();

        const title = document.createElement("h2");
        title.className = "widget-title";
        title.textContent = this.title;

        heading.append(index, title);

        const actions = document.createElement("div");
        actions.className = "widget-header-actions";

        const collapseButton = document.createElement("button");
        collapseButton.type = "button";
        collapseButton.className = "icon-button";
        collapseButton.setAttribute("aria-label", "Свернуть карточку");
        collapseButton.setAttribute("aria-expanded", "true");
        collapseButton.title = "Свернуть / развернуть";
        collapseButton.textContent = "⌃";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "icon-button delete-widget";
        deleteButton.setAttribute("aria-label", "Удалить виджет");
        deleteButton.title = "Удалить виджет";
        deleteButton.textContent = "×";

        actions.append(collapseButton, deleteButton);
        header.append(heading, actions);

        const body = document.createElement("div");
        body.className = "widget-body";

        card.append(header, body);

        this.element = card;
        this.body = body;

        this.listen(collapseButton, "click", () => {
            this.toggleCollapse();
        });

        this.listen(deleteButton, "click", () => {
            this.onRemove?.(this.id);
        });

        return card;
    }

    getIndexLabel() {
        const labels = {
            todo: "01",
            weather: "02",
            currency: "03"
        };

        return labels[this.type] ?? "00";
    }

    listen(target, eventName, handler, options = {}) {
        if (this.destroyed) return;

        target.addEventListener(eventName, handler, options);

        this._listeners.push({
            target,
            eventName,
            handler,
            options
        });
    }

    setTimer(callback, delay) {
        const timer = setTimeout(() => {
            this._timers.delete(timer);

            if (!this.destroyed) {
                callback();
            }
        }, delay);

        this._timers.add(timer);
        return timer;
    }

    clearTimer(timer) {
        clearTimeout(timer);
        this._timers.delete(timer);
    }

    toggleCollapse() {
        if (!this.element || this.destroyed) return;

        this.collapsed = !this.collapsed;
        this.element.classList.toggle("is-collapsed", this.collapsed);

        const button = this.element.querySelector(
            '[aria-label="Свернуть карточку"], ' +
            '[aria-label="Развернуть карточку"]'
        );

        if (!button) return;

        button.setAttribute(
            "aria-label",
            this.collapsed ? "Развернуть карточку" : "Свернуть карточку"
        );

        button.setAttribute(
            "aria-expanded",
            String(!this.collapsed)
        );

        button.textContent = this.collapsed ? "⌄" : "⌃";
    }

    onRemove() {
        // Переопределяется Dashboard при создании виджета.
    }

    destroy() {
        if (this.destroyed) return;

        this.destroyed = true;

        this._abortController.abort();

        for (const timer of this._timers) {
            clearTimeout(timer);
        }

        this._timers.clear();

        for (const {
            target,
            eventName,
            handler,
            options
        } of this._listeners) {
            target.removeEventListener(eventName, handler, options);
        }

        this._listeners.length = 0;

        this.element?.remove();

        this.element = null;
        this.body = null;
        this.onRemove = null;
    }
}