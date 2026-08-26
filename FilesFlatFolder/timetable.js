import { t } from "../i18n.js";
import {
    hidePreprocessingIssues,
    renderPreprocessingIssues,
    setResultMessage,
    setStatusText,
    setTimetableContentVisible
} from "./optimization-ui.js";

const LAST_RESULT_STORAGE_KEY =
    "ttorganizer.lastOptimizationResult";

export function initializeTimetable() {
    setupClearResultButton();
    loadLastOptimizationResultFromStorage();

    window.addEventListener(
        "classflow:language-changed",
        refreshTimetableLanguage
    );
}

export function renderOptimizationResult(data) {
    const result = normalizeOptimizationResult(data);

    console.log("Normalized optimization result:", result);

    const scheduledLessons = Array.isArray(
        result.scheduledLessons
    )
        ? result.scheduledLessons
        : [];

    const preprocessingIssues = Array.isArray(
        result.preprocessingIssues
    )
        ? result.preprocessingIssues
        : [];

    const optimizationFailed = result.success === false;

    const preprocessingFailed =
        result.canOptimize === false ||
        preprocessingIssues.some(
            issue =>
                String(issue.severity).toLowerCase() ===
                "error"
        );

    if (optimizationFailed || preprocessingFailed) {
        renderPreprocessingFailure(
            result,
            preprocessingIssues
        );

        populateFilters([]);
        renderScheduledLessonRows([]);
        return;
    }

    renderOptimizationSuccess(result, scheduledLessons);
    populateFilters(scheduledLessons);
    renderScheduledLessonRows(scheduledLessons);
}

export function clearOptimizationResultForNewRun() {
    setResultMessage(
        "neutral",
        t("optimization.progress"),
        t("result.previousCleared")
    );

    hidePreprocessingIssues();
    setTimetableContentVisible(true);
    setTimetableMessage(t("optimization.running"));
    resetAllFilters();
    clearLastOptimizationResultFromStorage();
}

export function saveLastOptimizationResultToStorage(data) {
    try {
        localStorage.setItem(
            LAST_RESULT_STORAGE_KEY,
            JSON.stringify(data)
        );
    } catch (error) {
        console.error(
            "Could not save optimization result to localStorage.",
            error
        );
    }
}

function setupClearResultButton() {
    const clearResultButton = document.getElementById(
        "clearSavedResultButton"
    );

    if (!clearResultButton) {
        console.warn("clearResultButton not found");
        return;
    }

    clearResultButton.addEventListener(
        "click",
        clearOptimizationResult
    );
}

function normalizeOptimizationResult(data) {
    let result = data?.result ?? data ?? {};

    if (typeof result === "string") {
        try {
            result = JSON.parse(result);
        } catch (error) {
            console.error(
                "Could not parse optimization result JSON.",
                error
            );

            return createInvalidResult();
        }
    }

    if (result?.result) {
        if (typeof result.result === "string") {
            try {
                return JSON.parse(result.result);
            } catch (error) {
                console.error(
                    "Could not parse nested optimization result.",
                    error
                );
            }
        }

        if (typeof result.result === "object") {
            return result.result;
        }
    }

    return result;
}

function createInvalidResult() {
    return {
        success: false,
        canOptimize: false,
        message:
            t("result.parseError"),
        preprocessingIssues: [],
        scheduledLessons: []
    };
}

function renderPreprocessingFailure(
    result,
    preprocessingIssues
) {
    const generalMessage =
        result.message ??
        result.error ??
        result.optimizationInfo?.message ??
        t("problem.blockingErrors");

    setResultMessage(
        "error",
        t("optimization.cannotStart"),
        generalMessage
    );

    renderPreprocessingIssues(preprocessingIssues);
    setTimetableContentVisible(false);
}

function renderOptimizationSuccess(
    result,
    scheduledLessons
) {
    const lessonCount = scheduledLessons.length;

    const message =
        result.optimizationInfo?.message ??
        t("result.scheduledLessons")
            .replace("{count}", lessonCount);

    setResultMessage(
        "success",
        t("result.completed"),
        message
    );

    hidePreprocessingIssues();
    setTimetableContentVisible(true);
}

function renderScheduledLessonRows(scheduledLessons) {
    const timetableBody = document.getElementById(
        "timetableBody"
    );

    if (!timetableBody) {
        console.warn("timetableBody not found");
        return;
    }

    timetableBody.innerHTML = "";

    if (!scheduledLessons || scheduledLessons.length === 0) {
        setTimetableMessage(
            t("table.noScheduledLessons")
        );
        return;
    }

    for (const lesson of scheduledLessons) {
        const row = document.createElement("tr");

        const classValue =
            lesson.classGroup ??
            lesson.classGroupName ??
            lesson.classGroupId ??
            "";

        const subjectValue =
            lesson.subject ??
            lesson.subjectName ??
            lesson.subjectId ??
            "";

        const teacherValue =
            lesson.teacher ??
            lesson.teacherName ??
            lesson.teacherId ??
            "";

        const roomValue =
            lesson.room ??
            lesson.roomName ??
            lesson.roomId ??
            "";

        row.dataset.classValue = String(classValue);
        row.dataset.teacherValue = String(teacherValue);
        row.dataset.roomValue = String(roomValue);

        appendCell(row, lesson.day ?? "");
        appendCell(row, lesson.lessonNumber + 1 ?? lesson.slot ?? ""
        );
        appendCell(row, lesson.lessonInstanceId ?? "");
        appendCell(row, classValue);
        appendCell(row, subjectValue);
        appendCell(row, teacherValue);
        appendCell(row, roomValue);

        timetableBody.appendChild(row);
    }

    applyFilters();
}

function appendCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = String(value ?? "");
    row.appendChild(cell);
}

function setTimetableMessage(message) {
    const timetableBody = document.getElementById(
        "timetableBody"
    );

    if (!timetableBody) {
        return;
    }

    timetableBody.innerHTML = "";

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 7;
    cell.textContent = message;

    row.appendChild(cell);
    timetableBody.appendChild(row);
}

function populateFilters(scheduledLessons) {
    fillSelect(
        document.getElementById("classFilter"),
        scheduledLessons
            .map(
                item =>
                    item.classGroup ??
                    item.classGroupName ??
                    item.classGroupId
            )
            .filter(hasValue),
        t("filter.allClasses")
    );

    fillSelect(
        document.getElementById("teacherFilter"),
        scheduledLessons
            .map(
                item =>
                    item.teacher ??
                    item.teacherName ??
                    item.teacherId
            )
            .filter(hasValue),
        t("filter.allTeachers")
    );

    fillSelect(
        document.getElementById("roomFilter"),
        scheduledLessons
            .map(
                item =>
                    item.room ??
                    item.roomName ??
                    item.roomId
            )
            .filter(hasValue),
        t("filter.allRooms")
    );

    setupFilterEvents();
}

function hasValue(value) {
    return value !== undefined &&
        value !== null &&
        value !== "";
}

function fillSelect(selectElement, values, defaultText) {
    if (!selectElement) {
        return;
    }

    const uniqueValues = [
        ...new Set(values.map(value => String(value)))
    ].sort();

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
    const classFilter = document.getElementById(
        "classFilter"
    );

    const teacherFilter = document.getElementById(
        "teacherFilter"
    );

    const roomFilter = document.getElementById(
        "roomFilter"
    );

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
    const classValue =
        document.getElementById("classFilter")?.value ??
        "";

    const teacherValue =
        document.getElementById("teacherFilter")?.value ??
        "";

    const roomValue =
        document.getElementById("roomFilter")?.value ??
        "";

    for (const row of document.querySelectorAll(
        "#timetableBody tr"
    )) {
        const matchesClass =
            !classValue ||
            row.dataset.classValue === classValue;

        const matchesTeacher =
            !teacherValue ||
            row.dataset.teacherValue === teacherValue;

        const matchesRoom =
            !roomValue ||
            row.dataset.roomValue === roomValue;

        row.style.display =
            matchesClass && matchesTeacher && matchesRoom
                ? ""
                : "none";
    }
}

function clearOptimizationResult() {
    setResultMessage(
        "neutral",
        t("result.none"),
        t("result.noneDescription")
    );

    hidePreprocessingIssues();
    setTimetableContentVisible(true);
    setStatusText(t("optimization.ready"));
    setTimetableMessage(t("table.noTimetable"));
    resetAllFilters();
    clearLastOptimizationResultFromStorage();
}

function resetAllFilters() {
    resetSelect("classFilter", t("filter.allClasses"));
    resetSelect("teacherFilter", t("filter.allTeachers"));
    resetSelect("roomFilter", t("filter.allRooms"));
}

function resetSelect(selectId, defaultText) {
    const select = document.getElementById(selectId);

    if (!select) {
        return;
    }

    select.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = defaultText;
    select.appendChild(option);
}

function loadLastOptimizationResultFromStorage() {
    try {
        const savedJson = localStorage.getItem(
            LAST_RESULT_STORAGE_KEY
        );

        if (!savedJson) {
            return;
        }

        const data = JSON.parse(savedJson);

        renderOptimizationResult(data);
        setStatusText(t("result.loadedLast"));
    } catch (error) {
        console.error(
            "Could not load optimization result from localStorage.",
            error
        );

        localStorage.removeItem(LAST_RESULT_STORAGE_KEY);
        setStatusText(t("result.loadSavedFailed"));
    }
}


function refreshTimetableLanguage() {
    try {
        const savedJson = localStorage.getItem(
            LAST_RESULT_STORAGE_KEY
        );

        if (savedJson) {
            renderOptimizationResult(JSON.parse(savedJson));
        } else {
            resetAllFilters();
            setTimetableMessage(t("table.noTimetable"));
        }
    } catch (error) {
        console.error(
            "Could not refresh timetable language.",
            error
        );
    }
}

function clearLastOptimizationResultFromStorage() {
    localStorage.removeItem(LAST_RESULT_STORAGE_KEY);
}
