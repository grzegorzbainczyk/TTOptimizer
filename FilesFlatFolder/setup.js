import { initializeI18n, t } from "./i18n.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initializeI18n();
    document.getElementById("exitSetupButton")
        ?.addEventListener("click", () => {
            window.location.href = "main.html";
        });

    document.getElementById("addBuildingRowButton")
        ?.addEventListener("click", () => addBuildingRow());

    document.getElementById("addSchoolUnitRowButton")
        ?.addEventListener("click", () => addSchoolUnitRow());

    document.getElementById("saveAndContinueButton")
        ?.addEventListener("click", saveAndContinue);

    document.getElementById("skipSetupStepButton")
        ?.addEventListener("click", () => {
            window.location.href = "rooms.html?setup=1";
        });

    await loadSetupData();
});

let existingBuildings = [];
let existingSchoolUnits = [];

async function loadSetupData() {
    setBusy(true);
    showMessage(t("setup.loadingSchool"), false);

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const [schoolResponse, buildingsResponse, schoolUnitsResponse] =
            await Promise.all([
                fetch(`/api/organizations/${encodeURIComponent(organizationId)}`),
                fetch(`/api/buildings?organizationId=${encodeURIComponent(organizationId)}`),
                fetch(`/api/schoolunits?organizationId=${encodeURIComponent(organizationId)}`)
            ]);

        const school = await readJsonResponse(schoolResponse);
        const buildingsData = await readJsonResponse(buildingsResponse);
        const schoolUnitsData = await readJsonResponse(schoolUnitsResponse);

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

        if (!schoolUnitsResponse.ok) {
            throw new Error(getApiErrorMessage(
                schoolUnitsData,
                `Could not load schools. Status: ${schoolUnitsResponse.status}`
            ));
        }

        document.getElementById("schoolName").value = school.name ?? "";
        document.getElementById("schoolAddress").value = school.address ?? "";
        document.getElementById("directorName").value = school.directorName ?? "";

        existingBuildings =
            Array.isArray(buildingsData)
                ? buildingsData
                : buildingsData?.buildings ?? [];

        existingSchoolUnits =
            Array.isArray(schoolUnitsData)
                ? schoolUnitsData
                : schoolUnitsData?.schoolUnits ?? [];

        renderSchoolUnits();
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
    const container =
        document.getElementById("buildingRows");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    for (const building of existingBuildings) {
        addBuildingRow(building);
    }
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
        .addEventListener("click", async () => {
            const buildingId =
                row.dataset.buildingId
                    ? Number(row.dataset.buildingId)
                    : null;

            const buildingName =
                row.querySelector(".setup-building-name")?.value.trim() ||
                "ten budynek";

            if (!buildingId) {
                row.remove();
                return;
            }

            const confirmed = window.confirm(
                `Usunąć budynek „${buildingName}”?\n\n` +
                "Wszystkie sale przypisane do tego budynku również zostaną usunięte."
            );

            if (!confirmed) {
                return;
            }

            try {
                setBusy(true);

                const organizationId =
                    window.appContext.requireOrganizationId();

                const response = await fetch(
                    `/api/buildings/${encodeURIComponent(buildingId)}?organizationId=${encodeURIComponent(organizationId)}`,
                    { method: "DELETE" }
                );

                const data = await readJsonResponse(response);

                if (!response.ok) {
                    throw new Error(
                        getApiErrorMessage(
                            data,
                            `Nie udało się usunąć budynku „${buildingName}”.`
                        )
                    );
                }

                existingBuildings =
                    existingBuildings.filter(item =>
                        Number(item.id) !== buildingId
                    );

                row.remove();

                showMessage(
                    `Usunięto budynek „${buildingName}” wraz z przypisanymi salami.`,
                    false
                );
            } catch (error) {
                console.error("Error deleting building:", error);

                showMessage(
                    error instanceof Error
                        ? error.message
                        : "Nie udało się usunąć budynku.",
                    true
                );
            } finally {
                setBusy(false);
            }
        });

    container.appendChild(row);
}

