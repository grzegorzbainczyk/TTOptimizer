import { initializeI18n, t } from "./i18n.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initializeI18n();
    document.getElementById("exitSetupButton")
        ?.addEventListener("click", () => {
            window.location.href = "main.html";
        });

    document.getElementById("singleBuildingOption")
        ?.addEventListener("change", updateBuildingMode);

    document.getElementById("multipleBuildingsOption")
        ?.addEventListener("change", updateBuildingMode);

    document.getElementById("useSchoolAddressForBuilding")
        ?.addEventListener("change", syncBuildingAddressState);

    document.getElementById("schoolAddress")
        ?.addEventListener("input", syncBuildingAddressValue);

    document.getElementById("addBuildingRowButton")
        ?.addEventListener("click", () => addBuildingRow());

    document.getElementById("saveAndContinueButton")
        ?.addEventListener("click", saveAndContinue);

    updateBuildingMode();
    await loadSetupData();
});

let existingBuildings = [];

async function loadSetupData() {
    setBusy(true);
    showMessage(t("setup.loadingSchool"), false);

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const [schoolResponse, buildingsResponse] =
            await Promise.all([
                fetch(`/api/organizations/${encodeURIComponent(organizationId)}`),
                fetch(`/api/buildings?organizationId=${encodeURIComponent(organizationId)}`)
            ]);

        const school = await readJsonResponse(schoolResponse);
        const buildingsData = await readJsonResponse(buildingsResponse);

        if (!schoolResponse.ok) {
            throw new Error(getApiErrorMessage(
                school,
                `${t("setup.loadSchoolFailed")} Status: ${schoolResponse.status}`
            ));
        }

        if (!buildingsResponse.ok) {
            throw new Error(getApiErrorMessage(
                buildingsData,
                `${t("setup.loadBuildingsFailed")} Status: ${buildingsResponse.status}`
            ));
        }

        document.getElementById("schoolType").value = String(school.schoolType ?? 0);
        document.getElementById("schoolName").value = school.name ?? "";
        document.getElementById("schoolAddress").value = school.address ?? "";
        document.getElementById("directorName").value = school.directorName ?? "";

        existingBuildings =
            Array.isArray(buildingsData)
                ? buildingsData
                : buildingsData?.buildings ?? [];

        applyExistingBuildings();
        showMessage("", false);
    } catch (error) {
        console.error("Error loading setup:", error);
        showMessage(
            error instanceof Error
                ? error.message
                : t("setup.loadFailed"),
            true
        );
    } finally {
        setBusy(false);
    }
}

function applyExistingBuildings() {
    if (existingBuildings.length <= 1) {
        document.getElementById("singleBuildingOption").checked = true;
        document.getElementById("multipleBuildingsOption").checked = false;

        const building = existingBuildings[0];

        if (building) {
            document.getElementById("singleBuildingName").value =
                building.name ?? t("setup.mainBuilding");

            const schoolAddress =
                document.getElementById("schoolAddress").value.trim();

            const sameAddress =
                Boolean(schoolAddress) &&
                normalize(building.address) === normalize(schoolAddress);

            document.getElementById("useSchoolAddressForBuilding").checked =
                sameAddress || !building.address;

            document.getElementById("singleBuildingAddress").value =
                building.address ?? schoolAddress;
        }
    } else {
        document.getElementById("singleBuildingOption").checked = false;
        document.getElementById("multipleBuildingsOption").checked = true;

        const container =
            document.getElementById("buildingRows");

        container.innerHTML = "";

        for (const building of existingBuildings) {
            addBuildingRow(building);
        }
    }

    updateBuildingMode();
    syncBuildingAddressState();
}

function updateBuildingMode() {
    const single =
        document.getElementById("singleBuildingOption").checked;

    document.getElementById("singleBuildingPanel").hidden = !single;
    document.getElementById("multipleBuildingsPanel").hidden = single;

    if (!single) {
        const container =
            document.getElementById("buildingRows");

        if (container.children.length === 0) {
            if (existingBuildings.length > 0) {
                for (const building of existingBuildings) {
                    addBuildingRow(building);
                }
            } else {
                addBuildingRow({ name: t("setup.mainBuilding") });
                addBuildingRow({ name: "Budynek B" });
            }
        }
    }
}

function syncBuildingAddressState() {
    const checkbox =
        document.getElementById("useSchoolAddressForBuilding");

    const input =
        document.getElementById("singleBuildingAddress");

    if (!checkbox || !input) {
        return;
    }

    input.disabled = checkbox.checked;

    if (checkbox.checked) {
        syncBuildingAddressValue();
    }
}

function syncBuildingAddressValue() {
    const checkbox =
        document.getElementById("useSchoolAddressForBuilding");

    if (!checkbox?.checked) {
        return;
    }

    document.getElementById("singleBuildingAddress").value =
        document.getElementById("schoolAddress").value;
}

function addBuildingRow(building = {}) {
    const container =
        document.getElementById("buildingRows");

    const row =
        document.createElement("div");

    row.className = "building-row";
    row.dataset.buildingId = building.id ?? "";

    row.innerHTML = `
        <div class="form-field">
            <label>Nazwa budynku</label>
            <input class="setup-building-name"
                   type="text"
                   maxlength="150"
                   value="${escapeAttribute(building.name ?? "")}"
                   placeholder="np. Budynek główny" />
        </div>

        <div class="form-field">
            <label>Adres</label>
            <input class="setup-building-address"
                   type="text"
                   maxlength="500"
                   value="${escapeAttribute(building.address ?? "")}"
                   placeholder="Opcjonalnie" />
        </div>

        <button class="secondary-button building-row-remove"
                type="button">
            Usuń
        </button>
    `;

    row.querySelector(".building-row-remove")
        .addEventListener("click", () => {
            if (container.children.length <= 1) {
                showMessage(
                    t("setup.buildingRequired"),
                    true
                );
                return;
            }

            row.remove();
        });

    container.appendChild(row);
}

