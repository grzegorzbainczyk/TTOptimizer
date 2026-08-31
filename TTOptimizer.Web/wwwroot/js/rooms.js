import { initializeI18n, t } from "./i18n.js";
import { initializeSimpleXlsxImport } from "./simple-xlsx-import.js";
import { initializeRoomSetupMode } from "./main/rooms-setup.js";

let availableBuildings = [];
let availableSubjects = [];
let currentRooms = [];

document.addEventListener(
    "DOMContentLoaded",
    async () => {
    await initializeI18n();
    const setupHandled = await initializeRoomSetupMode();
    if (setupHandled) return;
    document.title = t("rooms.pageTitle", "ClassFlow - Rooms");
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

        document.getElementById("addBuildingInlineButton")
            ?.addEventListener("click", () => {
                appendInlineBuildingCard(null);
            });

        initializeSimpleXlsxImport({
            resourceName: "room",
            pluralName: "Rooms",
            previewUrl: "/api/rooms/import/preview",
            importUrlFactory: () => {
                const organizationId =
                    window.appContext.requireOrganizationId();

                return `/api/rooms/import?organizationId=${encodeURIComponent(
                    organizationId
                )}`;
            },
            importButtonId: "importRoomsButton",
            fileInputId: "roomImportFileInput",
            previewSectionId: "roomImportPreviewSection",
            previewTableId: "roomImportPreviewTable",
            messageId: "roomImportMessage",
            confirmButtonId: "confirmRoomsImportButton",
            closeButtonId: "closeRoomsImportPreviewButton",
            onImported: loadRooms
        });

        await refreshPageData();
    }
);

async function refreshPageData() {
    await Promise.all([
        loadSubjects(),
        loadBuildings()
    ]);
    await loadRooms();
}

