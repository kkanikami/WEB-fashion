import UIComponent from "./UIComponent.js";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast";

const LOCATION = {
  name: "Припять",
  latitude: 51.405,
  longitude: 30.057
};

function describeWeather(code) {
  const descriptions = {
    0: ["Ясно", "☀"],
    1: ["Преимущественно ясно", "☀"],
    2: ["Переменная облачность", "☁"],
    3: ["Пасмурно", "☁"],
    45: ["Туман", "≋"],
    48: ["Изморозь и туман", "≋"],
    51: ["Лёгкая морось", "☂"],
    53: ["Морось", "☂"],
    55: ["Сильная морось", "☂"],
    56: ["Ледяная морось", "❄"],
    57: ["Сильная ледяная морось", "❄"],
    61: ["Небольшой дождь", "☂"],
    63: ["Дождь", "☂"],
    65: ["Сильный дождь", "☂"],
    66: ["Ледяной дождь", "❄"],
    67: ["Сильный ледяной дождь", "❄"],
    71: ["Небольшой снег", "❄"],
    73: ["Снег", "❄"],
    75: ["Сильный снег", "❄"],
    77: ["Снежные зёрна", "❄"],
    80: ["Ливень", "☂"],
    81: ["Сильный ливень", "☂"],
    82: ["Очень сильный ливень", "☂"],
    85: ["Снегопад", "❄"],
    86: ["Сильный снегопад", "❄"],
    95: ["Гроза", "ϟ"],
    96: ["Гроза с градом", "ϟ"],
    99: ["Сильная гроза с градом", "ϟ"]
  };

  return descriptions[code] ?? ["Неизвестные условия", "?"];
}

export default class WeatherWidget extends UIComponent {
  constructor(id, title = "Погода") {
    super(id, title);

    this.type = "weather";
    this.requestController = null;
  }

  render() {
    const card = super.render();

    if (this._rendered) return card;
    this._rendered = true;

    this.status = document.createElement("div");
    this.status.className = "widget-status status-loading";
    this.status.textContent = "ЗАГРУЗКА ПОГОДЫ";

    this.content = document.createElement("div");

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "retry-button";
    retry.textContent = "Повторить";

    this.listen(retry, "click", () => this.loadWeather());

    this.retryButton = retry;

    this.body.append(this.status, this.content, retry);

    this.loadWeather();

    return card;
  }

  async loadWeather() {
    if (this.destroyed || !this.body) return;

    this.requestController?.abort();

    const controller = new AbortController();
    this.requestController = controller;

    this.status.className = "widget-status status-loading";
    this.status.textContent = "ЗАГРУЗКА ПОГОДЫ";
    this.content.replaceChildren();
    this.retryButton.hidden = true;

    const params = new URLSearchParams({
      latitude: String(LOCATION.latitude),
      longitude: String(LOCATION.longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      timezone: "auto"
    });

    try {
      const response = await fetch(
        `${WEATHER_URL}?${params.toString()}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error(`Ошибка сервера: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (this.destroyed || controller.signal.aborted) return;

      const current = data.current;
      const units = data.current_units;

      if (
        !current ||
        !units ||
        !Number.isFinite(current.temperature_2m) ||
        !Number.isFinite(current.apparent_temperature) ||
        !Number.isFinite(current.relative_humidity_2m) ||
        !Number.isFinite(current.wind_speed_10m) ||
        !Number.isFinite(current.weather_code)
      ) {
        throw new Error("Сервис вернул неполные данные о погоде.");
      }

      this.status.className = "widget-status";
      this.status.textContent = "ДАННЫЕ ПОЛУЧЕНЫ";

      const [description, symbol] = describeWeather(
        current.weather_code
      );

      const main = document.createElement("div");
      main.className = "weather-main";

      const temperature = document.createElement("div");
      temperature.className = "weather-temperature";
      temperature.textContent =
        `${current.temperature_2m} ${units.temperature_2m}`;

      const icon = document.createElement("div");
      icon.className = "weather-symbol";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = symbol;

      main.append(temperature, icon);

      const location = document.createElement("div");
      location.className = "weather-description";
      location.textContent = `${LOCATION.name} — ${description}`;

      const grid = document.createElement("div");
      grid.className = "data-grid";

      grid.append(
        this.createCell(
          "ОЩУЩАЕТСЯ",
          `${current.apparent_temperature} ${units.apparent_temperature}`
        ),
        this.createCell(
          "ВЛАЖНОСТЬ",
          `${current.relative_humidity_2m} ${units.relative_humidity_2m}`
        ),
        this.createCell(
          "ВЕТЕР",
          `${current.wind_speed_10m} ${units.wind_speed_10m}`
        ),
        this.createCell(
          "ВРЕМЯ ДАННЫХ",
          current.time.replace("T", " ")
        )
      );

      this.content.append(main, location, grid);
    } catch (error) {
      if (error.name === "AbortError") return;
      if (this.destroyed) return;

      this.status.className = "widget-status status-error";
      this.status.textContent = "DANGER / НЕТ ДАННЫХ";

      const message = document.createElement("p");
      message.className = "widget-error";
      message.textContent =
        `Не удалось загрузить погоду: ${error.message}`;

      this.content.replaceChildren(message);
      this.retryButton.hidden = false;
    }
  }

  createCell(label, value) {
    const cell = document.createElement("div");
    cell.className = "data-cell";

    const caption = document.createElement("span");
    caption.className = "data-label";
    caption.textContent = label;

    const result = document.createElement("span");
    result.className = "data-value";
    result.textContent = value;

    cell.append(caption, result);
    return cell;
  }

  destroy() {
    this.requestController?.abort();
    this.requestController = null;
    super.destroy();
  }
}