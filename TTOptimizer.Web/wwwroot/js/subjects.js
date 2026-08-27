import { initializeI18n, t } from "./i18n.js";
import { initializeSimpleXlsxImport } from "./simple-xlsx-import.js";
import { initializeSubjectSetupMode, prepareOfficialSubjectCandidates } from "./main/subjects-setup.js";

let currentSubjects = [];
let officialImportSchoolUnits = [];
let officialImportCandidates = [];

document.addEventListener("DOMContentLoaded", async () => {
    await initializeI18n();
    const setupHandled = await initializeSubjectSetupMode();
    if (setupHandled) return;
    document.title = t("subjects.pageTitle", "ClassFlow - Subjects");
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

    document.getElementById("importOfficialSubjectsButton")
        ?.addEventListener("click", openOfficialSubjectImport);

    document.getElementById("closeOfficialSubjectImportButton")
        ?.addEventListener("click", closeOfficialSubjectImport);

    document.getElementById("officialSubjectImportCloseIcon")
        ?.addEventListener("click", closeOfficialSubjectImport);

    document.getElementById("prepareOfficialSubjectImportButton")
        ?.addEventListener("click", prepareOfficialSubjectImport);

    document.getElementById("selectAllOfficialSubjectsButton")
        ?.addEventListener("click", () => setAllOfficialSubjectSelections(true));

    document.getElementById("clearOfficialSubjectSelectionButton")
        ?.addEventListener("click", () => setAllOfficialSubjectSelections(false));

    document.getElementById("confirmOfficialSubjectImportButton")
        ?.addEventListener("click", importSelectedOfficialSubjects);

    document.getElementById("officialSubjectImportModal")
        ?.addEventListener("click", event => {
            if (event.target.id === "officialSubjectImportModal") {
                closeOfficialSubjectImport();
            }
        });

    initializeSimpleXlsxImport({
        resourceName: "subject",
        pluralName: "Subjects",
        previewUrl: "/api/subjects/import/preview",
        importUrlFactory: () => {
            const organizationId =
                window.appContext.requireOrganizationId();

            return `/api/subjects/import?organizationId=${encodeURIComponent(
                organizationId
            )}`;
        },
        importButtonId: "importSubjectsButton",
        fileInputId: "subjectImportFileInput",
        previewSectionId: "subjectImportPreviewSection",
        previewTableId: "subjectImportPreviewTable",
        messageId: "subjectImportMessage",
        confirmButtonId: "confirmSubjectsImportButton",
        closeButtonId: "closeSubjectsImportPreviewButton",
        onImported: loadSubjects
    });

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
            <td colspan="3" class="teachers-table-state">Loading subjects...</td>
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
                    `${t("subjects.loadFailed", "Could not load subjects.")} Status: ${response.status}`
                )
            );
        }

        const subjects = Array.isArray(data)
            ? data
            : data?.subjects ?? [];

        currentSubjects = subjects;
        renderSubjects(subjects);
        updateSubjectsCount(subjects.length);
    } catch (error) {
        console.error(
            "Error loading subjects:",
            error
        );

        updateSubjectsCount(null);

        showSubjectsError(
            error instanceof Error
                ? error.message
                : t("subjects.loadFailed", "Could not load subjects.")
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
                <td colspan="3" class="teachers-table-state">No subjects found.</td>
            </tr>
        `;

        return;
    }

    subjects.forEach(subject => {
        const row = document.createElement("tr");

        row.className = "teacher-row";

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
        editButton.className =
            "small-button teacher-action-button teacher-edit-button";
        editButton.textContent = t("common.edit", "Edit");

        editButton.addEventListener(
            "click",
            () => {
                openEditSubjectForm(subject);
            }
        );


        const availabilityButton =
            document.createElement("button");

        availabilityButton.type = "button";
        availabilityButton.className =
            "small-button teacher-action-button teacher-availability-button";
        availabilityButton.textContent = t("common.availability", "Availability");

        availabilityButton.addEventListener("click", () => {
            const url =
                "availability.html" +
                "?resourceType=subject" +
                `&resourceId=${encodeURIComponent(
                    subject.id
                )}`;

            window.location.href = url;
        });

        const preferencesButton =
            document.createElement("button");

        preferencesButton.type = "button";
        preferencesButton.className =
            "small-button teacher-action-button subject-preferences-button";
        preferencesButton.textContent = t("common.preferences", "Preferences");

        preferencesButton.addEventListener("click", () => {
            const url =
                "subject-preferences.html" +
                `?subjectId=${encodeURIComponent(
                    subject.id
                )}`;

            window.location.href = url;
        });

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "small-button teacher-action-button teacher-delete-button";
        deleteButton.textContent = t("common.delete", "Delete");

        deleteButton.addEventListener(
            "click",
            async () => {
                await deleteSubject(subject);
            }
        );

                const actionsContainer =
            document.createElement("div");

        actionsContainer.className =
            "teacher-actions";

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


async function openOfficialSubjectImport() {
    closeSubjectForm();

    const modal =
        document.getElementById("officialSubjectImportModal");

    if (!modal) {
        return;
    }

    modal.hidden = false;
    document.body.classList.add("modal-open");

    officialImportCandidates = [];

    const preview =
        document.getElementById("officialSubjectImportPreview");

    if (preview) {
        preview.hidden = true;
    }

    toggleOfficialImportPreviewActions(false);
    showOfficialSubjectImportMessage(
        "Wczytywanie szkół...",
        false
    );

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/schoolunits?organizationId=${encodeURIComponent(organizationId)}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się wczytać szkół. Status: ${response.status}`
                )
            );
        }

        officialImportSchoolUnits =
            Array.isArray(data)
                ? data
                : data?.schoolUnits ?? [];

        populateOfficialSubjectSchoolSelect();

        if (officialImportSchoolUnits.length === 0) {
            showOfficialSubjectImportMessage(
                "Najpierw dodaj szkołę na stronie Szkoła.",
                true
            );
            return;
        }

        showOfficialSubjectImportMessage("", false);
    } catch (error) {
        console.error(
            "Error loading schools for official subject import:",
            error
        );

        showOfficialSubjectImportMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się wczytać szkół.",
            true
        );
    }
}

