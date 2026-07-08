document.addEventListener("DOMContentLoaded", () => {
    setupTeachersNavigation();
});

function setupTeachersNavigation() {
    const teachersButton = document.getElementById("teachersButton");

    if (!teachersButton) {
        console.warn("teachersButton not found");
        return;
    }

    teachersButton.addEventListener("click", () => {
        window.location.href = "teachers.html";
    });
}