import { initializeI18n, t } from "./i18n.js";

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
let availableRooms = [];

document.addEventListener("DOMContentLoaded", async () => {
    await initializeI18n();
    document.title = t("subjectPreferences.pageTitle", "ClassFlow - Subject preferences");

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

    document.getElementById("preferredRoomId")
        ?.addEventListener("change", updatePreferredRoomImportanceState);

    await loadRooms();
    await loadPreferences();

    window.addEventListener(
        "classflow:language-changed",
        () => {
            if (currentPreferences) {
                renderPreferences(currentPreferences);
            }
        }
    );
});

function getSubjectId() {
    const value =
        new URLSearchParams(window.location.search)
            .get("subjectId");

    const subjectId =
        Number.parseInt(value ?? "", 10);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
        throw new Error(t("subjectPreferences.invalidSubjectId", "Subject ID is missing or invalid."));
    }

    return subjectId;
}

async function loadPreferences() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const subjectId =
            getSubjectId();

        showMessage(t("subjectPreferences.loading", "Loading subject scheduling preferences..."));

        const response = await fetch(
            `/api/subjects/${encodeURIComponent(subjectId)}/scheduling-preferences?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data =
            await readJsonResponse(response);

        if (!response.ok || !data?.success) {
            throw new Error(
                data?.message ??
                t("subjectPreferences.loadFailed", "Could not load subject scheduling preferences.")
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
                : t("subjectPreferences.loadFailed", "Could not load subject scheduling preferences."),
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
            t("subjectPreferences.subjectFallback", "Subject preferences");
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

    populatePreferredRoomSelect(preferences.preferredRoomId);
    populatePreferredRoomImportance(
        preferences.preferredRoomImportance
    );
    updatePreferredRoomImportanceState();
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
        t("subjectPreferences.defaultValue", "Default ({value})")
            .replace(
                "{value}",
                translatePreferenceLevel(defaultValue)
            );

    select.appendChild(defaultOption);

    for (const level of preferenceLevels) {
        const option =
            document.createElement("option");

        option.value = level;
        option.textContent = translatePreferenceLevel(level);

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
                ),

            preferredRoomId:
                getOptionalInt("preferredRoomId"),

            preferredRoomImportance:
                getPreferredRoomImportance()
        };

        validateOptionalLimit(
            payload.maxOccurrencesPerDayLimit,
            t("subjectPreferences.maxOccurrencesPerDay.title", "Max occurrences per day")
        );

        validateDoubleLessonSelection();

        if (saveButton) {
            saveButton.disabled = true;
        }

        showMessage(t("subjectPreferences.saving", "Saving subject scheduling preferences..."));

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
                t("subjectPreferences.saveFailed", "Could not save subject scheduling preferences.")
            );
        }

        currentPreferences =
            data.preferences;

        renderPreferences(
            currentPreferences
        );

        showMessage(
            t(
                "subjectPreferences.saved",
                "Subject scheduling preferences were saved."
            )
        );
    } catch (error) {
        console.error(
            "Error saving subject scheduling preferences:",
            error
        );

        showMessage(
            error instanceof Error
                ? error.message
                : t("subjectPreferences.saveFailed", "Could not save subject scheduling preferences."),
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

    const preferredRoom =
        document.getElementById("preferredRoomId");

    if (preferredRoom) {
        preferredRoom.value = "";
    }

    const preferredRoomImportance =
        document.getElementById("preferredRoomImportance");

    if (preferredRoomImportance) {
        preferredRoomImportance.value = "Hard";
    }

    updatePreferredRoomImportanceState();

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

function getOptionalInt(id) {
    const raw = document.getElementById(id)?.value;

    if (!raw) {
        return null;
    }

    const value = Number.parseInt(raw, 10);
    return Number.isInteger(value) && value > 0
        ? value
        : null;
}

function getPreferredRoomImportance() {
    const preferredRoomId = getOptionalInt("preferredRoomId");

    if (preferredRoomId == null) {
        return null;
    }

    return document.getElementById("preferredRoomImportance")?.value
        ?? "Hard";
}

async function loadRooms() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/rooms?organizationId=${encodeURIComponent(organizationId)}`
        );

        if (!response.ok) {
            throw new Error(
                t(
                    "subjectPreferences.room.loadFailed",
                    "Could not load rooms."
                )
            );
        }

        const data = await readJsonResponse(response);
        availableRooms = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error loading rooms for subject preferences:", error);
        availableRooms = [];
    }
}

function populatePreferredRoomSelect(selectedRoomId) {
    const select = document.getElementById("preferredRoomId");

    if (!select) {
        return;
    }

    select.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = t(
        "subjectPreferences.room.noPreferredRoom",
        "No preferred room"
    );
    select.appendChild(emptyOption);

    for (const room of availableRooms) {
        const option = document.createElement("option");
        option.value = String(room.id);
        option.textContent = room.buildingName
            ? `${room.name} (${room.buildingName})`
            : room.name;
        select.appendChild(option);
    }

    select.value = selectedRoomId == null
        ? ""
        : String(selectedRoomId);
}

function populatePreferredRoomImportance(savedValue) {
    const select = document.getElementById("preferredRoomImportance");

    if (!select) {
        return;
    }

    select.innerHTML = "";

    for (const level of preferenceLevels) {
        if (level === "Disabled") {
            continue;
        }

        const option = document.createElement("option");
        option.value = level;
        option.textContent = translatePreferenceLevel(level);
        select.appendChild(option);
    }

    select.value = savedValue ?? "Hard";
}

function updatePreferredRoomImportanceState() {
    const preferredRoomId = getOptionalInt("preferredRoomId");
    const importance = document.getElementById("preferredRoomImportance");

    if (importance) {
        importance.disabled = preferredRoomId == null;
    }
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
            t(
                "subjectPreferences.limitRange",
                "{label} limit must be between 1 and 8."
            ).replace("{label}", label)
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
            t(
                "subjectPreferences.doubleConflict",
                "Prefer double lessons and avoid double lessons cannot both be enabled."
            )
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
            t(
                "subjectPreferences.defaultValue",
                "Default ({value})"
            ).replace("{value}", defaultValue);
    }

    if (hint) {
        hint.textContent =
            savedValue == null
                ? t(
                    "subjectPreferences.usingOrganizationDefault",
                    "Using organization default: {value}"
                ).replace("{value}", defaultValue)
                : t(
                    "subjectPreferences.organizationDefault",
                    "Organization default: {value}"
                ).replace("{value}", defaultValue);
    }
}


function translatePreferenceLevel(level) {
    return t(
        `subjectPreferences.level.${level}`,
        level
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
                t(
                    "subjectPreferences.invalidJson",
                    "Server returned invalid JSON. Status: {status}"
                ).replace("{status}", response.status)
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