async function saveAndContinue() {
    const schoolType =
        Number(document.getElementById("schoolType").value);

    if (!Number.isInteger(schoolType) || schoolType <= 0) {
        showMessage(t("setup.schoolType.required"), true);
        document.getElementById("schoolType").focus();
        return;
    }

    const schoolName =
        document.getElementById("schoolName").value.trim();

    if (!schoolName) {
        showMessage(t("setup.schoolNameRequired"), true);
        document.getElementById("schoolName").focus();
        return;
    }

    const buildings = collectBuildings();

    if (buildings.length === 0) {
        return;
    }

    setBusy(true);
    showMessage("Zapisywanie konfiguracji...", false);

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        await saveSchool(organizationId);
        await saveBuildings(organizationId, buildings);

        showMessage(
            "Dane zapisane. Przechodzimy do sal...",
            false
        );

        window.setTimeout(() => {
            window.location.href = "rooms.html?setup=1";
        }, 350);
    } catch (error) {
        console.error("Error saving setup:", error);

        showMessage(
            error instanceof Error
                ? error.message
                : t("setup.saveFailed"),
            true
        );
    } finally {
        setBusy(false);
    }
}

function collectBuildings() {
    const single =
        document.getElementById("singleBuildingOption").checked;

    if (single) {
        const name =
            document.getElementById("singleBuildingName").value.trim();

        if (!name) {
            showMessage(t("setup.buildingNameRequired"), true);
            document.getElementById("singleBuildingName").focus();
            return [];
        }

        const address =
            document.getElementById("singleBuildingAddress").value.trim();

        return [{
            id: existingBuildings.length === 1
                ? existingBuildings[0].id
                : null,
            name,
            address: address || null
        }];
    }

    const result = [];

    for (const row of document.querySelectorAll(".building-row")) {
        const name =
            row.querySelector(".setup-building-name").value.trim();

        const address =
            row.querySelector(".setup-building-address").value.trim();

        if (!name) {
            showMessage(
                t("setup.everyBuildingNameRequired"),
                true
            );

            row.querySelector(".setup-building-name").focus();
            return [];
        }

        result.push({
            id: row.dataset.buildingId
                ? Number(row.dataset.buildingId)
                : null,
            name,
            address: address || null
        });
    }

    return result;
}

async function saveSchool(organizationId) {
    const response = await fetch(
        `/api/organizations/${encodeURIComponent(organizationId)}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name:
                    document.getElementById("schoolName").value.trim(),
                schoolType:
                    Number(document.getElementById("schoolType").value),
                address:
                    document.getElementById("schoolAddress").value.trim() || null,
                directorName:
                    document.getElementById("directorName").value.trim() || null
            })
        }
    );

    const data =
        await readJsonResponse(response);

    if (!response.ok) {
        throw new Error(
            getApiErrorMessage(
                data,
                `${t("setup.saveSchoolFailed")} Status: ${response.status}`
            )
        );
    }
}

async function saveBuildings(organizationId, buildings) {
    const existingById =
        new Map(
            existingBuildings.map(item => [item.id, item])
        );

    for (const building of buildings) {
        const isExisting =
            building.id && existingById.has(building.id);

        const url =
            isExisting
                ? `/api/buildings/${encodeURIComponent(building.id)}?organizationId=${encodeURIComponent(organizationId)}`
                : `/api/buildings?organizationId=${encodeURIComponent(organizationId)}`;

        const response = await fetch(url, {
            method: isExisting ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: building.name,
                address: building.address,
                info: null
            })
        });

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    t("setup.saveBuildingFailed").replace("{name}", building.name)
                )
            );
        }

        if (isExisting) {
            existingById.delete(building.id);
        }
    }

    // Celowo nie usuwamy automatycznie istniejących budynków pominiętych
    // w konfiguratorze. Mogą już mieć przypisane sale. Użytkownik może
    // bezpiecznie usunąć je później na stronie Budynki.
}

function setBusy(disabled) {
    for (const selector of [
        "#schoolType",
        "#schoolName",
        "#schoolAddress",
        "#directorName",
        "#singleBuildingOption",
        "#multipleBuildingsOption",
        "#singleBuildingName",
        "#singleBuildingAddress",
        "#useSchoolAddressForBuilding",
        "#addBuildingRowButton",
        "#saveAndContinueButton"
    ]) {
        const element =
            document.querySelector(selector);

        if (element) {
            element.disabled = disabled;
        }
    }

    for (const element of document.querySelectorAll(
        ".setup-building-name, .setup-building-address, .building-row-remove"
    )) {
        element.disabled = disabled;
    }
}

function showMessage(message, isError) {
    const element =
        document.getElementById("setupMessage");

    element.textContent = message;
    element.classList.toggle(
        "form-message-error",
        Boolean(isError)
    );
}

function normalize(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("pl");
}

function escapeAttribute(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
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
        return { message: text };
    }
}

function getApiErrorMessage(data, fallback) {
    if (typeof data?.message === "string") {
        return data.message;
    }

    if (data?.errors) {
        const messages =
            Object.values(data.errors)
                .flat()
                .filter(item => typeof item === "string");

        if (messages.length > 0) {
            return messages.join(" ");
        }
    }

    return fallback;
}
