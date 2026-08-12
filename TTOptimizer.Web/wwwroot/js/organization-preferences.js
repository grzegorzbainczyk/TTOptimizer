document.addEventListener("DOMContentLoaded", async () => {
    const backButton =
        document.getElementById("backToMainButton");

    const saveButton =
        document.getElementById(
            "saveOrganizationPreferencesButton"
        );

    backButton?.addEventListener("click", () => {
        window.location.href = "main.html";
    });

    saveButton?.addEventListener(
        "click",
        saveOrganizationPreferences
    );

    await loadOrganizationPreferences();
});

async function loadOrganizationPreferences() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        showStatus("Loading scheduling defaults...");

        const response = await fetch(
            `/api/organization-scheduling-preferences` +
            `?organizationId=${encodeURIComponent(
                organizationId
            )}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok || !data?.success) {
            throw new Error(
                data?.message ??
                "Could not load organization scheduling defaults."
            );
        }

        const preferences = data.preferences;

        document.getElementById(
            "teacherMinimizeGaps"
        ).value =
            preferences.teacherMinimizeGaps ?? "Medium";

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
        document.getElementById(
            "saveOrganizationPreferencesButton"
        );

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const teacherMinimizeGaps =
            document.getElementById(
                "teacherMinimizeGaps"
            ).value;

        if (saveButton) {
            saveButton.disabled = true;
        }

        showStatus("Saving scheduling defaults...");

        const response = await fetch(
            `/api/organization-scheduling-preferences` +
            `?organizationId=${encodeURIComponent(
                organizationId
            )}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    teacherMinimizeGaps
                })
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
        if (saveButton) {
            saveButton.disabled = false;
        }
    }
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
            success: false,
            message:
                `Server returned invalid JSON. Status: ${response.status}`
        };
    }
}

function showStatus(message, isError = false) {
    const status =
        document.getElementById(
            "organizationPreferencesStatus"
        );

    if (!status) {
        return;
    }

    status.textContent = message;
    status.classList.toggle(
        "settings-status-error",
        isError
    );
}
