const storageKey = "classFlowWelcomeGuideHidden";

function hideWelcomeGuide() {
    const overlay = document.getElementById("welcomeGuideOverlay");
    overlay?.classList.add("hidden");
    document.body.classList.remove("welcome-guide-open");
}

function showWelcomeGuide() {
    const overlay = document.getElementById("welcomeGuideOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("hidden");
    document.body.classList.add("welcome-guide-open");
}

function persistPreferenceIfNeeded() {
    const checkbox =
        document.getElementById("welcomeGuideDontShowAgain");

    if (checkbox?.checked) {
        localStorage.setItem(storageKey, "true");
    }
}

export function initializeWelcomeGuide() {
    const overlay = document.getElementById("welcomeGuideOverlay");

    if (!overlay) {
        return;
    }

    const closeButton =
        document.getElementById("welcomeGuideCloseButton");

    const startButton =
        document.getElementById("welcomeGuideStartButton");

    closeButton?.addEventListener("click", () => {
        persistPreferenceIfNeeded();
        hideWelcomeGuide();
    });

    startButton?.addEventListener("click", () => {
        persistPreferenceIfNeeded();
        hideWelcomeGuide();
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            persistPreferenceIfNeeded();
            hideWelcomeGuide();
        }
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            !overlay.classList.contains("hidden")
        ) {
            persistPreferenceIfNeeded();
            hideWelcomeGuide();
        }
    });

    const isHidden =
        localStorage.getItem(storageKey) === "true";

    if (!isHidden) {
        showWelcomeGuide();
    }
}
