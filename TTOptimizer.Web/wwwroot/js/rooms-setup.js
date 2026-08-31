let setupBuildings = [];
let setupExistingRooms = [];
let setupPreviewRooms = [];

export async function initializeRoomSetupMode() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("setup") !== "1") {
        return false;
    }

    const setupRoot = document.getElementById("roomSetupMode");
    const normalPage = document.getElementById("normalRoomsPage");

    if (!setupRoot) {
        return false;
    }

    setupRoot.hidden = false;

    if (normalPage) {
        normalPage.hidden = true;
    }

    document.title = "ClassFlow - Konfiguracja sal";

    wireSetupEvents();
    await loadSetupData();
    renderSetupPreview();

    return true;
}

function wireSetupEvents() {
    document.getElementById("exitRoomSetupButton")
        ?.addEventListener("click", () => {
            window.location.href = "main.html";
        });

    document.getElementById("backToSchoolSetupButton")
        ?.addEventListener("click", () => {
            window.location.href = "setup.html";
        });

    document.querySelectorAll('input[name="roomSetupMode"]')
        .forEach(input => {
            input.addEventListener("change", updateSetupMode);
        });

    document.getElementById("refreshRoomPreviewButton")
        ?.addEventListener("click", renderSetupPreview);

    document.getElementById("addManualRoomButton")
        ?.addEventListener("click", () => {
            addManualRoomRow();
            renderSetupPreview();
        });

    document.getElementById("saveGeneratedRoomsButton")
        ?.addEventListener("click", saveSetupRooms);

    document.getElementById("skipRoomSetupButton")
        ?.addEventListener("click", goToSubjects);

    document.getElementById("selectAllExistingRoomsButton")
        ?.addEventListener("click", toggleAllExistingRooms);

    document.getElementById("deleteSelectedRoomsButton")
        ?.addEventListener("click", deleteSelectedExistingRooms);

    document.querySelectorAll(".room-special-grid input[type='checkbox']")
        .forEach(input => {
            input.addEventListener("change", renderSetupPreview);
        });
}

async function loadSetupData() {
    setSetupBusy(true);
    showSetupMessage("Wczytywanie budynków i istniejących sal...", false);

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const [buildingsResponse, roomsResponse] =
            await Promise.all([
                fetch(`/api/buildings?organizationId=${encodeURIComponent(organizationId)}`),
                fetch(`/api/rooms?organizationId=${encodeURIComponent(organizationId)}`)
            ]);

        const buildingsData = await readJsonResponse(buildingsResponse);
        const roomsData = await readJsonResponse(roomsResponse);

        if (!buildingsResponse.ok) {
            throw new Error(
                getApiErrorMessage(
                    buildingsData,
                    `Nie udało się wczytać budynków. Status: ${buildingsResponse.status}`
                )
            );
        }

        if (!roomsResponse.ok) {
            throw new Error(
                getApiErrorMessage(
                    roomsData,
                    `Nie udało się wczytać sal. Status: ${roomsResponse.status}`
                )
            );
        }

        setupBuildings =
            Array.isArray(buildingsData)
                ? buildingsData
                : buildingsData?.buildings ?? [];

        setupExistingRooms =
            Array.isArray(roomsData)
                ? roomsData
                : roomsData?.rooms ?? [];

        renderExistingRooms();
        renderBuildingGenerators();

        if (
            setupBuildings.length > 0 &&
            document.getElementById("manualRoomRows")?.children.length === 0
        ) {
            addManualRoomRow();
        }

        if (setupBuildings.length === 0) {
            showSetupMessage(
                "Nie ma jeszcze budynków. Możesz pominąć ten krok i wrócić do niego później.",
                false
            );
        } else {
            showSetupMessage("", false);
        }
    } catch (error) {
        console.error("Error loading room setup:", error);

        showSetupMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się wczytać danych konfiguracji sal.",
            true
        );
    } finally {
        setSetupBusy(false);
    }
}

