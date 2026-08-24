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
        const individuals = overview.groups.filter(g => g.classGroupId === classGroup.id && (g.type === 3 || g.type === "Individual"));
        for (const group of individuals) section.append(createRow(group.name, t("studentGroups.individual", "Individual"), group));
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
async function createIndividual(event) {
    event.preventDefault();
    await post("individual", { classGroupId:Number(document.getElementById("individualClassId").value), name:document.getElementById("individualName").value.trim() });
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
async function del(path) { const organizationId=window.appContext.requireOrganizationId(); const response=await fetch(`/api/student-groups/${path}?organizationId=${encodeURIComponent(organizationId)}`,{method:"DELETE"}); const data=await read(response); if(!response.ok){showMessage(data?.message??t("studentGroups.deleteFailed", "Could not delete student group."),true);return;} showMessage(t("studentGroups.updated", "Student groups updated."),false); await refresh(); }
async function read(response){const text=await response.text(); if(!text)return null; try{return JSON.parse(text)}catch{return {message:text}}}
function showMessage(message,error){const e=document.getElementById("studentGroupsMessage");e.textContent=message;e.classList.toggle("error-message",error)}
function escapeHtml(value){const div=document.createElement("div");div.textContent=value??"";return div.innerHTML}
