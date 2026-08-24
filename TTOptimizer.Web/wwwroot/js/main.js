import { initializeI18n } from "./i18n.js";
import { setupDashboardNavigation } from "./main/navigation.js";
import { initializeOptimization } from "./main/optimization-service.js";
import { initializeTimetable } from "./main/timetable.js";
import { initializeCsvExport } from "./main/csv-export.js";
import { initializeSchoolSummary } from "./main/school-summary.js";
import { initializeSetupStatus } from "./main/setup-status.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initializeI18n();
    setupDashboardNavigation();
    initializeTimetable();
    initializeCsvExport();
    await initializeSchoolSummary();
    await initializeSetupStatus();
    await initializeOptimization();
});
