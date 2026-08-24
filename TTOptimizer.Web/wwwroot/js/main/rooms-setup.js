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

        if (setupBuildings.length === 0) {
            throw new Error(
                "Najpierw dodaj co najmniej jeden budynek."
            );
        }

        renderBuildingGenerators();

        if (document.getElementById("manualRoomRows")?.children.length === 0) {
            addManualRoomRow();
        }

        showSetupMessage("", false);
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

        addRangeRow(
            rangeList,
            index === 0
                ? { start: 1, end: 20 }
                : { start: 1, end: 10 }
        );
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

    const buildingOptions = setupBuildings
        .map(building => `
            <option value="${building.id}"
                    ${Number(values.buildingId) === Number(building.id) ? "selected" : ""}>
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
    setupPreviewRooms = collectPreviewRooms();

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

    const existingNameSet =
        new Set(
            setupExistingRooms.map(room =>
                room.name.toLocaleLowerCase("pl")
            )
        );

    const existingInPreview =
        setupPreviewRooms
            .filter(room =>
                existingNameSet.has(
                    room.name.toLocaleLowerCase("pl")
                )
            )
            .map(room => room.name);

    const warningMessages = [];

    if (duplicateNames.size > 0) {
        warningMessages.push(
            `Powtarzające się nazwy w podglądzie: ${[...duplicateNames].join(", ")}. ` +
            "Nazwy sal muszą być unikalne w całej szkole. Użyj prefiksu budynku, np. A-101."
        );
    }

    if (existingInPreview.length > 0) {
        warningMessages.push(
            `${existingInPreview.length} sal już istnieje i zostanie pominiętych przy zapisie.`
        );
    }

    warnings.hidden = warningMessages.length === 0;
    warnings.innerHTML = warningMessages
        .map(message => `<p>⚠ ${escapeHtml(message)}</p>`)
        .join("");

    if (setupPreviewRooms.length === 0) {
        summary.textContent =
            "Jeszcze nic nie wygenerowano.";

        preview.innerHTML =
            `<p class="room-preview-empty">
                Dodaj zakres numerów albo wpisz sale ręcznie.
             </p>`;

        return;
    }

    summary.textContent =
        `${setupPreviewRooms.length} sal w podglądzie` +
        (existingInPreview.length > 0
            ? ` · ${existingInPreview.length} już istnieje`
            : "");

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

            const alreadyExists =
                existingNameSet.has(
                    room.name.toLocaleLowerCase("pl")
                );

            chip.className =
                alreadyExists
                    ? "room-preview-chip is-existing"
                    : "room-preview-chip";

            chip.textContent =
                alreadyExists
                    ? `${room.name} · istnieje`
                    : room.name;

            chips.appendChild(chip);
        });

        preview.appendChild(group);
    }
}

async function saveSetupRooms() {
    renderSetupPreview();

    if (setupPreviewRooms.length === 0) {
        showSetupMessage(
            "Dodaj co najmniej jedną salę.",
            true
        );
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

        window.setTimeout(() => {
            window.location.href = "teachers.html?setup=1";
        }, 500);
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
