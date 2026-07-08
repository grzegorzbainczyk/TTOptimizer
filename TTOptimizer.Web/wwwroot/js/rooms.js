document.addEventListener("DOMContentLoaded", async () => {
    const backToMainButton = document.getElementById("backToMainButton");
    const refreshRoomsButton = document.getElementById("refreshRoomsButton");
    const addRoomButton = document.getElementById("addRoomButton");

    if (backToMainButton) {
        backToMainButton.addEventListener("click", () => {
            window.location.href = "main.html";
        });
    }

    if (refreshRoomsButton) {
        refreshRoomsButton.addEventListener("click", loadRooms);
    }

    if (addRoomButton) {
        addRoomButton.addEventListener("click", () => {
            alert("Adding room will be implemented later.");
        });
    }

    await loadRooms();
});

async function loadRooms() {
    try {
        const response = await fetch("/api/rooms");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const rooms = await response.json();
        renderRooms(rooms);
    } catch (error) {
        console.error("Error loading rooms:", error);
        showRoomsError();
    }
}

function renderRooms(rooms) {
    const tbody = document.querySelector("#roomsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!rooms || rooms.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td colspan="3">No rooms found.</td>
        `;

        tbody.appendChild(row);
        return;
    }

    rooms.forEach(room => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${room.id}</td>
            <td>${room.name}</td>
            <td>
                <button class="small-button" onclick="editRoom(${room.id})">
                    Edit
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function showRoomsError() {
    const tbody = document.querySelector("#roomsTable tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="3">Could not load rooms.</td>
        </tr>
    `;
}

function editRoom(id) {
    alert(`Editing room ${id} will be implemented later.`);
}