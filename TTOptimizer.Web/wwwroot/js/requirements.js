let availableTeachers = [];
let availableStudentGroups = [];
let availableSubjects = [];
let availableClasses = [];
let availableRequirements = [];
let curriculumDefinition = null;
let curriculumPreviewRows = [];
let curriculumTeacherAssignments = [];
let teachingPlanRowFilter = "all";
let teachingPlanClassSelections = [];

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

    document.getElementById("selectAllTeachingPlanClasses")
        ?.addEventListener("change", handleSelectAllTeachingPlanClasses);

    document.getElementById("showAllTeachingPlanRowsButton")
        ?.addEventListener("click", () => setTeachingPlanRowFilter("all"));

    document.getElementById("showTeachingPlanIssuesButton")
        ?.addEventListener("click", () => setTeachingPlanRowFilter("issues"));

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
            importCurriculum: "Importuj plan nauczania",
            curriculumTitle: "Import z ramowego planu nauczania",
            curriculumClass: "Klasa",
            curriculumGrade: "Poziom klasy",
            curriculumSchoolYear: "Rok szkolny",
            curriculumLoadPreview: "Przygotuj import",
            curriculumCreateLessons: "Importuj gotowe pozycje",
            curriculumSubject: "Przedmiot",
            curriculumHours: "Godziny/tydzień",
            curriculumMappedSubject: "Przedmiot w ClassFlow",
            curriculumTeacher: "Nauczyciel",
            curriculumStatus: "Status",
        teachingPlanClassSelectionDescription:
            "Select the classes to prepare. Check the grade for every selected class before creating the preview.",
        teachingPlanClassHeader: "Class",
        teachingPlanGradeHeader: "Grade",
        teachingPlanSummaryTitle: "Import summary",
        teachingPlanPreviewClassHeader: "Class",
        teachingPlanAll: "All",
        teachingPlanIssues: "Needs attention",
        teachingPlanReadyItems: "Ready",
        teachingPlanNewSubjects: "New subjects",
        teachingPlanIssuesCount: "Needs attention",
        teachingPlanDuplicates: "Already exists",
        teachingPlanDuplicate: "Already exists",
        teachingPlanSelectAtLeastOneClass: "Select at least one class.",
        teachingPlanMissingGrade: "Choose a grade for every selected class.",
        teachingPlanImported: "Import completed.",
        teachingPlanNothingReady: "There are no ready items to import.",
            teachingPlanClassSelectionDescription:
                "Wybierz klasy do przygotowania. Przed podglądem sprawdź poziom każdej klasy.",
            teachingPlanClassHeader: "Klasa",
            teachingPlanGradeHeader: "Poziom",
            teachingPlanSummaryTitle: "Podsumowanie importu",
            teachingPlanPreviewClassHeader: "Klasa",
            teachingPlanAll: "Wszystko",
            teachingPlanIssues: "Wymaga uwagi",
            teachingPlanReadyItems: "Gotowe",
            teachingPlanNewSubjects: "Nowe przedmioty",
            teachingPlanIssuesCount: "Wymaga uwagi",
            teachingPlanDuplicates: "Już istnieje",
            teachingPlanDuplicate: "Już istnieje",
            teachingPlanSelectAtLeastOneClass: "Wybierz co najmniej jedną klasę.",
            teachingPlanMissingGrade: "Uzupełnij poziom dla każdej wybranej klasy.",
            teachingPlanImported: "Import zakończony.",
            teachingPlanNothingReady: "Nie ma gotowych pozycji do importu.",
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
        importCurriculum: "Import teaching plan",
        curriculumTitle: "Import from teaching plan",
        curriculumClass: "Class",
        curriculumGrade: "Grade",
        curriculumSchoolYear: "School year",
        curriculumLoadPreview: "Prepare import",
        curriculumCreateLessons: "Import ready items",
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
    setText("teachingPlanClassSelectionDescription", text.teachingPlanClassSelectionDescription);
    setText("teachingPlanClassHeader", text.teachingPlanClassHeader);
    setText("teachingPlanGradeHeader", text.teachingPlanGradeHeader);
    setText("teachingPlanSummaryTitle", text.teachingPlanSummaryTitle);
    setText("teachingPlanPreviewClassHeader", text.teachingPlanPreviewClassHeader);
    setText("showAllTeachingPlanRowsButton", text.teachingPlanAll);
    setText("showTeachingPlanIssuesButton", text.teachingPlanIssues);
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

        availableRequirements = requirements;
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
    const tbody =
        document.querySelector("#teachingPlanClassesTable tbody");

    if (!tbody) return;

    teachingPlanClassSelections = availableClasses.map(classGroup => ({
        classGroupId: Number(classGroup.id),
        className: classGroup.name ?? `Class #${classGroup.id}`,
        grade: inferGradeFromClassName(classGroup.name),
        selected: true
    }));

    renderTeachingPlanClassSelections();
}

