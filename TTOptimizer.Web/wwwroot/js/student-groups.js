import { initializeI18n, t } from "./i18n.js";
let overview = { groups: [], divisions: [] };
let classes = [];

document.addEventListener("DOMContentLoaded", async () => {
    await initializeI18n();
    document.title = t("studentGroups.pageTitle", "ClassFlow - Student Groups");
    document.getElementById("backToMainButton")?.addEventListener("click", () => window.location.href = "main.html");
    document.getElementById("refreshStudentGroupsButton")?.addEventListener("click", refresh);
    document.getElementById("divisionForm")?.addEventListener("submit", createDivision);
    document.getElementById("individualForm")?.addEventListener("submit", createIndividual);
    document.getElementById("combinedForm")?.addEventListener("submit", createCombined);
    await refresh();
});

async function refresh() {
    const organizationId = window.appContext.requireOrganizationId();
    const [classResponse, groupResponse] = await Promise.all([
        fetch(`/api/classes?organizationId=${encodeURIComponent(organizationId)}`),
        fetch(`/api/student-groups?organizationId=${encodeURIComponent(organizationId)}`)
    ]);
    if (!classResponse.ok || !groupResponse.ok) {
        showMessage(t("studentGroups.loadFailed", "Could not load student groups."), true); return;
    }
    classes = await classResponse.json();
    overview = await groupResponse.json();
    fillClassSelects();
    renderIndividualGroups();
    renderMembers();
    renderTree();
}

function fillClassSelects() {
    for (const id of ["divisionClassId", "individualClassId"]) {
        const select = document.getElementById(id);
        select.innerHTML = "";
        select.append(
            new Option(
                t("studentGroups.selectClass", "Select class"),
                ""
            )
        );
        for (const item of classes) select.append(new Option(item.name, item.id));
    }
}

function renderIndividualGroups() {
    const tbody = document.getElementById("individualGroupsBody");
    const count = document.getElementById("individualGroupsCount");
    if (!tbody) return;

    const individuals = overview.groups.filter(
        group =>
            group.type === 3 ||
            group.type === "Individual"
    );

    if (count) {
        count.textContent =
            individuals.length === 1
                ? "1 uczeń / grupa"
                : `${individuals.length} uczniów / grup`;
    }

    tbody.innerHTML = "";

    if (individuals.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 3;
        cell.className = "teachers-table-state";
        cell.textContent =
            "Nie dodano jeszcze uczniów ani małych grup do zajęć dodatkowych.";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    for (const group of individuals) {
        const row = document.createElement("tr");
        row.className = "teacher-row";

        const classGroup = classes.find(
            item => Number(item.id) === Number(group.classGroupId)
        );

        const nameCell = document.createElement("td");
        nameCell.textContent =
            getIndividualDisplayName(group);

        const classCell = document.createElement("td");
        classCell.textContent = classGroup?.name ?? "";

        const actionsCell = document.createElement("td");
        actionsCell.className = "table-actions-column";
        actionsCell.appendChild(
            smallDeleteButton(async () => await deleteGroup(group))
        );

        row.append(nameCell, classCell, actionsCell);
        tbody.appendChild(row);
    }
}

function renderMembers() {
    const host = document.getElementById("combinedMembers"); host.innerHTML = "";
    const selectable = overview.groups.filter(g => g.type !== 2 && g.type !== "Combined" && g.type !== "WholeClass" && g.type !== 0);
    if (selectable.length === 0) { host.textContent = t("studentGroups.createFirst", "Create subgroups or individual groups first."); return; }
    for (const group of selectable) {
        const label = document.createElement("label"); label.className = "student-group-member-option";
        const input = document.createElement("input"); input.type = "checkbox"; input.value = group.id;
        label.append(input, document.createTextNode(group.name)); host.append(label);
    }
}

function renderTree() {
    const host = document.getElementById("studentGroupsTree"); host.innerHTML = "";
    for (const classGroup of classes) {
        const section = document.createElement("article"); section.className = "student-group-tree-card";
        const title = document.createElement("h3"); title.textContent = classGroup.name; section.append(title);
        const whole = overview.groups.find(g => g.classGroupId === classGroup.id && (g.type === 0 || g.type === "WholeClass"));
        section.append(createRow(whole?.name ?? classGroup.name, t("studentGroups.wholeClass", "Whole class"), null));
        const divisions = overview.divisions.filter(d => d.classGroupId === classGroup.id);
        for (const division of divisions) {
            const block = document.createElement("div"); block.className = "student-group-division";
            const heading = document.createElement("div"); heading.className = "student-group-division-heading";
            const strong = document.createElement("strong"); strong.textContent = division.name;
            const del = smallDeleteButton(async () => await deleteDivision(division)); heading.append(strong, del); block.append(heading);
            for (const group of division.groups) block.append(createRow(group.name, t("studentGroups.subgroup", "Subgroup"), group));
            section.append(block);
        }
        host.append(section);
    }
    const combined = overview.groups.filter(g => g.type === 2 || g.type === "Combined");
    if (combined.length) {
        const section = document.createElement("article"); section.className = "student-group-tree-card student-group-combined-card";
        const title = document.createElement("h3"); title.textContent = t("studentGroups.combinedGroups", "Combined groups"); section.append(title);
        for (const group of combined) section.append(createRow(`${group.name} (${(group.memberGroupNames ?? []).join(", ")})`, t("studentGroups.combined", "Combined"), group));
        host.append(section);
    }
}

function createRow(name, type, group) {
    const row = document.createElement("div"); row.className = "student-group-tree-row";
    const text = document.createElement("span"); text.innerHTML = `<strong>${escapeHtml(name)}</strong><small>${type}</small>`; row.append(text);
    if (group) row.append(smallDeleteButton(async () => await deleteGroup(group)));
    return row;
}
function smallDeleteButton(handler) { const b=document.createElement("button"); b.type="button"; b.className="small-button teacher-delete-button"; b.textContent=t("common.delete", "Delete"); b.addEventListener("click",handler); return b; }

async function createDivision(event) {
    event.preventDefault();
    const names = document.getElementById("divisionGroupNames").value.split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);
    await post("divisions", { classGroupId:Number(document.getElementById("divisionClassId").value), name:document.getElementById("divisionName").value.trim(), groupNames:names });
}
function buildIndividualGroupName(classGroupId, rawName) {
    const classGroup = classes.find(
        item => Number(item.id) === Number(classGroupId)
    );

    const className = classGroup?.name?.trim() ?? "";
    const name = rawName.trim();

    if (!className) {
        return name;
    }

    const prefix = `${className} - `;

    return name.startsWith(prefix)
        ? name
        : `${prefix}${name}`;
}

