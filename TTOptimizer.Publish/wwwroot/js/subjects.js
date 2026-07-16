document.addEventListener("DOMContentLoaded", async () => {
    const backToMainButton = document.getElementById("backToMainButton");
    const refreshSubjectsButton = document.getElementById("refreshSubjectsButton");
    const addSubjectButton = document.getElementById("addSubjectButton");

    if (backToMainButton) {
        backToMainButton.addEventListener("click", () => {
            window.location.href = "main.html";
        });
    }

    if (refreshSubjectsButton) {
        refreshSubjectsButton.addEventListener("click", loadSubjects);
    }

    if (addSubjectButton) {
        addSubjectButton.addEventListener("click", () => {
            alert("Adding subject will be implemented later.");
        });
    }

    await loadSubjects();
});

async function loadSubjects() {
    try {
        const organizationId = window.appContext.requireOrganizationId();
        const response = await fetch(`api/subjects?organizationId=${organizationId}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error: ${response.status}. Response: ${errorText}`);
        }

        const subjects = await response.json();
        renderSubjects(subjects);
    } catch (error) {
        console.error("Error loading subjects:", error);
        showSubjectsError();
    }
}

function renderSubjects(subjects) {
    const tbody = document.querySelector("#subjectsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!subjects || subjects.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td colspan="3">No subjects found.</td>
        `;

        tbody.appendChild(row);
        return;
    }

    subjects.forEach(subject => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${subject.id}</td>
            <td>${subject.name}</td>
            <td>
                <button class="small-button" onclick="editSubject(${subject.id})">
                    Edit
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function showSubjectsError() {
    const tbody = document.querySelector("#subjectsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="3">Could not load subjects.</td>
        </tr>
    `;
}

function editSubject(id) {
    alert(`Editing subject ${id} will be implemented later.`);
}