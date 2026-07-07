// Displays lessons in the timetable table.
function renderLessonsTable(lessons) {
    const tableBody = document.getElementById("lessonsTableBody");

    tableBody.innerHTML = "";

    if (!lessons || lessons.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td colspan="6">No lessons returned.</td>
        `;

        tableBody.appendChild(row);
        return;
    }

    const filteredLessons = getFilteredLessons(lessons);

    if (filteredLessons.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td colspan="6">No lessons match selected filters.</td>
        `;

        tableBody.appendChild(row);
        return;
    }

    for (const lesson of filteredLessons) {
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