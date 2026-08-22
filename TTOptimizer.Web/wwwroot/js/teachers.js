import { initializeI18n, t } from "./i18n.js";
let currentTeacherImportRows = [];

document.addEventListener("DOMContentLoaded", async () => {
    await initializeI18n();
    document.title = t("teachers.pageTitle", "ClassFlow - Teachers");
    const backToMainButton =
        document.getElementById("backToMainButton");

    const refreshTeachersButton =
        document.getElementById("refreshTeachersButton");

    const addTeacherButton =
        document.getElementById("addTeacherButton");

    const saveTeacherButton =
        document.getElementById("saveTeacherButton");

    const cancelTeacherButton =
        document.getElementById("cancelTeacherButton");

    const importTeachersButton =
        document.getElementById("importTeachersButton");

    const teacherImportFileInput =
        document.getElementById("teacherImportFileInput");

    const closeTeacherImportPreviewButton =
        document.getElementById("closeTeacherImportPreviewButton");

    const confirmTeacherImportButton =
        document.getElementById("confirmTeacherImportButton");


    backToMainButton?.addEventListener("click", () => {
        window.location.href = "main.html";
    });

    refreshTeachersButton?.addEventListener(
        "click",
        loadTeachers
    );

    addTeacherButton?.addEventListener(
        "click",
        openAddTeacherForm
    );

    saveTeacherButton?.addEventListener(
        "click",
        saveTeacher
    );

    cancelTeacherButton?.addEventListener(
        "click",
        closeTeacherForm
    );

    importTeachersButton?.addEventListener(
        "click",
        () => teacherImportFileInput?.click()
    );

    teacherImportFileInput?.addEventListener(
        "change",
        handleTeacherImportFileSelected
    );

    closeTeacherImportPreviewButton?.addEventListener(
        "click",
        closeTeacherImportPreview
    );

    confirmTeacherImportButton?.addEventListener(
        "click",
        confirmTeacherImport
    );


    await loadTeachers();
});

async function loadTeachers() {
    const tbody =
        document.querySelector("#teachersTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="5">Loading teachers...</td>
        </tr>
    `;

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/teachers?organizationId=${encodeURIComponent(
                organizationId
            )}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                data?.message ??
                `${t("teachers.loadFailed", "Could not load teachers.")} Status: ${response.status}`
            );
        }

        /*
         * Obsługuje zarówno:
         * { success: true, teachers: [...] }
         *
         * jak i starszy wariant:
         * [...]
         */
        const teachers = Array.isArray(data)
            ? data
            : data?.teachers ?? [];

        renderTeachers(teachers);
        updateTeachersCount(teachers.length);
    } catch (error) {
        console.error("Error loading teachers:", error);

        updateTeachersCount(null);

        showTeachersError(
            error instanceof Error
                ? error.message
                : "Could not load teachers."
        );
    }
}
function renderTeachers(teachers) {
    const tbody =
        document.querySelector("#teachersTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!Array.isArray(teachers) || teachers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">No teachers found.</td>
            </tr>
        `;

        return;
    }

    teachers.forEach(teacher => {
        const row =
            document.createElement("tr");

        row.className = "teacher-row";

        row.appendChild(
            createTableCell(teacher.teacherNumber)
        );

        row.appendChild(
            createTableCell(teacher.name)
        );

        row.appendChild(
            createTableCell(teacher.alias)
        );

        row.appendChild(
            createTableCell(teacher.info ?? "")
        );

        const actionsCell =
            document.createElement("td");

        actionsCell.classList.add(
            "table-actions-column"
        );

        const editButton =
            document.createElement("button");

        editButton.type = "button";
        editButton.className = "small-button teacher-action-button teacher-edit-button";
        editButton.textContent = t("common.edit", "Edit");

        editButton.addEventListener("click", () => {
            openEditTeacherForm(teacher);
        });

        const availabilityButton =
            document.createElement("button");

        availabilityButton.type = "button";
        availabilityButton.className = "small-button teacher-action-button teacher-availability-button";
        availabilityButton.textContent = t("common.availability", "Availability");

        availabilityButton.addEventListener("click", () => {
            const url =
                "availability.html" +
                "?resourceType=teacher" +
                `&resourceId=${encodeURIComponent(teacher.id)}`;

            window.location.href = url;
        });

        const preferencesButton =
            document.createElement("button");

        preferencesButton.type = "button";
        preferencesButton.className = "small-button teacher-action-button teacher-preferences-button";
        preferencesButton.textContent = t("common.preferences", "Preferences");

        preferencesButton.addEventListener("click", () => {
            const url =
                "teacher-preferences.html" +
                `?teacherId=${encodeURIComponent(teacher.id)}` +
                `&teacherName=${encodeURIComponent(teacher.name ?? "")}`;

            window.location.href = url;
        });

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "small-button teacher-action-button teacher-delete-button";
        deleteButton.textContent = t("common.delete", "Delete");

        deleteButton.addEventListener("click", async () => {
            await deleteTeacher(teacher);
        });

        const actionsContainer =
            document.createElement("div");

        actionsContainer.className = "teacher-actions";

        actionsContainer.append(
            editButton,
            availabilityButton,
            preferencesButton,
            deleteButton
        );

        actionsCell.appendChild(actionsContainer);

        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });
}

