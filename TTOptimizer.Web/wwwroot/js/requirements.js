let availableTeachers = [];
let availableStudentGroups = [];
let availableSubjects = [];
let availableClasses = [];
let curriculumDefinition = null;
let curriculumPreviewRows = [];
let curriculumTeacherAssignments = [];

document.addEventListener("DOMContentLoaded", async () => {
    configureLessonsPageLanguage();

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

    document.getElementById("importCurriculumButton")
        ?.addEventListener("click", openCurriculumImport);

    document.getElementById("cancelCurriculumImportButton")
        ?.addEventListener("click", closeCurriculumImport);

    document.getElementById("loadCurriculumPreviewButton")
        ?.addEventListener("click", loadCurriculumPreview);

    document.getElementById("confirmCurriculumImportButton")
        ?.addEventListener("click", confirmCurriculumImport);

    saveRequirementButton?.addEventListener(
        "click",
        saveRequirement
    );

    cancelRequirementButton?.addEventListener(
        "click",
        closeRequirementForm
    );

    document.getElementById("newStudentGroupButton")
        ?.addEventListener("click", openNewStudentGroupPanel);

    document.getElementById("cancelNewStudentGroupButton")
        ?.addEventListener("click", closeNewStudentGroupPanel);

    document.getElementById("saveNewStudentGroupButton")
        ?.addEventListener("click", saveNewStudentGroup);

    document.getElementById("newSubjectButton")
        ?.addEventListener("click", openNewSubjectPanel);

    document.getElementById("cancelNewSubjectButton")
        ?.addEventListener("click", closeNewSubjectPanel);

    document.getElementById("saveNewSubjectButton")
        ?.addEventListener("click", saveNewSubject);

    document.getElementById("requirementIsAdditional")
        ?.addEventListener("change", handleAdditionalLessonChanged);

    await refreshPageData();
});

function getLessonsPageText() {
    const language =
        localStorage.getItem("classFlowLanguage") === "pl"
            ? "pl"
            : "en";

    if (language === "pl") {
        return {
            pageLabel: "Dane planu lekcji",
            pageTitle: "Lekcje",
            pageSubtitle:
                "Zdefiniuj lekcje, które mają zostać uwzględnione w planie.",
            listTitle: "Lista lekcji",
            listDescription:
                "Określ grupę uczniów, przedmiot, nauczyciela i liczbę lekcji w tygodniu.",
            addLesson: "Dodaj lekcję",
            importCurriculum: "Importuj z ramowego planu",
            curriculumTitle: "Import z ramowego planu nauczania",
            curriculumClass: "Klasa",
            curriculumGrade: "Poziom klasy",
            curriculumSchoolYear: "Rok szkolny",
            curriculumLoadPreview: "Wczytaj podgląd",
            curriculumCreateLessons: "Utwórz lekcje",
            curriculumSubject: "Przedmiot",
            curriculumHours: "Godziny/tydzień",
            curriculumMappedSubject: "Przedmiot w ClassFlow",
            curriculumTeacher: "Nauczyciel",
            curriculumStatus: "Status",
            curriculumReady: "Gotowe",
            curriculumMissingSubject: "Wybierz przedmiot",
            curriculumMissingTeacher: "Wybierz nauczyciela",
            curriculumSelectClass: "Wybierz klasę",
            curriculumSelectGrade: "Wybierz poziom",
            curriculumCreated: "Lekcje zostały utworzone.",
            curriculumPartialError: "Nie udało się utworzyć wszystkich lekcji.",
            curriculumCreateSubject: "Utwórz przedmiot",
            curriculumCreateSubjectStatus: "Przedmiot zostanie utworzony",
            curriculumMultipleTeachers: "Kilku przypisanych nauczycieli",
            curriculumContextError: "Nie udało się wczytać domyślnych przypisań nauczycieli.",
            addLessonForm: "Dodaj lekcję",
            editLessonForm: "Edytuj lekcję",
            additionalLesson: "Zajęcia dodatkowe",
            additionalLessonHelp:
                "Zajęcia dodatkowe otrzymują domyślnie niski priorytet.",
            newItem: "+ Nowy",
            addStudentGroup: "Dodaj grupę uczniów",
            addSubject: "Dodaj przedmiot",
            cancel: "Anuluj",
            back: "Powrót",
            refresh: "Odśwież"
        };
    }

    return {
        pageLabel: "Timetable input",
        pageTitle: "Lessons",
        pageSubtitle:
            "Define the lessons that should be included in the timetable.",
        listTitle: "Lessons list",
        listDescription:
            "Choose the student group, subject, teacher and number of lessons per week.",
        addLesson: "Add lesson",
        importCurriculum: "Import from curriculum",
        curriculumTitle: "Import from official curriculum",
        curriculumClass: "Class",
        curriculumGrade: "Grade",
        curriculumSchoolYear: "School year",
        curriculumLoadPreview: "Load preview",
        curriculumCreateLessons: "Create lessons",
        curriculumSubject: "Subject",
        curriculumHours: "Hours/week",
        curriculumMappedSubject: "ClassFlow subject",
        curriculumTeacher: "Teacher",
        curriculumStatus: "Status",
        curriculumReady: "Ready",
        curriculumMissingSubject: "Select subject",
        curriculumMissingTeacher: "Select teacher",
        curriculumSelectClass: "Select class",
        curriculumSelectGrade: "Select grade",
        curriculumCreated: "Lessons were created.",
        curriculumPartialError: "Not all lessons could be created.",
        curriculumCreateSubject: "Create subject",
        curriculumCreateSubjectStatus: "Subject will be created",
        curriculumMultipleTeachers: "Multiple assigned teachers",
        curriculumContextError: "Could not load default teacher assignments.",
        addLessonForm: "Add lesson",
        editLessonForm: "Edit lesson",
        additionalLesson: "Additional lesson",
        additionalLessonHelp:
            "Additional lessons start with Low priority.",
        newItem: "+ New",
        addStudentGroup: "Add student group",
        addSubject: "Add subject",
        cancel: "Cancel",
        back: "Back",
        refresh: "Refresh"
    };
}

