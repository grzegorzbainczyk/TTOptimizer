import { initializeI18n, t } from "./i18n.js";
import { initializeSimpleXlsxImport } from "./simple-xlsx-import.js";

let availableTeachers = [];
let availableRooms = [];
let availableSchoolUnits = [];
let availableClasses = [];

const SCHOOL_TYPE_MAX_GRADE = {
    1: 8,
    2: 4,
    3: 5,
    4: 3,
    5: 2
};

const SCHOOL_TYPE_NAME_TO_NUMBER = {
    PrimarySchool: 1,
    GeneralSecondarySchool: 2,
    TechnicalSecondarySchool: 3,
    VocationalSchoolFirstDegree: 4,
    VocationalSchoolSecondDegree: 5
};

function normalizeSchoolType(value) {
    if (typeof value === "number" && Number.isInteger(value)) {
        return value;
    }

    const text = String(value ?? "").trim();

    if (/^\d+$/.test(text)) {
        return Number(text);
    }

    return SCHOOL_TYPE_NAME_TO_NUMBER[text] ?? 0;
}

function getMaxGradeForSchoolUnit(schoolUnitId) {
    const schoolUnit = availableSchoolUnits.find(
        item => Number(item.id) === Number(schoolUnitId)
    );

    const schoolType = normalizeSchoolType(schoolUnit?.schoolType);
    return SCHOOL_TYPE_MAX_GRADE[schoolType] ?? 8;
}

function getFirstMissingGrade(schoolUnitId) {
    const maxGrade = getMaxGradeForSchoolUnit(schoolUnitId);

    const used = new Set(
        availableClasses
            .filter(item => Number(item.schoolUnitId) === Number(schoolUnitId))
            .map(item => Number(item.grade))
            .filter(Number.isInteger)
    );

    for (let grade = 1; grade <= maxGrade; grade++) {
        if (!used.has(grade)) {
            return grade;
        }
    }

    return 1;
}

function populateGradeOptions(preferredGrade = null) {
    const schoolSelect = document.getElementById("schoolUnitId");
    const gradeSelect = document.getElementById("classGrade");

    if (!schoolSelect || !gradeSelect) {
        return;
    }

    const schoolUnitId = Number(schoolSelect.value);
    const maxGrade = getMaxGradeForSchoolUnit(schoolUnitId);

    gradeSelect.innerHTML = "";

    for (let grade = 1; grade <= maxGrade; grade++) {
        const option = document.createElement("option");
        option.value = String(grade);
        option.textContent = String(grade);
        gradeSelect.appendChild(option);
    }

    const desired = Number(preferredGrade);

    gradeSelect.value =
        Number.isInteger(desired) &&
        desired >= 1 &&
        desired <= maxGrade
            ? String(desired)
            : String(getFirstMissingGrade(schoolUnitId));
}

