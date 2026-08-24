let setupPlan = null;
let existingSubjects = [];
let preparedSubjects = [];

export async function initializeSubjectSetupMode() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("setup") !== "1") {
        return false;
    }

    document.getElementById("subjectSetupMode").hidden = false;

    const normalPage = document.getElementById("normalSubjectsPage");
    if (normalPage) {
        normalPage.hidden = true;
    }

    document.title = "ClassFlow - Konfiguracja przedmiotów";

    wireEvents();
    await loadExistingSubjects();

    return true;
}

function wireEvents() {
    document.getElementById("exitSubjectSetupButton")
        ?.addEventListener("click", () => {
            window.location.href = "main.html";
        });

    document.getElementById("backToRoomSetupButton")
        ?.addEventListener("click", () => {
            window.location.href = "rooms.html?setup=1";
        });

    document.getElementById("prepareOfficialSubjectsButton")
        ?.addEventListener("click", prepareOfficialSubjects);

    document.getElementById("selectAllSubjectsButton")
        ?.addEventListener("click", () => setAllSelections(true));

    document.getElementById("clearSubjectSelectionButton")
        ?.addEventListener("click", () => setAllSelections(false));

    document.getElementById("addCustomSubjectButton")
        ?.addEventListener("click", addCustomSubject);

    document.getElementById("customSubjectName")
        ?.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                addCustomSubject();
            }
        });

    document.getElementById("saveSetupSubjectsButton")
        ?.addEventListener("click", saveSelectedSubjects);
}