function configureLessonsPageLanguage() {
    const text = getLessonsPageText();

    document.title =
        `ClassFlow - ${text.pageTitle}`;

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    };

    setText("requirementsPageLabel", text.pageLabel);
    setText("requirementsPageTitle", text.pageTitle);
    setText("requirementsPageSubtitle", text.pageSubtitle);
    setText("requirementsListTitle", text.listTitle);
    setText("requirementsListDescription", text.listDescription);
    setText("addRequirementButtonLabel", text.addLesson);
    setText("importCurriculumButtonLabel", text.importCurriculum);
    setText("curriculumImportTitle", text.curriculumTitle);
    setText("curriculumClassLabel", text.curriculumClass);
    setText("curriculumGradeLabel", text.curriculumGrade);
    setText("curriculumSchoolYearLabel", text.curriculumSchoolYear);
    setText("loadCurriculumPreviewButton", text.curriculumLoadPreview);
    setText("confirmCurriculumImportButton", text.curriculumCreateLessons);
    setText("curriculumPreviewSubjectHeader", text.curriculumSubject);
    setText("curriculumPreviewHoursHeader", text.curriculumHours);
    setText("curriculumPreviewMappedSubjectHeader", text.curriculumMappedSubject);
    setText("curriculumPreviewTeacherHeader", text.curriculumTeacher);
    setText("curriculumPreviewStatusHeader", text.curriculumStatus);
    setText("requirementIsAdditionalLabel", text.additionalLesson);
    setText("requirementIsAdditionalHelp", text.additionalLessonHelp);
    setText("newStudentGroupButton", text.newItem);
    setText("newSubjectButton", text.newItem);
    setText("saveNewStudentGroupButton", text.addStudentGroup);
    setText("saveNewSubjectButton", text.addSubject);
    setText("cancelNewStudentGroupButton", text.cancel);
    setText("cancelNewSubjectButton", text.cancel);
    setText("backToMainButton", text.back);
    setText("refreshRequirementsButton", text.refresh);
}

