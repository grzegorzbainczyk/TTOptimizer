let availableTeachers = [];
let availableRooms = [];

document.addEventListener("DOMContentLoaded", async () => {
    const backToMainButton =
        document.getElementById("backToMainButton");

    const refreshClassesButton =
        document.getElementById("refreshClassesButton");

    const addClassButton =
        document.getElementById("addClassButton");

    const saveClassButton =
        document.getElementById("saveClassButton");

    const cancelClassButton =
        document.getElementById("cancelClassButton");

    backToMainButton?.addEventListener("click", () => {
        window.location.href = "main.html";
    });

    refreshClassesButton?.addEventListener(
        "click",
        refreshPageData
    );

    addClassButton?.addEventListener(
        "click",
        openAddClassForm
    );

    saveClassButton?.addEventListener(
        "click",
        saveClass
    );

    cancelClassButton?.addEventListener(
        "click",
        closeClassForm
    );

    await refreshPageData();
});

async function refreshPageData() {
    await Promise.all([
        loadTeachers(),
        loadRooms()
    ]);

    await loadClasses();
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

async function loadRooms() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/rooms?organizationId=${encodeURIComponent(
                organizationId
            )}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not load rooms. Status: ${response.status}`
                )
            );
        }

        availableRooms = Array.isArray(data)
            ? data
            : data?.rooms ?? [];

        populateRoomOptions();
    } catch (error) {
        console.error("Error loading rooms:", error);

        availableRooms = [];
        populateRoomOptions();
    }
}

async function loadClasses() {
    const tbody =
        document.querySelector("#classesTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="5">Loading classes...</td>
        </tr>
    `;

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

        const classes = Array.isArray(data)
            ? data
            : data?.classes ?? data?.classGroups ?? [];

        renderClasses(classes);
    } catch (error) {
        console.error("Error loading classes:", error);

        showClassesError(
            error instanceof Error
                ? error.message
                : "Could not load classes."
        );
    }
}

function renderClasses(classes) {
    const tbody =
        document.querySelector("#classesTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!Array.isArray(classes) || classes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">No classes found.</td>
            </tr>
        `;

        return;
    }

    classes.forEach(classGroup => {
        const row =
            document.createElement("tr");

        row.appendChild(
            createTableCell(classGroup.name)
        );

        row.appendChild(
            createTableCell(
                classGroup.homeroomTeacherName ?? ""
            )
        );

        row.appendChild(
            createTableCell(
                classGroup.defaultRoomName ?? ""
            )
        );

        row.appendChild(
            createTableCell(classGroup.info ?? "")
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
            openEditClassForm(classGroup);
        });

        const availabilityButton =
            document.createElement("button");

        availabilityButton.type = "button";
        availabilityButton.className = "small-button";
        availabilityButton.textContent = "Availability";

        availabilityButton.addEventListener("click", () => {
            const url =
                "availability.html" +
                "?resourceType=class" +
                `&resourceId=${encodeURIComponent(
                    classGroup.id
                )}`;

            window.location.href = url;
        });

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "small-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener(
            "click",
            async () => {
                await deleteClass(classGroup);
            }
        );

        actionsCell.append(
            editButton,
            availabilityButton,
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
            "homeroomTeacherId"
        );

    if (!select) {
        return;
    }

    const selectedValue = select.value;

    select.innerHTML = "";

    const emptyOption =
        document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent = "None";

    select.appendChild(emptyOption);

    availableTeachers.forEach(teacher => {
        const option =
            document.createElement("option");

        option.value = teacher.id;

        option.textContent =
            `#${teacher.teacherNumber} ` +
            `${teacher.name} ` +
            `(${teacher.alias})`;

        select.appendChild(option);
    });

    select.value = selectedValue;
}

function populateRoomOptions() {
    const select =
        document.getElementById(
            "defaultRoomId"
        );

    if (!select) {
        return;
    }

    const selectedValue = select.value;

    select.innerHTML = "";

    const emptyOption =
        document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent = "None";

    select.appendChild(emptyOption);

    availableRooms.forEach(room => {
        const option =
            document.createElement("option");

        option.value = room.id;
        option.textContent = room.name;

        select.appendChild(option);
    });

    select.value = selectedValue;
}