function renderGradeCompleteness() {
    const container =
        document.getElementById("classGradeCompleteness");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (availableSchoolUnits.length === 0) {
        container.textContent =
            t("classes.noSchools", "Najpierw dodaj szkołę.");
        return;
    }

    for (const school of availableSchoolUnits) {
        const maxGrade =
            getMaxGradeForSchoolUnit(school.id);

        const defined = new Set(
            availableClasses
                .filter(item =>
                    Number(item.schoolUnitId) === Number(school.id)
                )
                .map(item => Number(item.grade))
                .filter(Number.isInteger)
        );

        const missing = [];

        for (let grade = 1; grade <= maxGrade; grade++) {
            if (!defined.has(grade)) {
                missing.push(grade);
            }
        }

        const card = document.createElement("div");
        card.className = "school-grade-completeness-card";

        const title = document.createElement("strong");
        title.textContent = school.name;

        const expected = document.createElement("span");
        expected.textContent =
            t("classes.expectedGrades", "Oczekiwane roczniki: 1–{max}")
                .replace("{max}", maxGrade);

        const status = document.createElement("span");

        if (missing.length === 0) {
            status.textContent =
                t("classes.allGradesDefined", "Wszystkie roczniki są zdefiniowane.");
            status.className = "grade-status-complete";
        } else {
            status.textContent =
                t("classes.missingGrades", "Brakuje roczników: {grades}")
                    .replace("{grades}", missing.join(", "));
            status.className = "grade-status-warning";
        }

        card.append(title, expected, status);
        container.appendChild(card);
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    await initializeI18n();
    document.title = t("classes.pageTitle", "ClassFlow - Classes");
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

    document.getElementById("schoolUnitId")
        ?.addEventListener("change", () => {
            populateGradeOptions();
        });

    initializeSimpleXlsxImport({
        resourceName: "class",
        pluralName: "Classes",
        previewUrl: "/api/classes/import/preview",
        importUrlFactory: () => {
            const organizationId = window.appContext.requireOrganizationId();
            const schoolUnitId = getSelectedImportSchoolUnitId();

            if (!schoolUnitId) {
                throw new Error("Select a school for imported classes.");
            }

            return `/api/classes/import?organizationId=${encodeURIComponent(organizationId)}&schoolUnitId=${encodeURIComponent(schoolUnitId)}`;
        },
        importButtonId: "importClassesButton",
        fileInputId: "classImportFileInput",
        previewSectionId: "classImportPreviewSection",
        previewTableId: "classImportPreviewTable",
        messageId: "classImportMessage",
        confirmButtonId: "confirmClassesImportButton",
        closeButtonId: "closeClassesImportPreviewButton",
        onImported: loadClasses
    });

    await refreshPageData();
});

async function refreshPageData() {
    await Promise.all([
        loadTeachers(),
        loadRooms(),
        loadSchoolUnits()
    ]);

    await loadClasses();
}

async function loadSchoolUnits() {
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
                    `Could not load schools. Status: ${response.status}`
                )
            );
        }

        availableSchoolUnits = Array.isArray(data)
            ? data
            : data?.schoolUnits ?? [];

        populateSchoolUnitOptions();
    } catch (error) {
        console.error("Error loading schools:", error);
        availableSchoolUnits = [];
        populateSchoolUnitOptions();
    }
}

function populateSchoolUnitOptions() {
    const formSelect =
        document.getElementById("schoolUnitId");

    const importSelect =
        document.getElementById("classImportSchoolUnitId");

    for (const select of [formSelect, importSelect]) {
        if (!select) {
            continue;
        }

        const selectedValue = select.value;
        select.innerHTML = "";

        for (const schoolUnit of availableSchoolUnits) {
            const option = document.createElement("option");
            option.value = String(schoolUnit.id);
            option.textContent = schoolUnit.name;
            select.appendChild(option);
        }

        if (selectedValue &&
            availableSchoolUnits.some(
                item => String(item.id) === selectedValue
            )) {
            select.value = selectedValue;
        } else if (availableSchoolUnits.length === 1) {
            select.value = String(availableSchoolUnits[0].id);
        }
    }

    const hideSelector = availableSchoolUnits.length === 1;

    document.getElementById("schoolUnitField")
        ?.toggleAttribute("hidden", hideSelector);

    document.getElementById("classImportSchoolUnitField")
        ?.toggleAttribute("hidden", hideSelector);
}

