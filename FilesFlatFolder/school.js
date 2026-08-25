document.addEventListener("DOMContentLoaded", async () => {
    const backToMainButton = document.getElementById("backToMainButton");
    const saveSchoolButton = document.getElementById("saveSchoolButton");
    const reloadSchoolButton = document.getElementById("reloadSchoolButton");

    backToMainButton?.addEventListener("click", () => {
        window.location.href = "main.html";
    });

    saveSchoolButton?.addEventListener("click", saveSchoolInformation);
    reloadSchoolButton?.addEventListener("click", loadSchoolInformation);

    await loadSchoolInformation();
});

async function loadSchoolInformation() {
    setFormDisabled(true);
    showMessage("Loading school information...", false);

    try {
        const organizationId = requireOrganizationId();

        const response = await fetch(
            `/api/organizations/${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not load school information. Status: ${response.status}`
                )
            );
        }

        document.getElementById("schoolName").value = data.name ?? "";
        document.getElementById("schoolAddress").value = data.address ?? "";
        document.getElementById("directorName").value = data.directorName ?? "";

        showMessage("", false);
    } catch (error) {
        console.error("Error loading school information:", error);
        showMessage(
            error instanceof Error
                ? error.message
                : "Could not load school information.",
            true
        );
    } finally {
        setFormDisabled(false);
    }
}

async function saveSchoolInformation() {
    const name = document.getElementById("schoolName").value.trim();
    const address = document.getElementById("schoolAddress").value.trim();
    const directorName = document.getElementById("directorName").value.trim();

    if (!name) {
        showMessage("School name is required.", true);
        document.getElementById("schoolName").focus();
        return;
    }

    setFormDisabled(true);
    showMessage("Saving school information...", false);

    try {
        const organizationId = requireOrganizationId();

        const response = await fetch(
            `/api/organizations/${encodeURIComponent(organizationId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    address: address || null,
                    directorName: directorName || null
                })
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not save school information. Status: ${response.status}`
                )
            );
        }

        document.getElementById("schoolName").value = data.name ?? "";
        document.getElementById("schoolAddress").value = data.address ?? "";
        document.getElementById("directorName").value = data.directorName ?? "";

        showMessage("School information was saved.", false);
    } catch (error) {
        console.error("Error saving school information:", error);
        showMessage(
            error instanceof Error
                ? error.message
                : "Could not save school information.",
            true
        );
    } finally {
        setFormDisabled(false);
    }
}

function requireOrganizationId() {
    if (!window.appContext ||
        typeof window.appContext.requireOrganizationId !== "function") {
        throw new Error("Organization context is not available.");
    }

    return window.appContext.requireOrganizationId();
}

function setFormDisabled(disabled) {
    for (const id of [
        "schoolName",
        "schoolAddress",
        "directorName",
        "saveSchoolButton",
        "reloadSchoolButton"
    ]) {
        const element = document.getElementById(id);

        if (element) {
            element.disabled = disabled;
        }
    }
}

function showMessage(message, isError) {
    const element = document.getElementById("schoolFormMessage");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle("form-message-error", Boolean(isError));
}

async function readJsonResponse(response) {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function getApiErrorMessage(data, fallback) {
    return data?.message ?? fallback;
}
