import { initializeI18n, t } from "./i18n.js";

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
    await initializeI18n();
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

    document.getElementById("loadCurriculumPreviewButton")
        ?.addEventListener("click", loadCurriculumPreview);

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
    return {
        pageLabel: t("lessons.pageLabel"),
        pageTitle: t("lessons.title"),
        pageSubtitle: t("lessons.subtitle"),
        listTitle: t("lessons.listTitle"),
        listDescription: t("lessons.listDescription"),
        addLesson: t("lessons.add"),
        importCurriculum: t("lessons.importCurriculum"),
        curriculumTitle: t("lessons.curriculumTitle"),
        curriculumClass: t("lessons.curriculumClass"),
        curriculumGrade: t("lessons.curriculumGrade"),
        curriculumSchoolYear: t("lessons.curriculumSchoolYear"),
        curriculumLoadPreview: t("lessons.curriculumLoadPreview"),
        curriculumCreateLessons: t("lessons.curriculumCreateLessons"),
        curriculumSubject: t("lessons.curriculumSubject"),
        curriculumHours: t("lessons.curriculumHours"),
        curriculumMappedSubject: t("lessons.curriculumMappedSubject"),
        curriculumTeacher: t("lessons.curriculumTeacher"),
        curriculumStatus: t("lessons.curriculumStatus"),
        teachingPlanClassSelectionDescription: t("lessons.teachingPlanClassSelectionDescription"),
        teachingPlanClassHeader: t("lessons.teachingPlanClassHeader"),
        teachingPlanGradeHeader: t("lessons.teachingPlanGradeHeader"),
        teachingPlanSummaryTitle: t("lessons.teachingPlanSummaryTitle"),
        teachingPlanPreviewClassHeader: t("lessons.teachingPlanPreviewClassHeader"),
        teachingPlanAll: t("lessons.teachingPlanAll"),
        teachingPlanIssues: t("lessons.teachingPlanIssues"),
        teachingPlanReadyItems: t("lessons.teachingPlanReadyItems"),
        teachingPlanNewSubjects: t("lessons.teachingPlanNewSubjects"),
        teachingPlanIssuesCount: t("lessons.teachingPlanIssuesCount"),
        teachingPlanDuplicates: t("lessons.teachingPlanDuplicates"),
        teachingPlanDuplicate: t("lessons.teachingPlanDuplicate"),
        teachingPlanSelectAtLeastOneClass: t("lessons.teachingPlanSelectAtLeastOneClass"),
        teachingPlanMissingGrade: t("lessons.teachingPlanMissingGrade"),
        teachingPlanImported: t("lessons.teachingPlanImported"),
        teachingPlanNothingReady: t("lessons.teachingPlanNothingReady"),
        curriculumReady: t("lessons.curriculumReady"),
        curriculumMissingSubject: t("lessons.curriculumMissingSubject"),
        curriculumMissingTeacher: t("lessons.curriculumMissingTeacher"),
        curriculumSelectClass: t("lessons.curriculumSelectClass"),
        curriculumSelectGrade: t("lessons.curriculumSelectGrade"),
        curriculumCreated: t("lessons.curriculumCreated"),
        curriculumPartialError: t("lessons.curriculumPartialError"),
        curriculumCreateSubject: t("lessons.curriculumCreateSubject"),
        curriculumCreateSubjectStatus: t("lessons.curriculumCreateSubjectStatus"),
        curriculumMultipleTeachers: t("lessons.curriculumMultipleTeachers"),
        curriculumContextError: t("lessons.curriculumContextError"),
        addLessonForm: t("lessons.addForm"),
        editLessonForm: t("lessons.editForm"),
        additionalLesson: t("lessons.additional"),
        additionalLessonHelp: t("lessons.additionalHelp"),
        newItem: t("common.new"),
        addStudentGroup: t("lessons.addStudentGroup"),
        addSubject: t("lessons.addSubject"),
        cancel: t("common.cancel"),
        back: t("common.back"),
        refresh: t("common.refresh")
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
            <td colspan="7" class="teachers-table-state">${t("lessons.loading")}</td>
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
                : t("lessons.loadFailed")
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
                <td colspan="7" class="teachers-table-state">${t("lessons.noneFound")}</td>
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
        editButton.textContent = t("common.edit");

        editButton.addEventListener("click", () => {
            openEditRequirementForm(requirement);
        });

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "small-button teacher-action-button teacher-delete-button";
        deleteButton.textContent = t("common.delete");

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
            t("lessons.countUnknown");
        return;
    }

    countElement.textContent =
        count === 1
            ? t("lessons.countOne")
            : t("lessons.countMany").replace("{count}", count);
}

