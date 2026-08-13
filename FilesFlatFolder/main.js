import { setupDashboardNavigation } from "./main/navigation.js";
import { initializeOptimization } from "./main/optimization-service.js";
import { initializeTimetable } from "./main/timetable.js";
import { initializeCsvExport } from "./main/csv-export.js";

document.addEventListener("DOMContentLoaded", async () => {
    setupDashboardNavigation();
    initializeTimetable();
    initializeCsvExport();
    await initializeOptimization();
});