function updateTeachersCount(count) {
    const element = document.getElementById("teachersCount");

    if (!element) {
        return;
    }

    if (!Number.isInteger(count)) {
        element.textContent = t("teachers.countUnknown", "Could not determine the number of teachers.");
        return;
    }

    element.textContent = count === 1
        ? t("teachers.countOne", "1 teacher")
        : t("teachers.countMany", "{count} teachers").replace("{count}", count);
}

function createTableCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value?.toString() ?? "";
    return cell;
}

function openAddTeacherForm() {
    const formSection =
        document.getElementById("teacherFormSection");

    const formTitle =
        document.getElementById("teacherFormTitle");

    const teacherId =
        document.getElementById("teacherId");

    const teacherNumber =
        document.getElementById("teacherNumber");

    const teacherName =
        document.getElementById("teacherName");

    const teacherAlias =
        document.getElementById("teacherAlias");

    const teacherInfo =
        document.getElementById("teacherInfo");

    clearTeacherFormMessage();

    teacherId.value = "";
    teacherNumber.value = "";
    teacherName.value = "";
    teacherAlias.value = "";
    teacherInfo.value = "";

    formTitle.textContent = t("teachers.add", "Add teacher");
    formSection.hidden = false;

    teacherName.focus();
}

function openEditTeacherForm(teacher) {
    const formSection =
        document.getElementById("teacherFormSection");

    const formTitle =
        document.getElementById("teacherFormTitle");

    const teacherId =
        document.getElementById("teacherId");

    const teacherNumber =
        document.getElementById("teacherNumber");

    const teacherName =
        document.getElementById("teacherName");

    const teacherAlias =
        document.getElementById("teacherAlias");

    const teacherInfo =
        document.getElementById("teacherInfo");

    clearTeacherFormMessage();

    teacherId.value = teacher.id;
    teacherNumber.value = teacher.teacherNumber;
    teacherName.value = teacher.name ?? "";
    teacherAlias.value = teacher.alias ?? "";
    teacherInfo.value = teacher.info ?? "";

    formTitle.textContent = t("teachers.edit", "Edit teacher");
    formSection.hidden = false;

    teacherName.focus();
}

function closeTeacherForm() {
    const formSection =
        document.getElementById("teacherFormSection");

    if (formSection) {
        formSection.hidden = true;
    }

    clearTeacherFormMessage();
}

