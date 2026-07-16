let allRules = [];
let targetItems = [];

const targetEndpoints = {
    Teacher: "/api/teachers",
    Room: "/api/rooms",
    ClassGroup: "/api/classes",
    Subject: "/api/subjects"
};

const dayNames = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday"
};

document.addEventListener("DOMContentLoaded", async () => {
    setupNavigation();
    setupFormEvents();

    await loadTargetItems();
    await loadRules();
});

function setupNavigation() {
    const backToMainButton = document.getElementById("backToMainButton");

    if (backToMainButton) {
        backToMainButton.addEventListener("click", () => {
            window.location.href = "main.html";
        });
    }
}

function setupFormEvents() {
    const form = document.getElementById("ruleForm");
    const resetFormButton = document.getElementById("resetFormButton");
    const newRuleButton = document.getElementById("newRuleButton");
    const refreshRulesButton = document.getElementById("refreshRulesButton");
    const targetTypeSelect = document.getElementById("targetTypeSelect");
    const isHardInput = document.getElementById("isHardInput");

    if (form) {
        form.addEventListener("submit", saveRule);
    }

    if (resetFormButton) {
        resetFormButton.addEventListener("click", resetForm);
    }

    if (newRuleButton) {
        newRuleButton.addEventListener("click", resetForm);
    }

    if (refreshRulesButton) {
        refreshRulesButton.addEventListener("click", loadRules);
    }

    if (targetTypeSelect) {
        targetTypeSelect.addEventListener("change", async () => {
            await loadTargetItems();
        });
    }

    if (isHardInput) {
        isHardInput.addEventListener("change", updateWeightState);
    }

    updateWeightState();
}

async function loadRules() {
    try {
        setStatus("Loading rules...");

        const response = await fetch(
            addOrganizationId("/api/schedule-constraints")
        );

        if (!response.ok) {
            throw new Error(
                `Could not load rules. Status: ${response.status}`
            );
        }

        const data = await response.json();

        allRules = normalizeArray(data);

        renderRulesTable();

        setStatus(`Loaded ${allRules.length} rule(s).`);
    } catch (error) {
        console.error("Load rules error:", error);
        setStatus("Error while loading rules.");
    }
}

async function loadTargetItems() {
    const targetType = getValue("targetTypeSelect");
    const endpoint = targetEndpoints[targetType];

    if (!endpoint) {
        populateTargetSelect([]);
        return;
    }

    try {
        setStatus(`Loading ${targetType} list...`);

        const response = await fetch(addOrganizationId(endpoint));

        if (!response.ok) {
            throw new Error(`Could not load targets. Status: ${response.status}`);
        }

        const data = await response.json();

        targetItems = normalizeArray(data);

        populateTargetSelect(targetItems);

        setStatus("Ready.");
    } catch (error) {
        console.error(error);
        targetItems = [];
        populateTargetSelect([]);
        setStatus(`Error while loading ${targetType} list.`);
    }
}

function populateTargetSelect(items) {
    const select = document.getElementById("targetIdSelect");

    if (!select) {
        return;
    }

    select.innerHTML = "";

    if (!items || items.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No items available";
        select.appendChild(option);
        return;
    }

    for (const item of items) {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = getDisplayName(item);
        select.appendChild(option);
    }
}

async function saveRule(event) {
    event.preventDefault();

    const id = getValue("constraintId");
    const request = buildRequest();

    const validationMessage = validateRequest(request);

    if (validationMessage) {
        setStatus(validationMessage);
        return;
    }

    try {
        const isEdit = Boolean(id);

        const baseUrl = isEdit
            ? `/api/schedule-constraints/${id}`
            : "/api/schedule-constraints";

        const url = addOrganizationId(baseUrl);
        const method = isEdit ? "PUT" : "POST";

        setStatus(isEdit ? "Updating rule..." : "Creating rule...");

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                errorText || `Save failed. Status: ${response.status}`
            );
        }

        await loadRules();
        resetForm();

        setStatus(isEdit ? "Rule updated." : "Rule created.");
    } catch (error) {
        console.error("Save rule error:", error);
        setStatus("Error while saving rule.");
    }
}

