
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // CURRENT YEAR
  // =========================

  const currentYear = document.getElementById("current-year");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // =========================
  // PROJECT FILTERS
  // =========================

  const filterButtons = document.querySelectorAll("[data-filter]");
  const projectCards = document.querySelectorAll(".project-card[data-category]");
  const filterStatus = document.getElementById("filter-status");
  const emptyState = document.getElementById("empty-state");
  const projectsGrid = document.getElementById("projects-grid");
  const showAllButton = document.getElementById("show-all-projects");

  const categoryNames = {
    all: "Все",
    "3d": "3Д",
    design: "Дизайн",
    illustration: "Иллюстрация",
    photography: "Фотография"
  };

  function applyProjectFilter(category) {
    let visibleCount = 0;

    projectCards.forEach((card) => {
      const matches =
        category === "all" || card.dataset.category === category;

      card.hidden = !matches;

      if (matches) {
        visibleCount += 1;
      }
    });

    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === category;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (projectsGrid) {
      projectsGrid.hidden = visibleCount === 0;
    }

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }

    if (filterStatus) {
      if (visibleCount === 0) {
        filterStatus.textContent =
          `В категории «${categoryNames[category]}» пока нет проектов.`;
      } else if (category === "all") {
        filterStatus.textContent =
          `Показаны все проекты: ${visibleCount}.`;
      } else {
        filterStatus.textContent =
          `Категория «${categoryNames[category]}»: ${visibleCount} ${
            visibleCount === 1 ? "проект" : "проекта"
          }.`;
      }
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyProjectFilter(button.dataset.filter);
    });
  });

  if (showAllButton) {
    showAllButton.addEventListener("click", () => {
      applyProjectFilter("all");

      const allButton = document.querySelector(
        '[data-filter="all"]'
      );

      if (allButton) {
        allButton.focus();
      }
    });
  }

  // Начальное состояние: показываем все проекты.
  applyProjectFilter("all");

  // =========================
  // LIGHT / DARK THEME
  // =========================

  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = themeToggle?.querySelector(".theme-icon");
  const themeLabel = themeToggle?.querySelector(".theme-label");
  const themeColorMeta = document.querySelector(
    'meta[name="theme-color"]'
  );

  const THEME_STORAGE_KEY = "veronika-portfolio-theme";

  function getSavedTheme() {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
    } catch (error) {
      // Хранилище может быть недоступно.
      // В таком случае используем светлую тему по умолчанию.
    }

    return "light";
  }

  function saveTheme(theme) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // Переключение темы продолжает работать,
      // даже если сохранить выбор невозможно.
    }
  }

  function applyTheme(theme, shouldSave = false) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = normalizedTheme;

    const isDark = normalizedTheme === "dark";

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute(
        "aria-label",
        isDark
          ? "Переключить на светлую тему"
          : "Переключить на тёмную тему"
      );
    }

    if (themeIcon) {
      themeIcon.textContent = isDark ? "☀" : "☾";
    }

    if (themeLabel) {
      themeLabel.textContent = isDark
        ? "Светлая тема"
        : "Тёмная тема";
    }

    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        "content",
        isDark ? "#201823" : "#fff5fa"
      );
    }

    if (shouldSave) {
      saveTheme(normalizedTheme);
    }
  }

  // Восстанавливаем тему после загрузки страницы.
  applyTheme(getSavedTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.dataset.theme;
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      applyTheme(nextTheme, true);
    });
  }

  // =========================
  // MOBILE NAVIGATION
  // =========================

  const menuToggle = document.getElementById("menu-toggle");
  const navigation = document.getElementById("main-navigation");

  function closeMenu(returnFocus = false) {
    if (!menuToggle || !navigation) {
      return;
    }

    navigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");

    if (returnFocus) {
      menuToggle.focus();
    }
  }

  function openMenu() {
    if (!menuToggle || !navigation) {
      return;
    }

    navigation.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Закрыть меню");
  }

  if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
      const isExpanded =
        menuToggle.getAttribute("aria-expanded") === "true";

      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Закрываем меню после перехода по пункту навигации.
    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    // Escape закрывает открытое меню и возвращает фокус кнопке.
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menuToggle.getAttribute("aria-expanded") === "true"
      ) {
        closeMenu(true);
      }
    });

    // Если окно стало широким, закрываем мобильное меню.
    window.addEventListener("resize", () => {
      if (window.innerWidth > 700) {
        closeMenu();
      }
    });
  }
});