function renderExistingRooms() {
    const container =
        document.getElementById("roomExistingGroups");

    const summary =
        document.getElementById("roomExistingSummary");

    if (!container || !summary) {
        return;
    }

    container.innerHTML = "";

    if (setupExistingRooms.length === 0) {
        summary.textContent = "Nie ma jeszcze żadnych sal.";
        container.innerHTML = `
            <p class="room-preview-empty">
                Możesz dodać sale teraz albo przejść dalej i wrócić później.
            </p>
        `;

        updateExistingRoomSelectionState();
        return;
    }

    summary.textContent =
        `${setupExistingRooms.length} sal w placówce. ` +
        "Możesz je zaznaczyć i usunąć albo pozostawić bez zmian.";

    const byBuilding = new Map();

    for (const room of setupExistingRooms) {
        const key = room.buildingId ?? 0;

        if (!byBuilding.has(key)) {
            byBuilding.set(key, []);
        }

        byBuilding.get(key).push(room);
    }

    for (const [buildingId, rooms] of byBuilding) {
        const building =
            setupBuildings.find(item =>
                Number(item.id) === Number(buildingId)
            );

        const group =
            document.createElement("section");

        group.className = "room-preview-group room-existing-group";

        group.innerHTML = `
            <div class="room-preview-group-header">
                <strong>${escapeHtml(building?.name ?? "Bez budynku")}</strong>
                <div class="room-existing-group-actions">
                    <span>${rooms.length}</span>
                    <button class="room-existing-select-group"
                            type="button">
                        Zaznacz
                    </button>
                </div>
            </div>
            <div class="room-existing-room-list"></div>
        `;

        const list =
            group.querySelector(".room-existing-room-list");

        for (const room of rooms) {
            const item =
                document.createElement("label");

            item.className = "room-existing-room-item";

            item.innerHTML = `
                <input class="room-existing-checkbox"
                       type="checkbox"
                       value="${room.id}" />
                <span>${escapeHtml(room.name)}</span>
            `;

            item.querySelector("input")
                .addEventListener(
                    "change",
                    updateExistingRoomSelectionState
                );

            list.appendChild(item);
        }

        group.querySelector(".room-existing-select-group")
            .addEventListener("click", () => {
                const checkboxes =
                    [...group.querySelectorAll(
                        ".room-existing-checkbox"
                    )];

                const shouldSelect =
                    checkboxes.some(input => !input.checked);

                checkboxes.forEach(input => {
                    input.checked = shouldSelect;
                });

                updateExistingRoomSelectionState();
            });

        container.appendChild(group);
    }

    updateExistingRoomSelectionState();
}

function getSelectedExistingRoomIds() {
    return [
        ...document.querySelectorAll(
            ".room-existing-checkbox:checked"
        )
    ]
        .map(input => Number(input.value))
        .filter(id => Number.isInteger(id) && id > 0);
}

function updateExistingRoomSelectionState() {
    const selectedIds =
        getSelectedExistingRoomIds();

    const deleteButton =
        document.getElementById("deleteSelectedRoomsButton");

    const selectAllButton =
        document.getElementById("selectAllExistingRoomsButton");

    if (deleteButton) {
        deleteButton.disabled = selectedIds.length === 0;
        deleteButton.textContent =
            selectedIds.length === 0
                ? "Usuń zaznaczone"
                : `Usuń zaznaczone (${selectedIds.length})`;
    }

    if (selectAllButton) {
        const allCheckboxes =
            [...document.querySelectorAll(
                ".room-existing-checkbox"
            )];

        const allSelected =
            allCheckboxes.length > 0 &&
            allCheckboxes.every(input => input.checked);

        selectAllButton.textContent =
            allSelected
                ? "Odznacz wszystkie"
                : "Zaznacz wszystkie";
    }
}

function toggleAllExistingRooms() {
    const checkboxes =
        [...document.querySelectorAll(
            ".room-existing-checkbox"
        )];

    if (checkboxes.length === 0) {
        return;
    }

    const shouldSelect =
        checkboxes.some(input => !input.checked);

    checkboxes.forEach(input => {
        input.checked = shouldSelect;
    });

    updateExistingRoomSelectionState();
}