function getIndividualDisplayName(group) {
    const classGroup = classes.find(
        item => Number(item.id) === Number(group.classGroupId)
    );

    const className = classGroup?.name?.trim() ?? "";
    const name = String(group.name ?? "");

    if (!className) {
        return name;
    }

    const prefix = `${className} - `;

    return name.startsWith(prefix)
        ? name.slice(prefix.length)
        : name;
}

async function createIndividual(event) {
    event.preventDefault();

    const classGroupId =
        Number(document.getElementById("individualClassId").value);

    const name =
        document.getElementById("individualName").value.trim();

    if (classGroupId <= 0 || !name) {
        showMessage(
            "Podaj klasę źródłową oraz nazwę ucznia lub grupy.",
            true
        );
        return;
    }

    const storedName =
        buildIndividualGroupName(classGroupId, name);

    await post(
        "individual",
        {
            classGroupId,
            name: storedName
        }
    );

    document.getElementById("individualName").value = "";
}

async function createCombined(event) {
    event.preventDefault();
    const ids=[...document.querySelectorAll('#combinedMembers input:checked')].map(x=>Number(x.value));
    await post("combined", { name:document.getElementById("combinedName").value.trim(), memberGroupIds:ids });
}
async function post(path, body) {
    const organizationId=window.appContext.requireOrganizationId();
    const response=await fetch(`/api/student-groups/${path}?organizationId=${encodeURIComponent(organizationId)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await read(response); if(!response.ok){showMessage(data?.message??t("studentGroups.saveFailed", "Could not save student group."),true);return;} showMessage(t("studentGroups.updated", "Student groups updated."),false); await refresh();
}
async function deleteGroup(group) { if(!confirm(t("studentGroups.deleteGroupConfirm", "Delete student group {name}?").replace("{name}", group.name ?? ""))) return; await del(`${group.id}`); }
async function deleteDivision(division) { if(!confirm(t("studentGroups.deleteDivisionConfirm", "Delete division {name}?").replace("{name}", division.name ?? ""))) return; await del(`divisions/${division.id}`); }
async function del(path) {
    const organizationId =
        window.appContext.requireOrganizationId();

    const response = await fetch(
        `/api/student-groups/${path}?organizationId=${encodeURIComponent(
            organizationId
        )}`,
        {
            method: "DELETE"
        }
    );

    const data = await read(response);

    if (!response.ok) {
        const message =
            getDeleteErrorMessage(
                response.status,
                data?.code,
                data?.message
            );

        showMessage(message, true);
        alert(message);
        return false;
    }

    showMessage(
        "Grupa została usunięta.",
        false
    );

    await refresh();
    return true;
}

function getDeleteErrorMessage(
    status,
    code,
    serverMessage
) {
    switch (code) {
        case "group_used_by_lessons":
            return "Nie można usunąć tej grupy, ponieważ jest już używana przez zajęcia. Najpierw usuń lub zmień te zajęcia.";

        case "group_used_by_combined":
            return "Nie można usunąć tej grupy, ponieważ należy do grupy łączonej. Najpierw zmień albo usuń grupę łączoną.";

        case "whole_class_managed":
            return "Grupa całej klasy jest tworzona i zarządzana automatycznie.";

        case "division_in_use":
            return "Nie można usunąć tego podziału, ponieważ co najmniej jedna z jego grup jest już używana.";

        default:
            if (status === 409) {
                return serverMessage ||
                    "Nie można usunąć tej grupy, ponieważ jest już używana.";
            }

            return serverMessage ||
                t(
                    "studentGroups.deleteFailed",
                    "Could not delete student group."
                );
    }
}
async function read(response){const text=await response.text(); if(!text)return null; try{return JSON.parse(text)}catch{return {message:text}}}
function showMessage(message,error){const e=document.getElementById("studentGroupsMessage");e.textContent=message;e.classList.toggle("error-message",error)}
function escapeHtml(value){const div=document.createElement("div");div.textContent=value??"";return div.innerHTML}
