document.addEventListener("DOMContentLoaded", async () => {
    const backToMainButton =
        document.getElementById("backToMainButton");

    const refreshSubjectsButton =
        document.getElementById("refreshSubjectsButton");

    const addSubjectButton =
        document.getElementById("addSubjectButton");

    const saveSubjectButton =
        document.getElementById("saveSubjectButton");

    const cancelSubjectButton =
        document.getElementById("cancelSubjectButton");

    backToMainButton?.addEventListener("click", () => {
        window.location.href = "main.html";
    });

    refreshSubjectsButton?.addEventListener(
        "click",
        loadSubjects
    );

    addSubjectButton?.addEventListener(
        "click",
        openAddSubjectForm
    );

    saveSubjectButton?.addEventListener(
        "click",
        saveSubject
    );

    cancelSubjectButton?.addEventListener(
        "click",
        closeSubjectForm
    );

    await loadSubjects();
});

async function loadSubjects() {
    const tbody =
        document.querySelector("#subjectsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="3">
                Loading subjects...
            </td>
        </tr>
    `;

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/subjects?organizationId=${encodeURIComponent(
                organizationId
            )}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not load subjects. Status: ${response.status}`
                )
            );
        }

        const subjects = Array.isArray(data)
            ? data
            : data?.subjects ?? [];

        renderSubjects(subjects);
    } catch (error) {
        console.error(
            "Error loading subjects:",
            error
        );

        showSubjectsError(
            error instanceof Error
                ? error.message
                : "Could not load subjects."
        );
    }
}

function renderSubjects(subjects) {
    const tbody =
        document.querySelector("#subjectsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (
        !Array.isArray(subjects) ||
        subjects.length === 0
    ) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3">
                    No subjects found.
                </td>
            </tr>
        `;

        return;
    }

    subjects.forEach(subject => {
        const row = document.createElement("tr");

        row.appendChild(
            createTableCell(subject.name)
        );

        row.appendChild(
            createTableCell(subject.info ?? "")
        );

        const actionsCell =
            document.createElement("td");

        actionsCell.classList.add(
            "table-actions-column"
        );

        const editButton =
            document.createElement("button");

        editButton.type = "button";
        editButton.className = "small-button";
        editButton.textContent = "Edit";

        editButton.addEventListener(
            "click",
            () => {
                openEditSubjectForm(subject);
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "small-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener(
            "click",
            async () => {
                await deleteSubject(subject);
            }
        );

        actionsCell.append(
            editButton,
            deleteButton
        );

        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });
}

function createTableCell(value) {
    const cell = document.createElement("td");

    cell.textContent =
        value?.toString() ?? "";

    return cell;
}

function openAddSubjectForm() {
    document.getElementById(
        "subjectId"
    ).value = "";

    document.getElementById(
        "subjectName"
    ).value = "";

    document.getElementById(
        "subjectInfo"
    ).value = "";

    clearSubjectFormMessage();

    document.getElementById(
        "subjectFormTitle"
    ).textContent = "Add subject";

    document.getElementById(
        "subjectFormSection"
    ).hidden = false;

    document.getElementById(
        "subjectName"
    ).focus();
}

function openEditSubjectForm(subject) {
    document.getElementById(
        "subjectId"
    ).value = subject.id;

    document.getElementById(
        "subjectName"
    ).value = subject.name ?? "";

    document.getElementById(
        "subjectInfo"
    ).value = subject.info ?? "";

    clearSubjectFormMessage();

    document.getElementById(
        "subjectFormTitle"
    ).textContent = "Edit subject";

    document.getElementById(
        "subjectFormSection"
    ).hidden = false;

    document.getElementById(
        "subjectName"
    ).focus();
}

function closeSubjectForm() {
    const formSection =
        document.getElementById(
            "subjectFormSection"
        );

    if (formSection) {
        formSection.hidden = true;
    }

    clearSubjectFormMessage();
}

async function saveSubject() {
    const subjectId =
        document.getElementById(
            "subjectId"
        ).value;

    const name =
        document.getElementById(
            "subjectName"
        ).value.trim();

    const info =
        document.getElementById(
            "subjectInfo"
        ).value.trim();

    if (!name) {
        showSubjectFormMessage(
            "Subject name is required.",
            true
        );

        return;
    }

    const requestBody = {
        name,
        info: info || null
    };

    const isEditing =
        subjectId !== "";

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const url = isEditing
            ? `/api/subjects/${encodeURIComponent(
                subjectId
            )}?organizationId=${encodeURIComponent(
                organizationId
            )}`
            : `/api/subjects?organizationId=${encodeURIComponent(
                organizationId
            )}`;

        const response = await fetch(url, {
            method: isEditing
                ? "PUT"
                : "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(requestBody)
        });

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not save subject. Status: ${response.status}`
                )
            );
        }

        closeSubjectForm();
        await loadSubjects();
    } catch (error) {
        console.error(
            "Error saving subject:",
            error
        );

        showSubjectFormMessage(
            error instanceof Error
                ? error.message
                : "Could not save subject.",
            true
        );
    }
}

async function deleteSubject(subject) {
    const confirmed = window.confirm(
        `Delete subject ${subject.name}?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/subjects/${encodeURIComponent(
                subject.id
            )}?organizationId=${encodeURIComponent(
                organizationId
            )}`,
            {
                method: "DELETE"
            }
        );

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not delete subject. Status: ${response.status}`
                )
            );
        }

        await loadSubjects();
    } catch (error) {
        console.error(
            "Error deleting subject:",
            error
        );

        window.alert(
            error instanceof Error
                ? error.message
                : "Could not delete subject."
        );
    }
}

function showSubjectsError(message) {
    const tbody =
        document.querySelector(
            "#subjectsTable tbody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    const row =
        document.createElement("tr");

    const cell =
        document.createElement("td");

    cell.colSpan = 3;
    cell.textContent = message;

    row.appendChild(cell);
    tbody.appendChild(row);
}

function showSubjectFormMessage(
    message,
    isError
) {
    const messageElement =
        document.getElementById(
            "subjectFormMessage"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;

    messageElement.classList.toggle(
        "error-message",
        isError
    );
}

function clearSubjectFormMessage() {
    const messageElement =
        document.getElementById(
            "subjectFormMessage"
        );

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

function getApiErrorMessage(
    data,
    fallbackMessage
) {
    if (
        typeof data?.message === "string"
    ) {
        return data.message;
    }

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