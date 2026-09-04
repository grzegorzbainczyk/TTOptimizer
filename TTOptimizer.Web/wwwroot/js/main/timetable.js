import { t } from "../i18n.js";
import {
    hidePreprocessingIssues,
    renderPreprocessingIssues,
    setResultMessage,
    setStatusText,
    setTimetableContentVisible
} from "./optimization-ui.js";
import {
    clearConstraintReport,
    renderConstraintReport
} from "./constraint-report.js";

const LAST_RESULT_STORAGE_KEY =
    "ttorganizer.lastOptimizationResult";

let currentScheduledLessons = [];
let currentTimetableView = "list";

const WEEK_DAYS = [
    ["Poniedziałek", "Monday"],
    ["Wtorek", "Tuesday"],
    ["Środa", "Wednesday"],
    ["Czwartek", "Thursday"],
    ["Piątek", "Friday"]
];

export function initializeTimetable() {
    setupClearResultButton();
    setupTimetableViewControls();
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
        currentScheduledLessons = [];
        clearConstraintReport();

        renderPreprocessingFailure(
            result,
            preprocessingIssues
        );

        populateFilters([]);
        renderScheduledLessonRows([]);
        renderCurrentTimetableView();
        return;
    }

    currentScheduledLessons = scheduledLessons;

    renderOptimizationSuccess(result, scheduledLessons);
    renderConstraintReport(result);
    populateFilters(scheduledLessons);
    renderScheduledLessonRows(scheduledLessons);
    renderCurrentTimetableView();
}

export function clearOptimizationResultForNewRun() {
    setResultMessage(
        "neutral",
        t("optimization.progress"),
        t("result.previousCleared")
    );

    hidePreprocessingIssues();
    clearConstraintReport();
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


function setupTimetableViewControls() {
    document.querySelectorAll(".timetable-view-button")
        .forEach(button => {
            button.addEventListener("click", () => {
                currentTimetableView =
                    button.dataset.view ?? "list";
                renderCurrentTimetableView();
            });
        });

    document.getElementById("timetableWeeklySelector")
        ?.addEventListener("change", renderWeeklySchedule);
}

function renderCurrentTimetableView() {
    const listView =
        document.getElementById("timetableListView");
    const weeklyView =
        document.getElementById("timetableWeeklyView");
    const isList = currentTimetableView === "list";

    if (listView) listView.hidden = !isList;
    if (weeklyView) weeklyView.hidden = isList;

    document.querySelectorAll(".timetable-view-button")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.view === currentTimetableView
            );
        });

    if (!isList) {
        populateWeeklySelector();
        renderWeeklySchedule();
    }
}

function populateWeeklySelector() {
    const selector =
        document.getElementById("timetableWeeklySelector");
    if (!selector) return;

    const previous = selector.value;
    const values = [...new Set(
        currentScheduledLessons
            .map(item =>
                String(getPerspectiveValue(
                    item,
                    currentTimetableView
                ) ?? "")
            )
            .filter(Boolean)
    )].sort((a, b) =>
        a.localeCompare(
            b,
            undefined,
            { numeric: true, sensitivity: "base" }
        )
    );

    selector.innerHTML = "";

    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        selector.appendChild(option);
    });

    if (values.includes(previous)) {
        selector.value = previous;
    }
}

function getPerspectiveValue(lesson, view) {
    if (view === "class") {
        return getStudentGroupValue(lesson) ||
            getClassValue(lesson);
    }
    if (view === "teacher") {
        return getTeacherValue(lesson);
    }
    if (view === "room") {
        return getRoomValue(lesson);
    }
    return "";
}

function getClassValue(lesson) {
    return lesson.classGroup ??
        lesson.classGroupName ??
        lesson.classGroupId ??
        "";
}

function getStudentGroupValue(lesson) {
    return lesson.studentGroup ??
        lesson.studentGroupName ??
        "";
}

function getSubjectValue(lesson) {
    return lesson.subject ??
        lesson.subjectName ??
        lesson.subjectId ??
        "";
}

function getTeacherValue(lesson) {
    return lesson.teacher ??
        lesson.teacherName ??
        lesson.teacherId ??
        "";
}

function getRoomValue(lesson) {
    return lesson.room ??
        lesson.roomName ??
        lesson.roomId ??
        "";
}