async function deleteSelectedExistingRooms() {
    const roomIds =
        getSelectedExistingRoomIds();

    if (roomIds.length === 0) {
        return;
    }

    const confirmed = window.confirm(
        roomIds.length === 1
            ? "Usunąć zaznaczoną salę?"
            : `Usunąć ${roomIds.length} zaznaczonych sal?`
    );

    if (!confirmed) {
        return;
    }

    setSetupBusy(true);
    showSetupMessage("Usuwanie zaznaczonych sal...", false);

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/rooms/setup-delete?organizationId=${encodeURIComponent(organizationId)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ roomIds })
            }
        );

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się usunąć sal. Status: ${response.status}`
                )
            );
        }

        const deletedIdSet =
            new Set(roomIds);

        setupExistingRooms =
            setupExistingRooms.filter(room =>
                !deletedIdSet.has(Number(room.id))
            );

        renderExistingRooms();
        renderSetupPreview();

        showSetupMessage(
            `Usunięto ${data?.deletedCount ?? roomIds.length} sal.`,
            false
        );
    } catch (error) {
        console.error("Error deleting setup rooms:", error);

        showSetupMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się usunąć zaznaczonych sal.",
            true
        );
    } finally {
        setSetupBusy(false);
    }
}

function renderBuildingGenerators() {
    const container =
        document.getElementById("roomGeneratorBuildings");

    container.innerHTML = "";

    setupBuildings.forEach((building, index) => {
        const card = document.createElement("section");
        card.className = "room-generator-card";
        card.dataset.buildingId = building.id;

        card.innerHTML = `
            <div class="room-generator-card-header">
                <div>
                    <span class="room-generator-label">Budynek</span>
                    <h3>${escapeHtml(building.name)}</h3>
                    ${building.address
                        ? `<p>${escapeHtml(building.address)}</p>`
                        : ""}
                </div>

                <button class="secondary-button add-range-button"
                        type="button">
                    + Dodaj zakres
                </button>
            </div>

            <div class="room-range-list"></div>

            <div class="room-prefix-row">
                <label>
                    <span>Opcjonalny prefiks nazw sal</span>
                    <input class="room-name-prefix"
                           type="text"
                           maxlength="20"
                           placeholder="np. A-" />
                </label>

                <small>
                    Przydatne, jeśli w kilku budynkach powtarzają się te same numery sal.
                </small>
            </div>
        `;

        const rangeList =
            card.querySelector(".room-range-list");

        const addRangeButton =
            card.querySelector(".add-range-button");

        addRangeButton.addEventListener("click", () => {
            addRangeRow(rangeList);
            renderSetupPreview();
        });

        card.querySelector(".room-name-prefix")
            .addEventListener("input", renderSetupPreview);

        container.appendChild(card);
    });
}

function addRangeRow(container, values = {}) {
    const row = document.createElement("div");
    row.className = "room-range-row";

    row.innerHTML = `
        <label>
            <span>Od</span>
            <input class="room-range-start"
                   type="number"
                   min="0"
                   max="9999"
                   value="${values.start ?? ""}" />
        </label>

        <span class="room-range-separator">–</span>

        <label>
            <span>Do</span>
            <input class="room-range-end"
                   type="number"
                   min="0"
                   max="9999"
                   value="${values.end ?? ""}" />
        </label>

        <button class="secondary-button room-range-remove"
                type="button">
            Usuń
        </button>
    `;

    row.querySelectorAll("input")
        .forEach(input => {
            input.addEventListener("input", renderSetupPreview);
        });

    row.querySelector(".room-range-remove")
        .addEventListener("click", () => {
            row.remove();
            renderSetupPreview();
        });

    container.appendChild(row);
}

function addManualRoomRow(values = {}) {
    const container =
        document.getElementById("manualRoomRows");

    const row =
        document.createElement("div");

    row.className = "manual-room-row";

    const defaultBuildingId =
        values.buildingId ??
        setupBuildings[0]?.id ??
        null;

    const buildingOptions = setupBuildings
        .map(building => `
            <option value="${building.id}"
                    ${Number(defaultBuildingId) === Number(building.id) ? "selected" : ""}>
                ${escapeHtml(building.name)}
            </option>
        `)
        .join("");

    row.innerHTML = `
        <label>
            <span>Nazwa sali</span>
            <input class="manual-room-name"
                   type="text"
                   maxlength="100"
                   value="${escapeAttribute(values.name ?? "")}"
                   placeholder="np. Sala 12" />
        </label>

        <label>
            <span>Budynek</span>
            <select class="manual-room-building">
                ${buildingOptions}
            </select>
        </label>

        <button class="secondary-button manual-room-remove"
                type="button">
            Usuń
        </button>
    `;

    row.querySelectorAll("input, select")
        .forEach(input => {
            input.addEventListener("input", renderSetupPreview);
            input.addEventListener("change", renderSetupPreview);
        });

    row.querySelector(".manual-room-remove")
        .addEventListener("click", () => {
            row.remove();
            renderSetupPreview();
        });

    container.appendChild(row);
}

function updateSetupMode() {
    const mode =
        document.querySelector('input[name="roomSetupMode"]:checked')?.value;

    document.getElementById("roomGeneratorPanel").hidden =
        mode !== "generate";

    document.getElementById("roomManualPanel").hidden =
        mode !== "manual";

    renderSetupPreview();
}

function collectPreviewRooms() {
    const mode =
        document.querySelector('input[name="roomSetupMode"]:checked')?.value;

    const result = [];

    if (mode === "manual") {
        document.querySelectorAll(".manual-room-row")
            .forEach(row => {
                const name =
                    row.querySelector(".manual-room-name").value.trim();

                if (!name) {
                    return;
                }

                result.push({
                    name,
                    buildingId:
                        Number(row.querySelector(".manual-room-building").value)
                });
            });

        return result;
    }

    document.querySelectorAll(".room-generator-card")
        .forEach(card => {
            const buildingId =
                Number(card.dataset.buildingId);

            const prefix =
                card.querySelector(".room-name-prefix").value.trim();

            card.querySelectorAll(".room-range-row")
                .forEach(row => {
                    const start =
                        Number(row.querySelector(".room-range-start").value);

                    const end =
                        Number(row.querySelector(".room-range-end").value);

                    if (
                        !Number.isInteger(start) ||
                        !Number.isInteger(end) ||
                        start < 0 ||
                        end < start ||
                        end - start > 500
                    ) {
                        return;
                    }

                    for (let number = start; number <= end; number++) {
                        result.push({
                            name: `${prefix}${number}`,
                            buildingId
                        });
                    }
                });
        });

    const specialRoomNames =
        [...document.querySelectorAll(
            ".room-special-grid input[type='checkbox']:checked"
        )]
            .map(input => input.value);

    const defaultBuildingId =
        setupBuildings[0]?.id ?? null;

    specialRoomNames.forEach(name => {
        result.push({
            name,
            buildingId: defaultBuildingId
        });
    });

    return result;
}

function renderSetupPreview() {
    const allCandidates = collectPreviewRooms();

    const existingNameSet =
        new Set(
            setupExistingRooms.map(room =>
                room.name.toLocaleLowerCase("pl")
            )
        );

    setupPreviewRooms =
        allCandidates.filter(room =>
            !existingNameSet.has(
                room.name.toLocaleLowerCase("pl")
            )
        );

    const preview =
        document.getElementById("roomSetupPreview");

    const summary =
        document.getElementById("roomSetupPreviewSummary");

    const warnings =
        document.getElementById("roomSetupWarnings");

    preview.innerHTML = "";

    const names = new Map();
    const duplicateNames = new Set();

    setupPreviewRooms.forEach(room => {
        const key =
            room.name.toLocaleLowerCase("pl");

        if (names.has(key)) {
            duplicateNames.add(room.name);
        }

        names.set(key, true);
    });

    const warningMessages = [];

    if (duplicateNames.size > 0) {
        warningMessages.push(
            `Powtarzające się nowe nazwy: ${[...duplicateNames].join(", ")}. ` +
            "Nazwy sal muszą być unikalne w całej placówce."
        );
    }

    warnings.hidden = warningMessages.length === 0;
    warnings.innerHTML = warningMessages
        .map(message => `<p>⚠ ${escapeHtml(message)}</p>`)
        .join("");

    if (setupPreviewRooms.length === 0) {
        summary.textContent =
            "Brak nowych sal do dodania.";

        preview.innerHTML =
            `<p class="room-preview-empty">
                To jest poprawny stan. Możesz przejść dalej bez zmian.
             </p>`;

        return;
    }

    summary.textContent =
        `${setupPreviewRooms.length} nowych sal do dodania`;

    const byBuilding =
        new Map();

    setupPreviewRooms.forEach(room => {
        const key =
            room.buildingId ?? 0;

        if (!byBuilding.has(key)) {
            byBuilding.set(key, []);
        }

        byBuilding.get(key).push(room);
    });

    for (const [buildingId, rooms] of byBuilding) {
        const building =
            setupBuildings.find(item =>
                Number(item.id) === Number(buildingId)
            );

        const group =
            document.createElement("section");

        group.className = "room-preview-group";

        group.innerHTML = `
            <div class="room-preview-group-header">
                <strong>${escapeHtml(building?.name ?? "Bez budynku")}</strong>
                <span>${rooms.length}</span>
            </div>
            <div class="room-preview-chips"></div>
        `;

        const chips =
            group.querySelector(".room-preview-chips");

        rooms.forEach(room => {
            const chip =
                document.createElement("span");

            chip.className = "room-preview-chip";
            chip.textContent = room.name;

            chips.appendChild(chip);
        });

        preview.appendChild(group);
    }
}

async function saveSetupRooms() {
    renderSetupPreview();

    if (setupPreviewRooms.length === 0) {
        goToSubjects();
        return;
    }

    const normalizedNames =
        setupPreviewRooms.map(room =>
            room.name.toLocaleLowerCase("pl")
        );

    if (new Set(normalizedNames).size !== normalizedNames.length) {
        showSetupMessage(
            "Usuń powtarzające się nazwy sal przed zapisem.",
            true
        );
        return;
    }

    setSetupBusy(true);
    showSetupMessage("Zapisywanie sal...", false);

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response =
            await fetch(
                `/api/rooms/setup-import?organizationId=${encodeURIComponent(organizationId)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        rooms: setupPreviewRooms
                    })
                }
            );

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się zapisać sal. Status: ${response.status}`
                )
            );
        }

        showSetupMessage(
            `Gotowe. Dodano ${data.createdCount ?? 0} sal` +
            (
                data.skippedExistingCount > 0
                    ? `, pominięto ${data.skippedExistingCount} już istniejących.`
                    : "."
            ),
            false
        );

        window.setTimeout(goToSubjects, 350);
    } catch (error) {
        console.error("Error saving setup rooms:", error);

        showSetupMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się zapisać sal.",
            true
        );
    } finally {
        setSetupBusy(false);
    }
}

function goToSubjects() {
    window.location.href = "subjects.html?setup=1";
}

function setSetupBusy(disabled) {
    document.querySelectorAll(
        "#roomSetupMode input, #roomSetupMode select, #roomSetupMode button"
    ).forEach(element => {
        if (element.id === "exitRoomSetupButton") {
            return;
        }

        element.disabled = disabled;
    });
}

function showSetupMessage(message, isError) {
    const element =
        document.getElementById("roomSetupMessage");

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
                .filter(item =>
                    typeof item === "string"
                );

        if (messages.length > 0) {
            return messages.join(" ");
        }
    }

    return fallback;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}