function closeOfficialSubjectImport() {
    const modal =
        document.getElementById("officialSubjectImportModal");

    if (modal) {
        modal.hidden = true;
    }

    document.body.classList.remove("modal-open");
    officialImportCandidates = [];
    showOfficialSubjectImportMessage("", false);
}

function populateOfficialSubjectSchoolSelect() {
    const select =
        document.getElementById("officialSubjectSchoolUnitId");

    if (!select) {
        return;
    }

    select.innerHTML = "";

    for (const school of officialImportSchoolUnits) {
        const option = document.createElement("option");
        option.value = String(school.id);
        option.textContent =
            `${school.name} · ${formatOfficialSchoolType(school.schoolType)}`;
        select.appendChild(option);
    }
}

async function prepareOfficialSubjectImport() {
    const schoolSelect =
        document.getElementById("officialSubjectSchoolUnitId");

    const schoolYear =
        document.getElementById("officialSubjectSchoolYear")
            ?.value ?? "2026/2027";

    const schoolUnitId =
        Number(schoolSelect?.value);

    const schoolUnit =
        officialImportSchoolUnits.find(
            item => Number(item.id) === schoolUnitId
        );

    if (!schoolUnit) {
        showOfficialSubjectImportMessage(
            "Wybierz szkołę.",
            true
        );
        return;
    }

    setOfficialSubjectImportBusy(true);
    showOfficialSubjectImportMessage(
        "Przygotowywanie listy przedmiotów...",
        false
    );

    try {
        const result =
            await prepareOfficialSubjectCandidates({
                schoolUnits: [schoolUnit],
                existingSubjects: currentSubjects,
                schoolYear
            });

        officialImportCandidates = result.candidates;

        renderOfficialSubjectImportPreview();

        const preview =
            document.getElementById("officialSubjectImportPreview");

        if (preview) {
            preview.hidden = false;
        }

        toggleOfficialImportPreviewActions(true);
        showOfficialSubjectImportMessage("", false);
    } catch (error) {
        console.error(
            "Error preparing official subject import:",
            error
        );

        showOfficialSubjectImportMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się przygotować listy przedmiotów.",
            true
        );
    } finally {
        setOfficialSubjectImportBusy(false);
    }
}

function renderOfficialSubjectImportPreview() {
    const tbody =
        document.querySelector("#officialSubjectImportTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    for (const item of officialImportCandidates) {
        const row = document.createElement("tr");

        const selectCell = document.createElement("td");
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked =
            item.selected && !item.alreadyExists;
        checkbox.disabled = item.alreadyExists;

        checkbox.addEventListener("change", () => {
            item.selected = checkbox.checked;
            updateOfficialSubjectImportSummary();
        });

        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);
        row.appendChild(createTableCell(item.name));
        row.appendChild(createTableCell(item.appliesTo ?? ""));
        row.appendChild(
            createTableCell(
                item.alreadyExists
                    ? "Już istnieje"
                    : "Nowy"
            )
        );

        tbody.appendChild(row);
    }

    updateOfficialSubjectImportSummary();
}

