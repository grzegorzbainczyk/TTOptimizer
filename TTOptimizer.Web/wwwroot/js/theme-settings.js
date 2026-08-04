import {
    applyTheme,
    getAvailableThemes,
    getCurrentTheme
} from "./theme.js";

document.addEventListener("DOMContentLoaded", () => {
    const themeSelect =
        document.getElementById("themeSelect");

    if (!themeSelect) {
        return;
    }

    const availableThemes =
        getAvailableThemes();

    themeSelect.value =
        availableThemes.includes(getCurrentTheme())
            ? getCurrentTheme()
            : "cream";

    themeSelect.addEventListener("change", () => {
        const appliedTheme =
            applyTheme(themeSelect.value);

        themeSelect.value =
            appliedTheme;
    });

    document.addEventListener(
        "classflow:theme-changed",
        event => {
            const changedTheme =
                event.detail?.theme;

            if (availableThemes.includes(changedTheme)) {
                themeSelect.value =
                    changedTheme;
            }
        }
    );
});
