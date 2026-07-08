document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
});

function setupNavigation() {
    //teachers
    const teachersButton = document.getElementById("teachersButton");

    if (!teachersButton) {
        console.warn("teachersButton not found");
        return;
    }

    teachersButton.addEventListener("click", () => {
        window.location.href = "teachers.html";
    });

    //classes
    const classesButton = document.getElementById("classesButton");

    if (!classesButton) {
        console.warn("classesButton not found");
        return;
    }

    classesButton.addEventListener("click", () => {
        window.location.href = "classes.html";
    });

    //rooms
    const roomsButton = document.getElementById("roomsButton");

    if (!roomsButton) {
        console.warn("roomsButton not found");
        return;
    }

    roomsButton.addEventListener("click", () => {
        window.location.href = "rooms.html";
    });

    //subjects
    const subjectsbutton = document.getElementById("subjectsButton");

    if (!subjectsButton) {
        console.warn("subjectsButton not found");
        return;
    }

    subjectsButton.addEventListener("click", () => {
        window.location.href = "subjects.html";
    });

    //requirements
    const requirementsButton = document.getElementById("requirementsButton");

    if (!requirementsButton) {
        console.warn("requirementsButton not found");
        return;
    }

    requirementsButton.addEventListener("click", () => {
        window.location.href = "requirements.html";
    });
}