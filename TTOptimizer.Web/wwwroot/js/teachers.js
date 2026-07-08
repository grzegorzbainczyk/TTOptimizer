document.addEventListener("DOMContentLoaded", async () => {
    const backToMainButton = document.getElementById("backToMainButton");
    const refreshTeachersButton = document.getElementById("refreshTeachersButton");
    const addTeacherButton = document.getElementById("addTeacherButton");

    if (backToMainButton) {
        backToMainButton.addEventListener("click", () => {
            window.location.href = "main.html";
        });
    }

    if (refreshTeachersButton) {
        refreshTeachersButton.addEventListener("click", loadTeachers);
    }

    if (addTeacherButton) {
        addTeacherButton.addEventListener("click", () => {
            alert("Adding teachers will be implemented later.");
        });
    }

    await loadTeachers();
});

async function loadTeachers() {
    try {
        const response = await fetch("/api/teachers");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const teachers = await response.json();
        renderTeachers(teachers);
    } catch (error) {
        console.error("Error loading teachers:", error);
        showTeachersError();
    }
}

function renderTeachers(teachers) {
    const tbody = document.querySelector("#teachersTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!teachers || teachers.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td colspan="3">No teachers found.</td>
        `;

        tbody.appendChild(row);
        return;
    }

    teachers.forEach(teacher => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${teacher.id}</td>
            <td>${teacher.name}</td>
            <td>
                <button class="small-button" onclick="editTeacher(${teacher.id})">
                    Edit
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function showTeachersError() {
    const tbody = document.querySelector("#teachersTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="3">Could not load teachers.</td>
        </tr>
    `;
}

function editTeacher(id) {
    alert(`Editing teacher ${id} will be implemented later.`);
}