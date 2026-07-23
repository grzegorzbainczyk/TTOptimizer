let availableTeachers = [];
let availableClasses = [];
let availableSubjects = [];

document.addEventListener("DOMContentLoaded", async () => {
    const backToMainButton =
        document.getElementById("backToMainButton");

    const refreshRequirementsButton =
        document.getElementById("refreshRequirementsButton");

    const addRequirementButton =
        document.getElementById("addRequirementButton");

    const saveRequirementButton =
        document.getElementById("saveRequirementButton");

    const cancelRequirementButton =
        document.getElementById("cancelRequirementButton");

    backToMainButton?.addEventListener("click", () => {
        window.location.href = "main.html";
    });

    refreshRequirementsButton?.addEventListener(
        "click",
        refreshPageData
    );

    addRequirementButton?.addEventListener(
        "click",
        openAddRequirementForm
    );

    saveRequirementButton?.addEventListener(
        "click",
        saveRequirement
    );

    cancelRequirementButton?.addEventListener(
        "click",
        closeRequirementForm
    );

    await refreshPageData();
});

async function refreshPageData() {
    await Promise.all([
        loadTeachers(),
        loadClasses(),
        loadSubjects()
    ]);

    await loadRequirements();
}

async function loadTeachers() {
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
                getApiErrorMessage(
                    data,
                    `Could not load teachers. Status: ${response.status}`
                )
            );
        }

        availableTeachers = Array.isArray(data)
            ? data
            : data?.teachers ?? [];

        populateTeacherOptions();
    } catch (error) {
        console.error("Error loading teachers:", error);

        availableTeachers = [];
        populateTeacherOptions();
    }
}

