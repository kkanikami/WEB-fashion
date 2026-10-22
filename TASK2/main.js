import Dashboard from "./Dashboard.js";

const container = document.querySelector("#dashboard-grid");
const countElement = document.querySelector("#widget-count");
const messageElement = document.querySelector("#dashboard-message");

if (!container || !countElement || !messageElement) {
    throw new Error("Не найдены обязательные элементы панели.");
}

const dashboard = new Dashboard(
    container,
    countElement,
    messageElement
);


document.querySelector(".add-controls").addEventListener(
    "click",
    event => {
        const button = event.target.closest("[data-add-widget]");

        if (!button) return;

        dashboard.addWidget(button.dataset.addWidget);
    }
);

dashboard.init();