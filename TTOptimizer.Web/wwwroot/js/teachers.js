document.addEventListener("DOMContentLoaded", async () => {
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
                `Could not load teachers. Status: ${response.status}`
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
    } catch (error) {
        console.error("Error loading teachers:", error);

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
        const row = document.createElement("tr");

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

        const actionsCell = document.createElement("td");
        actionsCell.classList.add("table-actions-column");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "small-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            openEditTeacherForm(teacher);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "small-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            await deleteTeacher(teacher);
        });

        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });
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

    formTitle.textContent = "Add teacher";
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

    formTitle.textContent = "Edit teacher";
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
            "Teacher name is required.",
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
                    `Could not save teacher. Status: ${response.status}`
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
                    `Could not delete teacher. Status: ${response.status}`
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