async function refreshPageData() {
    await Promise.all([
        loadTeachers(),
        loadStudentGroups(),
        loadSubjects(),
        loadClasses()
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

async function loadStudentGroups() {
    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/student-groups?organizationId=${encodeURIComponent(
                organizationId
            )}`
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not load student groups. Status: ${response.status}`
                )
            );
        }

        availableStudentGroups = Array.isArray(data)
            ? data
            : data?.groups ?? [];

        populateStudentGroupOptions();
    } catch (error) {
        console.error("Error loading student groups:", error);

        availableStudentGroups = [];
        populateStudentGroupOptions();
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
            : data?.classes ?? data?.classGroups ?? [];

        populateNewStudentGroupClassOptions();
        populateCurriculumClassOptions();
    } catch (error) {
        console.error("Error loading classes:", error);
        availableClasses = [];
        populateNewStudentGroupClassOptions();
        populateCurriculumClassOptions();
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
            <td colspan="7" class="teachers-table-state">Loading requirements...</td>
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
        updateRequirementsCount(requirements.length);
    } catch (error) {
        console.error(
            "Error loading requirements:",
            error
        );

        updateRequirementsCount(null);

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
                <td colspan="7" class="teachers-table-state">No requirements found.</td>
            </tr>
        `;

        return;
    }

    requirements.forEach(requirement => {
        const row = document.createElement("tr");

        row.className = "teacher-row";

        row.appendChild(
            createTableCell(requirement.name)
        );

        row.appendChild(
            createTableCell(requirement.studentGroupName)
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

        row.appendChild(
            createTableCell(formatPriority(requirement.priority))
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
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            openEditRequirementForm(requirement);
        });

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "small-button teacher-action-button teacher-delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener(
            "click",
            async () => {
                await deleteRequirement(requirement);
            }
        );

                const actionsContainer =
            document.createElement("div");

        actionsContainer.className =
            "teacher-actions";

        actionsContainer.append(
            editButton,
            deleteButton
        );

        actionsCell.appendChild(actionsContainer);

        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });
}

function updateRequirementsCount(count) {
    const countElement =
        document.getElementById("requirementsCount");

    if (!countElement) {
        return;
    }

    if (!Number.isInteger(count)) {
        countElement.textContent =
            "Could not determine the number of lessons.";
        return;
    }

    countElement.textContent =
        count === 1
            ? "1 lesson"
            : `${count} lessons`;
}

function formatPriority(priority) {
    switch (Number(priority)) {
        case 0:
            return "Low";
        case 2:
            return "High";
        case 1:
        default:
            return "Normal";
    }
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

function populateStudentGroupOptions() {
    const select =
        document.getElementById(
            "requirementStudentGroupId"
        );

    if (!select) {
        return;
    }

    const selectedValue = select.value;

    select.innerHTML = "";

    const emptyOption =
        document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent = "Select student group";

    select.appendChild(emptyOption);

    availableStudentGroups.forEach(studentGroup => {
        const option =
            document.createElement("option");

        option.value = studentGroup.id;
        option.textContent = studentGroup.name;

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


function populateNewStudentGroupClassOptions() {
    const select =
        document.getElementById("newStudentGroupClassId");

    if (!select) {
        return;
    }

    const selectedValue = select.value;
    select.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Select class";
    select.appendChild(emptyOption);

    availableClasses.forEach(classGroup => {
        const option = document.createElement("option");
        option.value = classGroup.id;
        option.textContent = classGroup.name;
        select.appendChild(option);
    });

    select.value = selectedValue;
}

function openNewStudentGroupPanel() {
    const panel = document.getElementById("newStudentGroupPanel");
    if (!panel) {
        return;
    }

    document.getElementById("newStudentGroupClassId").value = "";
    document.getElementById("newStudentGroupName").value = "";
    clearQuickCreateMessage("newStudentGroupMessage");

    panel.hidden = false;
    document.getElementById("newStudentGroupName").focus();
}

function closeNewStudentGroupPanel() {
    const panel = document.getElementById("newStudentGroupPanel");
    if (panel) {
        panel.hidden = true;
    }

    clearQuickCreateMessage("newStudentGroupMessage");
}

async function saveNewStudentGroup() {
    const classGroupId =
        Number(document.getElementById("newStudentGroupClassId").value);

    const name =
        document.getElementById("newStudentGroupName").value.trim();

    if (classGroupId <= 0) {
        showQuickCreateMessage(
            "newStudentGroupMessage",
            "Class is required.",
            true
        );
        return;
    }

    if (!name) {
        showQuickCreateMessage(
            "newStudentGroupMessage",
            "Student group name is required.",
            true
        );
        return;
    }

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/student-groups/individual?organizationId=${encodeURIComponent(
                organizationId
            )}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    classGroupId,
                    name
                })
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not create student group. Status: ${response.status}`
                )
            );
        }

        const newGroupId = Number(data?.groupId);

        await loadStudentGroups();

        if (newGroupId > 0) {
            document.getElementById(
                "requirementStudentGroupId"
            ).value = newGroupId.toString();
        }

        closeNewStudentGroupPanel();
    } catch (error) {
        console.error("Error creating student group:", error);

        showQuickCreateMessage(
            "newStudentGroupMessage",
            error instanceof Error
                ? error.message
                : "Could not create student group.",
            true
        );
    }
}