async function loadBuildings() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/buildings?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `${t("buildings.loadFailed", "Could not load buildings.")} Status: ${response.status}`
                )
            );
        }

        availableBuildings =
            Array.isArray(data)
                ? data
                : data?.buildings ?? [];
    } catch (error) {
        console.error("Error loading buildings:", error);
        availableBuildings = [];
    }

    populateBuildingOptions();
    renderInlineBuildings();
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
                    `${t("subjects.loadFailed", "Could not load subjects.")} Status: ${response.status}`
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
            <td colspan="6" class="teachers-table-state">Loading rooms...</td>
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
                    `${t("rooms.loadFailed", "Could not load rooms.")} Status: ${response.status}`
                )
            );
        }

        const rooms =
            Array.isArray(data)
                ? data
                : data?.rooms ?? [];

        currentRooms = rooms;
        renderRooms(rooms);
        updateRoomsCount(rooms.length);
        renderInlineBuildings();
    } catch (error) {
        console.error(
            "Error loading rooms:",
            error
        );

        updateRoomsCount(null);

        showRoomsError(
            error instanceof Error
                ? error.message
                : t("rooms.loadFailed", "Could not load rooms.")
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
                <td colspan="6" class="teachers-table-state">No rooms found.</td>
            </tr>
        `;

        return;
    }

    rooms.forEach(room => {
        const row =
            document.createElement("tr");

        row.className = "teacher-row";

        row.appendChild(
            createTableCell(room.name)
        );

        row.appendChild(
            createTableCell(
                room.buildingName ?? ""
            )
        );

        row.appendChild(
            createTableCell(
                room.restrictedToSubjectName ?? ""
            )
        );

        row.appendChild(
            createTableCell(
                room.preferredSubjectName ?? ""
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
            "small-button teacher-action-button teacher-edit-button";
        editButton.textContent = t("common.edit", "Edit");

        editButton.addEventListener(
            "click",
            () => {
                openEditRoomForm(room);
            }
        );

        const availabilityButton =
            document.createElement("button");

        availabilityButton.type = "button";
        availabilityButton.className =
            "small-button teacher-action-button teacher-availability-button";
        availabilityButton.textContent = t("common.availability", "Availability");

        availabilityButton.addEventListener(
            "click",
            () => {
                const url =
                    "availability.html" +
                    "?resourceType=room" +
                    `&resourceId=${encodeURIComponent(
                        room.id
                    )}`;

                window.location.href = url;
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "small-button teacher-action-button teacher-delete-button";
        deleteButton.textContent = t("common.delete", "Delete");

        deleteButton.addEventListener(
            "click",
            async () => {
                await deleteRoom(room);
            }
        );

                const actionsContainer =
            document.createElement("div");

        actionsContainer.className =
            "teacher-actions";

        actionsContainer.append(
            editButton,
            availabilityButton,
            deleteButton
        );

        actionsCell.appendChild(actionsContainer);

        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });
}

function updateRoomsCount(count) {
    const countElement =
        document.getElementById("roomsCount");

    if (!countElement) {
        return;
    }

    if (!Number.isInteger(count)) {
        countElement.textContent =
            t("rooms.countUnknown", "Could not determine the number of rooms.");
        return;
    }

    countElement.textContent =
        count === 1
            ? t("rooms.countOne", "1 room")
            : t("rooms.countMany", "{count} rooms").replace("{count}", count);
}

function createTableCell(value) {
    const cell =
        document.createElement("td");

    cell.textContent =
        value?.toString() ?? "";

    return cell;
}

function populateBuildingOptions() {
    const select =
        document.getElementById(
            "roomBuildingId"
        );

    if (!select) {
        return;
    }

    const selectedValue = select.value;
    select.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = t("rooms.noBuilding", "No building assigned");
    select.appendChild(emptyOption);

    availableBuildings.forEach(building => {
        const option = document.createElement("option");
        option.value = building.id;
        option.textContent = building.name;
        select.appendChild(option);
    });

    select.value = selectedValue;
}

function populateSubjectOptions() {
    populateSingleSubjectSelect(
        "restrictedToSubjectId",
        t("rooms.noRestriction", "No restriction")
    );

    populateSingleSubjectSelect(
        "preferredSubjectId",
        t("rooms.noPreference", "No preference")
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
        "roomBuildingId"
    ).value =
        availableBuildings[0]?.id?.toString() ?? "";

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
    ).textContent = t("rooms.add", "Add room");

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
        "roomBuildingId"
    ).value =
        room.buildingId
            ?.toString() ?? "";

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
    ).textContent = t("rooms.edit", "Edit room");

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

    const buildingValue =
        document.getElementById(
            "roomBuildingId"
        ).value;

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
            t("rooms.nameRequired", "Room name is required."),
            true
        );

        return;
    }

    const requestBody = {
        name,

        buildingId:
            buildingValue
                ? Number(buildingValue)
                : null,

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
                    `${t("rooms.saveFailed", "Could not save room.")} Status: ${response.status}`
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
                : t("rooms.saveFailed", "Could not save room."),
            true
        );
    }
}

async function deleteRoom(room) {
    const confirmed =
        window.confirm(
            t("rooms.deleteConfirm", "Delete room {name}?")
                .replace("{name}", room.name ?? "")
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
                    `${t("rooms.deleteFailed", "Could not delete room.")} Status: ${response.status}`
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
                : t("rooms.deleteFailed", "Could not delete room.")
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


function renderInlineBuildings() {
    const container =
        document.getElementById("inlineBuildingsContainer");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (availableBuildings.length === 0) {
        appendInlineBuildingCard(null);
        return;
    }

    availableBuildings.forEach(building => {
        appendInlineBuildingCard(building);
    });
}

function appendInlineBuildingCard(building) {
    const container =
        document.getElementById("inlineBuildingsContainer");

    if (!container) {
        return;
    }

    const isNew = !building?.id;
    const card = document.createElement("section");
    card.className = "inline-building-card";
    card.dataset.buildingId = building?.id ?? "";

    const roomsInBuilding = building?.id
        ? currentRooms.filter(room =>
            Number(room.buildingId) === Number(building.id))
        : [];

    card.innerHTML = `
        <div class="inline-building-header">
            <div>
                <span class="room-generator-label">
                    ${isNew ? "Nowy budynek" : "Budynek"}
                </span>
                <h3>${escapeHtmlText(building?.name ?? "Nowy budynek")}</h3>
            </div>
            ${isNew
                ? `<button class="secondary-button inline-building-cancel"
                           type="button">Usuń ten formularz</button>`
                : `<button class="secondary-button inline-building-delete"
                           type="button">Usuń budynek</button>`}
        </div>

        <div class="inline-building-fields">
            <label>
                <span>Nazwa budynku</span>
                <input class="inline-building-name"
                       type="text"
                       maxlength="150"
                       value="${escapeHtmlAttribute(building?.name ?? "")}"
                       placeholder="np. Budynek główny" />
            </label>

            <label>
                <span>Adres <small>(opcjonalnie)</small></span>
                <input class="inline-building-address"
                       type="text"
                       maxlength="500"
                       value="${escapeHtmlAttribute(building?.address ?? "")}"
                       placeholder="np. ul. Szkolna 1" />
            </label>
        </div>

        <div class="inline-building-save-row">
            <button class="primary-button inline-building-save"
                    type="button">
                ${isNew ? "Zapisz budynek" : "Zapisz zmiany"}
            </button>
            <span class="inline-building-status"></span>
        </div>

        ${isNew ? `
            <div class="inline-room-generator inline-room-generator-disabled">
                <p>Najpierw zapisz budynek, a potem dodasz do niego sale.</p>
            </div>
        ` : `
            <div class="inline-room-generator">
                <div class="inline-room-generator-heading">
                    <div>
                        <h4>Sale w budynku</h4>
                        <p>
                            Szybko utwórz zakres, np. od 1 do 20.
                            Później każdą salę możesz normalnie edytować lub usunąć.
                        </p>
                    </div>
                    <button class="secondary-button inline-add-single-room"
                            type="button">
                        + Dodaj pojedynczą salę
                    </button>
                </div>

                <div class="inline-room-range">
                    <label>
                        <span>Od</span>
                        <input class="inline-room-from"
                               type="number"
                               min="0"
                               max="9999"
                               value="1" />
                    </label>
                    <label>
                        <span>Do</span>
                        <input class="inline-room-to"
                               type="number"
                               min="0"
                               max="9999"
                               value="20" />
                    </label>
                    <label>
                        <span>Prefiks <small>(opcjonalnie)</small></span>
                        <input class="inline-room-prefix"
                               type="text"
                               maxlength="20"
                               placeholder="np. A-" />
                    </label>
                    <button class="main-action-button inline-generate-rooms"
                            type="button">
                        Generuj sale
                    </button>
                </div>

                <div class="inline-building-room-list">
                    ${renderInlineRoomChips(roomsInBuilding)}
                </div>
            </div>
        `}
    `;

    card.querySelector(".inline-building-save")
        ?.addEventListener("click", () =>
            saveInlineBuilding(card, building));

    card.querySelector(".inline-building-cancel")
        ?.addEventListener("click", () => card.remove());

    card.querySelector(".inline-building-delete")
        ?.addEventListener("click", () =>
            deleteInlineBuilding(building));

    card.querySelector(".inline-generate-rooms")
        ?.addEventListener("click", () =>
            generateInlineRooms(card, building));

    card.querySelector(".inline-add-single-room")
        ?.addEventListener("click", () => {
            openAddRoomForm();
            const buildingSelect =
                document.getElementById("roomBuildingId");
            if (buildingSelect) {
                buildingSelect.value =
                    String(building.id);
            }
            document.getElementById("roomFormSection")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        });

    container.appendChild(card);
}

function renderInlineRoomChips(rooms) {
    if (!rooms || rooms.length === 0) {
        return `<p class="room-preview-empty">
            Nie dodano jeszcze sal w tym budynku.
        </p>`;
    }

    return `
        <div class="room-preview-chips">
            ${rooms.map(room =>
                `<span class="room-preview-chip">${escapeHtmlText(room.name)}</span>`
            ).join("")}
        </div>
    `;
}

async function saveInlineBuilding(card, building) {
    const name =
        card.querySelector(".inline-building-name")
            ?.value.trim() ?? "";

    const address =
        card.querySelector(".inline-building-address")
            ?.value.trim() ?? "";

    if (!name) {
        setInlineBuildingStatus(
            card,
            "Podaj nazwę budynku.",
            true
        );
        card.querySelector(".inline-building-name")?.focus();
        return;
    }

    const button =
        card.querySelector(".inline-building-save");

    if (button) {
        button.disabled = true;
    }

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const isEditing = Boolean(building?.id);

        const response = await fetch(
            isEditing
                ? `/api/buildings/${encodeURIComponent(building.id)}?organizationId=${encodeURIComponent(organizationId)}`
                : `/api/buildings?organizationId=${encodeURIComponent(organizationId)}`,
            {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    address: address || null,
                    info: building?.info ?? null
                })
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się zapisać budynku. Status: ${response.status}`
                )
            );
        }

        showInlineBuildingsMessage(
            isEditing
                ? "Dane budynku zostały zapisane."
                : "Budynek został dodany.",
            false
        );

        await loadBuildings();
        await loadRooms();
    } catch (error) {
        console.error("Error saving inline building:", error);
        setInlineBuildingStatus(
            card,
            error instanceof Error
                ? error.message
                : "Nie udało się zapisać budynku.",
            true
        );
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

async function deleteInlineBuilding(building) {
    if (!building?.id) {
        return;
    }

    const roomsInBuilding =
        currentRooms.filter(room =>
            Number(room.buildingId) === Number(building.id));

    const warning = roomsInBuilding.length > 0
        ? `Budynek „${building.name}” ma ${roomsInBuilding.length} sal. ` +
          "Usunięcie budynku usunie również te sale. Czy kontynuować?"
        : `Czy usunąć budynek „${building.name}”?`;

    if (!window.confirm(warning)) {
        return;
    }

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/buildings/${encodeURIComponent(building.id)}?organizationId=${encodeURIComponent(organizationId)}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            const data = await readJsonResponse(response);
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się usunąć budynku. Status: ${response.status}`
                )
            );
        }

        showInlineBuildingsMessage(
            "Budynek został usunięty.",
            false
        );

        await refreshPageData();
    } catch (error) {
        console.error("Error deleting inline building:", error);
        showInlineBuildingsMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się usunąć budynku.",
            true
        );
    }
}

async function generateInlineRooms(card, building) {
    const from =
        Number(card.querySelector(".inline-room-from")?.value);

    const to =
        Number(card.querySelector(".inline-room-to")?.value);

    const prefix =
        card.querySelector(".inline-room-prefix")
            ?.value.trim() ?? "";

    if (
        !Number.isInteger(from) ||
        !Number.isInteger(to) ||
        from < 0 ||
        to < from ||
        to - from > 500
    ) {
        setInlineBuildingStatus(
            card,
            "Podaj poprawny zakres sal. Maksymalnie 501 pozycji naraz.",
            true
        );
        return;
    }

    const rooms = [];

    for (let number = from; number <= to; number++) {
        rooms.push({
            name: `${prefix}${number}`,
            buildingId: building.id
        });
    }

    const button =
        card.querySelector(".inline-generate-rooms");

    if (button) {
        button.disabled = true;
    }

    setInlineBuildingStatus(
        card,
        "Dodawanie sal...",
        false
    );

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/rooms/setup-import?organizationId=${encodeURIComponent(organizationId)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ rooms })
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się wygenerować sal. Status: ${response.status}`
                )
            );
        }

        const created =
            Number(data?.createdCount) || 0;

        const skipped =
            Number(data?.skippedExistingCount) || 0;

        showInlineBuildingsMessage(
            skipped > 0
                ? `Dodano ${created} sal. Pominięto ${skipped} już istniejących nazw.`
                : `Dodano ${created} sal.`,
            false
        );

        await loadRooms();
        await loadBuildings();
    } catch (error) {
        console.error("Error generating inline rooms:", error);
        setInlineBuildingStatus(
            card,
            error instanceof Error
                ? error.message
                : "Nie udało się wygenerować sal.",
            true
        );
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

function setInlineBuildingStatus(card, message, isError) {
    const element =
        card.querySelector(".inline-building-status");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle(
        "form-message-error",
        Boolean(isError)
    );
}

function showInlineBuildingsMessage(message, isError) {
    const element =
        document.getElementById("inlineBuildingsMessage");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle(
        "form-message-error",
        Boolean(isError)
    );
}

function escapeHtmlText(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function escapeHtmlAttribute(value) {
    return escapeHtmlText(value);
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