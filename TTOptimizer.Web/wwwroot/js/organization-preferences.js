const preferenceLevels = [
    "Disabled",
    "Low",
    "Medium",
    "High",
    "Hard"
];

document.addEventListener("DOMContentLoaded", async () => {
    initializeLevelSelects();

    document.getElementById("backToMainButton")
        ?.addEventListener("click", () => {
            window.location.href = "main.html";
        });

    document.getElementById("saveOrganizationPreferencesButton")
        ?.addEventListener("click", saveOrganizationPreferences);

    await loadOrganizationPreferences();
});

function initializeLevelSelects() {
    for (const id of [
        "teacherMinimizeGaps",
        "teacherAvoidSingleLessonDay",
        "teacherAvoidImmediateBuildingChange",
        "teacherMaxConsecutiveLessons",
        "teacherMaxLessonsPerDay",
        "classGroupMinimizeGaps",
        "classGroupAvoidSingleLessonDay",
        "classGroupMaxConsecutiveLessons",
        "classGroupMaxLessonsPerDay",
        "subjectSpreadAcrossDays",
        "subjectMaxOccurrencesPerDay",
        "subjectPreferDoubleLessons",
        "subjectAvoidDoubleLessons"
    ]) {
        const select = document.getElementById(id);
        if (!select) continue;

        select.innerHTML = "";

        for (const level of preferenceLevels) {
            const option = document.createElement("option");
            option.value = level;
            option.textContent = level;
            select.appendChild(option);
        }
    }
}

async function loadOrganizationPreferences() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        showStatus("Loading scheduling defaults...");

        const response = await fetch(
            `/api/organization-scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok || !data?.success) {
            throw new Error(
                data?.message ??
                "Could not load organization scheduling defaults."
            );
        }

        const preferences = data.preferences;

        setValue("teacherMinimizeGaps",
            preferences.teacherMinimizeGaps ?? "Medium");

        setValue("teacherAvoidSingleLessonDay",
            preferences.teacherAvoidSingleLessonDay ?? "Low");

        setValue("teacherAvoidImmediateBuildingChange",
            preferences.teacherAvoidImmediateBuildingChange ?? "Medium");

        setValue("teacherMaxConsecutiveLessons",
            preferences.teacherMaxConsecutiveLessons ?? "Medium");

        setValue("teacherMaxConsecutiveLessonsLimit",
            preferences.teacherMaxConsecutiveLessonsLimit ?? 4);

        setValue("teacherMaxLessonsPerDay",
            preferences.teacherMaxLessonsPerDay ?? "Medium");

        setValue("teacherMaxLessonsPerDayLimit",
            preferences.teacherMaxLessonsPerDayLimit ?? 6);

        setValue("classGroupMinimizeGaps",
            preferences.classGroupMinimizeGaps ?? "Medium");

        setValue("classGroupAvoidSingleLessonDay",
            preferences.classGroupAvoidSingleLessonDay ?? "Disabled");

        setValue("classGroupMaxConsecutiveLessons",
            preferences.classGroupMaxConsecutiveLessons ?? "Medium");

        setValue("classGroupMaxConsecutiveLessonsLimit",
            preferences.classGroupMaxConsecutiveLessonsLimit ?? 6);

        setValue("classGroupMaxLessonsPerDay",
            preferences.classGroupMaxLessonsPerDay ?? "High");

        setValue("classGroupMaxLessonsPerDayLimit",
            preferences.classGroupMaxLessonsPerDayLimit ?? 8);

        setValue("subjectSpreadAcrossDays",
            preferences.subjectSpreadAcrossDays ?? "Medium");

        setValue("subjectMaxOccurrencesPerDay",
            preferences.subjectMaxOccurrencesPerDay ?? "Medium");

        setValue("subjectMaxOccurrencesPerDayLimit",
            preferences.subjectMaxOccurrencesPerDayLimit ?? 1);

        setValue("subjectPreferDoubleLessons",
            preferences.subjectPreferDoubleLessons ?? "Disabled");

        setValue("subjectAvoidDoubleLessons",
            preferences.subjectAvoidDoubleLessons ?? "Disabled");

        const organizationName =
            document.getElementById("organizationName");

        if (organizationName) {
            organizationName.textContent =
                preferences.organizationName ??
                `Organization #${organizationId}`;
        }

        showStatus("");
    } catch (error) {
        console.error(
            "Error loading organization scheduling defaults:",
            error
        );

        showStatus(
            error instanceof Error
                ? error.message
                : "Could not load scheduling defaults.",
            true
        );
    }
}

