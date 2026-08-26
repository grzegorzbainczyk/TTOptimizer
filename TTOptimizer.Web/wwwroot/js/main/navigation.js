const NAVIGATION_TARGETS = {
    schoolButton: "school.html",
    buildingsButton: "buildings.html",
    roomsButton: "rooms.html",
    classesButton: "classes.html",
    studentGroupsButton: "student-groups.html",
    subjectsButton: "subjects.html",
    teachersButton: "teachers.html",
    requirementsButton: "requirements.html",
    additionalLessonsButton: "requirements.html?mode=additional",
    organizationPreferencesButton: "organization-preferences.html",
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
        return;
    }

    button.addEventListener("click", () => {
        window.location.href = targetUrl;
    });
}