function formatPriority(priority) {
    switch (Number(priority)) {
        case 0:
            return t("lessons.priorityLow");
        case 2:
            return t("lessons.priorityHigh");
        case 1:
        default:
            return t("lessons.priorityNormal");
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
    emptyOption.textContent = t("lessons.selectTeacher");

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
    emptyOption.textContent = t("lessons.selectStudentGroup");

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
    emptyOption.textContent = t("lessons.selectSubject");

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
    emptyOption.textContent = t("lessons.curriculumSelectClass");
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
                    hoursPerWeek:
                        Number.isFinite(Number(lesson.hoursPerWeek)) &&
                        Number(lesson.hoursPerWeek) >= 1
                            ? Number(lesson.hoursPerWeek)
                            : 1,
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




// -----------------------------------------------------------------------------
// Lesson import wizard V2
// -----------------------------------------------------------------------------
(() => {
    const SCHOOL_TYPES = {
        Unknown: 0,
        PrimarySchool: 1,
        GeneralSecondarySchool: 2,
        TechnicalSecondarySchool: 3,
        VocationalSchoolFirstDegree: 4,
        VocationalSchoolSecondDegree: 5
    };

    const SCHOOL_TYPE_SLUG = {
        1: "primary-school",
        2: "general-secondary",
        3: "technical-secondary",
        4: "vocational-first",
        5: "vocational-second"
    };

    const state = {
        schools: [],
        schoolUnitId: null,
        classIndex: 0,
        isSummary: false,
        rowsByClassId: new Map(),
        gradeByClassId: new Map(),
        curriculumCache: new Map(),
        lastTeacherBySubjectId: new Map()
    };

    const byId = id => document.getElementById(id);

    function text(key, fallback) {
        return t(key, fallback);
    }

    function normalizeSchoolType(value) {
        if (typeof value === "number" && Number.isInteger(value)) {
            return value;
        }

        const asText = String(value ?? "").trim();

        if (/^\d+$/.test(asText)) {
            return Number(asText);
        }

        if (Object.prototype.hasOwnProperty.call(SCHOOL_TYPES, asText)) {
            return SCHOOL_TYPES[asText];
        }

        const aliases = {
            "primary": 1,
            "primary-school": 1,
            "general-secondary": 2,
            "general-secondary-school": 2,
            "technical-secondary": 3,
            "technical-secondary-school": 3,
            "vocational-first": 4,
            "vocational-second": 5
        };

        return aliases[asText.toLowerCase()] ?? 0;
    }

    function getAllSchools() {
        return [...state.schools].sort((a, b) =>
            String(a.name ?? "").localeCompare(
                String(b.name ?? ""),
                "pl",
                { numeric: true }
            )
        );
    }

    function getSelectedSchool() {
        return state.schools.find(
            school => Number(school.id) === Number(state.schoolUnitId)
        ) ?? null;
    }

    function inferGrade(className) {
        const match = String(className ?? "").match(/^\s*(\d+)/);
        return match ? Number(match[1]) : null;
    }

    function getClassesForSchool(schoolUnitId) {
        return availableClasses
            .filter(classGroup =>
                Number(classGroup.schoolUnitId) === Number(schoolUnitId)
            )
            .map(classGroup => ({
                ...classGroup,
                inferredGrade:
                    Number(classGroup.grade) ||
                    inferGrade(classGroup.name)
            }))
            .sort((a, b) => {
                const ga = a.inferredGrade ?? 999;
                const gb = b.inferredGrade ?? 999;
                if (ga !== gb) return ga - gb;
                return String(a.name ?? "").localeCompare(
                    String(b.name ?? ""),
                    "pl",
                    { numeric: true }
                );
            });
    }

    function getCurrentClass() {
        const school = getSelectedSchool();
        if (!school) return null;
        return getClassesForSchool(school.id)[state.classIndex] ?? null;
    }

    function getMaxGrade(schoolType) {
        switch (normalizeSchoolType(schoolType)) {
            case 1: return 8;
            case 2: return 4;
            case 3: return 5;
            case 4: return 3;
            case 5: return 2;
            default: return 8;
        }
    }

    async function loadSchools() {
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

        state.schools = Array.isArray(data)
            ? data
            : data?.schoolUnits ?? [];
    }

    async function loadCurriculumForSchool(school) {
        const schoolYear =
            byId("curriculumSchoolYear")?.value ?? "2026/2027";

        const schoolType = normalizeSchoolType(school?.schoolType);
        const slug = SCHOOL_TYPE_SLUG[schoolType];

        if (!slug) {
            return null;
        }

        const cacheKey = `${slug}:${schoolYear}`;

        if (state.curriculumCache.has(cacheKey)) {
            return state.curriculumCache.get(cacheKey);
        }

        const fileName = schoolYear.replace("/", "-") + ".json";
        const path = `/data/curricula/pl/${slug}/${fileName}`;

        try {
            const response = await fetch(path, { cache: "no-cache" });

            if (!response.ok) {
                state.curriculumCache.set(cacheKey, null);
                return null;
            }

            const definition = await response.json();
            state.curriculumCache.set(cacheKey, definition);
            return definition;
        } catch (error) {
            console.error("Could not load curriculum:", path, error);
            state.curriculumCache.set(cacheKey, null);
            return null;
        }
    }

    function romanToNumber(value) {
        const map = {
            I: 1,
            II: 2,
            III: 3,
            IV: 4,
            V: 5,
            VI: 6,
            VII: 7,
            VIII: 8
        };
        return map[String(value ?? "").toUpperCase()] ?? null;
    }

    function appliesToGrade(appliesTo, grade) {
        const value = String(appliesTo ?? "").trim().toUpperCase();

        if (!value) {
            return true;
        }

        const ranges = [...value.matchAll(
            /\b(VIII|VII|VI|V|IV|III|II|I)\s*-\s*(VIII|VII|VI|V|IV|III|II|I)\b/g
        )];

        for (const match of ranges) {
            const from = romanToNumber(match[1]);
            const to = romanToNumber(match[2]);

            if (from && to && grade >= from && grade <= to) {
                return true;
            }
        }

        const singles = [...value.matchAll(
            /\b(VIII|VII|VI|V|IV|III|II|I)\b/g
        )]
            .map(match => romanToNumber(match[1]))
            .filter(Boolean);

        return singles.includes(Number(grade));
    }

    function getCurriculumLessons(definition, grade) {
        if (Array.isArray(definition?.grades)) {
            const gradeDefinition = definition.grades.find(
                item => Number(item.grade) === Number(grade)
            );

            return (gradeDefinition?.lessons ?? []).map(item => {
                const configuredHours =
                    Number(item.hoursPerWeek);

                return {
                    subjectName: item.subject,
                    hoursPerWeek:
                        Number.isFinite(configuredHours) &&
                        configuredHours >= 1
                            ? configuredHours
                            : 1,
                    source: "hourly-plan"
                };
            });
        }

        if (Array.isArray(definition?.subjects)) {
            return definition.subjects
                .filter(item => item.selectedByDefault !== false)
                .filter(item => appliesToGrade(item.appliesTo, grade))
                .map(item => {
                    const configuredHours =
                        Number(item.hoursPerWeek);

                    return {
                        subjectName: item.name,
                        hoursPerWeek:
                            Number.isFinite(configuredHours) &&
                            configuredHours >= 1
                                ? configuredHours
                                : 1,
                        source: "subject-list"
                    };
                });
        }

        return [];
    }

    function findWholeClassGroup(classGroupId) {
        return availableStudentGroups.find(group =>
            Number(group.classGroupId) === Number(classGroupId) &&
            (
                Number(group.type) === 0 ||
                String(group.type).toLowerCase() === "wholeclass"
            )
        ) ?? null;
    }

    function findSubject(subjectName) {
        const normalized = normalizeCurriculumName(subjectName);

        return availableSubjects.find(subject =>
            normalizeCurriculumName(subject.name) === normalized
        ) ?? null;
    }

    function findExisting(row) {
        const normalized = normalizeCurriculumName(row.subjectName);

        return availableRequirements.find(requirement =>
            Number(requirement.studentGroupId) === Number(row.studentGroupId) &&
            normalizeCurriculumName(requirement.subjectName) === normalized &&
            !Boolean(requirement.isAdditional)
        ) ?? null;
    }

    function refreshAction(row) {
        const existing = findExisting(row);
        row.existingRequirementId = existing?.id ?? null;

        if (!row.teacherId || !Number(row.hoursPerWeek)) {
            row.action = "attention";
            return;
        }

        if (!existing) {
            row.action = "create";
            return;
        }

        const teacherChanged =
            Number(existing.teacherId) !== Number(row.teacherId);

        const hoursChanged =
            Number(existing.hoursPerWeek) !== Number(row.hoursPerWeek);

        row.action =
            teacherChanged || hoursChanged
                ? "update"
                : "unchanged";
    }

    async function buildRowsForClass(classGroup, grade) {
        const classId = Number(classGroup.id);

        const storedRows = state.rowsByClassId.get(classId);
        const storedGrade = state.gradeByClassId.get(classId);

        if (storedRows && Number(storedGrade) === Number(grade)) {
            storedRows.forEach(refreshAction);
            return storedRows;
        }

        const school = getSelectedSchool();
        const definition = await loadCurriculumForSchool(school);

        if (!definition) {
            state.rowsByClassId.set(classId, []);
            state.gradeByClassId.set(classId, grade);
            return null;
        }

        const wholeClassGroup = findWholeClassGroup(classGroup.id);

        if (!wholeClassGroup) {
            throw new Error(
                text(
                    "lessonWizard.missingWholeClassGroup",
                    `Brak grupy całej klasy dla ${classGroup.name}.`
                )
            );
        }

        const lessons = getCurriculumLessons(definition, grade);

        const rows = lessons.map(item => {
            const subject = findSubject(item.subjectName);

            const row = {
                classGroupId: classGroup.id,
                className: classGroup.name,
                studentGroupId: wholeClassGroup.id,
                subjectId: subject?.id ?? null,
                subjectName: item.subjectName,
                teacherId: null,
                hoursPerWeek: item.hoursPerWeek,
                source: item.source,
                action: "attention",
                existingRequirementId: null
            };

            const existing = findExisting(row);

            if (existing) {
                row.teacherId = existing.teacherId
                    ? Number(existing.teacherId)
                    : null;

                if (row.subjectId && row.teacherId) {
                    state.lastTeacherBySubjectId.set(
                        Number(row.subjectId),
                        Number(row.teacherId)
                    );
                }

                if (!row.hoursPerWeek) {
                    row.hoursPerWeek =
                        Number(existing.hoursPerWeek) || null;
                }
            } else if (row.subjectId) {
                row.teacherId =
                    state.lastTeacherBySubjectId.get(
                        Number(row.subjectId)
                    ) ?? null;
            }

            refreshAction(row);
            return row;
        });

        state.rowsByClassId.set(classId, rows);
        state.gradeByClassId.set(classId, grade);

        return rows;
    }

    function populateSchoolSelect() {
        const select = byId("lessonWizardSchoolSelect");
        if (!select) return;

        const schools = getAllSchools();
        const selected = state.schoolUnitId;

        select.innerHTML = "";

        for (const school of schools) {
            const option = document.createElement("option");
            option.value = String(school.id);
            option.textContent = school.name;
            select.appendChild(option);
        }

        if (
            selected &&
            schools.some(school => Number(school.id) === Number(selected))
        ) {
            select.value = String(selected);
        } else if (schools.length > 0) {
            state.schoolUnitId = Number(schools[0].id);
            select.value = String(state.schoolUnitId);
        }
    }

    function populateGradeSelect(classGroup, school) {
        const select = byId("lessonWizardGradeSelect");
        if (!select) return;

        select.innerHTML = "";

        const maxGrade = getMaxGrade(school.schoolType);

        for (let grade = 1; grade <= maxGrade; grade++) {
            const option = document.createElement("option");
            option.value = String(grade);
            option.textContent = String(grade);
            select.appendChild(option);
        }

        const savedGrade =
            state.gradeByClassId.get(Number(classGroup.id));

        const selectedGrade =
            savedGrade ??
            (Number(classGroup.grade) ||
                classGroup.inferredGrade ||
                1);

        select.value = String(selectedGrade);
    }

    function statusText(row) {
        switch (row.action) {
            case "create":
                return text("lessonWizard.create", "Nowa lekcja");
            case "update":
                return text("lessonWizard.update", "Do aktualizacji");
            case "unchanged":
                return text("lessonWizard.unchanged", "Bez zmian");
            default:
                return text("lessonWizard.attention", "Wymaga uzupełnienia");
        }
    }

    function renderRows(rows) {
        const tbody = byId("lessonWizardRows");
        if (!tbody) return;

        tbody.innerHTML = "";

        for (const row of rows) {
            refreshAction(row);

            const tr = document.createElement("tr");

            tr.appendChild(createTableCell(row.subjectName));

            const hoursCell = document.createElement("td");
            const hoursInput = document.createElement("input");
            hoursInput.type = "number";
            hoursInput.min = "1";
            hoursInput.max = "40";
            hoursInput.step = "1";
            hoursInput.value = row.hoursPerWeek ?? 1;
            hoursInput.className = "lesson-wizard-hours-input";
            hoursInput.placeholder = "—";
            hoursCell.appendChild(hoursInput);
            tr.appendChild(hoursCell);

            const teacherCell = document.createElement("td");
            const teacherSelect = document.createElement("select");

            const emptyTeacher = document.createElement("option");
            emptyTeacher.value = "";
            emptyTeacher.textContent =
                text("lessons.selectTeacher", "Wybierz nauczyciela");
            teacherSelect.appendChild(emptyTeacher);

            for (const teacher of availableTeachers) {
                const option = document.createElement("option");
                option.value = String(teacher.id);
                option.textContent =
                    teacher.alias
                        ? `${teacher.name} (${teacher.alias})`
                        : teacher.name;
                teacherSelect.appendChild(option);
            }

            teacherSelect.value =
                row.teacherId ? String(row.teacherId) : "";

            teacherCell.appendChild(teacherSelect);
            tr.appendChild(teacherCell);

            const statusCell = document.createElement("td");
            statusCell.className = "curriculum-row-status";
            statusCell.textContent = statusText(row);
            tr.appendChild(statusCell);

            const updateRow = () => {
                row.hoursPerWeek =
                    Number(hoursInput.value) || null;
                row.teacherId =
                    Number(teacherSelect.value) || null;

                if (row.subjectId && row.teacherId) {
                    state.lastTeacherBySubjectId.set(
                        Number(row.subjectId),
                        Number(row.teacherId)
                    );
                }

                refreshAction(row);
                statusCell.textContent = statusText(row);
            };

            hoursInput.addEventListener("input", updateRow);
            teacherSelect.addEventListener("change", updateRow);

            tbody.appendChild(tr);
        }
    }

    function setWizardText() {
        const assignments = [
            ["lessonWizardStepLabel", "lessonWizard.stepLabel", "Import planu nauczania"],
            ["lessonWizardTitle", "lessonWizard.title", "Przypisz nauczycieli do lekcji"],
            ["lessonWizardSubtitle", "lessonWizard.subtitle",
                "Przechodź po szkołach i klasach. Możesz wracać bez utraty wyborów."],
            ["lessonWizardSchoolLabel", "lessonWizard.school", "Szkoła"],
            ["lessonWizardYearLabel", "lessonWizard.schoolYear", "Rok szkolny"],
            ["lessonWizardGradeLabel", "lessonWizard.grade", "Rocznik"],
            ["lessonWizardBackButton", "lessonWizard.back", "← Wstecz"],
            ["lessonWizardCloseButton", "common.cancel", "Anuluj"],
            ["lessonWizardNextButton", "lessonWizard.nextSimple", "Dalej →"],
            ["confirmCurriculumImportButton", "lessonWizard.apply", "Zastosuj zmiany"],
            ["lessonWizardSummaryTitle", "lessonWizard.summary", "Podsumowanie"],
            ["lessonWizardSummaryHint", "lessonWizard.summaryHint",
                "Przed zapisem uzupełnij nauczycieli i liczbę godzin."]
        ];

        for (const [id, key, fallback] of assignments) {
            const element = byId(id);
            if (element) {
                element.textContent = text(key, fallback);
            }
        }
    }

    function setEmpty(message) {
        const empty = byId("lessonWizardEmptyState");
        const table = byId("lessonWizardTableWrapper");

        if (empty) {
            empty.textContent = message;
            empty.hidden = false;
        }

        if (table) {
            table.hidden = true;
        }
    }

    function updateProgress() {
        const school = getSelectedSchool();
        const classes = school ? getClassesForSchool(school.id) : [];

        const label = byId("lessonWizardProgressText");
        const bar = byId("lessonWizardProgressValue");

        if (state.isSummary) {
            if (label) {
                label.textContent =
                    text("lessonWizard.summary", "Podsumowanie");
            }
            if (bar) {
                bar.style.width = "100%";
            }
            return;
        }

        const current =
            classes.length > 0
                ? Math.min(state.classIndex + 1, classes.length)
                : 0;

        if (label) {
            label.textContent =
                classes.length > 0
                    ? text("lessonWizard.localProgress", "Klasa {current} z {total}")
                        .replace("{current}", current)
                        .replace("{total}", classes.length)
                    : text("lessonWizard.noClasses", "Brak klas");
        }

        if (bar) {
            bar.style.width =
                classes.length > 0
                    ? `${Math.round((current / classes.length) * 100)}%`
                    : "0%";
        }
    }

    function getMissingGradesForSchool(school) {
        if (!school) {
            return [];
        }

        const maxGrade = getMaxGrade(school.schoolType);

        const defined = new Set(
            getClassesForSchool(school.id)
                .map(item => Number(item.grade))
                .filter(Number.isInteger)
        );

        const missing = [];

        for (let grade = 1; grade <= maxGrade; grade++) {
            if (!defined.has(grade)) {
                missing.push(grade);
            }
        }

        return missing;
    }

    function updateSourceInfo(school, definition) {
        const target = byId("curriculumSourceInfo");
        if (!target) return;

        const parts = [];

        if (definition?.title) {
            parts.push(definition.title);
        } else if (school?.name) {
            parts.push(school.name);
        }

        const missingGrades =
            getMissingGradesForSchool(school);

        if (missingGrades.length > 0) {
            parts.push(
                text(
                    "lessonWizard.missingSchoolGrades",
                    "Brakuje roczników: {grades}. Możesz kontynuować, ale plan zostanie przygotowany tylko dla istniejących klas."
                ).replace(
                    "{grades}",
                    missingGrades.join(", ")
                )
            );
        }

        target.textContent = parts.join(" · ");
    }

    async function renderWizard() {
        setWizardText();
        populateSchoolSelect();

        const school = getSelectedSchool();
        const classes = school ? getClassesForSchool(school.id) : [];
        const classGroup = classes[state.classIndex] ?? null;

        byId("lessonWizardSummaryPanel").hidden = !state.isSummary;
        byId("lessonWizardNextButton").hidden = state.isSummary;
        byId("confirmCurriculumImportButton").hidden = !state.isSummary;

        const gradeField =
            document.querySelector(".lesson-wizard-grade-field");

        if (gradeField) {
            gradeField.hidden = state.isSummary;
        }

        if (state.isSummary) {
            byId("lessonWizardSchoolName").textContent = "";
            byId("lessonWizardClassName").textContent =
                text("lessonWizard.summary", "Podsumowanie");

            byId("lessonWizardTableWrapper").hidden = true;
            byId("lessonWizardEmptyState").hidden = true;

            renderSummary();
            updateProgress();
            return;
        }

        byId("lessonWizardSchoolName").textContent =
            school?.name ?? "";

        if (!school) {
            byId("lessonWizardClassName").textContent = "";
            setEmpty(
                text(
                    "lessonWizard.noSchools",
                    "W organizacji nie ma jeszcze żadnej szkoły."
                )
            );
            updateProgress();
            return;
        }

        if (!classGroup) {
            byId("lessonWizardClassName").textContent = "";
            setEmpty(
                text(
                    "lessonWizard.noClassesForSchool",
                    "Ta szkoła nie ma jeszcze zdefiniowanych klas."
                )
            );
            updateProgress();
            return;
        }

        byId("lessonWizardClassName").textContent =
            classGroup.name;

        populateGradeSelect(classGroup, school);

        const grade =
            Number(byId("lessonWizardGradeSelect")?.value ?? 1);

        const definition =
            await loadCurriculumForSchool(school);

        updateSourceInfo(school, definition);

        if (!definition) {
            setEmpty(
                text(
                    "lessonWizard.missingCurriculum",
                    "Nie znaleziono danych planu nauczania dla tego typu szkoły."
                )
            );
            updateProgress();
            return;
        }

        const rows =
            await buildRowsForClass(classGroup, grade);

        if (!rows || rows.length === 0) {
            setEmpty(
                text(
                    "lessonWizard.noSubjectsForGrade",
                    "Nie znaleziono przedmiotów dla tego rocznika."
                )
            );
            updateProgress();
            return;
        }

        byId("lessonWizardEmptyState").hidden = true;
        byId("lessonWizardTableWrapper").hidden = false;

        renderRows(rows);
        updateProgress();
    }

    function getAllRows() {
        return Array.from(state.rowsByClassId.values()).flat();
    }

    function renderSummary() {
        const rows = getAllRows();
        rows.forEach(refreshAction);

        const counts = {
            create: rows.filter(row => row.action === "create").length,
            update: rows.filter(row => row.action === "update").length,
            unchanged: rows.filter(row => row.action === "unchanged").length,
            attention: rows.filter(row => row.action === "attention").length
        };

        const grid = byId("lessonWizardSummaryGrid");

        if (grid) {
            grid.innerHTML = `
                <div>
                    <strong>${counts.create}</strong>
                    <span>${text("lessonWizard.created", "Nowe")}</span>
                </div>
                <div>
                    <strong>${counts.update}</strong>
                    <span>${text("lessonWizard.updated", "Aktualizacje")}</span>
                </div>
                <div>
                    <strong>${counts.unchanged}</strong>
                    <span>${text("lessonWizard.unchangedCount", "Bez zmian")}</span>
                </div>
                <div>
                    <strong>${counts.attention}</strong>
                    <span>${text("lessonWizard.attention", "Wymaga uzupełnienia")}</span>
                </div>
            `;
        }

        const apply = byId("confirmCurriculumImportButton");

        if (apply) {
            apply.disabled =
                counts.attention > 0 ||
                (counts.create + counts.update) === 0;
        }
    }

    function moveToNextSchool() {
        const schools = getAllSchools();
        const currentIndex = schools.findIndex(
            school => Number(school.id) === Number(state.schoolUnitId)
        );

        if (currentIndex >= 0 && currentIndex + 1 < schools.length) {
            state.schoolUnitId = Number(schools[currentIndex + 1].id);
            state.classIndex = 0;
            return true;
        }

        return false;
    }

    function moveToPreviousSchool() {
        const schools = getAllSchools();
        const currentIndex = schools.findIndex(
            school => Number(school.id) === Number(state.schoolUnitId)
        );

        if (currentIndex > 0) {
            const previous = schools[currentIndex - 1];
            state.schoolUnitId = Number(previous.id);

            const classes = getClassesForSchool(previous.id);
            state.classIndex = Math.max(0, classes.length - 1);

            return true;
        }

        return false;
    }

    function nextStep() {
        const school = getSelectedSchool();
        const classes = school ? getClassesForSchool(school.id) : [];

        if (classes.length > 0 && state.classIndex + 1 < classes.length) {
            state.classIndex++;
            return;
        }

        if (moveToNextSchool()) {
            return;
        }

        state.isSummary = true;
    }

    function previousStep() {
        if (state.isSummary) {
            state.isSummary = false;

            const schools = getAllSchools();
            const lastSchool = schools.at(-1);

            if (lastSchool) {
                state.schoolUnitId = Number(lastSchool.id);
                const classes = getClassesForSchool(lastSchool.id);
                state.classIndex = Math.max(0, classes.length - 1);
            }

            return;
        }

        if (state.classIndex > 0) {
            state.classIndex--;
            return;
        }

        moveToPreviousSchool();
    }

    async function saveAll() {
        const rows = getAllRows();
        rows.forEach(refreshAction);

        if (rows.some(row => row.action === "attention")) {
            showCurriculumImportMessage(
                text(
                    "lessonWizard.summaryHint",
                    "Przed zapisem uzupełnij nauczycieli i liczbę godzin."
                ),
                true
            );
            return;
        }

        const actionable = rows.filter(
            row => row.action === "create" || row.action === "update"
        );

        if (actionable.length === 0) {
            showCurriculumImportMessage(
                text(
                    "lessonWizard.nothingToSave",
                    "Nie ma zmian do zapisania."
                ),
                true
            );
            return;
        }

        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/requirements/import-teaching-plan?organizationId=${encodeURIComponent(organizationId)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    items: actionable.map(row => ({
                        classGroupId: row.classGroupId,
                        teacherId: row.teacherId,
                        subjectId: row.subjectId,
                        subjectName:
                            row.subjectId ? null : row.subjectName,
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

        await refreshPageData();
        closeWizard();
    }

    async function openWizard() {
        closeRequirementForm();

        state.lastTeacherBySubjectId.clear();

        // Keep these sequential because the current GET endpoints still
        // contain legacy WholeClass repair/backfill logic.
        await loadRequirements();
        await loadStudentGroups();
        await loadSchools();

        state.schoolUnitId =
            getAllSchools().length > 0
                ? Number(getAllSchools()[0].id)
                : null;

        state.classIndex = 0;
        state.isSummary = false;
        state.rowsByClassId.clear();
        state.gradeByClassId.clear();
        state.curriculumCache.clear();

        byId("curriculumImportSection").hidden = false;
        document.body.classList.add("modal-open");

        await renderWizard();
    }

    function closeWizard() {
        const modal = byId("curriculumImportSection");

        if (modal) {
            modal.hidden = true;
        }

        document.body.classList.remove("modal-open");
        state.isSummary = false;
    }

    document.addEventListener("DOMContentLoaded", () => {
        byId("importCurriculumButton")
            ?.addEventListener("click", openWizard);

        byId("cancelCurriculumImportButton")
            ?.addEventListener("click", closeWizard);

        byId("lessonWizardCloseButton")
            ?.addEventListener("click", closeWizard);

        byId("lessonWizardSchoolSelect")
            ?.addEventListener("change", async event => {
                state.schoolUnitId =
                    Number(event.target.value) || null;

                state.classIndex = 0;
                state.isSummary = false;

                await renderWizard();
            });

        byId("lessonWizardGradeSelect")
            ?.addEventListener("change", async event => {
                const classGroup = getCurrentClass();

                if (!classGroup) {
                    return;
                }

                const classId = Number(classGroup.id);
                state.gradeByClassId.set(
                    classId,
                    Number(event.target.value)
                );

                state.rowsByClassId.delete(classId);

                await renderWizard();
            });

        byId("lessonWizardNextButton")
            ?.addEventListener("click", async () => {
                nextStep();
                await renderWizard();
            });

        byId("lessonWizardBackButton")
            ?.addEventListener("click", async () => {
                previousStep();
                await renderWizard();
            });

        byId("confirmCurriculumImportButton")
            ?.addEventListener("click", async () => {
                const button =
                    byId("confirmCurriculumImportButton");

                if (button) {
                    button.disabled = true;
                }

                try {
                    await saveAll();
                } catch (error) {
                    console.error(
                        "Error saving teaching-plan wizard:",
                        error
                    );

                    showCurriculumImportMessage(
                        error instanceof Error
                            ? error.message
                            : "Nie udało się zapisać planu nauczania.",
                        true
                    );
                } finally {
                    renderSummary();
                }
            });
    });
})();

