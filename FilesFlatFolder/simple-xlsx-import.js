export function initializeSimpleXlsxImport(options) {
    const {
        resourceName,
        pluralName,
        previewUrl,
        importUrlFactory,
        importButtonId,
        fileInputId,
        previewSectionId,
        previewTableId,
        messageId,
        confirmButtonId,
        closeButtonId,
        onImported
    } = options;

    let currentRows = [];

    const importButton = document.getElementById(importButtonId);
    const fileInput = document.getElementById(fileInputId);
    const confirmButton = document.getElementById(confirmButtonId);
    const closeButton = document.getElementById(closeButtonId);

    importButton?.addEventListener("click", () => fileInput?.click());

    fileInput?.addEventListener("change", async event => {
        const file = event.target?.files?.[0];

        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            window.alert("Please select an XLSX file.");
            event.target.value = "";
            return;
        }

        try {
            showMessage(`Reading ${file.name}...`, false);

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(previewUrl, {
                method: "POST",
                body: formData
            });

            const data = await readJsonResponse(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ??
                    `Could not read XLSX file. Status: ${response.status}`
                );
            }

            currentRows = Array.isArray(data?.rows)
                ? data.rows
                : [];

            renderPreview();
            updateConfirmButton();

            showMessage(
                `${currentRows.length} row(s) read from the file.`,
                false
            );
        } catch (error) {
            currentRows = [];
            renderPreview();
            updateConfirmButton();

            showMessage(
                error instanceof Error
                    ? error.message
                    : "Could not read XLSX file.",
                true
            );
        } finally {
            event.target.value = "";
        }
    });

    confirmButton?.addEventListener("click", async () => {
        const validRows = currentRows.filter(
            row =>
                row?.isValid === true &&
                typeof row?.name === "string" &&
                row.name.trim() !== ""
        );

        if (validRows.length === 0) {
            showMessage(
                `There are no valid ${pluralName.toLowerCase()} to import.`,
                true
            );
            return;
        }

        if (!window.confirm(
            `Import ${validRows.length} ${pluralName.toLowerCase()} into ClassFlow?`
        )) {
            return;
        }

        confirmButton.disabled = true;

        try {
            showMessage(
                `Importing ${pluralName.toLowerCase()}...`,
                false
            );

            const response = await fetch(
                importUrlFactory(),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        names: validRows.map(
                            row => row.name.trim()
                        )
                    })
                }
            );

            const data = await readJsonResponse(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ??
                    `Could not import ${pluralName.toLowerCase()}.`
                );
            }

            const importedCount =
                Number(data?.importedCount ?? 0);

            const skippedExistingCount =
                Number(data?.skippedExistingCount ?? 0);

            let message =
                `Imported ${importedCount} ${pluralName.toLowerCase()}.`;

            if (skippedExistingCount > 0) {
                message +=
                    ` ${skippedExistingCount} existing item(s) were skipped.`;
            }

            showMessage(message, false);

            currentRows = [];
            updateConfirmButton();

            if (typeof onImported === "function") {
                await onImported();
            }
        } catch (error) {
            showMessage(
                error instanceof Error
                    ? error.message
                    : `Could not import ${pluralName.toLowerCase()}.`,
                true
            );

            updateConfirmButton();
        }
    });

    closeButton?.addEventListener("click", () => {
        const previewSection =
            document.getElementById(previewSectionId);

        if (previewSection) {
            previewSection.hidden = true;
        }

        currentRows = [];
        updateConfirmButton();
        showMessage("", false);
    });

    function renderPreview() {
        const section =
            document.getElementById(previewSectionId);

        const tbody =
            document.querySelector(`#${previewTableId} tbody`);

        if (!section || !tbody) {
            return;
        }

        tbody.innerHTML = "";

        if (currentRows.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 3;
            cell.textContent = `No ${pluralName.toLowerCase()} found.`;
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            for (const item of currentRows) {
                const row = document.createElement("tr");

                row.appendChild(createCell(item.rowNumber));
                row.appendChild(createCell(item.name ?? ""));

                const statusCell = createCell(
                    item.isValid
                        ? "OK"
                        : item.message || "Invalid row"
                );

                if (!item.isValid) {
                    statusCell.classList.add("error-message");
                }

                row.appendChild(statusCell);
                tbody.appendChild(row);
            }
        }

        section.hidden = false;
    }

    function updateConfirmButton() {
        if (!confirmButton) {
            return;
        }

        confirmButton.disabled =
            !currentRows.some(row => row?.isValid === true);
    }

    function showMessage(message, isError) {
        const element = document.getElementById(messageId);

        if (!element) {
            return;
        }

        element.textContent = message;
        element.classList.toggle("error-message", isError);
    }

    function createCell(value) {
        const cell = document.createElement("td");
        cell.textContent = String(value ?? "");
        return cell;
    }
}

async function readJsonResponse(response) {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            message: text
        };
    }
}
