import UIComponent from "./UIComponent.js";

const CURRENCY_URL =
  "https://api.frankfurter.dev/v2/rate/eur/usd";

export default class CurrencyWidget extends UIComponent {
  constructor(id, title = "Курс валют") {
    super(id, title);

    this.type = "currency";
    this.requestController = null;
  }

  render() {
    const card = super.render();

    if (this._rendered) return card;
    this._rendered = true;

    this.status = document.createElement("div");
    this.status.className = "widget-status status-loading";
    this.status.textContent = "ЗАПРОС КУРСА";

    this.content = document.createElement("div");

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "retry-button";
    retry.textContent = "Повторить";

    this.retryButton = retry;

    this.listen(retry, "click", () => this.loadRate());

    this.body.append(this.status, this.content, retry);

    this.loadRate();

    return card;
  }

  async loadRate() {
    if (this.destroyed || !this.body) return;

    this.requestController?.abort();

    const controller = new AbortController();
    this.requestController = controller;

    this.status.className = "widget-status status-loading";
    this.status.textContent = "ЗАПРОС КУРСА";
    this.content.replaceChildren();
    this.retryButton.hidden = true;

    try {
      const response = await fetch(CURRENCY_URL, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (this.destroyed || controller.signal.aborted) return;

      if (
        data.base !== "EUR" ||
        data.quote !== "USD" ||
        typeof data.date !== "string" ||
        !Number.isFinite(data.rate) ||
        data.rate <= 0
      ) {
        throw new Error("Сервис вернул некорректный курс.");
      }

      this.status.className = "widget-status";
      this.status.textContent = "КУРС ПОЛУЧЕН";

      const pair = document.createElement("div");
      pair.className = "currency-pair";
      pair.textContent = `${data.base} → ${data.quote}`;

      const rate = document.createElement("div");
      rate.className = "currency-rate";
      rate.textContent = data.rate.toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      });

      const description = document.createElement("p");
      description.className = "currency-note";
      description.textContent =
        `1 EUR = ${data.rate} USD`;

      const date = document.createElement("div");
      date.className = "data-cell";

      const label = document.createElement("span");
      label.className = "data-label";
      label.textContent = "ДАТА КУРСА";

      const dateValue = document.createElement("span");
      dateValue.className = "data-value";
      dateValue.textContent = data.date;

      date.append(label, dateValue);

      this.content.append(pair, rate, description, date);
    } catch (error) {
      if (error.name === "AbortError") return;
      if (this.destroyed) return;

      this.status.className = "widget-status status-error";
      this.status.textContent = "DANGER / НЕТ ДАННЫХ";

      const message = document.createElement("p");
      message.className = "widget-error";
      message.textContent =
        `Не удалось загрузить курс: ${error.message}`;

      this.content.replaceChildren(message);
      this.retryButton.hidden = false;
    }
  }

  destroy() {
    this.requestController?.abort();
    this.requestController = null;
    super.destroy();
  }
}