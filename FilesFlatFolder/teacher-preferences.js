const preferenceLevels = [
    "Disabled",
    "Low",
    "Medium",
    "High",
    "Hard"
];

const levelFields = [
    {
        id: "minimizeGapsImportance",
        override: "minimizeGaps",
        defaultValue: "defaultMinimizeGaps",
        effective: "effectiveMinimizeGaps"
    },
    {
        id: "avoidSingleLessonDayImportance",
        override: "avoidSingleLessonDay",
        defaultValue: "defaultAvoidSingleLessonDay",
        effective: "effectiveAvoidSingleLessonDay"
    },
    {
        id: "maxConsecutiveLessonsImportance",
        override: "maxConsecutiveLessons",
        defaultValue: "defaultMaxConsecutiveLessons",
        effective: "effectiveMaxConsecutiveLessons"
    },
    {
        id: "maxLessonsPerDayImportance",
        override: "maxLessonsPerDay",
        defaultValue: "defaultMaxLessonsPerDay",
        effective: "effectiveMaxLessonsPerDay"
    }
];

document.addEventListener("DOMContentLoaded", async () => {
    initializeLevelSelects();

    document.getElementById("backToTeachersButton")
        ?.addEventListener("click", () => {
            window.location.href = "teachers.html";
        });

    document.getElementById("saveTeacherPreferencesButton")
        ?.addEventListener(
            "click",
            saveTeacherSchedulingPreferences
        );

    document.getElementById("resetTeacherPreferencesButton")
        ?.addEventListener("click", async () => {
            for (const field of levelFields) {
                document.getElementById(field.id).value =
                    "default";
            }

            document.getElementById(
                "maxConsecutiveLessonsLimit"
            ).value = "";

            document.getElementById(
                "maxLessonsPerDayLimit"
            ).value = "";

            await saveTeacherSchedulingPreferences();
        });

    await initializeTeacherPreferencesPage();
});

function initializeLevelSelects() {
    for (const field of levelFields) {
        const select = document.getElementById(field.id);

        const defaultOption =
            document.createElement("option");
        defaultOption.value = "default";
        defaultOption.textContent = "Default";
        select.appendChild(defaultOption);

        for (const level of preferenceLevels) {
            const option = document.createElement("option");
            option.value = level;
            option.textContent = level;
            select.appendChild(option);
        }
    }
}

async function initializeTeacherPreferencesPage() {
    const parameters =
        new URLSearchParams(window.location.search);

    const teacherId =
        parameters.get("teacherId");

    const teacherName =
        parameters.get("teacherName");

    if (!teacherId) {
        showMessage("Teacher id is missing.", true);
        return;
    }

    document.getElementById("teacherId").value =
        teacherId;

    if (teacherName) {
        document.getElementById(
            "teacherPreferencesTitle"
        ).textContent =
            `${teacherName} - scheduling preferences`;
    }

    await loadTeacherSchedulingPreferences();
}

async function loadTeacherSchedulingPreferences() {
    clearMessage();

    const teacherId =
        document.getElementById("teacherId").value;

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/teachers/${encodeURIComponent(teacherId)}/scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok || !data?.success) {
            throw new Error(
                data?.message ??
                `Could not load scheduling preferences. Status: ${response.status}`
            );
        }

        const p = data.preferences;

        document.getElementById(
            "teacherPreferencesTitle"
        ).textContent =
            `${p.teacherName} - scheduling preferences`;

        for (const field of levelFields) {
            updateDefaultOption(
                field.id,
                p[field.defaultValue]
            );

            document.getElementById(field.id).value =
                p[field.override] == null
                    ? "default"
                    : p[field.override];
        }

        setLimit(
            "maxConsecutiveLessonsLimit",
            "maxConsecutiveLessonsLimitHint",
            p.maxConsecutiveLessonsLimit,
            p.defaultMaxConsecutiveLessonsLimit
        );

        setLimit(
            "maxLessonsPerDayLimit",
            "maxLessonsPerDayLimitHint",
            p.maxLessonsPerDayLimit,
            p.defaultMaxLessonsPerDayLimit
        );

        showEffectiveSummary(p);
    } catch (error) {
        console.error(
            "Error loading teacher scheduling preferences:",
            error
        );

        showMessage(
            error instanceof Error
                ? error.message
                : "Could not load scheduling preferences.",
            true
        );
    }
}

