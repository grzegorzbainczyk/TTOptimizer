const daysCount = 5;
const slotsPerDay = 8;

let resourceType = null;
let resourceId = null;

const unavailableSlots = new Set();

document.addEventListener("DOMContentLoaded", async () => {
    const backButton =
        document.getElementById("backButton");

    const refreshAvailabilityButton =
        document.getElementById(
            "refreshAvailabilityButton"
        );

    const saveAvailabilityButton =
        document.getElementById(
            "saveAvailabilityButton"
        );

    const markAllAvailableButton =
        document.getElementById(
            "markAllAvailableButton"
        );

    const markAllUnavailableButton =
        document.getElementById(
            "markAllUnavailableButton"
        );

    backButton?.addEventListener("click", goBack);

    refreshAvailabilityButton?.addEventListener(
        "click",
        loadAvailability
    );

    saveAvailabilityButton?.addEventListener(
        "click",
        saveAvailability
    );

    markAllAvailableButton?.addEventListener(
        "click",
        markAllAvailable
    );

    markAllUnavailableButton?.addEventListener(
        "click",
        markAllUnavailable
    );

    if (!readResourceParameters()) {
        return;
    }

    buildAvailabilityTable();

    await loadAvailability();
});

function readResourceParameters() {
    const parameters =
        new URLSearchParams(window.location.search);

    resourceType =
        parameters.get("resourceType");

    resourceId =
        Number(parameters.get("resourceId"));

    const supportedResourceTypes = [
        "teacher",
        "class",
        "room"
    ];

    if (
        !supportedResourceTypes.includes(resourceType) ||
        !Number.isInteger(resourceId) ||
        resourceId <= 0
    ) {
        showAvailabilityMessage(
            "Invalid resource type or resource ID.",
            true
        );

        disableAvailabilityControls();

        return false;
    }

    return true;
}

function buildAvailabilityTable() {
    const tbody =
        document.querySelector(
            "#availabilityTable tbody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    for (
        let slotIndex = 0;
        slotIndex < slotsPerDay;
        slotIndex++
    ) {
        const row =
            document.createElement("tr");

        const lessonCell =
            document.createElement("td");

        lessonCell.textContent =
            (slotIndex + 1).toString();

        row.appendChild(lessonCell);

        for (
            let dayIndex = 0;
            dayIndex < daysCount;
            dayIndex++
        ) {
            const cell =
                document.createElement("td");

            cell.classList.add(
                "availability-cell"
            );

            cell.dataset.dayIndex =
                dayIndex.toString();

            cell.dataset.slotIndex =
                slotIndex.toString();

            cell.tabIndex = 0;

            cell.addEventListener("click", () => {
                toggleAvailabilityCell(
                    dayIndex,
                    slotIndex
                );
            });

            cell.addEventListener(
                "keydown",
                event => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();

                        toggleAvailabilityCell(
                            dayIndex,
                            slotIndex
                        );
                    }
                }
            );

            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }

    renderAvailabilityTable();
}

async function loadAvailability() {
    clearAvailabilityMessage();

    try {
        const organizationId =
            window.appContext
                .requireOrganizationId();

        const endpoint =
            getAvailabilityEndpoint(
                organizationId
            );

        const response =
            await fetch(endpoint);

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not load availability. ` +
                    `Status: ${response.status}`
                )
            );
        }

        unavailableSlots.clear();

        const slots =
            Array.isArray(data?.unavailableSlots)
                ? data.unavailableSlots
                : [];

        slots.forEach(slot => {
            if (
                isValidSlot(
                    slot.dayIndex,
                    slot.slotIndex
                )
            ) {
                unavailableSlots.add(
                    createSlotKey(
                        slot.dayIndex,
                        slot.slotIndex
                    )
                );
            }
        });

        updatePageHeader(
            data?.resourceName
        );

        renderAvailabilityTable();
    } catch (error) {
        console.error(
            "Error loading availability:",
            error
        );

        showAvailabilityMessage(
            error instanceof Error
                ? error.message
                : "Could not load availability.",
            true
        );
    }
}

async function saveAvailability() {
    clearAvailabilityMessage();

    const unavailableSlotsRequest =
        Array.from(unavailableSlots)
            .map(parseSlotKey)
            .sort((left, right) => {
                if (
                    left.dayIndex !==
                    right.dayIndex
                ) {
                    return (
                        left.dayIndex -
                        right.dayIndex
                    );
                }

                return (
                    left.slotIndex -
                    right.slotIndex
                );
            });

    try {
        const organizationId =
            window.appContext
                .requireOrganizationId();

        const endpoint =
            getAvailabilityEndpoint(
                organizationId
            );

        const response =
            await fetch(endpoint, {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    unavailableSlots:
                        unavailableSlotsRequest
                })
            });

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not save availability. ` +
                    `Status: ${response.status}`
                )
            );
        }

        showAvailabilityMessage(
            data?.message ??
            "Availability was saved.",
            false
        );
    } catch (error) {
        console.error(
            "Error saving availability:",
            error
        );

        showAvailabilityMessage(
            error instanceof Error
                ? error.message
                : "Could not save availability.",
            true
        );
    }
}