function getSelectedImportSchoolUnitId() {
    if (availableSchoolUnits.length === 1) {
        return availableSchoolUnits[0].id;
    }

    const value =
        document.getElementById("classImportSchoolUnitId")?.value;

    return value ? Number(value) : null;
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
                    `${t("teachers.loadFailed", "Could not load teachers.")} Status: ${response.status}`
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
                    `${t("rooms.loadFailed", "Could not load rooms.")} Status: ${response.status}`
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
            <td colspan="6" class="teachers-table-state">Loading classes...</td>
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
                    `${t("classes.loadFailed", "Could not load classes.")} Status: ${response.status}`
                )
            );
        }

        const classes = Array.isArray(data)
            ? data
            : data?.classes ?? data?.classGroups ?? [];

        availableClasses = classes;
        renderClasses(classes);
        updateClassesCount(classes.length);
        renderGradeCompleteness();
    } catch (error) {
        console.error("Error loading classes:", error);

        availableClasses = [];
        renderGradeCompleteness();
        updateClassesCount(null);

        showClassesError(
            error instanceof Error
                ? error.message
                : t("classes.loadFailed", "Could not load classes.")
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
                <td colspan="6" class="teachers-table-state">No classes found.</td>
            </tr>
        `;

        return;
    }

    classes.forEach(classGroup => {
        const row =
            document.createElement("tr");

        row.className = "teacher-row";

        row.appendChild(
            createTableCell(classGroup.name)
        );

        row.appendChild(
            createTableCell(classGroup.schoolUnitName ?? "")
        );

        row.appendChild(
            createTableCell(classGroup.grade ?? "")
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
        editButton.className =
            "small-button teacher-action-button teacher-edit-button";
        editButton.textContent = t("common.edit", "Edit");

        editButton.addEventListener("click", () => {
            openEditClassForm(classGroup);
        });

        const availabilityButton =
            document.createElement("button");

        availabilityButton.type = "button";
        availabilityButton.className =
            "small-button teacher-action-button teacher-availability-button";
        availabilityButton.textContent = t("common.availability", "Availability");

        availabilityButton.addEventListener("click", () => {
            const url =
                "availability.html" +
                "?resourceType=class" +
                `&resourceId=${encodeURIComponent(
                    classGroup.id
                )}`;

            window.location.href = url;
        });


        const preferencesButton =
            document.createElement("button");

        preferencesButton.type = "button";
        preferencesButton.className =
            "small-button teacher-action-button class-preferences-button";
        preferencesButton.textContent = t("common.preferences", "Preferences");

        preferencesButton.addEventListener("click", () => {
            const url =
                "class-preferences.html" +
                `?classGroupId=${encodeURIComponent(
                    classGroup.id
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
                await deleteClass(classGroup);
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

function updateClassesCount(count) {
    const countElement =
        document.getElementById("classesCount");

    if (!countElement) {
        return;
    }

    if (!Number.isInteger(count)) {
        countElement.textContent =
            t("classes.countUnknown", "Could not determine the number of classes.");
        return;
    }

    countElement.textContent =
        count === 1
            ? t("classes.countOne", "1 class")
            : t("classes.countMany", "{count} classes").replace("{count}", count);
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
    emptyOption.textContent = t("common.none", "None");

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
    emptyOption.textContent = t("common.none", "None");

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

    if (availableSchoolUnits.length > 0) {
        document.getElementById("schoolUnitId").value =
            String(availableSchoolUnits[0].id);
        populateGradeOptions();
    }

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
    ).textContent = t("classes.add", "Add class");

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

    document.getElementById("schoolUnitId").value =
        classGroup.schoolUnitId?.toString() ?? "";

    populateGradeOptions(classGroup.grade);

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
    ).textContent = t("classes.edit", "Edit class");

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

    const schoolUnitValue =
        document.getElementById("schoolUnitId").value;

    const gradeValue =
        document.getElementById("classGrade").value;

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
            t("classes.nameRequired", "Class name is required."),
            true
        );

        return;
    }

    if (!schoolUnitValue) {
        showClassFormMessage(
            t("classes.schoolRequired", "Wybierz szkołę dla klasy."),
            true
        );
        return;
    }

    if (!gradeValue) {
        showClassFormMessage(
            t("classes.gradeRequired", "Wybierz rocznik."),
            true
        );
        return;
    }

    const requestBody = {
        schoolUnitId: Number(schoolUnitValue),
        grade: Number(gradeValue),
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
                    `${t("classes.saveFailed", "Could not save class.")} Status: ${response.status}`
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
                : t("classes.saveFailed", "Could not save class."),
            true
        );
    }
}

async function deleteClass(classGroup) {
    const confirmed = window.confirm(
        t("classes.deleteConfirm", "Delete class {name}?")
            .replace("{name}", classGroup.name ?? "")
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
                    `${t("classes.deleteFailed", "Could not delete class.")} Status: ${response.status}`
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
                : t("classes.deleteFailed", "Could not delete class.")
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

    cell.colSpan = 6;
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