const daysCount = 5;
const slotsPerDay = 8;

let resourceType = null;
let resourceId = null;

// Available is the default state and is therefore not stored in the API/database.
// The map contains only Preferred, NotPreferred or Unavailable entries.
const timeSlotPreferences = new Map();

const preferenceCycle = [
    "Available",
    "Preferred",
    "NotPreferred",
    "Unavailable"
];

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
        loadTimeSlotPreferences
    );

    saveAvailabilityButton?.addEventListener(
        "click",
        saveTimeSlotPreferences
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

    await loadTimeSlotPreferences();
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
        "room",
        "subject"
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
                cyclePreference(
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

                        cyclePreference(
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

async function loadTimeSlotPreferences() {
    clearAvailabilityMessage();

    try {
        const organizationId =
            window.appContext
                .requireOrganizationId();

        const endpoint =
            getTimeSlotPreferencesEndpoint(
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
                    `Could not load time slot preferences. ` +
                    `Status: ${response.status}`
                )
            );
        }

        timeSlotPreferences.clear();

        const preferences =
            Array.isArray(data?.timeSlotPreferences)
                ? data.timeSlotPreferences
                : [];

        preferences.forEach(preference => {
            if (
                isValidSlot(
                    preference.dayIndex,
                    preference.slotIndex
                ) &&
                isStoredPreferenceType(
                    preference.preferenceType
                )
            ) {
                timeSlotPreferences.set(
                    createSlotKey(
                        preference.dayIndex,
                        preference.slotIndex
                    ),
                    preference.preferenceType
                );
            }
        });

        updatePageHeader(
            data?.resourceName
        );

        renderAvailabilityTable();
    } catch (error) {
        console.error(
            "Error loading time slot preferences:",
            error
        );

        showAvailabilityMessage(
            error instanceof Error
                ? error.message
                : "Could not load time slot preferences.",
            true
        );
    }
}

async function saveTimeSlotPreferences() {
    clearAvailabilityMessage();

    const timeSlotPreferencesRequest =
        Array.from(timeSlotPreferences.entries())
            .map(([key, preferenceType]) => {
                const slot = parseSlotKey(key);

                return {
                    dayIndex: slot.dayIndex,
                    slotIndex: slot.slotIndex,
                    preferenceType
                };
            })
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
            getTimeSlotPreferencesEndpoint(
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
                    timeSlotPreferences:
                        timeSlotPreferencesRequest
                })
            });

        const data =
            await readJsonResponse(response);

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(
                    data,
                    `Could not save time slot preferences. ` +
                    `Status: ${response.status}`
                )
            );
        }

        showAvailabilityMessage(
            data?.message ??
            "Time slot preferences were saved.",
            false
        );
    } catch (error) {
        console.error(
            "Error saving time slot preferences:",
            error
        );

        showAvailabilityMessage(
            error instanceof Error
                ? error.message
                : "Could not save time slot preferences.",
            true
        );
    }
}

function getTimeSlotPreferencesEndpoint(
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

        case "subject":
            resourcePath = "subjects";
            break;

        default:
            throw new Error(
                `Unsupported resource type: ${resourceType}`
            );
    }

    return (
        `/api/${resourcePath}/${encodeURIComponent(
            resourceId
        )}/time-slot-preferences?organizationId=${encodeURIComponent(
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
        room: "Room",
        subject: "Subject"
    };

    const resourceLabel =
        resourceLabels[resourceType] ??
        "Resource";

    if (pageTitle) {
        pageTitle.textContent =
            `${resourceLabel} time slot preferences`;
    }

    if (resourceNameElement) {
        resourceNameElement.textContent =
            resourceName ||
            `${resourceLabel} #${resourceId}`;
    }
}

function cyclePreference(
    dayIndex,
    slotIndex
) {
    const key =
        createSlotKey(
            dayIndex,
            slotIndex
        );

    const currentPreference =
        getPreferenceForSlot(key);

    const currentIndex =
        preferenceCycle.indexOf(
            currentPreference
        );

    const nextPreference =
        preferenceCycle[
            (currentIndex + 1) %
            preferenceCycle.length
        ];

    setPreferenceForSlot(
        key,
        nextPreference
    );

    renderAvailabilityTable();
}

function getPreferenceForSlot(key) {
    return (
        timeSlotPreferences.get(key) ??
        "Available"
    );
}

function setPreferenceForSlot(
    key,
    preferenceType
) {
    if (preferenceType === "Available") {
        timeSlotPreferences.delete(key);
        return;
    }

    timeSlotPreferences.set(
        key,
        preferenceType
    );
}

function markAllAvailable() {
    timeSlotPreferences.clear();
    renderAvailabilityTable();
}

function markAllUnavailable() {
    timeSlotPreferences.clear();

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
            timeSlotPreferences.set(
                createSlotKey(
                    dayIndex,
                    slotIndex
                ),
                "Unavailable"
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

        const preference =
            getPreferenceForSlot(
                createSlotKey(
                    dayIndex,
                    slotIndex
                )
            );

        cell.classList.remove(
            "preferred",
            "available",
            "not-preferred",
            "unavailable"
        );

        switch (preference) {
            case "Preferred":
                cell.classList.add("preferred");
                cell.textContent = "Preferred";
                break;

            case "NotPreferred":
                cell.classList.add("not-preferred");
                cell.textContent = "Not preferred";
                break;

            case "Unavailable":
                cell.classList.add("unavailable");
                cell.textContent = "Unavailable";
                break;

            default:
                cell.classList.add("available");
                cell.textContent = "Available";
                break;
        }

        cell.setAttribute(
            "aria-label",
            preference === "NotPreferred"
                ? "Not preferred"
                : preference
        );
    });
}

function isStoredPreferenceType(value) {
    return (
        value === "Preferred" ||
        value === "NotPreferred" ||
        value === "Unavailable"
    );
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
        room: "rooms.html",
        subject: "subjects.html"
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