function getAvailabilityEndpoint(
    organizationId
) {
    let resourcePath;

    switch (resourceType) {
        case "teacher":
            resourcePath = "teachers";
            break;

        case "class":
            resourcePath = "classes";
            break;

        case "room":
            resourcePath = "rooms";
            break;

        default:
            throw new Error(
                `Unsupported resource type: ${resourceType}`
            );
    }

    return (
        `/api/${resourcePath}/${encodeURIComponent(
            resourceId
        )}/availability?organizationId=${encodeURIComponent(
            organizationId
        )}`
    );
}

function updatePageHeader(resourceName) {
    const pageTitle =
        document.getElementById(
            "availabilityPageTitle"
        );

    const resourceNameElement =
        document.getElementById(
            "availabilityResourceName"
        );

    const resourceLabels = {
        teacher: "Teacher",
        class: "Class",
        room: "Room"
    };

    const resourceLabel =
        resourceLabels[resourceType] ??
        "Resource";

    if (pageTitle) {
        pageTitle.textContent =
            `${resourceLabel} availability`;
    }

    if (resourceNameElement) {
        resourceNameElement.textContent =
            resourceName ||
            `${resourceLabel} #${resourceId}`;
    }
}

function toggleAvailabilityCell(
    dayIndex,
    slotIndex
) {
    const key =
        createSlotKey(
            dayIndex,
            slotIndex
        );

    if (unavailableSlots.has(key)) {
        unavailableSlots.delete(key);
    } else {
        unavailableSlots.add(key);
    }

    renderAvailabilityTable();
}

function markAllAvailable() {
    unavailableSlots.clear();
    renderAvailabilityTable();
}

function markAllUnavailable() {
    unavailableSlots.clear();

    for (
        let dayIndex = 0;
        dayIndex < daysCount;
        dayIndex++
    ) {
        for (
            let slotIndex = 0;
            slotIndex < slotsPerDay;
            slotIndex++
        ) {
            unavailableSlots.add(
                createSlotKey(
                    dayIndex,
                    slotIndex
                )
            );
        }
    }

    renderAvailabilityTable();
}

function renderAvailabilityTable() {
    const cells =
        document.querySelectorAll(
            ".availability-cell"
        );

    cells.forEach(cell => {
        const dayIndex =
            Number(cell.dataset.dayIndex);

        const slotIndex =
            Number(cell.dataset.slotIndex);

        const isUnavailable =
            unavailableSlots.has(
                createSlotKey(
                    dayIndex,
                    slotIndex
                )
            );

        cell.classList.toggle(
            "unavailable",
            isUnavailable
        );

        cell.classList.toggle(
            "available",
            !isUnavailable
        );

        cell.textContent =
            isUnavailable
                ? "Unavailable"
                : "Available";

        cell.setAttribute(
            "aria-label",
            isUnavailable
                ? "Unavailable"
                : "Available"
        );
    });
}

function createSlotKey(
    dayIndex,
    slotIndex
) {
    return `${dayIndex}:${slotIndex}`;
}

function parseSlotKey(key) {
    const [
        dayIndex,
        slotIndex
    ] = key
        .split(":")
        .map(Number);

    return {
        dayIndex,
        slotIndex
    };
}

function isValidSlot(
    dayIndex,
    slotIndex
) {
    return (
        Number.isInteger(dayIndex) &&
        dayIndex >= 0 &&
        dayIndex < daysCount &&
        Number.isInteger(slotIndex) &&
        slotIndex >= 0 &&
        slotIndex < slotsPerDay
    );
}

function goBack() {
    const backPages = {
        teacher: "teachers.html",
        class: "classes.html",
        room: "rooms.html"
    };

    window.location.href =
        backPages[resourceType] ??
        "main.html";
}

function disableAvailabilityControls() {
    const buttons = [
        "refreshAvailabilityButton",
        "saveAvailabilityButton",
        "markAllAvailableButton",
        "markAllUnavailableButton"
    ];

    buttons.forEach(buttonId => {
        const button =
            document.getElementById(
                buttonId
            );

        if (button) {
            button.disabled = true;
        }
    });
}

function showAvailabilityMessage(
    message,
    isError
) {
    const messageElement =
        document.getElementById(
            "availabilityMessage"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;

    messageElement.classList.toggle(
        "error-message",
        isError
    );
}

function clearAvailabilityMessage() {
    const messageElement =
        document.getElementById(
            "availabilityMessage"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";

    messageElement.classList.remove(
        "error-message"
    );
}

async function readJsonResponse(response) {
    const text =
        await response.text();

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

function getApiErrorMessage(
    data,
    fallbackMessage
) {
    if (
        typeof data?.message === "string"
    ) {
        return data.message;
    }

    if (data?.errors) {
        const validationMessages =
            Object.values(data.errors)
                .flat()
                .filter(message =>
                    typeof message === "string"
                );

        if (validationMessages.length > 0) {
            return validationMessages.join(" ");
        }
    }

    return fallbackMessage;
}