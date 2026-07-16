// Wait until the whole HTML document is loaded.
// This guarantees that elements like buttons, table body and filters already exist.
document.addEventListener("DOMContentLoaded", () => {

    const currentUser = localStorage.getItem("ttorganizer_user");

    if (!currentUser) {
        window.location.href = "/index.html";
        return;
    }

    // Main action buttons
    const runButton = document.getElementById("runOptimizationButton");
    const clearButton = document.getElementById("clearResultButton");

    // Raw JSON/debug output element
    const resultElement = document.getElementById("optimizationResult");

    // Status message shown to the user, for example: Ready / Running / Error
    const statusElement = document.getElementById("statusMessage");

    // Summary values displayed in the three cards above the table
    const initialPenaltyValue = document.getElementById("initialPenaltyValue");
    const bestPenaltyValue = document.getElementById("bestPenaltyValue");
    const lessonsCountValue = document.getElementById("lessonsCountValue");

    // Dropdown used to filter timetable rows by class
    const classFilter = document.getElementById("classFilter");
    const teacherFilter = document.getElementById("teacherFilter");
    const roomFilter = document.getElementById("roomFilter");

    // Stores the latest lessons returned by the API.
    // This will be useful when filtering by class without calling the API again.
    let currentLessons = [];

    // Register button click handlers
    runButton.addEventListener("click", runOptimization);
    clearButton.addEventListener("click", clearResult);

    //filter handlers
    classFilter.addEventListener("change", () => {
        renderLessonsTable(currentLessons);
    });

    teacherFilter.addEventListener("change", () => {
        renderLessonsTable(currentLessons);
    });

    roomFilter.addEventListener("change", () => {
        renderLessonsTable(currentLessons);
    });

    document.addEventListener("DOMContentLoaded", () => {
        const teachersButton = document.getElementById("teachersButton");

        if (teachersButton) {
            teachersButton.addEventListener("click", () => {
                window.location.href = "teachers.html";
            });
        }
    });

    // Runs the optimization by calling the backend API.
    // The backend then starts the C++ optimization engine.
    async function runOptimization() {
        setRunningState(true);

        statusElement.textContent = "Running optimization...";
        resultElement.textContent = "";

        try {
            // Call ASP.NET endpoint responsible for running the optimizer.
            const response = await fetch("/api/optimization/run", {
                method: "POST"
            });

            // Read response as plain text first.
            // This helps us display useful error details when the response is not OK.
            const responseText = await response.text();

            // If HTTP status is not successful, throw an error.
            // Example: 400, 500, etc.
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}: ${responseText}`);
            }

            // Convert JSON string returned by the API into a JavaScript object.
            const data = JSON.parse(responseText);

            // Store raw JSON result for debugging.
            resultElement.textContent = JSON.stringify(data, null, 2);

            // Store decoded scheduled lessons in a variable for later filtering.
            currentLessons = data.scheduledLessons ?? [];

            // Fill class dropdowns dynamically from returned lessons.
            populateClassFilter(classFilter, currentLessons);
            populateTeacherFilter(teacherFilter, currentLessons);
            populateRoomFilter(roomFilter, currentLessons);

            // Render lessons in the visible table.
            renderLessonsTable(currentLessons);

            // Update summary cards.
            initialPenaltyValue.textContent = data.initialPenalty ?? "-";
            bestPenaltyValue.textContent = data.bestPenalty ?? "-";
            lessonsCountValue.textContent = currentLessons.length;

            // Show final status message depending on optimizer result.
            if (data.success) {
                statusElement.textContent =
                    `Done. Initial penalty: ${data.initialPenalty}, best penalty: ${data.bestPenalty}.`;
            } else {
                statusElement.textContent = "Engine returned an error.";
            }
        } catch (error) {
            // Log full error to browser console for debugging.
            console.error(error);

            statusElement.textContent = "Error while running optimization.";

            // Show error message in raw result area.
            if (resultElement) {
                resultElement.textContent = error.message;
            }
        } finally {
            // Always restore button state, even if request failed.
            setRunningState(false);
        }
    }

    // Clears currently displayed result and resets UI text.
    function clearResult() {
        resultElement.textContent = "// Result will appear here";
        statusElement.textContent = "Ready.";

        initialPenaltyValue.textContent = "-";
        bestPenaltyValue.textContent = "-";
        lessonsCountValue.textContent = "-";

        currentLessons = [];
        renderLessonsTable(currentLessons);
    }

    // Enables/disables the run button while optimization is running.
    function setRunningState(isRunning) {
        runButton.disabled = isRunning;

        if (isRunning) {
            runButton.textContent = "Running...";
        } else {
            runButton.textContent = "Run optimization";
        }
    }

    //function loginAsDemoUser() {
    //    currentUser = {
    //        userName: "demo@ttorganizer.local",
    //        displayName: "Demo User"
    //    };

    //    currentOrganization = {
    //        name: "Demo School"
    //    };

    //    authPanel.classList.add("hidden");
    //    appShell.classList.remove("hidden");

    //    statusElement.textContent = "Logged in as Demo User.";
    //}
});