function openNewSubjectPanel() {
    const panel = document.getElementById("newSubjectPanel");
    if (!panel) {
        return;
    }

    document.getElementById("newSubjectName").value = "";
    clearQuickCreateMessage("newSubjectMessage");

    panel.hidden = false;
    document.getElementById("newSubjectName").focus();
}

function closeNewSubjectPanel() {
    const panel = document.getElementById("newSubjectPanel");
    if (panel) {
        panel.hidden = true;
    }

    clearQuickCreateMessage("newSubjectMessage");
}

async function saveNewSubject() {
    const name =
        document.getElementById("newSubjectName").value.trim();

    if (!name) {
        showQuickCreateMessage(
            "newSubjectMessage",
            "Subject name is required.",
            true
        );
        return;
    }

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/subjects?organizationId=${encodeURIComponent(
                organizationId
            )}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    info: null
                })
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not create subject. Status: ${response.status}`
                )
            );
        }

        const newSubjectId = Number(data?.id);

        await loadSubjects();

        if (newSubjectId > 0) {
            document.getElementById(
                "requirementSubjectId"
            ).value = newSubjectId.toString();
        }

        closeNewSubjectPanel();
    } catch (error) {
        console.error("Error creating subject:", error);

        showQuickCreateMessage(
            "newSubjectMessage",
            error instanceof Error
                ? error.message
                : "Could not create subject.",
            true
        );
    }
}


function populateCurriculumClassOptions() {
    const select = document.getElementById("curriculumClassId");
    if (!select) return;

    const text = getLessonsPageText();
    const selectedValue = select.value;
    select.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = text.curriculumSelectClass;
    select.appendChild(emptyOption);

    availableClasses.forEach(classGroup => {
        const option = document.createElement("option");
        option.value = classGroup.id;
        option.textContent = classGroup.name;
        select.appendChild(option);
    });

    select.value = selectedValue;
}

function openCurriculumImport() {
    closeRequirementForm();

    const section = document.getElementById("curriculumImportSection");
    if (!section) return;

    document.getElementById("curriculumClassId").value = "";
    document.getElementById("curriculumGrade").value = "";
    document.getElementById("curriculumSchoolYear").value = "2026/2027";
    document.getElementById("curriculumPreviewContainer").hidden = true;
    document.getElementById("curriculumSourceInfo").textContent = "";
    showCurriculumImportMessage("", false);

    section.hidden = false;
    document.getElementById("curriculumClassId").focus();
}

function closeCurriculumImport() {
    const section = document.getElementById("curriculumImportSection");
    if (section) section.hidden = true;

    curriculumPreviewRows = [];
    curriculumTeacherAssignments = [];
    const preview = document.getElementById("curriculumPreviewContainer");
    if (preview) preview.hidden = true;
    showCurriculumImportMessage("", false);
}

function normalizeCurriculumName(value) {
    return (value ?? "")
        .toString()
        .trim()
        .toLocaleLowerCase("pl-PL")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

function findMatchingSubject(subjectName) {
    const normalized = normalizeCurriculumName(subjectName);

    return availableSubjects.find(subject =>
        normalizeCurriculumName(subject.name) === normalized
    ) ?? null;
}

function findWholeClassStudentGroup(classGroupId) {
    const classId = Number(classGroupId);

    return availableStudentGroups.find(group =>
        Number(group.classGroupId) === classId &&
        (
            group.type === 0 ||
            group.type === "WholeClass" ||
            group.typeName === "WholeClass"
        )
    ) ?? availableStudentGroups.find(group =>
        Number(group.classGroupId) === classId
    ) ?? null;
}

async function loadCurriculumDefinition(schoolYear) {
    if (schoolYear !== "2026/2027") {
        throw new Error(`Unsupported school year: ${schoolYear}`);
    }

    if (curriculumDefinition?.schoolYear === schoolYear) {
        return curriculumDefinition;
    }

    const response = await fetch(
        "/data/curricula/pl/primary-school/2026-2027.json",
        { cache: "no-cache" }
    );

    if (!response.ok) {
        throw new Error(
            `Could not load curriculum data. Status: ${response.status}`
        );
    }

    curriculumDefinition = await response.json();
    return curriculumDefinition;
}


async function loadCurriculumTeacherAssignments(classGroupId) {
    const organizationId =
        window.appContext.requireOrganizationId();

    const response = await fetch(
        `/api/requirements/curriculum-context?organizationId=${encodeURIComponent(
            organizationId
        )}&classGroupId=${encodeURIComponent(classGroupId)}`
    );

    const data = await readJsonResponse(response);

    if (!response.ok) {
        throw new Error(
            getApiErrorMessage(
                data,
                getLessonsPageText().curriculumContextError
            )
        );
    }

    curriculumTeacherAssignments =
        Array.isArray(data?.teacherAssignments)
            ? data.teacherAssignments
            : [];
}

function getTeacherAssignmentsForSubject(subjectId) {
    const normalizedSubjectId = Number(subjectId);

    if (normalizedSubjectId <= 0) {
        return [];
    }

    return curriculumTeacherAssignments.filter(assignment =>
        Number(assignment.subjectId) === normalizedSubjectId
    );
}

function applyDefaultTeacherToCurriculumRow(row) {
    row.hasMultipleDefaultTeachers = false;
    row.teacherWasAutoAssigned = false;

    if (!row.subjectId) {
        return;
    }

    const assignments =
        getTeacherAssignmentsForSubject(row.subjectId);

    if (assignments.length === 1) {
        row.teacherId = Number(assignments[0].teacherId);
        row.teacherWasAutoAssigned = true;
        return;
    }

    if (assignments.length > 1) {
        row.teacherId = null;
        row.hasMultipleDefaultTeachers = true;
    }
}

async function ensureCurriculumSubject(row) {
    if (row.subjectId) {
        return row.subjectId;
    }

    if (!row.createSubject) {
        return null;
    }

    const organizationId =
        window.appContext.requireOrganizationId();

    const response = await fetch(
        `/api/subjects?organizationId=${encodeURIComponent(
            organizationId
        )}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: row.sourceSubjectName,
                info: null
            })
        }
    );

    const data = await readJsonResponse(response);

    if (response.ok) {
        row.subjectId = Number(data?.id) || null;
        row.createSubject = false;

        if (!row.subjectId) {
            throw new Error(
                `Subject "${row.sourceSubjectName}" was created but its ID was not returned.`
            );
        }

        return row.subjectId;
    }

    // A concurrent change or a repeated import may have created the subject
    // after the preview was loaded. Reload and try to match it before failing.
    if (response.status === 409) {
        await loadSubjects();

        const matchedSubject =
            findMatchingSubject(row.sourceSubjectName);

        if (matchedSubject) {
            row.subjectId = matchedSubject.id;
            row.createSubject = false;
            return row.subjectId;
        }
    }

    throw new Error(
        getApiErrorMessage(
            data,
            `Could not create subject "${row.sourceSubjectName}". Status: ${response.status}`
        )
    );
}

