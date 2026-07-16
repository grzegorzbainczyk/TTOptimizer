document.addEventListener("DOMContentLoaded", async () => {
    const backToMainButton = document.getElementById("backToMainButton");
    const refreshRequirementsButton = document.getElementById("refreshRequirementsButton");
    const addRequirementButton = document.getElementById("addRequirementButton");

    if (backToMainButton) {
        backToMainButton.addEventListener("click", () => {
            window.location.href = "main.html";
        });
    }

    if (refreshRequirementsButton) {
        refreshRequirementsButton.addEventListener("click", loadRequirements);
    }

    if (addRequirementButton) {
        addRequirementButton.addEventListener("click", () => {
            alert("Adding requirement will be implemented later.");
        });
    }

    await loadRequirements();
});

async function loadRequirements() {
    try {        
        const organizationId = window.appContext.requireOrganizationId();
        const response = await fetch(`api/requirements?organizationId=${organizationId}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error: ${response.status}. Response: ${errorText}`);
        }

        const requirements = await response.json();
        renderRequirements(requirements);
    } catch (error) {
        console.error("Error loading requirements:", error);
        showRequirementsError();
    }
}

function renderRequirements(requirements) {
    const tbody = document.querySelector("#requirementsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!requirements || requirements.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td colspan="6">No requirements found.</td>
        `;

        tbody.appendChild(row);
        return;
    }

    requirements.forEach(requirement => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${requirement.id}</td>
            <td>${requirement.teacherName ?? requirement.teacherId ?? ""}</td>
            <td>${requirement.className ?? requirement.classId ?? ""}</td>
            <td>${requirement.subjectName ?? requirement.subjectId ?? ""}</td>
            <td>${requirement.hoursPerWeek ?? ""}</td>
            <td>
                <button class="small-button" onclick="editRequirement(${requirement.id})">
                    Edit
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function showRequirementsError() {
    const tbody = document.querySelector("#requirementsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="6">Could not load requirements.</td>
        </tr>
    `;
}

function editRequirement(id) {
    alert(`Editing requirement ${id} will be implemented later.`);
}