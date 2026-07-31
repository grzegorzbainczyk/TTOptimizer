const STORAGE_KEYS = {
    lastOptimizationResult: "ttorganizer.lastOptimizationResult",
    optimizationSettings: "classflow.optimizationSettings"
};

const DEFAULT_OPTIMIZATION_SETTINGS = {
    populationSize: 100,
    iterations: 10000,
    eliteCount: 5,
    tournamentSize: 3,
    mutationAttempts: 5,
    mutationProbability: 1.0,
    randomSeed: 12345,
    threadCount: 1,
    stopWhenPerfect: true,
    stagnationGenerationLimit: 0,
    enableProgressLogging: true,
    progressLogInterval: 100,
    penalties: {
        low: 10,
        medium: 100,
        high: 1000,
        hard: 1000000
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupOptimization();
    setupClearResult();
    setupExportCsv();
    loadLastOptimizationResultFromStorage();
});

function setupNavigation() {
    setupNavigationButton("teachersButton", "teachers.html");
    setupNavigationButton("classesButton", "classes.html");
    setupNavigationButton("roomsButton", "rooms.html");
    setupNavigationButton("subjectsButton", "subjects.html");
    setupNavigationButton("requirementsButton", "requirements.html");
    setupNavigationButton("rulesButton", "rules.html");
    setupNavigationButton("aboutProjectButton", "about.html");
    setupNavigationButton("optimizationSettingsButton", "optimization-settings.html");
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

function setupOptimization() {
    const runOptimizationButton = document.getElementById("runOptimizationButton");

    if (!runOptimizationButton) {
        console.warn("runOptimizationButton not found");
        return;
    }

    runOptimizationButton.addEventListener("click", runOptimization);
}

function setupClearResult() {
    const clearResultButton = document.getElementById("clearSavedResultButton");

    if (!clearResultButton) {
        console.warn("clearResultButton not found");
        return;
    }

    clearResultButton.addEventListener("click", clearOptimizationResult);
}

function setupExportCsv() {
    const exportCsvButton = document.getElementById("exportCsvButton");

    if (!exportCsvButton) {
        console.warn("exportCsvButton not found");
        return;
    }

    exportCsvButton.addEventListener("click", exportVisibleTimetableRowsToCsv);
}

async function runOptimization() {
    const statusText = document.getElementById("statusText");
    const runButton = document.getElementById("runOptimizationButton");

    try {
        clearOptimizationResultForNewRun();
        setStatus("Running optimization...");
        setRunningState(true);

        let organizationId;

        try {
            organizationId = Number(window.appContext.requireOrganizationId());
        } catch (error) {
            console.error(error);
            alert("Organization context is missing.");
            return;
        }

        const optimizationSettings = loadOptimizationSettings();

        const response = await fetch(`/api/optimization/run?organizationId=${organizationId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(optimizationSettings)
        });

        if (!response.ok) {
            const errorText = await response.text();
            setStatus("Optimization failed.");
            console.error("Optimization request failed:", response.status, errorText);
            alert(`Optimization failed. Status: ${response.status}`);
            return;
        }

        const data = await response.json();

        console.log("Optimization result:", data);

        renderOptimizationResult(data);
        saveLastOptimizationResultToStorage(data);
        setStatus("Optimization finished.");
    } catch (error) {
        setStatus("Error while running optimization.");
        console.error("Error while running optimization:", error);
        alert("Error while running optimization. Check console for details.");
    } finally {
        setRunningState(false);
    }

    function setStatus(message) {
        if (statusText) {
            statusText.textContent = message;
        }
    }

    function setRunningState(isRunning) {
        if (!runButton) {
            return;
        }

        runButton.disabled = isRunning;
        runButton.textContent = isRunning ? "Running..." : "Run optimization";
    }
}

function loadOptimizationSettings() {
    const savedJson = localStorage.getItem(STORAGE_KEYS.optimizationSettings);

    if (!savedJson) {
        return {
            ...DEFAULT_OPTIMIZATION_SETTINGS,
            penalties: { ...DEFAULT_OPTIMIZATION_SETTINGS.penalties }
        };
    }

    try {
        const savedSettings = JSON.parse(savedJson);

        return {
            ...DEFAULT_OPTIMIZATION_SETTINGS,
            ...savedSettings,
            penalties: {
                ...DEFAULT_OPTIMIZATION_SETTINGS.penalties,
                ...(savedSettings.penalties ?? {})
            }
        };
    } catch (error) {
        console.error("Could not read optimization settings from localStorage.", error);
        localStorage.removeItem(STORAGE_KEYS.optimizationSettings);

        return {
            ...DEFAULT_OPTIMIZATION_SETTINGS,
            penalties: { ...DEFAULT_OPTIMIZATION_SETTINGS.penalties }
        };
    }
}

function normalizeOptimizationResult(data) {
    let result = data?.result ?? data ?? {};

    if (typeof result === "string") {
        try {
            result = JSON.parse(result);
        } catch (error) {
            console.error("Could not parse optimization result JSON.", error);

            return {
                success: false,
                canOptimize: false,
                message: "The optimization result could not be parsed.",
                preprocessingIssues: [],
                scheduledLessons: []
            };
        }
    }

    if (result?.result) {
        if (typeof result.result === "string") {
            try {
                return JSON.parse(result.result);
            } catch (error) {
                console.error("Could not parse nested optimization result.", error);
            }
        }

        if (typeof result.result === "object") {
            return result.result;
        }
    }

    return result;
}

function renderOptimizationResult(data) {
    const result = normalizeOptimizationResult(data);

    console.log("Normalized optimization result:", result);

    const scheduledLessons = Array.isArray(result.scheduledLessons) ? result.scheduledLessons : [];
    const preprocessingIssues = Array.isArray(result.preprocessingIssues) ? result.preprocessingIssues : [];

    const optimizationFailed = result.success === false;
    const preprocessingFailed =
        result.canOptimize === false ||
        preprocessingIssues.some(issue => String(issue.severity).toLowerCase() === "error");

    if (optimizationFailed || preprocessingFailed) {
        renderPreprocessingFailure(result, preprocessingIssues);
        populateFilters([]);
        renderScheduledLessonRows([]);
        return;
    }

    renderOptimizationSuccess(result, scheduledLessons);
    populateFilters(scheduledLessons);
    renderScheduledLessonRows(scheduledLessons);
}

function renderPreprocessingFailure(result, preprocessingIssues) {
    const generalMessage =
        result.message ??
        result.error ??
        result.optimizationInfo?.message ??
        "The input data contains blocking errors.";

    setResultMessage("error", "Optimization cannot be started", generalMessage);
    renderPreprocessingIssues(preprocessingIssues);
    setTimetableContentVisible(false);
}

function renderOptimizationSuccess(result, scheduledLessons) {
    const lessonCount = scheduledLessons.length;
    const message = result.optimizationInfo?.message ?? `The optimizer scheduled ${lessonCount} lessons.`;

    setResultMessage("success", "Optimization completed", message);
    hidePreprocessingIssues();
    setTimetableContentVisible(true);
}

function setResultMessage(type, title, message) {
    const panel = document.getElementById("resultMessagePanel");
    const titleElement = document.getElementById("resultMessageTitle");
    const messageElement = document.getElementById("resultMessageText");
    const iconElement = panel?.querySelector(".result-message-icon");

    if (!panel || !titleElement || !messageElement) {
        return;
    }

    panel.classList.remove(
        "result-message-neutral",
        "result-message-success",
        "result-message-error",
        "result-message-warning"
    );

    panel.classList.add(`result-message-${type}`);
    titleElement.textContent = title;
    messageElement.textContent = message;

    if (iconElement) {
        iconElement.textContent = getResultMessageIcon(type);
    }
}

function getResultMessageIcon(type) {
    switch (type) {
        case "success":
            return "✓";
        case "error":
            return "!";
        case "warning":
            return "⚠";
        default:
            return "i";
    }
}

function renderPreprocessingIssues(issues) {
    const details = document.getElementById("preprocessingDetails");
    const issuesList = document.getElementById("preprocessingIssuesList");
    const issueCount = document.getElementById("preprocessingIssueCount");

    if (!details || !issuesList || !issueCount) {
        return;
    }

    issuesList.innerHTML = "";

    if (!issues || issues.length === 0) {
        details.classList.add("hidden");
        return;
    }

    for (const issue of issues) {
        const listItem = document.createElement("li");
        const severity = String(issue.severity ?? "Error").toLowerCase();

        listItem.className = `preprocessing-issue preprocessing-issue-${severity}`;

        const heading = document.createElement("div");
        heading.className = "preprocessing-issue-heading";

        const title = document.createElement("strong");
        title.textContent = formatIssueCode(issue.code);

        const badge = document.createElement("span");
        badge.className = "preprocessing-issue-severity";
        badge.textContent = issue.severity ?? "Error";

        heading.appendChild(title);
        heading.appendChild(badge);

        const message = document.createElement("p");
        message.textContent = issue.message ?? "An unspecified preprocessing problem was found.";

        listItem.appendChild(heading);
        listItem.appendChild(message);

        const counts = createIssueCountsElement(issue);

        if (counts) {
            listItem.appendChild(counts);
        }

        issuesList.appendChild(listItem);
    }

    issueCount.textContent = issues.length === 1 ? "1 problem" : `${issues.length} problems`;
    details.classList.remove("hidden");
}

function createIssueCountsElement(issue) {
    const requiredCount = Number(issue.requiredCount);
    const availableCount = Number(issue.availableCount);

    if (!Number.isFinite(requiredCount) || !Number.isFinite(availableCount)) {
        return null;
    }

    if (requiredCount === 0 && availableCount === 0) {
        return null;
    }

    const element = document.createElement("div");
    element.className = "preprocessing-issue-counts";
    element.innerHTML = `
        <span>Required: <strong>${requiredCount}</strong></span>
        <span>Available: <strong>${availableCount}</strong></span>
    `;

    return element;
}

function formatIssueCode(code) {
    if (!code) {
        return "Preprocessing problem";
    }

    return String(code)
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
}

function hidePreprocessingIssues() {
    const details = document.getElementById("preprocessingDetails");
    const issuesList = document.getElementById("preprocessingIssuesList");

    details?.classList.add("hidden");

    if (issuesList) {
        issuesList.innerHTML = "";
    }
}

function setTimetableContentVisible(isVisible) {
    document.getElementById("timetableContent")?.classList.toggle("hidden", !isVisible);
}

function renderScheduledLessonRows(scheduledLessons) {
    const timetableBody = document.getElementById("timetableBody");

    if (!timetableBody) {
        console.warn("timetableBody not found");
        return;
    }

    timetableBody.innerHTML = "";

    if (!scheduledLessons || scheduledLessons.length === 0) {
        timetableBody.innerHTML = `
            <tr>
                <td colspan="7">No scheduled lessons returned by optimizer.</td>
            </tr>
        `;
        return;
    }

    for (const lesson of scheduledLessons) {
        const row = document.createElement("tr");

        const classValue = lesson.classGroup ?? lesson.classGroupName ?? lesson.classGroupId ?? "";
        const subjectValue = lesson.subject ?? lesson.subjectName ?? lesson.subjectId ?? "";
        const teacherValue = lesson.teacher ?? lesson.teacherName ?? lesson.teacherId ?? "";
        const roomValue = lesson.room ?? lesson.roomName ?? lesson.roomId ?? "";

        row.dataset.classValue = String(classValue);
        row.dataset.teacherValue = String(teacherValue);
        row.dataset.roomValue = String(roomValue);

        row.innerHTML = `
            <td>${lesson.day ?? ""}</td>
            <td>${lesson.lessonNumber ?? lesson.slot ?? ""}</td>
            <td>${lesson.lessonInstanceId ?? ""}</td>
            <td>${classValue}</td>
            <td>${subjectValue}</td>
            <td>${teacherValue}</td>
            <td>${roomValue}</td>
        `;

        timetableBody.appendChild(row);
    }

    applyFilters();
}

function populateFilters(scheduledLessons) {
    fillSelect(
        document.getElementById("classFilter"),
        scheduledLessons
            .map(x => x.classGroup ?? x.classGroupName ?? x.classGroupId)
            .filter(x => x !== undefined && x !== null && x !== ""),
        "All classes"
    );

    fillSelect(
        document.getElementById("teacherFilter"),
        scheduledLessons
            .map(x => x.teacher ?? x.teacherName ?? x.teacherId)
            .filter(x => x !== undefined && x !== null && x !== ""),
        "All teachers"
    );

    fillSelect(
        document.getElementById("roomFilter"),
        scheduledLessons
            .map(x => x.room ?? x.roomName ?? x.roomId)
            .filter(x => x !== undefined && x !== null && x !== ""),
        "All rooms"
    );

    setupFilterEvents();
}

function fillSelect(selectElement, values, defaultText) {
    if (!selectElement) {
        return;
    }

    const uniqueValues = [...new Set(values.map(x => String(x)))].sort();

    selectElement.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultText;
    selectElement.appendChild(defaultOption);

    for (const value of uniqueValues) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    }
}

function setupFilterEvents() {
    const classFilter = document.getElementById("classFilter");
    const teacherFilter = document.getElementById("teacherFilter");
    const roomFilter = document.getElementById("roomFilter");

    if (classFilter) {
        classFilter.onchange = applyFilters;
    }

    if (teacherFilter) {
        teacherFilter.onchange = applyFilters;
    }

    if (roomFilter) {
        roomFilter.onchange = applyFilters;
    }
}

function applyFilters() {
    const classValue = document.getElementById("classFilter")?.value ?? "";
    const teacherValue = document.getElementById("teacherFilter")?.value ?? "";
    const roomValue = document.getElementById("roomFilter")?.value ?? "";

    for (const row of document.querySelectorAll("#timetableBody tr")) {
        const matchesClass = !classValue || row.dataset.classValue === classValue;
        const matchesTeacher = !teacherValue || row.dataset.teacherValue === teacherValue;
        const matchesRoom = !roomValue || row.dataset.roomValue === roomValue;

        row.style.display = matchesClass && matchesTeacher && matchesRoom ? "" : "none";
    }
}

function clearOptimizationResult() {
    setResultMessage("neutral", "No optimization result yet", "Run the optimizer to generate a timetable.");

    hidePreprocessingIssues();
    setTimetableContentVisible(true);
    setText("statusText", "Ready.");

    const timetableBody = document.getElementById("timetableBody");

    if (timetableBody) {
        timetableBody.innerHTML = `
            <tr>
                <td colspan="7">No timetable generated yet.</td>
            </tr>
        `;
    }

    resetSelect("classFilter", "All classes");
    resetSelect("teacherFilter", "All teachers");
    resetSelect("roomFilter", "All rooms");
    clearLastOptimizationResultFromStorage();
}

function clearOptimizationResultForNewRun() {
    setResultMessage(
        "neutral",
        "Optimization in progress",
        "The previous result has been cleared. Please wait for the new timetable."
    );

    hidePreprocessingIssues();
    setTimetableContentVisible(true);

    const timetableBody = document.getElementById("timetableBody");

    if (timetableBody) {
        timetableBody.innerHTML = `
            <tr>
                <td colspan="7">Optimization is running...</td>
            </tr>
        `;
    }

    resetSelect("classFilter", "All classes");
    resetSelect("teacherFilter", "All teachers");
    resetSelect("roomFilter", "All rooms");
    clearLastOptimizationResultFromStorage();
}

function resetSelect(selectId, defaultText) {
    const select = document.getElementById(selectId);

    if (select) {
        select.innerHTML = `<option value="">${defaultText}</option>`;
    }
}

function setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

function saveLastOptimizationResultToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEYS.lastOptimizationResult, JSON.stringify(data));
    } catch (error) {
        console.error("Could not save optimization result to localStorage.", error);
    }
}

function loadLastOptimizationResultFromStorage() {
    try {
        const savedJson = localStorage.getItem(STORAGE_KEYS.lastOptimizationResult);

        if (!savedJson) {
            return;
        }

        const data = JSON.parse(savedJson);

        renderOptimizationResult(data);
        setText("statusText", "Loaded last optimization result.");
    } catch (error) {
        console.error("Could not load optimization result from localStorage.", error);
        localStorage.removeItem(STORAGE_KEYS.lastOptimizationResult);
        setText("statusText", "Could not load saved result.");
    }
}

function clearLastOptimizationResultFromStorage() {
    localStorage.removeItem(STORAGE_KEYS.lastOptimizationResult);
}

function escapeCsvValue(value) {
    const safeValue = String(value ?? "");
    return `"${safeValue.replaceAll('"', '""')}"`;
}

function exportVisibleTimetableRowsToCsv() {
    const rows = document.querySelectorAll("#timetableBody tr");

    if (!rows || rows.length === 0) {
        alert("There is no timetable data to export.");
        return;
    }

    const csvRows = [[
        "Day",
        "Lesson number",
        "Lesson",
        "Class",
        "Subject",
        "Teacher",
        "Room"
    ]];

    let exportedRowsCount = 0;

    for (const row of rows) {
        if (row.style.display === "none") {
            continue;
        }

        const cells = row.querySelectorAll("td");

        if (cells.length < 7) {
            continue;
        }

        csvRows.push(Array.from(cells).map(cell => escapeCsvValue(cell.textContent.trim())));
        exportedRowsCount++;
    }

    if (exportedRowsCount === 0) {
        alert("There are no visible rows to export.");
        return;
    }

    const csvContent = "﻿" + csvRows.map(row => row.join(";")).join("");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "timetable.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
