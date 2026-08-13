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
        property: "minimizeGaps",
        defaultProperty: "defaultMinimizeGaps"
    },
    {
        id: "avoidSingleLessonDayImportance",
        property: "avoidSingleLessonDay",
        defaultProperty: "defaultAvoidSingleLessonDay"
    },
    {
        id: "maxConsecutiveLessonsImportance",
        property: "maxConsecutiveLessons",
        defaultProperty: "defaultMaxConsecutiveLessons"
    },
    {
        id: "maxLessonsPerDayImportance",
        property: "maxLessonsPerDay",
        defaultProperty: "defaultMaxLessonsPerDay"
    }
];

let currentPreferences = null;

document.addEventListener("DOMContentLoaded", async () => {
    const classGroupId = getClassGroupId();

    document.getElementById("classGroupId").value =
        String(classGroupId);

    document.getElementById("backToClassesButton")
        ?.addEventListener("click", () => {
            window.location.href = "classes.html";
        });

    document.getElementById("saveClassGroupPreferencesButton")
        ?.addEventListener("click", savePreferences);

    document.getElementById("resetClassGroupPreferencesButton")
        ?.addEventListener("click", useAllDefaults);

    await loadPreferences();
});

function getClassGroupId() {
    const value =
        new URLSearchParams(window.location.search)
            .get("classGroupId");

    const classGroupId = Number.parseInt(value ?? "", 10);

    if (!Number.isInteger(classGroupId) || classGroupId <= 0) {
        throw new Error("Class ID is missing or invalid.");
    }

    return classGroupId;
}

async function loadPreferences() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const classGroupId = getClassGroupId();

        showMessage("Loading class scheduling preferences...");

        const response = await fetch(
            `/api/classes/${encodeURIComponent(classGroupId)}/scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok || !data?.success) {
            throw new Error(
                data?.message ??
                "Could not load class scheduling preferences."
            );
        }

        currentPreferences = data.preferences;
        renderPreferences(currentPreferences);

        showMessage("");
    } catch (error) {
        console.error(
            "Error loading class scheduling preferences:",
            error
        );

        showMessage(
            error instanceof Error
                ? error.message
                : "Could not load class scheduling preferences.",
            true
        );
    }
}

function renderPreferences(preferences) {
    const classGroupName =
        document.getElementById("classGroupName");

    if (classGroupName) {
        classGroupName.textContent =
            preferences.classGroupName ??
            "Class preferences";
    }

    for (const field of levelFields) {
        populateLevelSelect(
            field.id,
            preferences[field.property],
            preferences[field.defaultProperty]
        );
    }

    setLimit(
        "maxConsecutiveLessonsLimit",
        "maxConsecutiveLessonsLimitHint",
        preferences.maxConsecutiveLessonsLimit,
        preferences.defaultMaxConsecutiveLessonsLimit
    );

    setLimit(
        "maxLessonsPerDayLimit",
        "maxLessonsPerDayLimitHint",
        preferences.maxLessonsPerDayLimit,
        preferences.defaultMaxLessonsPerDayLimit
    );

    showEffectiveSummary(preferences);
}

function populateLevelSelect(
    id,
    savedValue,
    defaultValue
) {
    const select =
        document.getElementById(id);

    if (!select) {
        return;
    }

    select.innerHTML = "";

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "default";
    defaultOption.textContent =
        `Default (${defaultValue})`;

    select.appendChild(defaultOption);

    for (const level of preferenceLevels) {
        const option =
            document.createElement("option");

        option.value = level;
        option.textContent = level;

        select.appendChild(option);
    }

    select.value =
        savedValue ?? "default";
}

async function savePreferences() {
    const saveButton =
        document.getElementById(
            "saveClassGroupPreferencesButton"
        );

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const classGroupId =
            getClassGroupId();

        const payload = {
            minimizeGaps:
                getOptionalLevel(
                    "minimizeGapsImportance"
                ),

            avoidSingleLessonDay:
                getOptionalLevel(
                    "avoidSingleLessonDayImportance"
                ),

            maxConsecutiveLessons:
                getOptionalLevel(
                    "maxConsecutiveLessonsImportance"
                ),

            maxConsecutiveLessonsLimit:
                getOptionalLimit(
                    "maxConsecutiveLessonsLimit"
                ),

            maxLessonsPerDay:
                getOptionalLevel(
                    "maxLessonsPerDayImportance"
                ),

            maxLessonsPerDayLimit:
                getOptionalLimit(
                    "maxLessonsPerDayLimit"
                )
        };

        validateOptionalLimit(
            payload.maxConsecutiveLessonsLimit,
            "Max consecutive lessons"
        );

        validateOptionalLimit(
            payload.maxLessonsPerDayLimit,
            "Max lessons per day"
        );

        if (saveButton) {
            saveButton.disabled = true;
        }

        showMessage("Saving class scheduling preferences...");

        const response = await fetch(
            `/api/classes/${encodeURIComponent(classGroupId)}/scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const data =
            await readJsonResponse(response);

        if (!response.ok || !data?.success) {
            throw new Error(
                data?.message ??
                "Could not save class scheduling preferences."
            );
        }

        currentPreferences =
            data.preferences;

        renderPreferences(
            currentPreferences
        );

        showMessage(
            data.message ??
            "Class scheduling preferences were saved."
        );
    } catch (error) {
        console.error(
            "Error saving class scheduling preferences:",
            error
        );

        showMessage(
            error instanceof Error
                ? error.message
                : "Could not save class scheduling preferences.",
            true
        );
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
        }
    }
}