async function saveAndContinue() {
    const schoolName =
        document.getElementById("schoolName").value.trim();

    if (!schoolName) {
        showMessage(t("setup.schoolNameRequired"), true);
        document.getElementById("schoolName").focus();
        return;
    }

    const schoolUnits = collectSchoolUnits();

    if (schoolUnits.length === 0) {
        return;
    }

    const buildings = collectBuildings();

    if (buildings == null) {
        return;
    }

    setBusy(true);
    showMessage("Zapisywanie konfiguracji...", false);

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        await saveSchool(organizationId);
        await saveSchoolUnits(organizationId, schoolUnits);
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


function renderSchoolUnits() {
    const container =
        document.getElementById("schoolUnitRows");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (existingSchoolUnits.length === 0) {
        addSchoolUnitRow();
        return;
    }

    for (const schoolUnit of existingSchoolUnits) {
        addSchoolUnitRow(schoolUnit);
    }
}

function addSchoolUnitRow(schoolUnit = {}) {
    const container =
        document.getElementById("schoolUnitRows");

    if (!container) {
        return;
    }

    const row =
        document.createElement("div");

    row.className = "school-unit-row";
    row.dataset.schoolUnitId = schoolUnit.id ?? "";

    row.innerHTML = `
        <div class="form-field">
            <label>Nazwa szkoły</label>
            <input class="setup-school-unit-name"
                   type="text"
                   maxlength="200"
                   value="${escapeAttribute(schoolUnit.name ?? "")}"
                   placeholder="np. Technikum nr 1" />
        </div>

        <div class="form-field">
            <label>Typ szkoły</label>
            <select class="setup-school-unit-type">
                <option value="0">Wybierz typ szkoły</option>
                <option value="1">Szkoła podstawowa</option>
                <option value="2">Liceum ogólnokształcące</option>
                <option value="3">Technikum</option>
                <option value="4">Branżowa szkoła I stopnia</option>
                <option value="5">Branżowa szkoła II stopnia</option>
            </select>
        </div>

        <button class="secondary-button school-unit-row-remove"
                type="button">
            Usuń
        </button>
    `;

    row.querySelector(".setup-school-unit-type").value =
        String(schoolUnit.schoolType ?? 0);

    row.querySelector(".school-unit-row-remove")
        .addEventListener("click", () => {
            if (container.children.length <= 1) {
                showMessage(
                    "Placówka musi zawierać co najmniej jedną szkołę.",
                    true
                );
                return;
            }

            row.remove();
        });

    container.appendChild(row);
}

function collectSchoolUnits() {
    const result = [];
    const names = new Set();

    for (const row of document.querySelectorAll(".school-unit-row")) {
        const name =
            row.querySelector(".setup-school-unit-name").value.trim();

        const schoolType =
            Number(row.querySelector(".setup-school-unit-type").value);

        if (!name) {
            showMessage("Podaj nazwę każdej szkoły.", true);
            row.querySelector(".setup-school-unit-name").focus();
            return [];
        }

        if (!Number.isInteger(schoolType) || schoolType <= 0) {
            showMessage(
                `Wybierz typ szkoły dla „${name}”.`,
                true
            );
            row.querySelector(".setup-school-unit-type").focus();
            return [];
        }

        const normalizedName = normalize(name);

        if (names.has(normalizedName)) {
            showMessage(
                `Szkoła „${name}” została dodana więcej niż raz.`,
                true
            );
            row.querySelector(".setup-school-unit-name").focus();
            return [];
        }

        names.add(normalizedName);

        result.push({
            id: row.dataset.schoolUnitId
                ? Number(row.dataset.schoolUnitId)
                : null,
            name,
            schoolType
        });
    }

    return result;
}

async function saveSchoolUnits(organizationId, schoolUnits) {
    const existingById =
        new Map(
            existingSchoolUnits.map(item => [item.id, item])
        );

    for (const schoolUnit of schoolUnits) {
        const isExisting =
            schoolUnit.id && existingById.has(schoolUnit.id);

        const url =
            isExisting
                ? `/api/schoolunits/${encodeURIComponent(schoolUnit.id)}?organizationId=${encodeURIComponent(organizationId)}`
                : `/api/schoolunits?organizationId=${encodeURIComponent(organizationId)}`;

        const response = await fetch(url, {
            method: isExisting ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: schoolUnit.name,
                schoolType: schoolUnit.schoolType
            })
        });

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not save school '${schoolUnit.name}'.`
                )
            );
        }

        if (isExisting) {
            existingById.delete(schoolUnit.id);
        }
    }

    // Unlike buildings, omitted SchoolUnits should represent an explicit
    // removal from the setup screen. The API blocks deletion when classes
    // are already assigned, so no data can silently become orphaned.
    for (const removedSchoolUnit of existingById.values()) {
        const response = await fetch(
            `/api/schoolunits/${encodeURIComponent(removedSchoolUnit.id)}?organizationId=${encodeURIComponent(organizationId)}`,
            { method: "DELETE" }
        );

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not remove school '${removedSchoolUnit.name}'.`
                )
            );
        }
    }
}

