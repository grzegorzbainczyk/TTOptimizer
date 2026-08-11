document.addEventListener("DOMContentLoaded", async () => {
    const backToTeachersButton =
        document.getElementById("backToTeachersButton");

    const saveTeacherPreferencesButton =
        document.getElementById("saveTeacherPreferencesButton");

    const resetTeacherPreferencesButton =
        document.getElementById("resetTeacherPreferencesButton");

    backToTeachersButton?.addEventListener("click", () => {
        window.location.href = "teachers.html";
    });

    saveTeacherPreferencesButton?.addEventListener(
        "click",
        saveTeacherSchedulingPreferences
    );

    resetTeacherPreferencesButton?.addEventListener(
        "click",
        async () => {
            const select =
                document.getElementById("minimizeGapsImportance");

            select.value = "default";

            await saveTeacherSchedulingPreferences();
        }
    );

    await initializeTeacherPreferencesPage();
});

async function initializeTeacherPreferencesPage() {
    const parameters =
        new URLSearchParams(window.location.search);

    const teacherId =
        parameters.get("teacherId");

    const teacherName =
        parameters.get("teacherName");

    if (!teacherId) {
        showTeacherPreferencesMessage(
            "Teacher id is missing.",
            true
        );

        return;
    }

    document.getElementById("teacherId").value =
        teacherId;

    const title =
        document.getElementById("teacherPreferencesTitle");

    if (teacherName) {
        title.textContent =
            `${teacherName} - scheduling preferences`;
    }

    await loadTeacherSchedulingPreferences();
}

async function loadTeacherSchedulingPreferences() {
    clearTeacherPreferencesMessage();

    const teacherId =
        document.getElementById("teacherId").value;

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/teachers/${encodeURIComponent(
                teacherId
            )}/scheduling-preferences?organizationId=${encodeURIComponent(
                organizationId
            )}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                data?.message ??
                `Could not load scheduling preferences. Status: ${response.status}`
            );
        }

        const preferences = data?.preferences;

        if (!preferences) {
            throw new Error(
                "Scheduling preferences response is missing."
            );
        }

        const title =
            document.getElementById("teacherPreferencesTitle");

        title.textContent =
            `${preferences.teacherName} - scheduling preferences`;

        const select =
            document.getElementById("minimizeGapsImportance");

        updateDefaultOption(
            preferences.defaultMinimizeGaps
        );

        select.value =
            preferences.minimizeGaps == null
                ? "default"
                : preferences.minimizeGaps.toLowerCase();

        showEffectiveValue(
            preferences.effectiveMinimizeGaps
        );
    } catch (error) {
        console.error(
            "Error loading teacher scheduling preferences:",
            error
        );

        showTeacherPreferencesMessage(
            error instanceof Error
                ? error.message
                : "Could not load scheduling preferences.",
            true
        );
    }
}

async function saveTeacherSchedulingPreferences() {
    clearTeacherPreferencesMessage();

    const teacherId =
        document.getElementById("teacherId").value;

    const select =
        document.getElementById("minimizeGapsImportance");

    const minimizeGaps =
        select.value === "default"
            ? null
            : toPreferenceLevel(select.value);

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/teachers/${encodeURIComponent(
                teacherId
            )}/scheduling-preferences?organizationId=${encodeURIComponent(
                organizationId
            )}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    minimizeGaps
                })
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                data?.message ??
                `Could not save scheduling preferences. Status: ${response.status}`
            );
        }

        updateDefaultOption(
            data.preferences.defaultMinimizeGaps
        );

        showEffectiveValue(
            data.preferences.effectiveMinimizeGaps
        );

        showTeacherPreferencesMessage(
            "Scheduling preferences saved.",
            false
        );
    } catch (error) {
        console.error(
            "Error saving teacher scheduling preferences:",
            error
        );

        showTeacherPreferencesMessage(
            error instanceof Error
                ? error.message
                : "Could not save scheduling preferences.",
            true
        );
    }
}

function updateDefaultOption(defaultValue) {
    const select =
        document.getElementById("minimizeGapsImportance");

    const defaultOption =
        select.querySelector('option[value="default"]');

    if (defaultOption) {
        defaultOption.textContent =
            `Default (${defaultValue})`;
    }
}

function showEffectiveValue(effectiveValue) {
    const messageElement =
        document.getElementById("teacherPreferencesMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent =
        `Effective value: ${effectiveValue}`;

    messageElement.classList.remove(
        "error-message"
    );
}

function toPreferenceLevel(value) {
    const mapping = {
        disabled: "Disabled",
        low: "Low",
        medium: "Medium",
        high: "High",
        hard: "Hard"
    };

    return mapping[value] ?? null;
}

function showTeacherPreferencesMessage(message, isError) {
    const messageElement =
        document.getElementById("teacherPreferencesMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.classList.toggle(
        "error-message",
        isError
    );
}

function clearTeacherPreferencesMessage() {
    const messageElement =
        document.getElementById("teacherPreferencesMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";
    messageElement.classList.remove(
        "error-message"
    );
}

async function readJsonResponse(response) {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            message: text
        };
    }
}