function buildRequest() {
    const isHard = getChecked("isHardInput");
    const weightValue = getNumberOrNull("weightInput");

    return {
        name: getValue("nameInput"),
        description: getValue("descriptionInput") || null,
        constraintType: getValue("constraintTypeSelect"),
        targetType: getValue("targetTypeSelect"),
        targetId: getNumberOrNull("targetIdSelect"),
        isHard: isHard,
        weight: isHard ? 100 : (weightValue ?? 0),
        dayOfWeek: getNumberOrNull("dayOfWeekSelect"),
        slotNumber: getNumberOrNull("slotNumberSelect"),
        value: getValue("valueInput") || null,
        isActive: getChecked("isActiveInput")
    };
}

function validateRequest(request) {
    if (!request.name || request.name.trim().length === 0) {
        return "Name is required.";
    }

    if (!request.constraintType) {
        return "Constraint type is required.";
    }

    if (!request.targetType) {
        return "Target type is required.";
    }

    if (!request.targetId || request.targetId <= 0) {
        return "Target is required.";
    }

    if (request.weight < 0 || request.weight > 100) {
        return "Weight must be between 0 and 100.";
    }

    if (request.dayOfWeek !== null && (request.dayOfWeek < 1 || request.dayOfWeek > 5)) {
        return "Day must be between Monday and Friday.";
    }

    if (request.slotNumber !== null && (request.slotNumber < 1 || request.slotNumber > 8)) {
        return "Slot must be between 1 and 8.";
    }

    return null;
}

function renderRulesTable() {
    const tbody = document.getElementById("rulesTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!allRules || allRules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9">No rules defined yet.</td></tr>`;
        return;
    }

    for (const rule of allRules) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${escapeHtml(rule.name)}</td>
            <td>${escapeHtml(formatConstraintType(rule.constraintType))}</td>
            <td>${escapeHtml(formatTarget(rule))}</td>
            <td>${escapeHtml(formatDay(rule.dayOfWeek))}</td>
            <td>${escapeHtml(formatSlot(rule.slotNumber))}</td>
            <td>${rule.isHard ? "Yes" : "No"}</td>
            <td>${rule.weight}</td>
            <td>${rule.isActive ? "Yes" : "No"}</td>
            <td>
                <button class="table-action-button" data-action="edit" data-id="${rule.id}">
                    Edit
                </button>
                <button class="table-action-button table-action-danger" data-action="delete" data-id="${rule.id}">
                    Delete
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    }

    tbody.querySelectorAll("button[data-action='edit']").forEach(button => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            editRule(id);
        });
    });

    tbody.querySelectorAll("button[data-action='delete']").forEach(button => {
        button.addEventListener("click", async () => {
            const id = Number(button.dataset.id);
            await deleteRule(id);
        });
    });
}

async function editRule(id) {
    const rule = allRules.find(x => x.id === id);

    if (!rule) {
        setStatus(`Rule with id ${id} was not found in the loaded list.`);
        return;
    }

    setValue("constraintId", rule.id);
    setValue("nameInput", rule.name);
    setValue("descriptionInput", rule.description ?? "");
    setValue("constraintTypeSelect", rule.constraintType);
    setValue("targetTypeSelect", rule.targetType);

    await loadTargetItems();

    setValue("targetIdSelect", rule.targetId);
    setValue("dayOfWeekSelect", rule.dayOfWeek ?? "");
    setValue("slotNumberSelect", rule.slotNumber ?? "");
    setValue("valueInput", rule.value ?? "");
    setValue("weightInput", rule.weight ?? 100);

    setChecked("isHardInput", rule.isHard);
    setChecked("isActiveInput", rule.isActive);

    updateWeightState();

    setStatus(`Editing rule: ${rule.name}`);
}

async function deleteRule(id) {
    const rule = allRules.find(x => x.id === id);
    const name = rule ? rule.name : `#${id}`;

    const confirmed = confirm(`Delete rule "${name}"?`);

    if (!confirmed) {
        return;
    }

    try {
        setStatus("Deleting rule...");

        const baseUrl = `/api/schedule-constraints/${id}`;
        const url = addOrganizationId(baseUrl);

        const response = await fetch(url, {
            method: "DELETE"
        });

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                errorText || `Delete failed. Status: ${response.status}`
            );
        }

        await loadRules();
        resetForm();

        setStatus("Rule deleted.");
    } catch (error) {
        console.error("Delete rule error:", error);
        setStatus("Error while deleting rule.");
    }
}