async function saveTeacher() {
    const teacherId =
        document.getElementById("teacherId").value;

    const name =
        document.getElementById("teacherName").value.trim();

    const alias =
        document.getElementById("teacherAlias").value.trim();

    const info =
        document.getElementById("teacherInfo").value.trim();

    if (!name) {
        showTeacherFormMessage(
            t("teachers.nameRequired", "Teacher name is required."),
            true
        );

        return;
    }

    const isEditing = teacherId !== "";

    if (isEditing && !alias) {
        showTeacherFormMessage(
            "Teacher alias is required when editing.",
            true
        );

        return;
    }

    const requestBody = {
        name,
        alias: alias || null,
        info: info || null
    };

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const url = isEditing
            ? `/api/teachers/${encodeURIComponent(
                teacherId
            )}?organizationId=${encodeURIComponent(
                organizationId
            )}`
            : `/api/teachers?organizationId=${encodeURIComponent(
                organizationId
            )}`;

        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `${t("teachers.saveFailed", "Could not save teacher.")} Status: ${response.status}`
                )
            );
        }

        closeTeacherForm();
        await loadTeachers();
    } catch (error) {
        console.error("Error saving teacher:", error);

        showTeacherFormMessage(
            error instanceof Error
                ? error.message
                : "Could not save teacher.",
            true
        );
    }
}

async function deleteTeacher(teacher) {
    const confirmed = window.confirm(
        `Delete teacher #${teacher.teacherNumber} ` +
        `${teacher.name} (${teacher.alias})?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/teachers/${encodeURIComponent(
                teacher.id
            )}?organizationId=${encodeURIComponent(
                organizationId
            )}`,
            {
                method: "DELETE"
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `${t("teachers.deleteFailed", "Could not delete teacher.")} Status: ${response.status}`
                )
            );
        }

        await loadTeachers();
    } catch (error) {
        console.error("Error deleting teacher:", error);

        window.alert(
            error instanceof Error
                ? error.message
                : "Could not delete teacher."
        );
    }
}

function showTeachersError(message) {
    const tbody =
        document.querySelector("#teachersTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = message;

    row.appendChild(cell);
    tbody.appendChild(row);
}

function showTeacherFormMessage(message, isError) {
    const messageElement =
        document.getElementById("teacherFormMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.classList.toggle(
        "error-message",
        isError
    );
}

function clearTeacherFormMessage() {
    const messageElement =
        document.getElementById("teacherFormMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";
    messageElement.classList.remove("error-message");
}


async function handleTeacherImportFileSelected(event) {
    const input = event.target;
    const file = input?.files?.[0];

    if (!file) {
        return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
        window.alert(t("teachers.selectXlsx", "Please select an XLSX file."));
        input.value = "";
        return;
    }

    try {
        showTeacherImportMessage(
            `Reading ${file.name}...`,
            false
        );

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            "/api/teachers/import/preview",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                data?.message ??
                `${t("teachers.importReadFailed", "Could not read XLSX file.")} Status: ${response.status}`
            );
        }

        const rows = Array.isArray(data?.rows)
            ? data.rows
            : [];

        currentTeacherImportRows = rows;

        renderTeacherImportPreview(rows);
        updateConfirmTeacherImportButton();

        showTeacherImportMessage(
            `${rows.length} row(s) read from the file.`,
            false
        );
    } catch (error) {
        console.error(
            "Error reading teacher import file:",
            error
        );

        currentTeacherImportRows = [];
        renderTeacherImportPreview([]);
        updateConfirmTeacherImportButton();

        showTeacherImportMessage(
            error instanceof Error
                ? error.message
                : t("teachers.importReadFailed", "Could not read XLSX file."),
            true
        );
    } finally {
        input.value = "";
    }
}

