// Displays lessons in the timetable table.
function renderLessonsTable(lessons) {
    const tableBody = document.getElementById("lessonsTableBody");

    // Clear previous table content.
    tableBody.innerHTML = "";

    // If there are no lessons, show a single information row.
    if (!lessons || lessons.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = `
                <td colspan="6">No lessons returned.</td>
            `;

        tableBody.appendChild(row);
        return;
    }

    // Create one table row for each lesson returned by the optimizer.
    for (const lesson of lessons) {
        const row = document.createElement("tr");

        row.innerHTML = `
                <td>${lesson.day}</td>
                <td>${lesson.lessonNumber}</td>
                <td>${lesson.classGroup}</td>
                <td>${lesson.subject}</td>
                <td>${lesson.teacher}</td>
                <td>${lesson.room}</td>
            `;

        tableBody.appendChild(row);
    }
}