async function loadClasses() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/classes?organizationId=${encodeURIComponent(
                organizationId
            )}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not load classes. Status: ${response.status}`
                )
            );
        }

        availableClasses = Array.isArray(data)
            ? data
            : data?.classes ??
            data?.classGroups ??
            [];

        populateClassOptions();
    } catch (error) {
        console.error("Error loading classes:", error);

        availableClasses = [];
        populateClassOptions();
    }
}

async function loadSubjects() {
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

        availableSubjects = Array.isArray(data)
            ? data
            : data?.subjects ?? [];

        populateSubjectOptions();
    } catch (error) {
        console.error("Error loading subjects:", error);

        availableSubjects = [];
        populateSubjectOptions();
    }
}

async function loadRequirements() {
    const tbody =
        document.querySelector("#requirementsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="5">
                Loading requirements...
            </td>
        </tr>
    `;

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/requirements?organizationId=${encodeURIComponent(
                organizationId
            )}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not load requirements. Status: ${response.status}`
                )
            );
        }

        const requirements = Array.isArray(data)
            ? data
            : data?.requirements ?? [];

        renderRequirements(requirements);
    } catch (error) {
        console.error(
            "Error loading requirements:",
            error
        );

        showRequirementsError(
            error instanceof Error
                ? error.message
                : "Could not load requirements."
        );
    }
}

function renderRequirements(requirements) {
    const tbody =
        document.querySelector("#requirementsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (
        !Array.isArray(requirements) ||
        requirements.length === 0
    ) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    No requirements found.
                </td>
            </tr>
        `;

        return;
    }

    requirements.forEach(requirement => {
        const row = document.createElement("tr");

        row.appendChild(
            createTableCell(requirement.className)
        );

        row.appendChild(
            createTableCell(requirement.subjectName)
        );

        row.appendChild(
            createTableCell(requirement.teacherName)
        );

        row.appendChild(
            createTableCell(requirement.hoursPerWeek)
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

        editButton.addEventListener("click", () => {
            openEditRequirementForm(requirement);
        });

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "small-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener(
            "click",
            async () => {
                await deleteRequirement(requirement);
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

function populateTeacherOptions() {
    const select =
        document.getElementById(
            "requirementTeacherId"
        );

    if (!select) {
        return;
    }

    const selectedValue = select.value;

    select.innerHTML = "";

    const emptyOption =
        document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent = "Select teacher";

    select.appendChild(emptyOption);

    availableTeachers.forEach(teacher => {
        const option =
            document.createElement("option");

        option.value = teacher.id;

        option.textContent =
            teacher.alias
                ? `${teacher.name} (${teacher.alias})`
                : teacher.name;

        select.appendChild(option);
    });

    select.value = selectedValue;
}

function populateClassOptions() {
    const select =
        document.getElementById(
            "requirementClassGroupId"
        );

    if (!select) {
        return;
    }

    const selectedValue = select.value;

    select.innerHTML = "";

    const emptyOption =
        document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent = "Select class";

    select.appendChild(emptyOption);

    availableClasses.forEach(classGroup => {
        const option =
            document.createElement("option");

        option.value = classGroup.id;
        option.textContent = classGroup.name;

        select.appendChild(option);
    });

    select.value = selectedValue;
}

function populateSubjectOptions() {
    const select =
        document.getElementById(
            "requirementSubjectId"
        );

    if (!select) {
        return;
    }

    const selectedValue = select.value;

    select.innerHTML = "";

    const emptyOption =
        document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent = "Select subject";

    select.appendChild(emptyOption);

    availableSubjects.forEach(subject => {
        const option =
            document.createElement("option");

        option.value = subject.id;
        option.textContent = subject.name;

        select.appendChild(option);
    });

    select.value = selectedValue;
}

function openAddRequirementForm() {
    document.getElementById(
        "requirementId"
    ).value = "";

    document.getElementById(
        "requirementClassGroupId"
    ).value = "";

    document.getElementById(
        "requirementSubjectId"
    ).value = "";

    document.getElementById(
        "requirementTeacherId"
    ).value = "";

    document.getElementById(
        "requirementHoursPerWeek"
    ).value = "1";

    clearRequirementFormMessage();

    document.getElementById(
        "requirementFormTitle"
    ).textContent = "Add requirement";

    document.getElementById(
        "requirementFormSection"
    ).hidden = false;

    document.getElementById(
        "requirementClassGroupId"
    ).focus();
}

function openEditRequirementForm(requirement) {
    document.getElementById(
        "requirementId"
    ).value = requirement.id;

    document.getElementById(
        "requirementClassGroupId"
    ).value =
        requirement.classGroupId?.toString() ?? "";

    document.getElementById(
        "requirementSubjectId"
    ).value =
        requirement.subjectId?.toString() ?? "";

    document.getElementById(
        "requirementTeacherId"
    ).value =
        requirement.teacherId?.toString() ?? "";

    document.getElementById(
        "requirementHoursPerWeek"
    ).value =
        requirement.hoursPerWeek ?? 1;

    clearRequirementFormMessage();

    document.getElementById(
        "requirementFormTitle"
    ).textContent = "Edit requirement";

    document.getElementById(
        "requirementFormSection"
    ).hidden = false;

    document.getElementById(
        "requirementClassGroupId"
    ).focus();
}

function closeRequirementForm() {
    const formSection =
        document.getElementById(
            "requirementFormSection"
        );

    if (formSection) {
        formSection.hidden = true;
    }

    clearRequirementFormMessage();
}

async function saveRequirement() {
    const requirementId =
        document.getElementById(
            "requirementId"
        ).value;

    const classGroupId =
        Number(
            document.getElementById(
                "requirementClassGroupId"
            ).value
        );

    const subjectId =
        Number(
            document.getElementById(
                "requirementSubjectId"
            ).value
        );

    const teacherId =
        Number(
            document.getElementById(
                "requirementTeacherId"
            ).value
        );

    const hoursPerWeek =
        Number(
            document.getElementById(
                "requirementHoursPerWeek"
            ).value
        );

    if (classGroupId <= 0) {
        showRequirementFormMessage(
            "Class is required.",
            true
        );

        return;
    }

    if (subjectId <= 0) {
        showRequirementFormMessage(
            "Subject is required.",
            true
        );

        return;
    }

    if (teacherId <= 0) {
        showRequirementFormMessage(
            "Teacher is required.",
            true
        );

        return;
    }

    if (
        !Number.isInteger(hoursPerWeek) ||
        hoursPerWeek < 1 ||
        hoursPerWeek > 40
    ) {
        showRequirementFormMessage(
            "Hours per week must be between 1 and 40.",
            true
        );

        return;
    }

    const requestBody = {
        teacherId,
        classGroupId,
        subjectId,
        hoursPerWeek
    };

    const isEditing =
        requirementId !== "";

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const url = isEditing
            ? `/api/requirements/${encodeURIComponent(
                requirementId
            )}?organizationId=${encodeURIComponent(
                organizationId
            )}`
            : `/api/requirements?organizationId=${encodeURIComponent(
                organizationId
            )}`;

        const response = await fetch(url, {
            method: isEditing
                ? "PUT"
                : "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(requestBody)
        });

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not save requirement. Status: ${response.status}`
                )
            );
        }

        closeRequirementForm();
        await loadRequirements();
    } catch (error) {
        console.error(
            "Error saving requirement:",
            error
        );

        showRequirementFormMessage(
            error instanceof Error
                ? error.message
                : "Could not save requirement.",
            true
        );
    }
}

async function deleteRequirement(requirement) {
    const confirmed = window.confirm(
        `Delete ${requirement.subjectName} for ` +
        `${requirement.className}?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/requirements/${encodeURIComponent(
                requirement.id
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
                    `Could not delete requirement. Status: ${response.status}`
                )
            );
        }

        await loadRequirements();
    } catch (error) {
        console.error(
            "Error deleting requirement:",
            error
        );

        window.alert(
            error instanceof Error
                ? error.message
                : "Could not delete requirement."
        );
    }
}

function showRequirementsError(message) {
    const tbody =
        document.querySelector(
            "#requirementsTable tbody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    const row =
        document.createElement("tr");

    const cell =
        document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = message;

    row.appendChild(cell);
    tbody.appendChild(row);
}

function showRequirementFormMessage(
    message,
    isError
) {
    const messageElement =
        document.getElementById(
            "requirementFormMessage"
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

function clearRequirementFormMessage() {
    const messageElement =
        document.getElementById(
            "requirementFormMessage"
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
    if (typeof data?.message === "string") {
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