function openAddClassForm() {
    document.getElementById("classId").value = "";

    document.getElementById("className").value =
        "";

    document.getElementById(
        "homeroomTeacherId"
    ).value = "";

    document.getElementById(
        "defaultRoomId"
    ).value = "";

    document.getElementById("classInfo").value =
        "";

    clearClassFormMessage();

    document.getElementById(
        "classFormTitle"
    ).textContent = "Add class";

    document.getElementById(
        "classFormSection"
    ).hidden = false;

    document.getElementById(
        "className"
    ).focus();
}

function openEditClassForm(classGroup) {
    document.getElementById("classId").value =
        classGroup.id;

    document.getElementById("className").value =
        classGroup.name ?? "";

    document.getElementById(
        "homeroomTeacherId"
    ).value =
        classGroup.homeroomTeacherId
            ?.toString() ?? "";

    document.getElementById(
        "defaultRoomId"
    ).value =
        classGroup.defaultRoomId
            ?.toString() ?? "";

    document.getElementById("classInfo").value =
        classGroup.info ?? "";

    clearClassFormMessage();

    document.getElementById(
        "classFormTitle"
    ).textContent = "Edit class";

    document.getElementById(
        "classFormSection"
    ).hidden = false;

    document.getElementById(
        "className"
    ).focus();
}

function closeClassForm() {
    const formSection =
        document.getElementById(
            "classFormSection"
        );

    if (formSection) {
        formSection.hidden = true;
    }

    clearClassFormMessage();
}

async function saveClass() {
    const classId =
        document.getElementById(
            "classId"
        ).value;

    const name =
        document.getElementById(
            "className"
        ).value.trim();

    const homeroomTeacherValue =
        document.getElementById(
            "homeroomTeacherId"
        ).value;

    const defaultRoomValue =
        document.getElementById(
            "defaultRoomId"
        ).value;

    const info =
        document.getElementById(
            "classInfo"
        ).value.trim();

    if (!name) {
        showClassFormMessage(
            "Class name is required.",
            true
        );

        return;
    }

    const requestBody = {
        name,
        info: info || null,

        homeroomTeacherId:
            homeroomTeacherValue
                ? Number(homeroomTeacherValue)
                : null,

        defaultRoomId:
            defaultRoomValue
                ? Number(defaultRoomValue)
                : null
    };

    const isEditing = classId !== "";

    try {
        const organizationId =
            window.appContext
                .requireOrganizationId();

        const url = isEditing
            ? `/api/classes/${encodeURIComponent(
                classId
            )}?organizationId=${encodeURIComponent(
                organizationId
            )}`
            : `/api/classes?organizationId=${encodeURIComponent(
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
                    `Could not save class. ` +
                    `Status: ${response.status}`
                )
            );
        }

        closeClassForm();
        await loadClasses();
    } catch (error) {
        console.error(
            "Error saving class:",
            error
        );

        showClassFormMessage(
            error instanceof Error
                ? error.message
                : "Could not save class.",
            true
        );
    }
}

async function deleteClass(classGroup) {
    const confirmed = window.confirm(
        `Delete class ${classGroup.name}?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const organizationId =
            window.appContext
                .requireOrganizationId();

        const response = await fetch(
            `/api/classes/${encodeURIComponent(
                classGroup.id
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
                    `Could not delete class. ` +
                    `Status: ${response.status}`
                )
            );
        }

        await loadClasses();
    } catch (error) {
        console.error(
            "Error deleting class:",
            error
        );

        window.alert(
            error instanceof Error
                ? error.message
                : "Could not delete class."
        );
    }
}

function showClassesError(message) {
    const tbody =
        document.querySelector(
            "#classesTable tbody"
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

function showClassFormMessage(
    message,
    isError
) {
    const messageElement =
        document.getElementById(
            "classFormMessage"
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

function clearClassFormMessage() {
    const messageElement =
        document.getElementById(
            "classFormMessage"
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