async function loadCurriculumPreview() {
    const text = getLessonsPageText();
    const classGroupId = Number(
        document.getElementById("curriculumClassId").value
    );
    const grade = Number(
        document.getElementById("curriculumGrade").value
    );
    const schoolYear =
        document.getElementById("curriculumSchoolYear").value;

    if (classGroupId <= 0) {
        showCurriculumImportMessage(text.curriculumSelectClass, true);
        return;
    }

    if (!Number.isInteger(grade) || grade < 1 || grade > 8) {
        showCurriculumImportMessage(text.curriculumSelectGrade, true);
        return;
    }

    const wholeClassGroup =
        findWholeClassStudentGroup(classGroupId);

    if (!wholeClassGroup) {
        showCurriculumImportMessage(
            "Whole-class student group was not found for the selected class.",
            true
        );
        return;
    }

    try {
        const definition =
            await loadCurriculumDefinition(schoolYear);

        const gradeDefinition =
            definition.grades?.find(item =>
                Number(item.grade) === grade
            );

        if (!gradeDefinition) {
            throw new Error(
                `Curriculum for grade ${grade} was not found.`
            );
        }

        await loadCurriculumTeacherAssignments(classGroupId);

        curriculumPreviewRows =
            (gradeDefinition.lessons ?? []).map((lesson, index) => {
                const matchedSubject =
                    findMatchingSubject(lesson.subject);

                const row = {
                    index,
                    sourceSubjectName: lesson.subject,
                    hoursPerWeek: Number(lesson.hoursPerWeek),
                    subjectId: matchedSubject?.id ?? null,
                    createSubject: !matchedSubject,
                    teacherId: null,
                    teacherWasAutoAssigned: false,
                    hasMultipleDefaultTeachers: false,
                    studentGroupId: wholeClassGroup.id,
                    classGroupId
                };

                applyDefaultTeacherToCurriculumRow(row);

                return row;
            });

        const source = definition.source ?? {};
        document.getElementById("curriculumSourceInfo").textContent =
            `${source.journal ?? ""}` +
            (gradeDefinition.sourceAnnex
                ? `, annex ${gradeDefinition.sourceAnnex}`
                : "");

        renderCurriculumPreview();
        document.getElementById(
            "curriculumPreviewContainer"
        ).hidden = false;

        showCurriculumImportMessage("", false);
    } catch (error) {
        console.error("Error loading curriculum preview:", error);
        showCurriculumImportMessage(
            error instanceof Error
                ? error.message
                : "Could not load curriculum preview.",
            true
        );
    }
}

