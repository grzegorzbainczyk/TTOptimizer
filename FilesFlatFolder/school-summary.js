import { t } from "../i18n.js";

export async function initializeSchoolSummary() {
    const organizationNameElement =
        document.getElementById("organizationName");

    if (!organizationNameElement) {
        return;
    }

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/organizations/${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                data?.message ??
                `Could not load school information. Status: ${response.status}`
            );
        }

        organizationNameElement.textContent =
            data.name || t("school.unnamed");
    } catch (error) {
        console.error("Could not load school information:", error);
        organizationNameElement.textContent = t("school.unavailable");
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
        return null;
    }
}