async function loadExistingSubjects() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/subjects?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się wczytać istniejących przedmiotów. Status: ${response.status}`
                )
            );
        }

        existingSubjects =
            Array.isArray(data)
                ? data
                : data?.subjects ?? [];
    } catch (error) {
        console.error("Error loading existing subjects:", error);

        showMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się wczytać istniejących przedmiotów.",
            true
        );
    }
}

async function prepareOfficialSubjects() {
    setBusy(true);
    showMessage("Przygotowywanie listy przedmiotów...", false);

    try {
        const response = await fetch(
            "data/teaching-plans/pl/primary/2026-2027.json",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(
                `Nie udało się wczytać danych ramowego planu. Status: ${response.status}`
            );
        }

        setupPlan = await response.json();

        const existingNameSet =
            new Set(
                existingSubjects.map(item =>
                    normalize(item.name)
                )
            );

        preparedSubjects = setupPlan.subjects.map((item, index) => ({
            id: `official-${index}`,
            name: item.name,
            category: item.category ?? "podstawowe",
            appliesTo: item.appliesTo ?? "",
            selected:
                Boolean(item.selectedByDefault) &&
                !existingNameSet.has(normalize(item.name)),
            alreadyExists:
                existingNameSet.has(normalize(item.name)),
            isCustom: false
        }));

        renderPlanInfo();
        renderSubjectList();

        document.getElementById("subjectSetupPreviewSection").hidden = false;
        showMessage("", false);
    } catch (error) {
        console.error("Error preparing official subjects:", error);

        showMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się przygotować listy przedmiotów.",
            true
        );
    } finally {
        setBusy(false);
    }
}

function renderPlanInfo() {
    const info = document.getElementById("subjectPlanInfo");
    info.hidden = false;

    document.getElementById("subjectPlanLegalAct").textContent =
        setupPlan.source?.legalAct ?? "";

    document.getElementById("subjectPlanTransitionNote").textContent =
        setupPlan.transitionNote ?? "";

    const link = document.getElementById("subjectPlanSourceLink");
    link.href = setupPlan.source?.legalActUrl ?? "#";
}

function renderSubjectList() {
    const container =
        document.getElementById("subjectSetupList");

    container.innerHTML = "";

    const categoryLabels = {
        podstawowe: "Podstawowe",
        nowe: "Nowy plan",
        przejściowe: "Plan przejściowy",
        pozostałe: "Pozostałe zajęcia",
        opcjonalne: "Opcjonalne"
    };

    const categoryOrder = [
        "podstawowe",
        "nowe",
        "przejściowe",
        "pozostałe",
        "opcjonalne",
        "własne"
    ];

    for (const category of categoryOrder) {
        const items =
            preparedSubjects.filter(item =>
                (item.isCustom ? "własne" : item.category) === category
            );

        if (items.length === 0) {
            continue;
        }

        const group =
            document.createElement("section");

        group.className = "subject-setup-group";

        const title =
            category === "własne"
                ? "Dodane ręcznie"
                : categoryLabels[category] ?? category;

        group.innerHTML = `
            <div class="subject-setup-group-header">
                <strong>${escapeHtml(title)}</strong>
                <span>${items.length}</span>
            </div>
            <div class="subject-setup-items"></div>
        `;

        const itemsContainer =
            group.querySelector(".subject-setup-items");

        items.forEach(item => {
            const row =
                document.createElement("label");

            row.className =
                item.alreadyExists
                    ? "subject-setup-item is-existing"
                    : "subject-setup-item";

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.checked = item.selected;
            checkbox.disabled = item.alreadyExists;

            checkbox.addEventListener("change", () => {
                item.selected = checkbox.checked;
                updateSummary();
            });

            const text =
                document.createElement("span");

            text.className = "subject-setup-item-text";

            const name =
                document.createElement("strong");

            name.textContent = item.name;
            text.appendChild(name);

            const meta =
                document.createElement("small");

            meta.textContent =
                item.alreadyExists
                    ? "Już istnieje w ClassFlow"
                    : item.appliesTo
                        ? `Klasy: ${item.appliesTo}`
                        : "Przedmiot własny";

            text.appendChild(meta);

            row.append(checkbox, text);

            if (item.isCustom) {
                const remove =
                    document.createElement("button");

                remove.type = "button";
                remove.className = "subject-custom-remove";
                remove.textContent = "Usuń";

                remove.addEventListener("click", event => {
                    event.preventDefault();
                    preparedSubjects =
                        preparedSubjects.filter(candidate =>
                            candidate.id !== item.id
                        );
                    renderSubjectList();
                });

                row.appendChild(remove);
            }

            itemsContainer.appendChild(row);
        });

        container.appendChild(group);
    }

    updateSummary();
}

function updateSummary() {
    const selectedCount =
        preparedSubjects.filter(item =>
            item.selected && !item.alreadyExists
        ).length;

    const existingCount =
        preparedSubjects.filter(item =>
            item.alreadyExists
        ).length;

    const summary =
        document.getElementById("subjectSetupSummary");

    summary.textContent =
        `${selectedCount} wybranych do dodania` +
        (existingCount > 0
            ? ` · ${existingCount} już istnieje`
            : "");

    const existingInfo =
        document.getElementById("subjectSetupExistingInfo");

    existingInfo.hidden =
        existingCount === 0;

    if (existingCount > 0) {
        existingInfo.textContent =
            `${existingCount} przedmiotów z oficjalnej listy jest już w bazie. ` +
            "Nie będą tworzone ponownie.";
    }

    const saveButton =
        document.getElementById("saveSetupSubjectsButton");

    saveButton.disabled = false;

    saveButton.textContent =
        selectedCount === 0
            ? "Pomiń i przejdź dalej →"
            : `Dodaj ${selectedCount} przedmiotów →`;
}

function setAllSelections(selected) {
    preparedSubjects.forEach(item => {
        if (!item.alreadyExists) {
            item.selected = selected;
        }
    });

    renderSubjectList();
}

function addCustomSubject() {
    const input =
        document.getElementById("customSubjectName");

    const name =
        input.value.trim();

    if (!name) {
        return;
    }

    const normalized =
        normalize(name);

    const duplicate =
        preparedSubjects.some(item =>
            normalize(item.name) === normalized
        ) ||
        existingSubjects.some(item =>
            normalize(item.name) === normalized
        );

    if (duplicate) {
        showMessage(
            `Przedmiot "${name}" już znajduje się na liście.`,
            true
        );
        return;
    }

    preparedSubjects.push({
        id: `custom-${Date.now()}-${Math.random()}`,
        name,
        category: "własne",
        appliesTo: "",
        selected: true,
        alreadyExists: false,
        isCustom: true
    });

    input.value = "";
    showMessage("", false);
    renderSubjectList();
}

async function saveSelectedSubjects() {
    const names =
        preparedSubjects
            .filter(item =>
                item.selected && !item.alreadyExists
            )
            .map(item => item.name);

    if (names.length === 0) {
        window.location.href = "teachers.html?setup=1";
        return;
    }

    setBusy(true);
    showMessage("Dodawanie przedmiotów...", false);

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/subjects/import?organizationId=${encodeURIComponent(organizationId)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ names })
            }
        );

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się dodać przedmiotów. Status: ${response.status}`
                )
            );
        }

        showMessage(
            `Dodano ${data.importedCount ?? names.length} przedmiotów` +
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
        console.error("Error importing setup subjects:", error);

        showMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się dodać przedmiotów.",
            true
        );
    } finally {
        setBusy(false);
    }
}

function setBusy(disabled) {
    document.querySelectorAll(
        "#subjectSetupMode input, #subjectSetupMode select, #subjectSetupMode button"
    ).forEach(element => {
        if (
            element.id === "exitSubjectSetupButton" ||
            element.id === "backToRoomSetupButton"
        ) {
            return;
        }

        element.disabled = disabled;
    });
}

function showMessage(message, isError) {
    const element =
        document.getElementById("subjectSetupMessage");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle(
        "form-message-error",
        Boolean(isError)
    );
}

function normalize(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("pl");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
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