function renderCurriculumPreview() {
    const tbody =
        document.querySelector("#curriculumPreviewTable tbody");

    if (!tbody) return;

    const text = getLessonsPageText();
    tbody.innerHTML = "";

    curriculumPreviewRows.forEach(row => {
        const tr = document.createElement("tr");

        tr.appendChild(createTableCell(row.sourceSubjectName));
        tr.appendChild(createTableCell(row.hoursPerWeek));

        const subjectCell = document.createElement("td");
        const subjectSelect = document.createElement("select");

        const emptySubject = document.createElement("option");
        emptySubject.value = "";
        emptySubject.textContent = text.curriculumMissingSubject;
        subjectSelect.appendChild(emptySubject);

        if (row.createSubject && !row.subjectId) {
            const createOption = document.createElement("option");
            createOption.value = "__create__";
            createOption.textContent =
                `${text.curriculumCreateSubject}: ${row.sourceSubjectName}`;
            subjectSelect.appendChild(createOption);
        }

        availableSubjects.forEach(subject => {
            const option = document.createElement("option");
            option.value = subject.id;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });

        subjectSelect.value = row.createSubject
            ? "__create__"
            : row.subjectId?.toString() ?? "";

        const teacherCell = document.createElement("td");
        const teacherSelect = document.createElement("select");

        const emptyTeacher = document.createElement("option");
        emptyTeacher.value = "";
        emptyTeacher.textContent = text.curriculumMissingTeacher;
        teacherSelect.appendChild(emptyTeacher);

        availableTeachers.forEach(teacher => {
            const option = document.createElement("option");
            option.value = teacher.id;
            option.textContent =
                teacher.alias
                    ? `${teacher.name} (${teacher.alias})`
                    : teacher.name;
            teacherSelect.appendChild(option);
        });

        teacherSelect.value =
            row.teacherId?.toString() ?? "";

        subjectSelect.addEventListener("change", () => {
            if (subjectSelect.value === "__create__") {
                row.subjectId = null;
                row.createSubject = true;
                row.teacherWasAutoAssigned = false;
                row.hasMultipleDefaultTeachers = false;
            } else {
                row.subjectId =
                    Number(subjectSelect.value) || null;
                row.createSubject = false;
                row.teacherId = null;

                applyDefaultTeacherToCurriculumRow(row);

                teacherSelect.value =
                    row.teacherId?.toString() ?? "";
            }

            updateCurriculumRowStatus(tr, row);
        });

        teacherSelect.addEventListener("change", () => {
            row.teacherId =
                Number(teacherSelect.value) || null;

            // A manual selection always wins over the suggested default.
            row.teacherWasAutoAssigned = false;

            updateCurriculumRowStatus(tr, row);
        });

        subjectCell.appendChild(subjectSelect);
        tr.appendChild(subjectCell);

        teacherCell.appendChild(teacherSelect);
        tr.appendChild(teacherCell);

        const statusCell = document.createElement("td");
        statusCell.className = "curriculum-row-status";
        tr.appendChild(statusCell);

        updateCurriculumRowStatus(tr, row);
        tbody.appendChild(tr);
    });
}