function resetForm() {
    setValue("constraintId", "");
    setValue("nameInput", "");
    setValue("descriptionInput", "");
    setValue("constraintTypeSelect", "UnavailableSlot");
    setValue("targetTypeSelect", "Teacher");
    setValue("dayOfWeekSelect", "");
    setValue("slotNumberSelect", "");
    setValue("valueInput", "");
    setValue("weightInput", 100);

    setChecked("isHardInput", true);
    setChecked("isActiveInput", true);

    updateWeightState();

    loadTargetItems();

    setStatus("Ready.");
}

function updateWeightState() {
    const isHard = getChecked("isHardInput");
    const weightInput = document.getElementById("weightInput");

    if (!weightInput) {
        return;
    }

    if (isHard) {
        weightInput.value = 100;
        weightInput.disabled = true;
    } else {
        weightInput.disabled = false;
    }
}

function normalizeArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.result)) {
        return data.result;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (Array.isArray(data.items)) {
        return data.items;
    }

    return [];
}

function getDisplayName(item) {
    return item.name
        ?? item.fullName
        ?? item.displayName
        ?? item.title
        ?? `Item #${item.id}`;
}

function formatConstraintType(type) {
    switch (type) {
        case "UnavailableSlot":
            return "Unavailable slot";
        case "AvoidSlot":
            return "Avoid slot";
        case "MaxLessonsPerDay":
            return "Max lessons per day";
        default:
            return type ?? "";
    }
}

function formatTarget(rule) {
    const targetName = rule.targetName
        ?? rule.teacherName
        ?? rule.roomName
        ?? rule.classGroupName
        ?? rule.subjectName;

    if (targetName) {
        return `${rule.targetType}: ${targetName}`;
    }

    return `${rule.targetType} #${rule.targetId}`;
}

function formatDay(dayOfWeek) {
    if (!dayOfWeek) {
        return "-";
    }

    return dayNames[dayOfWeek] ?? `Day ${dayOfWeek}`;
}

function formatSlot(slotNumber) {
    if (!slotNumber) {
        return "-";
    }

    return `Lesson ${slotNumber}`;
}

function getValue(id) {
    const element = document.getElementById(id);

    if (!element) {
        return "";
    }

    return element.value;
}

function setValue(id, value) {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    element.value = value ?? "";
}

function getChecked(id) {
    const element = document.getElementById(id);

    if (!element) {
        return false;
    }

    return element.checked;
}

function setChecked(id, value) {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    element.checked = !!value;
}

function getNumberOrNull(id) {
    const value = getValue(id);

    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return null;
    }

    return number;
}

function setStatus(message) {
    const statusText = document.getElementById("statusText");

    if (statusText) {
        statusText.textContent = message;
    }
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getOrganizationId() {
    return window.appContext.requireOrganizationId();
}

function addOrganizationId(url) {
    const organizationId = getOrganizationId();
    const separator = url.includes("?") ? "&" : "?";

    return `${url}${separator}organizationId=${encodeURIComponent(organizationId)}`;
}