function collectBuildings() {
    const result = [];
    const names = new Set();

    for (const row of document.querySelectorAll(".building-row")) {
        const name =
            row.querySelector(".setup-building-name").value.trim();

        const address =
            row.querySelector(".setup-building-address").value.trim();

        if (!name) {
            showMessage(
                "Podaj nazwę budynku albo usuń pusty wiersz.",
                true
            );
            row.querySelector(".setup-building-name").focus();
            return null;
        }

        const normalizedName = normalize(name);

        if (names.has(normalizedName)) {
            showMessage(
                `Budynek „${name}” został dodany więcej niż raz.`,
                true
            );
            row.querySelector(".setup-building-name").focus();
            return null;
        }

        names.add(normalizedName);

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
            existingBuildings.map(item => [Number(item.id), item])
        );

    const existingByName =
        new Map(
            existingBuildings.map(item => [
                normalize(item.name),
                item
            ])
        );

    for (const building of buildings) {
        // Re-running setup must be idempotent. Prefer the persisted ID,
        // but if the UI row lost it for any reason, fall back to matching
        // an already existing building by normalized name.
        let existingBuilding = null;

        if (building.id) {
            existingBuilding =
                existingById.get(Number(building.id)) ?? null;
        }

        if (!existingBuilding) {
            existingBuilding =
                existingByName.get(normalize(building.name)) ?? null;
        }

        const buildingId =
            existingBuilding?.id ?? null;

        const isExisting =
            Boolean(buildingId);

        const url =
            isExisting
                ? `/api/buildings/${encodeURIComponent(buildingId)}?organizationId=${encodeURIComponent(organizationId)}`
                : `/api/buildings?organizationId=${encodeURIComponent(organizationId)}`;

        const response = await fetch(url, {
            method: isExisting ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: building.name,
                address: building.address,
                info: existingBuilding?.info ?? null
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
            existingById.delete(Number(buildingId));
            existingByName.delete(normalize(existingBuilding.name));
        }
    }

    // Existing buildings omitted from setup are intentionally preserved.
    // They may already contain rooms and setup must never silently destroy
    // previously configured data.
}

function setBusy(disabled) {
    for (const selector of [
        "#schoolName",
        "#schoolAddress",
        "#directorName",
        "#addBuildingRowButton",
        "#addSchoolUnitRowButton",
        "#saveAndContinueButton",
        "#skipSetupStepButton"
    ]) {
        const element =
            document.querySelector(selector);

        if (element) {
            element.disabled = disabled;
        }
    }

    for (const element of document.querySelectorAll(
        ".setup-building-name, .setup-building-address, .building-row-remove, " +
        ".setup-school-unit-name, .setup-school-unit-type, .school-unit-row-remove"
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
