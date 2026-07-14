document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupOptimization();
    setupClearResult();
});

function setupNavigation() {
    setupNavigationButton("teachersButton", "teachers.html");
    setupNavigationButton("classesButton", "classes.html");
    setupNavigationButton("roomsButton", "rooms.html");
    setupNavigationButton("subjectsButton", "subjects.html");
    setupNavigationButton("requirementsButton", "requirements.html");
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

    runOptimizationButton.addEventListener("click", async () => {
        await runOptimization();
    });
}

function setupClearResult() {
    const clearResultButton = document.getElementById("clearResultButton");

    if (!clearResultButton) {
        console.warn("clearResultButton not found");
        return;
    }

    clearResultButton.addEventListener("click", () => {
        clearOptimizationResult();
    });
}

async function runOptimization() {
    const statusText = document.getElementById("statusText");

    try {
        setStatus("Running optimization...");

        const response = await fetch("/api/optimization/run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
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
        setStatus("Optimization finished.");
    } catch (error) {
        setStatus("Error while running optimization.");
        console.error("Error while running optimization:", error);
        alert("Error while running optimization. Check console for details.");
    }

    function setStatus(message) {
        if (statusText) {
            statusText.textContent = message;
        }
    }
}

function renderOptimizationResult(data) {
    const result = data.result ?? data;

    setText("initialPenalty", result.initialPenalty ?? "-");
    setText("bestPenalty", result.bestPenalty ?? "-");

    const scheduledLessons = result.scheduledLessons ?? [];

    setText("lessonsCount", scheduledLessons.length);

    populateFilters(scheduledLessons);
    renderScheduledLessonRows(scheduledLessons);

    const rawResult = document.getElementById("rawResult");
    if (rawResult) {
        rawResult.textContent = JSON.stringify(data, null, 2);
    }
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
    const classFilter = document.getElementById("classFilter");
    const teacherFilter = document.getElementById("teacherFilter");
    const roomFilter = document.getElementById("roomFilter");

    fillSelect(
        classFilter,
        scheduledLessons
            .map(x => x.classGroup ?? x.classGroupName ?? x.classGroupId)
            .filter(x => x !== undefined && x !== null && x !== ""),
        "All classes"
    );

    fillSelect(
        teacherFilter,
        scheduledLessons
            .map(x => x.teacher ?? x.teacherName ?? x.teacherId)
            .filter(x => x !== undefined && x !== null && x !== ""),
        "All teachers"
    );

    fillSelect(
        roomFilter,
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

    const rows = document.querySelectorAll("#timetableBody tr");

    for (const row of rows) {
        const matchesClass =
            !classValue || row.dataset.classValue === classValue;

        const matchesTeacher =
            !teacherValue || row.dataset.teacherValue === teacherValue;

        const matchesRoom =
            !roomValue || row.dataset.roomValue === roomValue;

        row.style.display =
            matchesClass && matchesTeacher && matchesRoom ? "" : "none";
    }
}
function clearOptimizationResult() {
    setText("initialPenalty", "-");
    setText("bestPenalty", "-");
    setText("lessonsCount", "-");
    setText("statusText", "Ready.");

    const timetableBody = document.getElementById("timetableBody");
    if (timetableBody) {
        timetableBody.innerHTML = `
            <tr>
                <td colspan="7">No timetable generated yet.</td>
            </tr>
        `;
    }

    const rawResult = document.getElementById("rawResult");
    if (rawResult) {
        rawResult.textContent = "Raw result will appear here";
    }

    resetSelect("classFilter", "All classes");
    resetSelect("teacherFilter", "All teachers");
    resetSelect("roomFilter", "All rooms");
}

function resetSelect(selectId, defaultText) {
    const select = document.getElementById(selectId);

    if (!select) {
        return;
    }

    select.innerHTML = `<option value="">${defaultText}</option>`;
}

function setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}