async function saveTeacherSchedulingPreferences() {
    clearMessage();

    const teacherId =
        document.getElementById("teacherId").value;

    const payload = {
        minimizeGaps:
            readLevel("minimizeGapsImportance"),

        avoidSingleLessonDay:
            readLevel("avoidSingleLessonDayImportance"),

        maxConsecutiveLessons:
            readLevel("maxConsecutiveLessonsImportance"),

        maxConsecutiveLessonsLimit:
            readOptionalLimit("maxConsecutiveLessonsLimit"),

        maxLessonsPerDay:
            readLevel("maxLessonsPerDayImportance"),

        maxLessonsPerDayLimit:
            readOptionalLimit("maxLessonsPerDayLimit")
    };

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/teachers/${encodeURIComponent(teacherId)}/scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok || !data?.success) {
            throw new Error(
                data?.message ??
                `Could not save scheduling preferences. Status: ${response.status}`
            );
        }

        const p = data.preferences;

        for (const field of levelFields) {
            updateDefaultOption(
                field.id,
                p[field.defaultValue]
            );
        }

        setLimit(
            "maxConsecutiveLessonsLimit",
            "maxConsecutiveLessonsLimitHint",
            p.maxConsecutiveLessonsLimit,
            p.defaultMaxConsecutiveLessonsLimit
        );

        setLimit(
            "maxLessonsPerDayLimit",
            "maxLessonsPerDayLimitHint",
            p.maxLessonsPerDayLimit,
            p.defaultMaxLessonsPerDayLimit
        );

        showEffectiveSummary(p, true);
    } catch (error) {
        console.error(
            "Error saving teacher scheduling preferences:",
            error
        );

        showMessage(
            error instanceof Error
                ? error.message
                : "Could not save scheduling preferences.",
            true
        );
    }
}

function readLevel(id) {
    const value =
        document.getElementById(id).value;

    return value === "default"
        ? null
        : value;
}

function readOptionalLimit(id) {
    const raw =
        document.getElementById(id).value.trim();

    if (!raw) {
        return null;
    }

    const value = Number.parseInt(raw, 10);

    if (!Number.isInteger(value) ||
        value < 1 ||
        value > 8) {
        throw new Error(
            "Lesson limits must be between 1 and 8."
        );
    }

    return value;
}

function updateDefaultOption(selectId, defaultValue) {
    const option =
        document.getElementById(selectId)
            ?.querySelector('option[value="default"]');

    if (option) {
        option.textContent =
            `Default (${defaultValue})`;
    }
}

function setLimit(
    inputId,
    hintId,
    overrideValue,
    defaultValue
) {
    const input = document.getElementById(inputId);
    const hint = document.getElementById(hintId);

    input.value =
        overrideValue == null
            ? ""
            : overrideValue;

    input.placeholder =
        `Default (${defaultValue})`;

    if (hint) {
        hint.textContent =
            overrideValue == null
                ? `Using organization default: ${defaultValue}`
                : `Teacher override: ${overrideValue}`;
    }
}

function showEffectiveSummary(p, saved = false) {
    const prefix =
        saved
            ? "Saved. "
            : "";

    showMessage(
        `${prefix}Effective values: ` +
        `gaps ${p.effectiveMinimizeGaps}; ` +
        `single-lesson day ${p.effectiveAvoidSingleLessonDay}; ` +
        `consecutive ${p.effectiveMaxConsecutiveLessons} / limit ${p.effectiveMaxConsecutiveLessonsLimit}; ` +
        `daily ${p.effectiveMaxLessonsPerDay} / limit ${p.effectiveMaxLessonsPerDayLimit}.`,
        false
    );
}

function showMessage(message, isError) {
    const element =
        document.getElementById(
            "teacherPreferencesMessage"
        );

    if (!element) return;

    element.textContent = message;
    element.classList.toggle(
        "error-message",
        isError
    );
}

function clearMessage() {
    showMessage("", false);
}

async function readJsonResponse(response) {
    const text = await response.text();

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return {
            success: false,
            message: text
        };
    }
}
