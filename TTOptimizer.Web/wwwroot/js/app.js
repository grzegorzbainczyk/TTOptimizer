document.addEventListener("DOMContentLoaded", () => {
    const runButton = document.getElementById("runOptimizationButton");
    const clearButton = document.getElementById("clearResultButton");
    const resultElement = document.getElementById("optimizationResult");
    const statusElement = document.getElementById("statusMessage");

    runButton.addEventListener("click", runOptimization);
    clearButton.addEventListener("click", clearResult);

    async function runOptimization() {
        setRunningState(true);

        statusElement.textContent = "Running optimization...";
        resultElement.textContent = "";

        try {
            const response = await fetch("/api/optimization/run", { method: "POST" });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}: ${responseText}`);
            }

            const data = JSON.parse(responseText);

            resultElement.textContent = JSON.stringify(data, null, 2);
            renderLessonsTable(data.scheduledLessons);

            if (data.success) {
                statusElement.textContent =
                    `Done. Initial penalty: ${data.initialPenalty}, best penalty: ${data.bestPenalty}.`;
            } else {
                statusElement.textContent = "Engine returned an error.";
            }
        } catch (error) {
            console.error(error);

            statusElement.textContent = "Error while running optimization.";

            if (resultElement) {
                resultElement.textContent = error.message;
            }
        } finally {
        setRunningState(false);
    }
    }

    function clearResult() {
        resultElement.textContent = "// Result will appear here";
        statusElement.textContent = "Ready.";
    }

    function setRunningState(isRunning) {
        runButton.disabled = isRunning;

        if (isRunning) {
            runButton.textContent = "Running...";
        } else {
            runButton.textContent = "Run optimization";
        }
    }

    function renderLessonsTable(lessons) {
        const tableBody = document.getElementById("lessonsTableBody");

        tableBody.innerHTML = "";

        if (!lessons || lessons.length === 0) {
            const row = document.createElement("tr");

            row.innerHTML = `
            <td colspan="6">No lessons returned.</td>
        `;

            tableBody.appendChild(row);
            return;
        }

        for (const lesson of lessons) {
            const row = document.createElement("tr");

            row.innerHTML = `
            <td>${lesson.day}</td>
            <td>${lesson.lessonNumber}</td>
            <td>${lesson.classGroup}</td>
            <td>${lesson.subject}</td>
            <td>${lesson.teacher}</td>
            <td>${lesson.room}</td>
        `;

            tableBody.appendChild(row);
        }
    }
});