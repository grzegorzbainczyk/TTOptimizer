document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("backToMainButton")
        ?.addEventListener("click", () => {
            window.location.href = "main.html";
        });

    document.getElementById("saveSchoolButton")
        ?.addEventListener("click", saveSchoolInformation);

    document.getElementById("reloadSchoolButton")
        ?.addEventListener("click", async () => {
            await Promise.all([
                loadSchoolInformation(),
                loadSchoolUnits()
            ]);
        });

    document.getElementById("addSchoolUnitButton")
        ?.addEventListener("click", openAddSchoolUnitForm);

    document.getElementById("saveSchoolUnitButton")
        ?.addEventListener("click", saveSchoolUnit);

    document.getElementById("cancelSchoolUnitButton")
        ?.addEventListener("click", closeSchoolUnitForm);

    await Promise.all([
        loadSchoolInformation(),
        loadSchoolUnits()
    ]);
});

let schoolUnits = [];

async function loadSchoolInformation() {
    setOrganizationFormDisabled(true);
    showOrganizationMessage("Ładowanie danych...", false);

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
                    `Nie udało się wczytać danych organizacji. Status: ${response.status}`
                )
            );
        }

        document.getElementById("schoolName").value =
            data?.name ?? "";

        document.getElementById("schoolAddress").value =
            data?.address ?? "";

        document.getElementById("directorName").value =
            data?.directorName ?? "";

        showOrganizationMessage("", false);
    } catch (error) {
        console.error("Error loading school information:", error);

        showOrganizationMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się wczytać danych organizacji.",
            true
        );
    } finally {
        setOrganizationFormDisabled(false);
    }
}

async function saveSchoolInformation() {
    const name =
        document.getElementById("schoolName").value.trim();

    const address =
        document.getElementById("schoolAddress").value.trim();

    const directorName =
        document.getElementById("directorName").value.trim();

    if (!name) {
        showOrganizationMessage(
            "Nazwa organizacji jest wymagana.",
            true
        );

        document.getElementById("schoolName").focus();
        return;
    }

    setOrganizationFormDisabled(true);
    showOrganizationMessage("Zapisywanie danych...", false);

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
                    `Nie udało się zapisać danych organizacji. Status: ${response.status}`
                )
            );
        }

        document.getElementById("schoolName").value =
            data?.name ?? "";

        document.getElementById("schoolAddress").value =
            data?.address ?? "";

        document.getElementById("directorName").value =
            data?.directorName ?? "";

        showOrganizationMessage(
            "Dane organizacji zostały zapisane.",
            false
        );
    } catch (error) {
        console.error("Error saving school information:", error);

        showOrganizationMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się zapisać danych organizacji.",
            true
        );
    } finally {
        setOrganizationFormDisabled(false);
    }
}

async function loadSchoolUnits() {
    const tbody =
        document.querySelector("#schoolUnitsTable tbody");

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3"
                    class="teachers-table-state">
                    Ładowanie szkół...
                </td>
            </tr>
        `;
    }

    try {
        const organizationId = requireOrganizationId();

        const response = await fetch(
            `/api/schoolunits?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się wczytać szkół. Status: ${response.status}`
                )
            );
        }

        schoolUnits = Array.isArray(data)
            ? data
            : data?.schoolUnits ?? [];

        renderSchoolUnits();
        updateSchoolUnitsCount();
        showSchoolUnitsMessage("", false);
    } catch (error) {
        console.error("Error loading school units:", error);

        schoolUnits = [];
        renderSchoolUnits();
        updateSchoolUnitsCount(null);

        showSchoolUnitsMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się wczytać szkół.",
            true
        );
    }
}

function renderSchoolUnits() {
    const tbody =
        document.querySelector("#schoolUnitsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (schoolUnits.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3"
                    class="teachers-table-state">
                    Nie dodano jeszcze żadnej szkoły.
                </td>
            </tr>
        `;
        return;
    }

    for (const schoolUnit of schoolUnits) {
        const row = document.createElement("tr");
        row.className = "teacher-row";

        row.appendChild(
            createTableCell(schoolUnit.name)
        );

        row.appendChild(
            createTableCell(
                formatSchoolType(schoolUnit.schoolType)
            )
        );

        const actionsCell =
            document.createElement("td");

        actionsCell.className =
            "table-actions-column";

        const actions =
            document.createElement("div");

        actions.className = "teacher-actions";

        const editButton =
            document.createElement("button");

        editButton.type = "button";
        editButton.className =
            "small-button teacher-action-button teacher-edit-button";
        editButton.textContent = "Edytuj";

        editButton.addEventListener("click", () => {
            openEditSchoolUnitForm(schoolUnit);
        });

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "small-button teacher-action-button teacher-delete-button";
        deleteButton.textContent = "Usuń";

        deleteButton.addEventListener("click", async () => {
            await deleteSchoolUnit(schoolUnit);
        });

        actions.append(
            editButton,
            deleteButton
        );

        actionsCell.appendChild(actions);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    }
}

function openAddSchoolUnitForm() {
    document.getElementById("schoolUnitFormTitle")
        .textContent = "Dodaj szkołę";

    document.getElementById("schoolUnitId").value = "";
    document.getElementById("schoolUnitName").value = "";
    document.getElementById("schoolUnitType").value = "";

    showSchoolUnitFormMessage("", false);

    document.getElementById("schoolUnitFormSection").hidden =
        false;

    document.getElementById("schoolUnitName").focus();
}

