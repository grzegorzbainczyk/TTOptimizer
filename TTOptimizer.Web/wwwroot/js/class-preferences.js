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
    await initializeI18n();
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

    window.addEventListener("classflow:language-changed", () => {
        if (currentPreferences) renderPreferences(currentPreferences);
    });
});

function getClassGroupId() {
    const value =
        new URLSearchParams(window.location.search)
            .get("classGroupId");

    const classGroupId = Number.parseInt(value ?? "", 10);

    if (!Number.isInteger(classGroupId) || classGroupId <= 0) {
        throw new Error(t("classPreferences.invalidClassId"));
    }

    return classGroupId;
}

async function loadPreferences() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const classGroupId = getClassGroupId();

        showMessage(t("classPreferences.loading"));

        const response = await fetch(
            `/api/classes/${encodeURIComponent(classGroupId)}/scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok || !data?.success) {
            throw new Error(
                t("classPreferences.loadFailed")
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
                : t("classPreferences.loadFailed"),
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
            t("classPreferences.classFallback");
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
        formatText("classPreferences.defaultValue", {
            value: translateLevel(defaultValue)
        });

    select.appendChild(defaultOption);

    for (const level of preferenceLevels) {
        const option =
            document.createElement("option");

        option.value = level;
        option.textContent = translateLevel(level);

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
            t("classPreferences.maxConsecutive.label")
        );

        validateOptionalLimit(
            payload.maxLessonsPerDayLimit,
            t("classPreferences.maxPerDay.label")
        );

        if (saveButton) {
            saveButton.disabled = true;
        }

        showMessage(t("classPreferences.saving"));

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
                t("classPreferences.saveFailed")
            );
        }

        currentPreferences =
            data.preferences;

        renderPreferences(
            currentPreferences
        );

        showMessage(
            t("classPreferences.saved")
        );
    } catch (error) {
        console.error(
            "Error saving class scheduling preferences:",
            error
        );

        showMessage(
            error instanceof Error
                ? error.message
                : t("classPreferences.saveFailed"),
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
            formatText("classPreferences.limitRange", { label })
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
            formatText("classPreferences.defaultValue", { value: defaultValue });
    }

    if (hint) {
        hint.textContent =
            savedValue == null
                ? formatText("classPreferences.usingOrganizationDefault", { value: defaultValue })
                : formatText("classPreferences.organizationDefault", { value: defaultValue });
    }
}

function showEffectiveSummary(preferences) {
    showMessage(
        formatText("classPreferences.effectiveSummary", {
            gaps: translateLevel(preferences.effectiveMinimizeGaps),
            single: translateLevel(preferences.effectiveAvoidSingleLessonDay),
            consecutive: translateLevel(preferences.effectiveMaxConsecutiveLessons),
            consecutiveLimit: preferences.effectiveMaxConsecutiveLessonsLimit,
            daily: translateLevel(preferences.effectiveMaxLessonsPerDay),
            dailyLimit: preferences.effectiveMaxLessonsPerDayLimit
        })
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
                formatText("classPreferences.invalidJson", { status: response.status })
        };
    }
}

function translateLevel(level) {
    return t(`classPreferences.level.${level}`, level);
}

function formatText(key, values) {
    let result = t(key);
    for (const [name, value] of Object.entries(values)) {
        result = result.replaceAll(`{${name}}`, String(value));
    }
    return result;
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
import { initializeI18n, t } from "./i18n.js";