async function useAllDefaults() {
    for (const field of levelFields) {
        const select =
            document.getElementById(field.id);

        if (select) {
            select.value = "default";
        }
    }

    const maxConsecutive =
        document.getElementById(
            "maxConsecutiveLessonsLimit"
        );

    const maxPerDay =
        document.getElementById(
            "maxLessonsPerDayLimit"
        );

    if (maxConsecutive) {
        maxConsecutive.value = "";
    }

    if (maxPerDay) {
        maxPerDay.value = "";
    }

    await savePreferences();
}

function getOptionalLevel(id) {
    const value =
        document.getElementById(id)?.value;

    return !value || value === "default"
        ? null
        : value;
}

function getOptionalLimit(id) {
    const raw =
        document.getElementById(id)?.value?.trim();

    if (!raw) {
        return null;
    }

    return Number.parseInt(raw, 10);
}

function validateOptionalLimit(value, label) {
    if (value == null) {
        return;
    }

    if (!Number.isInteger(value) ||
        value < 1 ||
        value > 8)
    {
        throw new Error(
            `${label} limit must be between 1 and 8.`
        );
    }
}

function setLimit(
    inputId,
    hintId,
    savedValue,
    defaultValue
) {
    const input =
        document.getElementById(inputId);

    const hint =
        document.getElementById(hintId);

    if (input) {
        input.value =
            savedValue ?? "";

        input.placeholder =
            `Default (${defaultValue})`;
    }

    if (hint) {
        hint.textContent =
            savedValue == null
                ? `Using organization default: ${defaultValue}`
                : `Organization default: ${defaultValue}`;
    }
}

function showEffectiveSummary(preferences) {
    showMessage(
        "Effective: " +
        `gaps ${preferences.effectiveMinimizeGaps}, ` +
        `single-lesson day ${preferences.effectiveAvoidSingleLessonDay}, ` +
        `consecutive ${preferences.effectiveMaxConsecutiveLessons} ` +
        `(limit ${preferences.effectiveMaxConsecutiveLessonsLimit}), ` +
        `daily ${preferences.effectiveMaxLessonsPerDay} ` +
        `(limit ${preferences.effectiveMaxLessonsPerDayLimit}).`
    );
}

async function readJsonResponse(response) {
    const text =
        await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            success: false,
            message:
                `Server returned invalid JSON. Status: ${response.status}`
        };
    }
}

function showMessage(
    message,
    isError = false
) {
    const element =
        document.getElementById(
            "classGroupPreferencesMessage"
        );

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle(
        "error-message",
        isError
    );
}
