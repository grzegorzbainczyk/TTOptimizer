export function initializeCsvExport() {
    const exportCsvButton = document.getElementById(
        "exportCsvButton"
    );

    if (!exportCsvButton) {
        console.warn("exportCsvButton not found");
        return;
    }

    exportCsvButton.addEventListener(
        "click",
        exportVisibleTimetableRowsToCsv
    );
}

function exportVisibleTimetableRowsToCsv() {
    const rows = document.querySelectorAll(
        "#timetableBody tr"
    );

    if (!rows || rows.length === 0) {
        alert("There is no timetable data to export.");
        return;
    }

    const csvRows = [[
        "Day",
        "Lesson number",
        "Lesson",
        "Class",
        "Subject",
        "Teacher",
        "Room"
    ]];

    let exportedRowsCount = 0;

    for (const row of rows) {
        if (row.style.display === "none") {
            continue;
        }

        const cells = row.querySelectorAll("td");

        if (cells.length < 7) {
            continue;
        }

        csvRows.push(
            Array.from(cells).map(cell =>
                escapeCsvValue(cell.textContent.trim())
            )
        );

        exportedRowsCount++;
    }

    if (exportedRowsCount === 0) {
        alert("There are no visible rows to export.");
        return;
    }

    const csvContent =
        "\uFEFF" +
        csvRows
            .map(row => row.join(";"))
            .join("\r\n");

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "timetable.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
    const safeValue = String(value ?? "");
    return `"${safeValue.replaceAll('"', '""')}"`;
}
