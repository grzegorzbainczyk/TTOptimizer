import { initializeI18n } from "./i18n.js";
import { setupDashboardNavigation } from "./main/navigation.js";
import { initializeOptimization } from "./main/optimization-service.js";
import { initializeTimetable } from "./main/timetable.js";
import { initializeCsvExport } from "./main/csv-export.js";
import { initializeSchoolSummary } from "./main/school-summary.js";
import { initializeWelcomeGuide } from "./main/welcome-guide.js";

document.addEventListener("DOMContentLoaded", async () => {
    // Nawigacja jest krytyczna i nie powinna zależeć od i18n ani innych modułów.
    setupDashboardNavigation();

    try {
        await initializeI18n();
    } catch (error) {
        console.error("Could not initialize i18n:", error);
    }

    try {
        initializeWelcomeGuide();
    } catch (error) {
        console.error("Could not initialize welcome guide:", error);
    }

    try {
        initializeTimetable();
    } catch (error) {
        console.error("Could not initialize timetable:", error);
    }

    try {
        initializeCsvExport();
    } catch (error) {
        console.error("Could not initialize CSV export:", error);
    }

    try {
        await initializeSchoolSummary();
    } catch (error) {
        console.error("Could not initialize school summary:", error);
    }

    try {
        await initializeOptimization();
    } catch (error) {
        console.error("Could not initialize optimization:", error);
    }
});
