const preferenceLevels = [
    "Disabled",
    "Low",
    "Medium",
    "High",
    "Hard"
];

const levelFields = [
    {
        id: "spreadAcrossDaysImportance",
        property: "spreadAcrossDays",
        defaultProperty: "defaultSpreadAcrossDays"
    },
    {
        id: "maxOccurrencesPerDayImportance",
        property: "maxOccurrencesPerDay",
        defaultProperty: "defaultMaxOccurrencesPerDay"
    },
    {
        id: "preferDoubleLessonsImportance",
        property: "preferDoubleLessons",
        defaultProperty: "defaultPreferDoubleLessons"
    },
    {
        id: "avoidDoubleLessonsImportance",
        property: "avoidDoubleLessons",
        defaultProperty: "defaultAvoidDoubleLessons"
    }
];

let currentPreferences = null;

document.addEventListener("DOMContentLoaded", async () => {
    const subjectId = getSubjectId();

    document.getElementById("subjectId").value =
        String(subjectId);

    document.getElementById("backToSubjectsButton")
        ?.addEventListener("click", () => {
            window.location.href = "subjects.html";
        });

    document.getElementById("saveSubjectPreferencesButton")
        ?.addEventListener("click", savePreferences);

    document.getElementById("resetSubjectPreferencesButton")
        ?.addEventListener("click", useAllDefaults);

    document.getElementById("preferDoubleLessonsImportance")
        ?.addEventListener("change", validateDoubleLessonSelection);

    document.getElementById("avoidDoubleLessonsImportance")
        ?.addEventListener("change", validateDoubleLessonSelection);

    await loadPreferences();
});

function getSubjectId() {
    const value =
        new URLSearchParams(window.location.search)
            .get("subjectId");

    const subjectId =
        Number.parseInt(value ?? "", 10);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
        throw new Error("Subject ID is missing or invalid.");
    }

    return subjectId;
}

async function loadPreferences() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const subjectId =
            getSubjectId();

        showMessage("Loading subject scheduling preferences...");

        const response = await fetch(
            `/api/subjects/${encodeURIComponent(subjectId)}/scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data =
            await readJsonResponse(response);

        if (!response.ok || !data?.success) {
            throw new Error(
                data?.message ??
                "Could not load subject scheduling preferences."
            );
        }

        currentPreferences =
            data.preferences;

        renderPreferences(
            currentPreferences
        );

        showMessage("");
    } catch (error) {
        console.error(
            "Error loading subject scheduling preferences:",
            error
        );

        showMessage(
            error instanceof Error
                ? error.message
                : "Could not load subject scheduling preferences.",
            true
        );
    }
}

function renderPreferences(preferences) {
    const subjectName =
        document.getElementById("subjectName");

    if (subjectName) {
        subjectName.textContent =
            preferences.subjectName ??
            "Subject preferences";
    }

    for (const field of levelFields) {
        populateLevelSelect(
            field.id,
            preferences[field.property],
            preferences[field.defaultProperty]
        );
    }

    setLimit(
        "maxOccurrencesPerDayLimit",
        "maxOccurrencesPerDayLimitHint",
        preferences.maxOccurrencesPerDayLimit,
        preferences.defaultMaxOccurrencesPerDayLimit
    );
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
            "saveSubjectPreferencesButton"
        );

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const subjectId =
            getSubjectId();

        const payload = {
            spreadAcrossDays:
                getOptionalLevel(
                    "spreadAcrossDaysImportance"
                ),

            maxOccurrencesPerDay:
                getOptionalLevel(
                    "maxOccurrencesPerDayImportance"
                ),

            maxOccurrencesPerDayLimit:
                getOptionalLimit(
                    "maxOccurrencesPerDayLimit"
                ),

            preferDoubleLessons:
                getOptionalLevel(
                    "preferDoubleLessonsImportance"
                ),

            avoidDoubleLessons:
                getOptionalLevel(
                    "avoidDoubleLessonsImportance"
                )
        };

        validateOptionalLimit(
            payload.maxOccurrencesPerDayLimit,
            "Max occurrences per day"
        );

        validateDoubleLessonSelection();

        if (saveButton) {
            saveButton.disabled = true;
        }

        showMessage("Saving subject scheduling preferences...");

        const response = await fetch(
            `/api/subjects/${encodeURIComponent(subjectId)}/scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`,
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
                "Could not save subject scheduling preferences."
            );
        }

        currentPreferences =
            data.preferences;

        renderPreferences(
            currentPreferences
        );

        showMessage(
            data.message ??
            "Subject scheduling preferences were saved."
        );
    } catch (error) {
        console.error(
            "Error saving subject scheduling preferences:",
            error
        );

        showMessage(
            error instanceof Error
                ? error.message
                : "Could not save subject scheduling preferences.",
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

    const limit =
        document.getElementById(
            "maxOccurrencesPerDayLimit"
        );

    if (limit) {
        limit.value = "";
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

function validateDoubleLessonSelection() {
    if (!currentPreferences) {
        return;
    }

    const preferValue =
        document.getElementById(
            "preferDoubleLessonsImportance"
        )?.value;

    const avoidValue =
        document.getElementById(
            "avoidDoubleLessonsImportance"
        )?.value;

    const effectivePrefer =
        preferValue === "default"
            ? currentPreferences.defaultPreferDoubleLessons
            : preferValue;

    const effectiveAvoid =
        avoidValue === "default"
            ? currentPreferences.defaultAvoidDoubleLessons
            : avoidValue;

    if (effectivePrefer !== "Disabled" &&
        effectiveAvoid !== "Disabled")
    {
        throw new Error(
            "Prefer double lessons and avoid double lessons cannot both be enabled."
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
            "subjectPreferencesMessage"
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