function inferGradeFromClassName(className) {
    const match = (className ?? "")
        .toString()
        .trim()
        .match(/(?:^|\D)([1-8])(?:\D|$)/);

    return match ? Number(match[1]) : null;
}

function renderTeachingPlanClassSelections() {
    const tbody =
        document.querySelector("#teachingPlanClassesTable tbody");

    if (!tbody) return;

    tbody.innerHTML = "";

    teachingPlanClassSelections.forEach(selection => {
        const row = document.createElement("tr");

        const selectedCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selection.selected;
        checkbox.setAttribute(
            "aria-label",
            `Select ${selection.className}`
        );

        checkbox.addEventListener("change", () => {
            selection.selected = checkbox.checked;
            updateSelectAllTeachingPlanClassesState();
        });

        selectedCell.appendChild(checkbox);
        row.appendChild(selectedCell);
        row.appendChild(createTableCell(selection.className));

        const gradeCell = document.createElement("td");
        const gradeSelect = document.createElement("select");

        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent =
            getLessonsPageText().curriculumSelectGrade;
        gradeSelect.appendChild(emptyOption);

        for (let grade = 1; grade <= 8; grade++) {
            const option = document.createElement("option");
            option.value = grade.toString();
            option.textContent = grade.toString();
            gradeSelect.appendChild(option);
        }

        gradeSelect.value =
            selection.grade?.toString() ?? "";

        gradeSelect.addEventListener("change", () => {
            selection.grade =
                Number(gradeSelect.value) || null;
        });

        gradeCell.appendChild(gradeSelect);
        row.appendChild(gradeCell);
        tbody.appendChild(row);
    });

    updateSelectAllTeachingPlanClassesState();
}

function handleSelectAllTeachingPlanClasses(event) {
    const selected = Boolean(event.target?.checked);

    teachingPlanClassSelections.forEach(item => {
        item.selected = selected;
    });

    renderTeachingPlanClassSelections();
}

function updateSelectAllTeachingPlanClassesState() {
    const checkbox =
        document.getElementById("selectAllTeachingPlanClasses");

    if (!checkbox) return;

    const selectedCount =
        teachingPlanClassSelections.filter(item => item.selected).length;

    checkbox.checked =
        teachingPlanClassSelections.length > 0 &&
        selectedCount === teachingPlanClassSelections.length;

    checkbox.indeterminate =
        selectedCount > 0 &&
        selectedCount < teachingPlanClassSelections.length;
}

function openCurriculumImport() {
    closeRequirementForm();

    const section =
        document.getElementById("curriculumImportSection");

    if (!section) return;

    document.getElementById("curriculumSchoolYear").value =
        "2026/2027";

    teachingPlanRowFilter = "all";
    curriculumPreviewRows = [];
    curriculumTeacherAssignments = [];

    populateCurriculumClassOptions();

    document.getElementById(
        "curriculumPreviewContainer"
    ).hidden = true;

    document.getElementById(
        "curriculumSourceInfo"
    ).textContent = "";

    showCurriculumImportMessage("", false);

    section.hidden = false;
}

function closeCurriculumImport() {
    const section =
        document.getElementById("curriculumImportSection");

    if (section) {
        section.hidden = true;
    }

    curriculumPreviewRows = [];
    curriculumTeacherAssignments = [];
    teachingPlanRowFilter = "all";

    const preview =
        document.getElementById("curriculumPreviewContainer");

    if (preview) {
        preview.hidden = true;
    }

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
    const normalized =
        normalizeCurriculumName(subjectName);

    return availableSubjects.find(subject =>
        normalizeCurriculumName(subject.name) === normalized
    ) ?? null;
}