async function saveOrganizationPreferences() {
    const saveButton =
        document.getElementById("saveOrganizationPreferencesButton");

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const payload = {
            teacherMinimizeGaps:
                getValue("teacherMinimizeGaps"),
            teacherAvoidSingleLessonDay:
                getValue("teacherAvoidSingleLessonDay"),
            teacherAvoidImmediateBuildingChange:
                getValue("teacherAvoidImmediateBuildingChange"),
            teacherMaxConsecutiveLessons:
                getValue("teacherMaxConsecutiveLessons"),
            teacherMaxConsecutiveLessonsLimit:
                getInteger("teacherMaxConsecutiveLessonsLimit"),
            teacherMaxLessonsPerDay:
                getValue("teacherMaxLessonsPerDay"),
            teacherMaxLessonsPerDayLimit:
                getInteger("teacherMaxLessonsPerDayLimit"),

            classGroupMinimizeGaps:
                getValue("classGroupMinimizeGaps"),
            classGroupAvoidSingleLessonDay:
                getValue("classGroupAvoidSingleLessonDay"),
            classGroupMaxConsecutiveLessons:
                getValue("classGroupMaxConsecutiveLessons"),
            classGroupMaxConsecutiveLessonsLimit:
                getInteger("classGroupMaxConsecutiveLessonsLimit"),
            classGroupMaxLessonsPerDay:
                getValue("classGroupMaxLessonsPerDay"),
            classGroupMaxLessonsPerDayLimit:
                getInteger("classGroupMaxLessonsPerDayLimit"),

            subjectSpreadAcrossDays:
                getValue("subjectSpreadAcrossDays"),
            subjectMaxOccurrencesPerDay:
                getValue("subjectMaxOccurrencesPerDay"),
            subjectMaxOccurrencesPerDayLimit:
                getInteger("subjectMaxOccurrencesPerDayLimit"),
            subjectPreferDoubleLessons:
                getValue("subjectPreferDoubleLessons"),
            subjectAvoidDoubleLessons:
                getValue("subjectAvoidDoubleLessons")
        };

        validateLimit(
            payload.teacherMaxConsecutiveLessonsLimit,
            "Max consecutive lessons"
        );

        validateLimit(
            payload.teacherMaxLessonsPerDayLimit,
            "Teacher max lessons per day"
        );

        validateLimit(
            payload.classGroupMaxConsecutiveLessonsLimit,
            "Class max consecutive lessons"
        );

        validateLimit(
            payload.classGroupMaxLessonsPerDayLimit,
            "Class max lessons per day"
        );

        validateLimit(
            payload.subjectMaxOccurrencesPerDayLimit,
            "Subject max occurrences per day"
        );

        if (payload.subjectPreferDoubleLessons !== "Disabled" &&
            payload.subjectAvoidDoubleLessons !== "Disabled")
        {
            throw new Error(
                "Prefer double lessons and avoid double lessons cannot both be enabled."
            );
        }

        if (saveButton) saveButton.disabled = true;

        showStatus("Saving scheduling defaults...");

        const response = await fetch(
            `/api/organization-scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`,
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
                "Could not save organization scheduling defaults."
            );
        }

        showStatus(
            data.message ??
            "Organization scheduling defaults were saved."
        );
    } catch (error) {
        console.error(
            "Error saving organization scheduling defaults:",
            error
        );

        showStatus(
            error instanceof Error
                ? error.message
                : "Could not save scheduling defaults.",
            true
        );
    } finally {
        if (saveButton) saveButton.disabled = false;
    }
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
}

function getValue(id) {
    return document.getElementById(id)?.value ?? "";
}

function getInteger(id) {
    return Number.parseInt(
        document.getElementById(id)?.value ?? "",
        10
    );
}

function validateLimit(value, label) {
    if (!Number.isInteger(value) || value < 1 || value > 8) {
        throw new Error(`${label} limit must be between 1 and 8.`);
    }
}

async function readJsonResponse(response) {
    const text = await response.text();

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return {
            success: false,
            message: `Server returned invalid JSON. Status: ${response.status}`
        };
    }
}

function showStatus(message, isError = false) {
    const status =
        document.getElementById("organizationPreferencesStatus");

    if (!status) return;

    status.textContent = message;
    status.classList.toggle("settings-status-error", isError);
}