function openEditSchoolUnitForm(schoolUnit) {
    document.getElementById("schoolUnitFormTitle")
        .textContent = "Edytuj szkołę";

    document.getElementById("schoolUnitId").value =
        schoolUnit.id;

    document.getElementById("schoolUnitName").value =
        schoolUnit.name ?? "";

    document.getElementById("schoolUnitType").value =
        String(schoolUnit.schoolType ?? "");

    showSchoolUnitFormMessage("", false);

    document.getElementById("schoolUnitFormSection").hidden =
        false;

    document.getElementById("schoolUnitName").focus();
}

function closeSchoolUnitForm() {
    document.getElementById("schoolUnitFormSection").hidden =
        true;

    document.getElementById("schoolUnitId").value = "";
    document.getElementById("schoolUnitName").value = "";
    document.getElementById("schoolUnitType").value = "";

    showSchoolUnitFormMessage("", false);
}

async function saveSchoolUnit() {
    const id =
        Number(document.getElementById("schoolUnitId").value) || null;

    const name =
        document.getElementById("schoolUnitName").value.trim();

    const schoolType =
        Number(document.getElementById("schoolUnitType").value);

    if (!name) {
        showSchoolUnitFormMessage(
            "Nazwa szkoły jest wymagana.",
            true
        );

        document.getElementById("schoolUnitName").focus();
        return;
    }

    if (!schoolType) {
        showSchoolUnitFormMessage(
            "Wybierz typ szkoły.",
            true
        );

        document.getElementById("schoolUnitType").focus();
        return;
    }

    const saveButton =
        document.getElementById("saveSchoolUnitButton");

    saveButton.disabled = true;

    try {
        const organizationId = requireOrganizationId();

        const url = id
            ? `/api/schoolunits/${encodeURIComponent(id)}?organizationId=${encodeURIComponent(organizationId)}`
            : `/api/schoolunits?organizationId=${encodeURIComponent(organizationId)}`;

        const response = await fetch(
            url,
            {
                method: id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    schoolType
                })
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się zapisać szkoły. Status: ${response.status}`
                )
            );
        }

        closeSchoolUnitForm();
        await loadSchoolUnits();

        showSchoolUnitsMessage(
            id
                ? "Szkoła została zaktualizowana."
                : "Szkoła została dodana.",
            false
        );
    } catch (error) {
        console.error("Error saving school unit:", error);

        showSchoolUnitFormMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się zapisać szkoły.",
            true
        );
    } finally {
        saveButton.disabled = false;
    }
}

async function deleteSchoolUnit(schoolUnit) {
    const confirmed = window.confirm(
        `Usunąć szkołę „${schoolUnit.name}”?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const organizationId = requireOrganizationId();

        const response = await fetch(
            `/api/schoolunits/${encodeURIComponent(schoolUnit.id)}?organizationId=${encodeURIComponent(organizationId)}`,
            {
                method: "DELETE"
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się usunąć szkoły. Status: ${response.status}`
                )
            );
        }

        await loadSchoolUnits();

        showSchoolUnitsMessage(
            "Szkoła została usunięta.",
            false
        );
    } catch (error) {
        console.error("Error deleting school unit:", error);

        showSchoolUnitsMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się usunąć szkoły.",
            true
        );
    }
}

function formatSchoolType(schoolType) {
    switch (Number(schoolType)) {
        case 1:
            return "Szkoła podstawowa";
        case 2:
            return "Liceum ogólnokształcące";
        case 3:
            return "Technikum";
        case 4:
            return "Branżowa szkoła I stopnia";
        case 5:
            return "Branżowa szkoła II stopnia";
        default:
            return "Nieznany";
    }
}

function updateSchoolUnitsCount(count = schoolUnits.length) {
    const element =
        document.getElementById("schoolUnitsCount");

    if (!element) {
        return;
    }

    if (!Number.isInteger(count)) {
        element.textContent =
            "Nie udało się określić liczby szkół.";
        return;
    }

    if (count === 1) {
        element.textContent = "1 szkoła";
        return;
    }

    element.textContent =
        `${count} ${count >= 2 && count <= 4 ? "szkoły" : "szkół"}`;
}

function createTableCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value?.toString() ?? "";
    return cell;
}

function requireOrganizationId() {
    if (
        !window.appContext ||
        typeof window.appContext.requireOrganizationId !== "function"
    ) {
        throw new Error(
            "Kontekst organizacji nie jest dostępny."
        );
    }

    return window.appContext.requireOrganizationId();
}

function setOrganizationFormDisabled(disabled) {
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

function showOrganizationMessage(message, isError) {
    showMessage(
        "schoolFormMessage",
        message,
        isError
    );
}

function showSchoolUnitFormMessage(message, isError) {
    showMessage(
        "schoolUnitFormMessage",
        message,
        isError
    );
}

function showSchoolUnitsMessage(message, isError) {
    showMessage(
        "schoolUnitsMessage",
        message,
        isError
    );
}

function showMessage(elementId, message, isError) {
    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle(
        "form-message-error",
        Boolean(isError)
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
        return null;
    }
}

function getApiErrorMessage(data, fallback) {
    return data?.message ?? fallback;
}