function renderTeacherImportPreview(rows) {
    const previewSection =
        document.getElementById("teacherImportPreviewSection");

    const tbody =
        document.querySelector(
            "#teacherImportPreviewTable tbody"
        );

    if (!previewSection || !tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!Array.isArray(rows) || rows.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.textContent = t("teachers.importNoRows", "No teacher rows found.");

        row.appendChild(cell);
        tbody.appendChild(row);

        previewSection.hidden = false;
        return;
    }

    for (const item of rows) {
        const row = document.createElement("tr");

        row.appendChild(
            createTableCell(item.rowNumber)
        );

        row.appendChild(
            createTableCell(item.name ?? "")
        );

        const statusText = item.isValid
            ? "OK"
            : item.message || "Invalid row";

        const statusCell =
            createTableCell(statusText);

        if (!item.isValid) {
            statusCell.classList.add("error-message");
        }

        row.appendChild(statusCell);
        tbody.appendChild(row);
    }

    previewSection.hidden = false;
}

function closeTeacherImportPreview() {
    const previewSection =
        document.getElementById("teacherImportPreviewSection");

    if (previewSection) {
        previewSection.hidden = true;
    }

    currentTeacherImportRows = [];
    updateConfirmTeacherImportButton();
    clearTeacherImportMessage();
}


function updateConfirmTeacherImportButton() {
    const button =
        document.getElementById("confirmTeacherImportButton");

    if (!button) {
        return;
    }

    const validRows = currentTeacherImportRows.filter(
        row => row?.isValid === true
    );

    button.disabled = validRows.length === 0;
}

async function confirmTeacherImport() {
    const validRows = currentTeacherImportRows.filter(
        row =>
            row?.isValid === true &&
            typeof row?.name === "string" &&
            row.name.trim() !== ""
    );

    if (validRows.length === 0) {
        showTeacherImportMessage(
            "There are no valid teachers to import.",
            true
        );
        return;
    }

    const confirmed = window.confirm(
        `Import ${validRows.length} teacher(s) into ClassFlow?`
    );

    if (!confirmed) {
        return;
    }

    const button =
        document.getElementById("confirmTeacherImportButton");

    if (button) {
        button.disabled = true;
    }

    try {
        showTeacherImportMessage(
            "Importing teachers...",
            false
        );

        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/teachers/import?organizationId=${encodeURIComponent(
                organizationId
            )}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    names: validRows.map(
                        row => row.name.trim()
                    )
                })
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                data?.message ??
                `${t("teachers.importFailed", "Could not import teachers.")} Status: ${response.status}`
            );
        }

        const importedCount =
            Number(data?.importedCount ?? 0);

        const skippedExistingCount =
            Number(data?.skippedExistingCount ?? 0);

        let message =
            `Imported ${importedCount} teacher(s).`;

        if (skippedExistingCount > 0) {
            message +=
                ` ${skippedExistingCount} existing teacher(s) were skipped.`;
        }

        showTeacherImportMessage(
            message,
            false
        );

        currentTeacherImportRows = [];
        updateConfirmTeacherImportButton();

        await loadTeachers();
    } catch (error) {
        console.error(
            "Error importing teachers:",
            error
        );

        showTeacherImportMessage(
            error instanceof Error
                ? error.message
                : t("teachers.importFailed", "Could not import teachers."),
            true
        );

        updateConfirmTeacherImportButton();
    }
}

function showTeacherImportMessage(message, isError) {
    const element =
        document.getElementById("teacherImportMessage");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle(
        "error-message",
        isError
    );
}

function clearTeacherImportMessage() {
    const element =
        document.getElementById("teacherImportMessage");

    if (!element) {
        return;
    }

    element.textContent = "";
    element.classList.remove("error-message");
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

function getApiErrorMessage(data, fallbackMessage) {
    if (typeof data?.message === "string") {
        return data.message;
    }

    /*
     * Obsługa automatycznej walidacji ASP.NET Core:
     *
     * {
     *   errors: {
     *     Name: ["The Name field is required."]
     *   }
     * }
     */
    if (data?.errors) {
        const validationMessages =
            Object.values(data.errors)
                .flat()
                .filter(message =>
                    typeof message === "string"
                );

        if (validationMessages.length > 0) {
            return validationMessages.join(" ");
        }
    }

    return fallbackMessage;
}