function updateOfficialSubjectImportSummary() {
    const selectedCount =
        officialImportCandidates.filter(
            item => item.selected && !item.alreadyExists
        ).length;

    const existingCount =
        officialImportCandidates.filter(
            item => item.alreadyExists
        ).length;

    const summary =
        document.getElementById("officialSubjectImportSummary");

    if (summary) {
        summary.textContent =
            `Do dodania: ${selectedCount}` +
            (
                existingCount > 0
                    ? ` · Już istnieje: ${existingCount}`
                    : ""
            );
    }

    const button =
        document.getElementById("confirmOfficialSubjectImportButton");

    if (button) {
        button.disabled = selectedCount === 0;
        button.textContent =
            selectedCount === 0
                ? "Brak nowych przedmiotów"
                : `Dodaj ${selectedCount} przedmiotów`;
    }
}

function toggleOfficialImportPreviewActions(visible) {
    for (const id of [
        "selectAllOfficialSubjectsButton",
        "clearOfficialSubjectSelectionButton",
        "confirmOfficialSubjectImportButton"
    ]) {
        const element = document.getElementById(id);
        if (element) {
            element.hidden = !visible;
        }
    }
}

function setAllOfficialSubjectSelections(selected) {
    for (const item of officialImportCandidates) {
        if (!item.alreadyExists) {
            item.selected = selected;
        }
    }

    renderOfficialSubjectImportPreview();
}

async function importSelectedOfficialSubjects() {
    const names =
        officialImportCandidates
            .filter(
                item =>
                    item.selected &&
                    !item.alreadyExists
            )
            .map(item => item.name);

    if (names.length === 0) {
        return;
    }

    setOfficialSubjectImportBusy(true);
    showOfficialSubjectImportMessage(
        "Dodawanie przedmiotów...",
        false
    );

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

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Nie udało się dodać przedmiotów. Status: ${response.status}`
                )
            );
        }

        await loadSubjects();

        showOfficialSubjectImportMessage(
            `Dodano ${data?.importedCount ?? names.length} przedmiotów` +
            (
                data?.skippedExistingCount > 0
                    ? `, pominięto ${data.skippedExistingCount} już istniejących.`
                    : "."
            ),
            false
        );

        officialImportCandidates =
            officialImportCandidates.map(item => ({
                ...item,
                alreadyExists:
                    item.alreadyExists ||
                    names.some(
                        name =>
                            name.localeCompare(
                                item.name,
                                "pl",
                                { sensitivity: "base" }
                            ) === 0
                    ),
                selected: false
            }));

        renderOfficialSubjectImportPreview();
    } catch (error) {
        console.error(
            "Error importing official subjects:",
            error
        );

        showOfficialSubjectImportMessage(
            error instanceof Error
                ? error.message
                : "Nie udało się dodać przedmiotów.",
            true
        );
    } finally {
        setOfficialSubjectImportBusy(false);
    }
}

function setOfficialSubjectImportBusy(disabled) {
    document.querySelectorAll(
        "#officialSubjectImportModal select, " +
        "#officialSubjectImportModal button, " +
        "#officialSubjectImportModal input"
    ).forEach(element => {
        if (
            element.id === "closeOfficialSubjectImportButton" ||
            element.id === "officialSubjectImportCloseIcon"
        ) {
            return;
        }

        element.disabled = disabled;
    });
}

function showOfficialSubjectImportMessage(message, isError) {
    const element =
        document.getElementById("officialSubjectImportMessage");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle(
        "error-message",
        Boolean(isError)
    );
}

function formatOfficialSchoolType(value) {
    switch (Number(value)) {
        case 1:
            return "Szkoła podstawowa";
        case 2:
            return "Liceum";
        case 3:
            return "Technikum";
        case 4:
            return "Branżowa I stopnia";
        case 5:
            return "Branżowa II stopnia";
        default:
            return "Nieznany typ";
    }
}

function updateSubjectsCount(count) {
    const countElement =
        document.getElementById("subjectsCount");

    if (!countElement) {
        return;
    }

    if (!Number.isInteger(count)) {
        countElement.textContent =
            t("subjects.countUnknown", "Could not determine the number of subjects.");
        return;
    }

    countElement.textContent =
        count === 1
            ? t("subjects.countOne", "1 subject")
            : t("subjects.countMany", "{count} subjects").replace("{count}", count);
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
    ).textContent = t("subjects.add", "Add subject");

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
    ).textContent = t("subjects.edit", "Edit subject");

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
            t("subjects.nameRequired", "Subject name is required."),
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
                    `${t("subjects.saveFailed", "Could not save subject.")} Status: ${response.status}`
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
                : t("subjects.saveFailed", "Could not save subject."),
            true
        );
    }
}

async function deleteSubject(subject) {
    const confirmed = window.confirm(
        t("subjects.deleteConfirm", "Delete subject {name}?")
            .replace("{name}", subject.name ?? "")
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
                    `${t("subjects.deleteFailed", "Could not delete subject.")} Status: ${response.status}`
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
                : t("subjects.deleteFailed", "Could not delete subject.")
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