function updateCurriculumRowStatus(rowElement, row) {
    const statusCell =
        rowElement.querySelector(".curriculum-row-status");

    if (!statusCell) return;

    const text = getLessonsPageText();

    if (!row.subjectId && !row.createSubject) {
        statusCell.textContent =
            text.curriculumMissingSubject;
        return;
    }

    if (!row.teacherId) {
        statusCell.textContent =
            row.hasMultipleDefaultTeachers
                ? text.curriculumMultipleTeachers
                : text.curriculumMissingTeacher;
        return;
    }

    if (row.createSubject) {
        statusCell.textContent =
            text.curriculumCreateSubjectStatus;
        return;
    }

    statusCell.textContent = text.curriculumReady;
}

async function confirmCurriculumImport() {
    const text = getLessonsPageText();

    if (curriculumPreviewRows.length === 0) {
        return;
    }

    const incomplete =
        curriculumPreviewRows.find(row =>
            (!row.subjectId && !row.createSubject) ||
            !row.teacherId
        );

    if (incomplete) {
        showCurriculumImportMessage(
            `${text.curriculumMissingSubject} / ${text.curriculumMissingTeacher}`,
            true
        );
        return;
    }

    const organizationId =
        window.appContext.requireOrganizationId();

    const button =
        document.getElementById(
            "confirmCurriculumImportButton"
        );

    if (button) button.disabled = true;

    let createdCount = 0;

    try {
        for (const row of curriculumPreviewRows) {
            await ensureCurriculumSubject(row);

            const response = await fetch(
                `/api/requirements?organizationId=${encodeURIComponent(
                    organizationId
                )}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: null,
                        teacherId: row.teacherId,
                        studentGroupId: row.studentGroupId,
                        subjectId: row.subjectId,
                        hoursPerWeek: row.hoursPerWeek,
                        priority: 1,
                        isAdditional: false
                    })
                }
            );

            const data = await readJsonResponse(response);

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(
                        data,
                        `Could not create lesson. Status: ${response.status}`
                    )
                );
            }

            createdCount++;
        }

        showCurriculumImportMessage(
            text.curriculumCreated,
            false
        );

        await loadRequirements();
        document.getElementById(
            "curriculumPreviewContainer"
        ).hidden = true;
        curriculumPreviewRows = [];
    } catch (error) {
        console.error("Error importing curriculum:", error);

        showCurriculumImportMessage(
            `${text.curriculumPartialError} ` +
            `${createdCount}/${curriculumPreviewRows.length}. ` +
            (error instanceof Error ? error.message : ""),
            true
        );
    } finally {
        if (button) button.disabled = false;
    }
}

function showCurriculumImportMessage(message, isError) {
    const element =
        document.getElementById("curriculumImportMessage");

    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error-message", isError);
}

function handleAdditionalLessonChanged() {
    const checkbox =
        document.getElementById("requirementIsAdditional");

    const priority =
        document.getElementById("requirementPriority");

    if (!checkbox || !priority) {
        return;
    }

    priority.value = checkbox.checked
        ? "0"
        : "1";
}

function showQuickCreateMessage(id, message, isError) {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle("error-message", isError);
}

function clearQuickCreateMessage(id) {
    showQuickCreateMessage(id, "", false);
}

function openAddRequirementForm() {
    closeCurriculumImport();
    document.getElementById(
        "requirementId"
    ).value = "";

    document.getElementById(
        "requirementName"
    ).value = "";

    document.getElementById(
        "requirementStudentGroupId"
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

    document.getElementById(
        "requirementPriority"
    ).value = "1";

    document.getElementById(
        "requirementIsAdditional"
    ).checked = false;

    document.getElementById(
        "requirementName"
    ).placeholder =
        "Optional for regular lessons";

    clearRequirementFormMessage();

    document.getElementById(
        "requirementFormTitle"
    ).textContent =
        getLessonsPageText().addLessonForm;

    document.getElementById(
        "requirementFormSection"
    ).hidden = false;

    document.getElementById(
        "requirementStudentGroupId"
    ).focus();
}


function openEditRequirementForm(requirement) {
    document.getElementById(
        "requirementId"
    ).value = requirement.id;

    document.getElementById(
        "requirementName"
    ).value =
        requirement.name ?? "";

    document.getElementById(
        "requirementStudentGroupId"
    ).value =
        requirement.studentGroupId?.toString() ?? "";

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

    document.getElementById(
        "requirementPriority"
    ).value =
        requirement.priority?.toString() ?? "1";

    document.getElementById(
        "requirementIsAdditional"
    ).checked =
        Boolean(requirement.isAdditional);

    clearRequirementFormMessage();

    document.getElementById(
        "requirementFormTitle"
    ).textContent =
        getLessonsPageText().editLessonForm;

    document.getElementById(
        "requirementFormSection"
    ).hidden = false;

    document.getElementById(
        "requirementStudentGroupId"
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

    const name =
        document.getElementById(
            "requirementName"
        ).value.trim();

    const studentGroupId =
        Number(
            document.getElementById(
                "requirementStudentGroupId"
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

    const priority =
        Number(
            document.getElementById(
                "requirementPriority"
            ).value
        );

    const isAdditional =
        document.getElementById(
            "requirementIsAdditional"
        ).checked;

    if (studentGroupId <= 0) {
        showRequirementFormMessage(
            "Student group is required.",
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

    if (![0, 1, 2].includes(priority)) {
        showRequirementFormMessage(
            "Priority must be Low, Normal or High.",
            true
        );

        return;
    }

    const requestBody = {
        name: name || null,
        teacherId,
        studentGroupId,
        subjectId,
        hoursPerWeek,
        priority,
        isAdditional
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
        `${requirement.studentGroupName}?`
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

    cell.colSpan = 7;
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