let availableSubjects = [];

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        const backToMainButton =
            document.getElementById(
                "backToMainButton"
            );

        const refreshRoomsButton =
            document.getElementById(
                "refreshRoomsButton"
            );

        const addRoomButton =
            document.getElementById(
                "addRoomButton"
            );

        const saveRoomButton =
            document.getElementById(
                "saveRoomButton"
            );

        const cancelRoomButton =
            document.getElementById(
                "cancelRoomButton"
            );

        backToMainButton?.addEventListener(
            "click",
            () => {
                window.location.href =
                    "main.html";
            }
        );

        refreshRoomsButton?.addEventListener(
            "click",
            refreshPageData
        );

        addRoomButton?.addEventListener(
            "click",
            openAddRoomForm
        );

        saveRoomButton?.addEventListener(
            "click",
            saveRoom
        );

        cancelRoomButton?.addEventListener(
            "click",
            closeRoomForm
        );

        await refreshPageData();
    }
);

async function refreshPageData() {
    await loadSubjects();
    await loadRooms();
}

async function loadSubjects() {
    try {
        const organizationId =
            window.appContext
                .requireOrganizationId();

        const response = await fetch(
            `/api/subjects?organizationId=${encodeURIComponent(
                organizationId
            )
            }`
        );

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not load subjects. ` +
                    `Status: ${response.status}`
                )
            );
        }

        availableSubjects =
            Array.isArray(data)
                ? data
                : data?.subjects ?? [];

        populateSubjectOptions();
    } catch (error) {
        console.error(
            "Error loading subjects:",
            error
        );

        availableSubjects = [];

        populateSubjectOptions();
    }
}

async function loadRooms() {
    const tbody =
        document.querySelector(
            "#roomsTable tbody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="5">
                Loading rooms...
            </td>
        </tr>
    `;

    try {
        const organizationId =
            window.appContext
                .requireOrganizationId();

        const response = await fetch(
            `/api/rooms?organizationId=${encodeURIComponent(
                organizationId
            )
            }`
        );

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not load rooms. ` +
                    `Status: ${response.status}`
                )
            );
        }

        const rooms =
            Array.isArray(data)
                ? data
                : data?.rooms ?? [];

        renderRooms(rooms);
    } catch (error) {
        console.error(
            "Error loading rooms:",
            error
        );

        showRoomsError(
            error instanceof Error
                ? error.message
                : "Could not load rooms."
        );
    }
}

function renderRooms(rooms) {
    const tbody =
        document.querySelector(
            "#roomsTable tbody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (
        !Array.isArray(rooms) ||
        rooms.length === 0
    ) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    No rooms found.
                </td>
            </tr>
        `;

        return;
    }

    rooms.forEach(room => {
        const row =
            document.createElement("tr");

        row.appendChild(
            createTableCell(room.name)
        );

        row.appendChild(
            createTableCell(
                room.restrictedToSubjectName ??
                ""
            )
        );

        row.appendChild(
            createTableCell(
                room.preferredSubjectName ??
                ""
            )
        );

        row.appendChild(
            createTableCell(
                room.info ?? ""
            )
        );

        const actionsCell =
            document.createElement("td");

        actionsCell.classList.add(
            "table-actions-column"
        );

        const editButton =
            document.createElement("button");

        editButton.type = "button";
        editButton.className =
            "small-button";

        editButton.textContent = "Edit";

        editButton.addEventListener(
            "click",
            () => {
                openEditRoomForm(room);
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "small-button";

        deleteButton.textContent =
            "Delete";

        deleteButton.addEventListener(
            "click",
            async () => {
                await deleteRoom(room);
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
    const cell =
        document.createElement("td");

    cell.textContent =
        value?.toString() ?? "";

    return cell;
}

function populateSubjectOptions() {
    populateSingleSubjectSelect(
        "restrictedToSubjectId",
        "No restriction"
    );

    populateSingleSubjectSelect(
        "preferredSubjectId",
        "No preference"
    );
}

function populateSingleSubjectSelect(
    selectId,
    emptyOptionText
) {
    const select =
        document.getElementById(
            selectId
        );

    if (!select) {
        return;
    }

    const selectedValue =
        select.value;

    select.innerHTML = "";

    const emptyOption =
        document.createElement(
            "option"
        );

    emptyOption.value = "";
    emptyOption.textContent =
        emptyOptionText;

    select.appendChild(
        emptyOption
    );

    availableSubjects.forEach(
        subject => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                subject.id;

            option.textContent =
                subject.name;

            select.appendChild(
                option
            );
        }
    );

    select.value =
        selectedValue;
}

function openAddRoomForm() {
    document.getElementById(
        "roomId"
    ).value = "";

    document.getElementById(
        "roomName"
    ).value = "";

    document.getElementById(
        "restrictedToSubjectId"
    ).value = "";

    document.getElementById(
        "preferredSubjectId"
    ).value = "";

    document.getElementById(
        "roomInfo"
    ).value = "";

    clearRoomFormMessage();

    document.getElementById(
        "roomFormTitle"
    ).textContent = "Add room";

    document.getElementById(
        "roomFormSection"
    ).hidden = false;

    document.getElementById(
        "roomName"
    ).focus();
}

function openEditRoomForm(room) {
    document.getElementById(
        "roomId"
    ).value = room.id;

    document.getElementById(
        "roomName"
    ).value =
        room.name ?? "";

    document.getElementById(
        "restrictedToSubjectId"
    ).value =
        room.restrictedToSubjectId
            ?.toString() ?? "";

    document.getElementById(
        "preferredSubjectId"
    ).value =
        room.preferredSubjectId
            ?.toString() ?? "";

    document.getElementById(
        "roomInfo"
    ).value =
        room.info ?? "";

    clearRoomFormMessage();

    document.getElementById(
        "roomFormTitle"
    ).textContent = "Edit room";

    document.getElementById(
        "roomFormSection"
    ).hidden = false;

    document.getElementById(
        "roomName"
    ).focus();
}

function closeRoomForm() {
    const formSection =
        document.getElementById(
            "roomFormSection"
        );

    if (formSection) {
        formSection.hidden = true;
    }

    clearRoomFormMessage();
}

async function saveRoom() {
    const roomId =
        document.getElementById(
            "roomId"
        ).value;

    const name =
        document.getElementById(
            "roomName"
        ).value.trim();

    const restrictedSubjectValue =
        document.getElementById(
            "restrictedToSubjectId"
        ).value;

    const preferredSubjectValue =
        document.getElementById(
            "preferredSubjectId"
        ).value;

    const info =
        document.getElementById(
            "roomInfo"
        ).value.trim();

    if (!name) {
        showRoomFormMessage(
            "Room name is required.",
            true
        );

        return;
    }

    const requestBody = {
        name,

        info:
            info || null,

        restrictedToSubjectId:
            restrictedSubjectValue
                ? Number(
                    restrictedSubjectValue
                )
                : null,

        preferredSubjectId:
            preferredSubjectValue
                ? Number(
                    preferredSubjectValue
                )
                : null
    };

    const isEditing =
        roomId !== "";

    try {
        const organizationId =
            window.appContext
                .requireOrganizationId();

        const url =
            isEditing
                ? `/api/rooms/${encodeURIComponent(roomId)
                }?organizationId=${encodeURIComponent(
                    organizationId
                )
                }`
                : `/api/rooms?organizationId=${encodeURIComponent(
                    organizationId
                )
                }`;

        const response =
            await fetch(
                url,
                {
                    method:
                        isEditing
                            ? "PUT"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            requestBody
                        )
                }
            );

        const data =
            await readJsonResponse(
                response
            );

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not save room. ` +
                    `Status: ${response.status}`
                )
            );
        }

        closeRoomForm();

        await loadRooms();
    } catch (error) {
        console.error(
            "Error saving room:",
            error
        );

        showRoomFormMessage(
            error instanceof Error
                ? error.message
                : "Could not save room.",
            true
        );
    }
}

async function deleteRoom(room) {
    const confirmed =
        window.confirm(
            `Delete room ${room.name}?`
        );

    if (!confirmed) {
        return;
    }

    try {
        const organizationId =
            window.appContext
                .requireOrganizationId();

        const response =
            await fetch(
                `/api/rooms/${encodeURIComponent(
                    room.id
                )
                }?organizationId=${encodeURIComponent(
                    organizationId
                )
                }`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await readJsonResponse(
                response
            );

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not delete room. ` +
                    `Status: ${response.status}`
                )
            );
        }

        await loadRooms();
    } catch (error) {
        console.error(
            "Error deleting room:",
            error
        );

        window.alert(
            error instanceof Error
                ? error.message
                : "Could not delete room."
        );
    }
}

function showRoomsError(message) {
    const tbody =
        document.querySelector(
            "#roomsTable tbody"
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
    cell.textContent =
        message;

    row.appendChild(cell);

    tbody.appendChild(row);
}

function showRoomFormMessage(
    message,
    isError
) {
    const messageElement =
        document.getElementById(
            "roomFormMessage"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent =
        message;

    messageElement.classList.toggle(
        "error-message",
        isError
    );
}

function clearRoomFormMessage() {
    const messageElement =
        document.getElementById(
            "roomFormMessage"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";

    messageElement.classList.remove(
        "error-message"
    );
}

async function readJsonResponse(
    response
) {
    const text =
        await response.text();

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
        typeof data?.message ===
        "string"
    ) {
        return data.message;
    }

    if (data?.errors) {
        const validationMessages =
            Object.values(
                data.errors
            )
                .flat()
                .filter(
                    message =>
                        typeof message ===
                        "string"
                );

        if (
            validationMessages.length >
            0
        ) {
            return validationMessages.join(
                " "
            );
        }
    }

    return fallbackMessage;
}