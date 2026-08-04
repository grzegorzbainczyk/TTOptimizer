const STORAGE_KEY = "classFlowTheme";
const DEFAULT_THEME = "cream";

const AVAILABLE_THEMES = Object.freeze([
    "cream",
    "beige",
    "blue",
    "green",
    "emerald"
]);

function normalizeTheme(themeName) {
    return AVAILABLE_THEMES.includes(themeName)
        ? themeName
        : DEFAULT_THEME;
}

export function applyTheme(themeName) {
    const normalizedTheme = normalizeTheme(themeName);

    document.documentElement.dataset.theme =
        normalizedTheme;

    localStorage.setItem(
        STORAGE_KEY,
        normalizedTheme
    );

    document.dispatchEvent(
        new CustomEvent("classflow:theme-changed", {
            detail: {
                theme: normalizedTheme
            }
        })
    );

    return normalizedTheme;
}

export function loadSavedTheme() {
    const savedTheme =
        localStorage.getItem(STORAGE_KEY);

    return applyTheme(
        normalizeTheme(savedTheme)
    );
}

export function getCurrentTheme() {
    return normalizeTheme(
        document.documentElement.dataset.theme
    );
}

export function getAvailableThemes() {
    return [...AVAILABLE_THEMES];
}

/*
 * Apply the saved theme immediately when this module is loaded.
 * Import this file from every page that should support themes.
 */
loadSavedTheme();
