let translations = {};
let currentLanguage = "en";

const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "pl"];
const STORAGE_KEY = "classFlowLanguage";

export async function initializeI18n() {
    const savedLanguage = localStorage.getItem(STORAGE_KEY);
    const browserLanguage = navigator.language?.split("-")[0];

    const initialLanguage = SUPPORTED_LANGUAGES.includes(savedLanguage)
        ? savedLanguage
        : SUPPORTED_LANGUAGES.includes(browserLanguage)
            ? browserLanguage
            : DEFAULT_LANGUAGE;

    await setLanguage(initialLanguage, false);

    const languageSelector = document.getElementById("languageSelector");

    if (languageSelector) {
        languageSelector.value = currentLanguage;
        languageSelector.addEventListener("change", async event => {
            await setLanguage(event.target.value);
        });
    }
}

export async function setLanguage(language, persist = true) {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
        language = DEFAULT_LANGUAGE;
    }

    await loadTranslations(language);
    currentLanguage = language;

    if (persist) {
        localStorage.setItem(STORAGE_KEY, language);
    }

    document.documentElement.lang = language;
    applyTranslations();

    window.dispatchEvent(
        new CustomEvent("classflow:language-changed", {
            detail: { language }
        })
    );

    const languageSelector = document.getElementById("languageSelector");
    if (languageSelector) {
        languageSelector.value = language;
    }
}

export function t(key, fallback = null) {
    return translations[key] ?? fallback ?? key;
}

export function getCurrentLanguage() {
    return currentLanguage;
}

async function loadTranslations(language) {
    const response = await fetch(`/locales/${language}.json`);

    if (!response.ok) {
        throw new Error(`Could not load translations for language: ${language}`);
    }

    translations = await response.json();
}

function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
        element.textContent = t(element.dataset.i18n, element.textContent);
    });

    document.querySelectorAll("[data-i18n-title]").forEach(element => {
        element.title = t(element.dataset.i18nTitle, element.title);
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach(element => {
        const key = element.dataset.i18nAriaLabel;
        element.setAttribute("aria-label", t(key, element.getAttribute("aria-label")));
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        element.placeholder = t(key, element.placeholder);
    });
}