function findWholeClassStudentGroup(classGroupId) {
    const classId = Number(classGroupId);

    // Do not fall back to an arbitrary subgroup. Importing a whole-class
    // teaching-plan item into a random subgroup would be wonderfully efficient
    // at creating the wrong timetable.
    return availableStudentGroups.find(group =>
        Number(group.classGroupId) === classId &&
        (
            group.type === 0 ||
            group.type === "WholeClass" ||
            group.typeName === "WholeClass"
        )
    ) ?? null;
}

async function loadCurriculumDefinition(schoolYear) {
    if (schoolYear !== "2026/2027") {
        throw new Error(
            `Unsupported school year: ${schoolYear}`
        );
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
            `Could not load teaching plan data. Status: ${response.status}`
        );
    }

    curriculumDefinition = await response.json();
    return curriculumDefinition;
}

async function loadTeachingPlanAssignmentsForClasses(classSelections) {
    const organizationId =
        window.appContext.requireOrganizationId();

    const result = [];

    await Promise.all(classSelections.map(async selection => {
        const response = await fetch(
            `/api/requirements/curriculum-context?organizationId=${encodeURIComponent(
                organizationId
            )}&classGroupId=${encodeURIComponent(
                selection.classGroupId
            )}`
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

        const assignments =
            Array.isArray(data?.teacherAssignments)
                ? data.teacherAssignments
                : [];

        assignments.forEach(assignment => {
            result.push({
                ...assignment,
                classGroupId: selection.classGroupId
            });
        });
    }));

    curriculumTeacherAssignments = result;
}

function getTeacherAssignmentsForRow(row) {
    if (!row.subjectId) {
        return [];
    }

    return curriculumTeacherAssignments.filter(assignment =>
        Number(assignment.classGroupId) === Number(row.classGroupId) &&
        Number(assignment.subjectId) === Number(row.subjectId)
    );
}

function applyDefaultTeacherToCurriculumRow(row) {
    row.hasMultipleDefaultTeachers = false;
    row.teacherWasAutoAssigned = false;

    if (!row.subjectId) {
        return;
    }

    const assignments =
        getTeacherAssignmentsForRow(row);

    if (assignments.length === 1) {
        row.teacherId =
            Number(assignments[0].teacherId);

        row.teacherWasAutoAssigned = true;
        return;
    }

    if (assignments.length > 1) {
        row.teacherId = null;
        row.hasMultipleDefaultTeachers = true;
    }
}

function isExistingTeachingPlanRequirement(row) {
    const subjectName =
        row.subjectId
            ? availableSubjects.find(
                subject => Number(subject.id) === Number(row.subjectId)
            )?.name
            : row.sourceSubjectName;

    const normalizedSubject =
        normalizeCurriculumName(subjectName);

    return availableRequirements.some(requirement =>
        Number(requirement.studentGroupId) === Number(row.studentGroupId) &&
        normalizeCurriculumName(requirement.subjectName) === normalizedSubject &&
        !Boolean(requirement.isAdditional)
    );
}

function refreshTeachingPlanRowState(row) {
    row.isDuplicate =
        isExistingTeachingPlanRequirement(row);

    row.needsAttention =
        !row.isDuplicate &&
        (
            (!row.subjectId && !row.createSubject) ||
            !row.teacherId ||
            row.hasMultipleDefaultTeachers
        );

    row.isReady =
        !row.isDuplicate &&
        !row.needsAttention &&
        (Boolean(row.subjectId) || row.createSubject) &&
        Boolean(row.teacherId);
}

async function loadCurriculumPreview() {
    const text = getLessonsPageText();
    const schoolYear =
        document.getElementById("curriculumSchoolYear").value;

    const selectedClasses =
        teachingPlanClassSelections.filter(item => item.selected);

    if (selectedClasses.length === 0) {
        showCurriculumImportMessage(
            text.teachingPlanSelectAtLeastOneClass,
            true
        );
        return;
    }

    if (selectedClasses.some(item =>
        !Number.isInteger(item.grade) ||
        item.grade < 1 ||
        item.grade > 8
    )) {
        showCurriculumImportMessage(
            text.teachingPlanMissingGrade,
            true
        );
        return;
    }

    try {
        showCurriculumImportMessage("", false);

        // Requirements GET ensures WholeClass groups exist. Reload afterwards
        // so the frontend sees groups that may just have been created.
        await loadRequirements();
        await loadStudentGroups();

        const definition =
            await loadCurriculumDefinition(schoolYear);

        await loadTeachingPlanAssignmentsForClasses(
            selectedClasses
        );

        const rows = [];

        for (const selection of selectedClasses) {
            const wholeClassGroup =
                findWholeClassStudentGroup(
                    selection.classGroupId
                );

            if (!wholeClassGroup) {
                throw new Error(
                    `Whole-class student group was not found for ${selection.className}.`
                );
            }

            const gradeDefinition =
                definition.grades?.find(item =>
                    Number(item.grade) ===
                    Number(selection.grade)
                );

            if (!gradeDefinition) {
                throw new Error(
                    `Teaching plan for grade ${selection.grade} was not found.`
                );
            }

            for (const lesson of gradeDefinition.lessons ?? []) {
                const matchedSubject =
                    findMatchingSubject(lesson.subject);

                const row = {
                    index: rows.length,
                    classGroupId: selection.classGroupId,
                    className: selection.className,
                    grade: selection.grade,
                    studentGroupId: wholeClassGroup.id,
                    sourceSubjectName: lesson.subject,
                    hoursPerWeek: Number(lesson.hoursPerWeek),
                    subjectId: matchedSubject?.id ?? null,
                    createSubject: !matchedSubject,
                    teacherId: null,
                    teacherWasAutoAssigned: false,
                    hasMultipleDefaultTeachers: false,
                    isDuplicate: false,
                    needsAttention: false,
                    isReady: false
                };

                applyDefaultTeacherToCurriculumRow(row);
                refreshTeachingPlanRowState(row);
                rows.push(row);
            }
        }

        curriculumPreviewRows = rows;
        teachingPlanRowFilter = "all";

        const source = definition.source ?? {};

        document.getElementById(
            "curriculumSourceInfo"
        ).textContent =
            `${source.journal ?? ""}`;

        renderCurriculumPreview();
        updateTeachingPlanSummary();

        document.getElementById(
            "curriculumPreviewContainer"
        ).hidden = false;
    } catch (error) {
        console.error(
            "Error preparing teaching plan import:",
            error
        );

        showCurriculumImportMessage(
            error instanceof Error
                ? error.message
                : "Could not prepare teaching plan import.",
            true
        );
    }
}

function setTeachingPlanRowFilter(filter) {
    teachingPlanRowFilter =
        filter === "issues"
            ? "issues"
            : "all";

    renderCurriculumPreview();
}

function getVisibleTeachingPlanRows() {
    if (teachingPlanRowFilter === "issues") {
        return curriculumPreviewRows.filter(row =>
            row.needsAttention
        );
    }

    return curriculumPreviewRows;
}

function renderCurriculumPreview() {
    const tbody =
        document.querySelector("#curriculumPreviewTable tbody");

    if (!tbody) return;

    const text = getLessonsPageText();
    tbody.innerHTML = "";

    const visibleRows =
        getVisibleTeachingPlanRows();

    if (visibleRows.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.className = "teachers-table-state";
        cell.textContent =
            teachingPlanRowFilter === "issues"
                ? "No items require attention."
                : "No teaching-plan items found.";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    visibleRows.forEach(row => {
        const tr = document.createElement("tr");

        tr.appendChild(createTableCell(row.className));
        tr.appendChild(createTableCell(row.sourceSubjectName));
        tr.appendChild(createTableCell(row.hoursPerWeek));

        const subjectCell = document.createElement("td");
        const subjectSelect = document.createElement("select");

        const emptySubject = document.createElement("option");
        emptySubject.value = "";
        emptySubject.textContent =
            text.curriculumMissingSubject;
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

        subjectSelect.value =
            row.createSubject
                ? "__create__"
                : row.subjectId?.toString() ?? "";

        const teacherCell = document.createElement("td");
        const teacherSelect = document.createElement("select");

        const emptyTeacher = document.createElement("option");
        emptyTeacher.value = "";
        emptyTeacher.textContent =
            text.curriculumMissingTeacher;
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
                row.teacherId = null;
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

            refreshTeachingPlanRowState(row);
            updateCurriculumRowStatus(tr, row);
            updateTeachingPlanSummary();
        });

        teacherSelect.addEventListener("change", () => {
            row.teacherId =
                Number(teacherSelect.value) || null;

            row.teacherWasAutoAssigned = false;
            row.hasMultipleDefaultTeachers = false;

            refreshTeachingPlanRowState(row);
            updateCurriculumRowStatus(tr, row);
            updateTeachingPlanSummary();
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

    if (row.isDuplicate) {
        statusCell.textContent =
            text.teachingPlanDuplicate;
        return;
    }

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

    statusCell.textContent =
        text.curriculumReady;
}

function updateTeachingPlanSummary() {
    const element =
        document.getElementById("teachingPlanSummary");

    if (!element) return;

    const text = getLessonsPageText();

    curriculumPreviewRows.forEach(
        refreshTeachingPlanRowState
    );

    const classCount =
        new Set(
            curriculumPreviewRows.map(row => row.classGroupId)
        ).size;

    const readyCount =
        curriculumPreviewRows.filter(row => row.isReady).length;

    const issueCount =
        curriculumPreviewRows.filter(row => row.needsAttention).length;

    const duplicateCount =
        curriculumPreviewRows.filter(row => row.isDuplicate).length;

    const newSubjectCount =
        new Set(
            curriculumPreviewRows
                .filter(row => row.createSubject)
                .map(row => normalizeCurriculumName(
                    row.sourceSubjectName
                ))
        ).size;

    element.textContent =
        `${classCount} class(es) · ` +
        `${curriculumPreviewRows.length} item(s) · ` +
        `${text.teachingPlanReadyItems}: ${readyCount} · ` +
        `${text.teachingPlanNewSubjects}: ${newSubjectCount} · ` +
        `${text.teachingPlanIssuesCount}: ${issueCount} · ` +
        `${text.teachingPlanDuplicates}: ${duplicateCount}`;
}

async function confirmCurriculumImport() {
    const text = getLessonsPageText();

    const readyRows =
        curriculumPreviewRows.filter(row => {
            refreshTeachingPlanRowState(row);
            return row.isReady;
        });

    if (readyRows.length === 0) {
        showCurriculumImportMessage(
            text.teachingPlanNothingReady,
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

    if (button) {
        button.disabled = true;
    }

    try {
        const response = await fetch(
            `/api/requirements/import-teaching-plan?organizationId=${encodeURIComponent(
                organizationId
            )}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    items: readyRows.map(row => ({
                        classGroupId: row.classGroupId,
                        teacherId: row.teacherId,
                        subjectId: row.subjectId,
                        subjectName:
                            row.subjectId
                                ? null
                                : row.sourceSubjectName,
                        hoursPerWeek: row.hoursPerWeek
                    }))
                })
            }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not import teaching plan. Status: ${response.status}`
                )
            );
        }

        showCurriculumImportMessage(
            `${text.teachingPlanImported} ` +
            `${data?.createdRequirements ?? readyRows.length} lesson(s), ` +
            `${data?.createdSubjects ?? 0} new subject(s), ` +
            `${data?.skippedDuplicates ?? 0} duplicate(s) skipped.`,
            false
        );

        await refreshPageData();

        curriculumPreviewRows = [];
        curriculumTeacherAssignments = [];

        document.getElementById(
            "curriculumPreviewContainer"
        ).hidden = true;
    } catch (error) {
        console.error(
            "Error importing teaching plan:",
            error
        );

        showCurriculumImportMessage(
            error instanceof Error
                ? error.message
                : "Could not import teaching plan.",
            true
        );
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

function showCurriculumImportMessage(message, isError) {
    const element =
        document.getElementById("curriculumImportMessage");

    if (!element) return;

    element.textContent = message;
    element.classList.toggle(
        "error-message",
        isError
    );
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