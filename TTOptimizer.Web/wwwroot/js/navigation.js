const NAVIGATION_TARGETS = {
    setupButton: "setup.html",
    teachersButton: "teachers.html",
    classesButton: "classes.html",
    roomsButton: "rooms.html",
    buildingsButton: "buildings.html",
    subjectsButton: "subjects.html",
    studentGroupsButton: "student-groups.html",
    schoolButton: "school.html",
    requirementsButton: "requirements.html",
    additionalLessonsButton: "requirements.html?mode=additional",
    organizationPreferencesButton: "organization-preferences.html",
    rulesButton: "rules.html",
    aboutProjectButton: "about.html",
    optimizationSettingsButton: "optimization-settings.html"
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