function renderWeeklySchedule() {
    const tbody =
        document.getElementById("timetableWeeklyBody");
    const selector =
        document.getElementById("timetableWeeklySelector");

    if (!tbody || !selector) return;

    updateWeeklyHeading();

    const selected = selector.value;

    if (!selected) {
        tbody.innerHTML =
            `<tr><td colspan="6">${weeklyText(
                "Brak danych do wyświetlenia.",
                "No data to display."
            )}</td></tr>`;
        return;
    }

    const lessons = currentScheduledLessons.filter(
        lesson =>
            String(getPerspectiveValue(
                lesson,
                currentTimetableView
            )) === selected
    );

    const maxSlot = Math.max(
        0,
        ...lessons.map(getSlotNumber)
    );

    tbody.innerHTML = "";

    for (let slot = 1; slot <= maxSlot; slot++) {
        const row = document.createElement("tr");

        const slotCell = document.createElement("th");
        slotCell.scope = "row";
        slotCell.className = "timetable-slot-cell";
        slotCell.textContent = String(slot);
        row.appendChild(slotCell);

        for (let day = 0; day < 5; day++) {
            const cell = document.createElement("td");
            cell.className = "timetable-weekly-cell";

            const matching = lessons.filter(
                lesson =>
                    normalizeDay(lesson.day) === day &&
                    getSlotNumber(lesson) === slot
            );

            if (matching.length === 0) {
                cell.classList.add(
                    "timetable-weekly-cell-empty"
                );
                cell.textContent = "·";
            } else {
                matching.forEach(lesson =>
                    cell.appendChild(
                        createWeeklyLessonCard(lesson)
                    )
                );
            }

            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }
}

function createWeeklyLessonCard(lesson) {
    const card = document.createElement("div");
    card.className = "timetable-weekly-lesson";

    const subject = document.createElement("strong");
    subject.className = "timetable-weekly-subject";
    subject.textContent = String(
        getSubjectValue(lesson) || "-"
    );
    card.appendChild(subject);

    const details = [];

    const studentGroup = getStudentGroupValue(lesson);

    if (studentGroup) {
        details.push([
            weeklyText("Grupa", "Group"),
            studentGroup
        ]);
    }

    if (currentTimetableView !== "class") {
        details.push([
            weeklyText("Klasa", "Class"),
            getClassValue(lesson)
        ]);
    }

    if (currentTimetableView !== "teacher") {
        details.push([
            weeklyText("Nauczyciel", "Teacher"),
            getTeacherValue(lesson)
        ]);
    }

    if (currentTimetableView !== "room") {
        details.push([
            weeklyText("Sala", "Room"),
            getRoomValue(lesson)
        ]);
    }

    details
        .filter(([, value]) => Boolean(value))
        .forEach(([label, value]) => {
            const line = document.createElement("span");
            line.textContent = `${label}: ${value}`;
            card.appendChild(line);
        });

    return card;
}

function getSlotNumber(lesson) {
    const lessonNumber = Number(lesson.lessonNumber);
    if (Number.isFinite(lessonNumber)) {
        return lessonNumber + 1;
    }

    const slot = Number(lesson.slot);
    if (Number.isFinite(slot)) {
        return slot >= 1 ? slot : slot + 1;
    }

    return 0;
}

function normalizeDay(day) {
    const numeric = Number(day);

    if (Number.isInteger(numeric)) {
        if (numeric >= 0 && numeric <= 4) {
            return numeric;
        }
        if (numeric >= 1 && numeric <= 5) {
            return numeric - 1;
        }
    }

    const value = String(day ?? "")
        .trim()
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const aliases = {
        monday: 0, mon: 0, poniedzialek: 0, pon: 0,
        tuesday: 1, tue: 1, wtorek: 1, wt: 1,
        wednesday: 2, wed: 2, sroda: 2, sr: 2,
        thursday: 3, thu: 3, czwartek: 3, czw: 3,
        friday: 4, fri: 4, piatek: 4, pt: 4
    };

    return aliases[value] ?? -1;
}

function updateWeeklyHeading() {
    const config = {
        class: ["Klasa:", "Class:"],
        teacher: ["Nauczyciel:", "Teacher:"],
        room: ["Sala:", "Room:"]
    }[currentTimetableView] ?? ["Klasa:", "Class:"];

    const eyebrow =
        document.getElementById("timetableWeeklyEyebrow");
    const title =
        document.getElementById("timetableWeeklyTitle");
    const label =
        document.getElementById("timetableWeeklySelectorLabel");
    const selector =
        document.getElementById("timetableWeeklySelector");

    if (eyebrow) {
        eyebrow.textContent =
            weeklyText("Plan tygodniowy", "Weekly timetable");
    }
    if (label) {
        label.textContent = weeklyText(config[0], config[1]);
    }
    if (title) {
        title.textContent =
            selector?.selectedOptions?.[0]?.textContent ??
            "";
    }

    const headers = document.querySelectorAll(
        "#timetableWeeklyTable thead th"
    );

    if (headers.length >= 6) {
        headers[0].textContent =
            weeklyText("Lekcja", "Lesson");

        WEEK_DAYS.forEach((day, index) => {
            headers[index + 1].textContent =
                weeklyText(day[0], day[1]);
        });
    }
}

function weeklyText(pl, en) {
    return document.documentElement.lang
        ?.toLowerCase() === "pl"
        ? pl
        : en;
}


function clearOptimizationResult() {
    setResultMessage(
        "neutral",
        t("result.none"),
        t("result.noneDescription")
    );

    hidePreprocessingIssues();
    clearConstraintReport();
    setTimetableContentVisible(true);
    setStatusText(t("optimization.ready"));
    setTimetableMessage(t("table.noTimetable"));
    resetAllFilters();
    currentScheduledLessons = [];
    currentTimetableView = "list";
    renderCurrentTimetableView();
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
