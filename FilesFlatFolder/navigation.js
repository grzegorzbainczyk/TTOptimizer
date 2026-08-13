const NAVIGATION_TARGETS = {
    teachersButton: "teachers.html",
    classesButton: "classes.html",
    studentGroupsButton: "student-groups.html",
    roomsButton: "rooms.html",
    subjectsButton: "subjects.html",
    requirementsButton: "requirements.html",
    schoolButton: "school.html",
    rulesButton: "rules.html",
    aboutProjectButton: "about.html",
    optimizationSettingsButton: "optimization-settings.html",
    optimizationInfoButton: "optimization-info.html"
};

export function setupDashboardNavigation() {
    for (const [buttonId, targetUrl] of Object.entries(NAVIGATION_TARGETS)) {
        setupNavigationButton(buttonId, targetUrl);
    }
}

function setupNavigationButton(buttonId, targetUrl) {
    const button = document.getElementById(buttonId);

    if (!button) {
        console.warn(`${buttonId} not found`);
        return;
    }

    button.addEventListener("click", () => {
        window.location.href = targetUrl;
    });
}
