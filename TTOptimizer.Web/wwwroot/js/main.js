import { initializeI18n } from "./i18n.js";
import { setupDashboardNavigation } from "./main/navigation.js";
import { initializeOptimization } from "./main/optimization-service.js";
import { initializeTimetable } from "./main/timetable.js";
import { initializeCsvExport } from "./main/csv-export.js";
import { initializeSchoolSummary } from "./main/school-summary.js";
import { initializeWelcomeGuide } from "./main/welcome-guide.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initializeI18n();
    initializeWelcomeGuide();
    setupDashboardNavigation();
    initializeTimetable();
    initializeCsvExport();
    await initializeSchoolSummary();
    await initializeOptimization();
});
