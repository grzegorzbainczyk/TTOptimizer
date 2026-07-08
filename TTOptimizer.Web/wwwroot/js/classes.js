document.addEventListener("DOMContentLoaded", async () => {
    const backToMainButton = document.getElementById("backToMainButton");
    const refreshClassesButton = document.getElementById("refreshClassesButton");
    const addClassesButton = document.getElementById("addClassButton");

    if (backToMainButton) {
        backToMainButton.addEventListener("click", () => {
            window.location.href = "main.html";
        });
    }

    if (refreshClassesButton) {
        refreshClassesButton.addEventListener("click", loadClasses);
    }

    if (addClassButton) {
        addClassButton.addEventListener("click", () => {
            alert("Adding classes will be implemented later.");
        });
    }

    await loadClasses();
});

async function loadClasses() {
    try {
        const response = await fetch("/api/classes");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const classes = await response.json();
        renderClasses(classes);
    } catch (error) {
        console.error("Error loading classes:", error);
        showClassesError();
    }
}

function renderClasses(classes) {
    const tbody = document.querySelector("#classesTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!classes || classes.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td colspan="3">No classes found.</td>
        `;

        tbody.appendChild(row);
        return;
    }

    classes.forEach(_class => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${_class.id}</td>
            <td>${_class.name}</td>
            <td>
                <button class="small-button" onclick="editClass(${_class.id})">
                    Edit
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function showClassesError() {
    const tbody = document.querySelector("#classesTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="3">Could not load classes.</td>
        </tr>
    `;
}

function editClass(id) {
    alert(`Editing class ${id} will be implemented later.`);
}