document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("backToMainButton")?.addEventListener("click", () => {
        window.location.href = "main.html";
    });

    document.getElementById("refreshBuildingsButton")?.addEventListener("click", loadBuildings);
    document.getElementById("addBuildingButton")?.addEventListener("click", openAddForm);
    document.getElementById("saveBuildingButton")?.addEventListener("click", saveBuilding);
    document.getElementById("cancelBuildingButton")?.addEventListener("click", closeForm);

    await loadBuildings();
});

async function loadBuildings() {
    const tbody = document.querySelector("#buildingsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="teachers-table-state">Loading buildings...</td></tr>`;

    try {
        const organizationId = window.appContext.requireOrganizationId();
        const response = await fetch(`/api/buildings?organizationId=${encodeURIComponent(organizationId)}`);
        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(getApiErrorMessage(data, `Could not load buildings. Status: ${response.status}`));
        }

        const buildings = Array.isArray(data) ? data : data?.buildings ?? [];
        renderBuildings(buildings);
        updateCount(buildings.length);
    } catch (error) {
        console.error("Error loading buildings:", error);
        updateCount(null);
        tbody.innerHTML = `<tr><td colspan="5" class="teachers-table-state"></td></tr>`;
        tbody.querySelector("td").textContent = error instanceof Error ? error.message : "Could not load buildings.";
    }
}

function renderBuildings(buildings) {
    const tbody = document.querySelector("#buildingsTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!Array.isArray(buildings) || buildings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="teachers-table-state">No buildings found.</td></tr>`;
        return;
    }

    for (const building of buildings) {
        const row = document.createElement("tr");
        row.className = "teacher-row";
        row.appendChild(createCell(building.name));
        row.appendChild(createCell(building.address ?? ""));
        row.appendChild(createCell(building.roomCount ?? 0));
        row.appendChild(createCell(building.info ?? ""));

        const actionsCell = document.createElement("td");
        actionsCell.className = "table-actions-column";
        const actions = document.createElement("div");
        actions.className = "teacher-actions";

        const editButton = createActionButton("Edit", "teacher-edit-button", () => openEditForm(building));
        const deleteButton = createActionButton("Delete", "teacher-delete-button", () => deleteBuilding(building));
        actions.append(editButton, deleteButton);
        actionsCell.appendChild(actions);
        row.appendChild(actionsCell);
        tbody.appendChild(row);
    }
}

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = String(value ?? "");
    return cell;
}

function createActionButton(text, extraClass, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `small-button teacher-action-button ${extraClass}`;
    button.textContent = text;
    button.addEventListener("click", handler);
    return button;
}

function openAddForm() {
    document.getElementById("buildingId").value = "";
    document.getElementById("buildingName").value = "";
    document.getElementById("buildingAddress").value = "";
    document.getElementById("buildingInfo").value = "";
    document.getElementById("buildingFormTitle").textContent = "Add building";
    clearMessage();
    document.getElementById("buildingFormSection").hidden = false;
    document.getElementById("buildingName").focus();
}

function openEditForm(building) {
    document.getElementById("buildingId").value = building.id;
    document.getElementById("buildingName").value = building.name ?? "";
    document.getElementById("buildingAddress").value = building.address ?? "";
    document.getElementById("buildingInfo").value = building.info ?? "";
    document.getElementById("buildingFormTitle").textContent = "Edit building";
    clearMessage();
    document.getElementById("buildingFormSection").hidden = false;
    document.getElementById("buildingName").focus();
}

function closeForm() {
    document.getElementById("buildingFormSection").hidden = true;
    clearMessage();
}

async function saveBuilding() {
    const id = document.getElementById("buildingId").value;
    const name = document.getElementById("buildingName").value.trim();
    const address = document.getElementById("buildingAddress").value.trim();
    const info = document.getElementById("buildingInfo").value.trim();

    if (!name) {
        showMessage("Building name is required.", true);
        return;
    }

    const organizationId = window.appContext.requireOrganizationId();
    const url = id
        ? `/api/buildings/${encodeURIComponent(id)}?organizationId=${encodeURIComponent(organizationId)}`
        : `/api/buildings?organizationId=${encodeURIComponent(organizationId)}`;

    try {
        const response = await fetch(url, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, address: address || null, info: info || null })
        });

        const data = await readJsonResponse(response);
        if (!response.ok) {
            throw new Error(getApiErrorMessage(data, `Could not save building. Status: ${response.status}`));
        }

        closeForm();
        await loadBuildings();
    } catch (error) {
        console.error("Error saving building:", error);
        showMessage(error instanceof Error ? error.message : "Could not save building.", true);
    }
}

async function deleteBuilding(building) {
    if (!confirm(`Delete building '${building.name}'?`)) return;

    try {
        const organizationId = window.appContext.requireOrganizationId();
        const response = await fetch(
            `/api/buildings/${encodeURIComponent(building.id)}?organizationId=${encodeURIComponent(organizationId)}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            const data = await readJsonResponse(response);
            throw new Error(getApiErrorMessage(data, `Could not delete building. Status: ${response.status}`));
        }

        await loadBuildings();
    } catch (error) {
        console.error("Error deleting building:", error);
        alert(error instanceof Error ? error.message : "Could not delete building.");
    }
}

function updateCount(count) {
    const element = document.getElementById("buildingsCount");
    if (!element) return;
    if (!Number.isInteger(count)) {
        element.textContent = "Could not determine the number of buildings.";
        return;
    }
    element.textContent = count === 1 ? "1 building" : `${count} buildings`;
}

function showMessage(message, isError) {
    const element = document.getElementById("buildingFormMessage");
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("error-message", isError);
}

function clearMessage() {
    const element = document.getElementById("buildingFormMessage");
    if (!element) return;
    element.textContent = "";
    element.classList.remove("error-message");
}

async function readJsonResponse(response) {
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); }
    catch { return { message: text }; }
}

function getApiErrorMessage(data, fallbackMessage) {
    if (typeof data?.message === "string") return data.message;
    if (data?.errors) {
        const messages = Object.values(data.errors).flat().filter(item => typeof item === "string");
        if (messages.length > 0) return messages.join(" ");
    }
    return fallbackMessage;
}
