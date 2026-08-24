function isPolish() {
    return localStorage.getItem("classFlowLanguage") === "pl";
}

function getSetupText() {
    if (isPolish()) {
        return {
            title: "Konfiguracja szkoły",
            subtitle:
                "Sprawdź, czy dane potrzebne do ułożenia planu są kompletne.",
            loading: "Sprawdzanie konfiguracji...",
            error: "Nie udało się odczytać stanu konfiguracji.",
            ready: "Gotowe",
            needsAttention: "Wymaga uwagi",
            optional: "Brak ograniczeń",
            neverRun: "Jeszcze nie uruchomiono",
            runs: "uruchomień",
            buildingsRooms: "Budynki i sale",
            classes: "Klasy",
            subjects: "Przedmioty",
            teachers: "Nauczyciele",
            assignments: "Przypisania nauczycieli",
            lessons: "Lekcje / plan nauczania",
            availability: "Dostępność",
            optimization: "Optymalizacja",
            buildings: "budynków",
            rooms: "sal",
            assignmentRows: "przypisań",
            classesMissing: "klas bez przypisań",
            lessonRows: "lekcji",
            classesWithoutLessons: "klas bez lekcji",
            customRules: "własnych ograniczeń",
            nextStep: "Następny krok",
            readyToOptimize:
                "Dane są gotowe. Możesz uruchomić optymalizację.",
            go: "Przejdź",
            steps: {
                rooms:
                    "Dodaj budynki i sale używane przez szkołę.",
                classes:
                    "Dodaj klasy, dla których ma powstać plan.",
                subjects:
                    "Dodaj przedmioty albo pozwól utworzyć je podczas importu planu nauczania.",
                teachers:
                    "Dodaj nauczycieli.",
                teacherAssignments:
                    "Uzupełnij przypisania nauczycieli do przedmiotów i klas.",
                lessons:
                    "Zaimportuj plan nauczania lub dodaj wymagane lekcje.",
                optimization:
                    "Konfiguracja podstawowa jest gotowa. Uruchom optymalizację."
            }
        };
    }

    return {
        title: "School setup",
        subtitle:
            "Check whether the data required to build the timetable is complete.",
        loading: "Checking setup...",
        error: "Could not load setup status.",
        ready: "Ready",
        needsAttention: "Needs attention",
        optional: "No restrictions",
        neverRun: "Not run yet",
        runs: "runs",
        buildingsRooms: "Buildings & rooms",
        classes: "Classes",
        subjects: "Subjects",
        teachers: "Teachers",
        assignments: "Teacher assignments",
        lessons: "Lessons / teaching plan",
        availability: "Availability",
        optimization: "Optimization",
        buildings: "buildings",
        rooms: "rooms",
        assignmentRows: "assignments",
        classesMissing: "classes without assignments",
        lessonRows: "lessons",
        classesWithoutLessons: "classes without lessons",
        customRules: "custom restrictions",
        nextStep: "Next step",
        readyToOptimize:
            "The data is ready. You can run optimization.",
        go: "Go",
        steps: {
            rooms:
                "Add the buildings and rooms used by the school.",
            classes:
                "Add the classes that need a timetable.",
            subjects:
                "Add subjects or let the teaching-plan import create them.",
            teachers:
                "Add teachers.",
            teacherAssignments:
                "Complete teacher assignments for subjects and classes.",
            lessons:
                "Import the teaching plan or add lesson requirements.",
            optimization:
                "The basic setup is ready. Run optimization."
        }
    };
}

function createStepRow({
    icon,
    title,
    details,
    ready,
    neutral = false
}) {
    const row = document.createElement("div");
    row.className = "setup-status-row";

    const iconElement = document.createElement("span");
    iconElement.className =
        ready
            ? "setup-status-icon setup-status-icon-ready"
            : neutral
                ? "setup-status-icon setup-status-icon-neutral"
                : "setup-status-icon setup-status-icon-warning";

    iconElement.textContent =
        ready
            ? "✓"
            : neutral
                ? "○"
                : "!";

    const content = document.createElement("div");
    content.className = "setup-status-content";

    const titleElement = document.createElement("strong");
    titleElement.textContent = title;

    const detailsElement = document.createElement("small");
    detailsElement.textContent = details;

    content.append(
        titleElement,
        detailsElement
    );

    row.append(
        iconElement,
        content
    );

    return row;
}

function getNextStepTarget(nextStep) {
    switch (nextStep) {
        case "rooms":
            return "rooms.html";

        case "classes":
            return "classes.html";

        case "subjects":
            return "subjects.html";

        case "teachers":
        case "teacherAssignments":
            return "teachers.html";

        case "lessons":
            return "requirements.html";

        case "optimization":
        default:
            return "#optimization";
    }
}

function renderSetupStatus(data) {
    const text = getSetupText();

    const title =
        document.getElementById("setupStatusTitle");

    const subtitle =
        document.getElementById("setupStatusSubtitle");

    const list =
        document.getElementById("setupStatusList");

    const nextStepText =
        document.getElementById("setupNextStepText");

    const nextStepButton =
        document.getElementById("setupNextStepButton");

    if (!list) {
        return;
    }

    if (title) {
        title.textContent = text.title;
    }

    if (subtitle) {
        subtitle.textContent = text.subtitle;
    }

    list.innerHTML = "";

    list.append(
        createStepRow({
            title: text.buildingsRooms,
            details:
                `${data.buildingsAndRooms.buildingCount} ${text.buildings}, ` +
                `${data.buildingsAndRooms.roomCount} ${text.rooms}`,
            ready: data.buildingsAndRooms.ready
        }),

        createStepRow({
            title: text.classes,
            details: `${data.classes.count}`,
            ready: data.classes.ready
        }),

        createStepRow({
            title: text.subjects,
            details: `${data.subjects.count}`,
            ready: data.subjects.ready
        }),

        createStepRow({
            title: text.teachers,
            details: `${data.teachers.count}`,
            ready: data.teachers.ready
        }),

        createStepRow({
            title: text.assignments,
            details:
                `${data.teacherAssignments.count} ${text.assignmentRows}` +
                (
                    data.teacherAssignments.classesWithoutAssignments > 0
                        ? ` · ${data.teacherAssignments.classesWithoutAssignments} ${text.classesMissing}`
                        : ""
                ),
            ready: data.teacherAssignments.ready
        }),

        createStepRow({
            title: text.lessons,
            details:
                `${data.lessons.count} ${text.lessonRows}` +
                (
                    data.lessons.classesWithoutLessons > 0
                        ? ` · ${data.lessons.classesWithoutLessons} ${text.classesWithoutLessons}`
                        : ""
                ),
            ready: data.lessons.ready
        }),

        createStepRow({
            title: text.availability,
            details:
                data.availability.customRuleCount > 0
                    ? `${data.availability.customRuleCount} ${text.customRules}`
                    : text.optional,
            ready: true,
            neutral:
                data.availability.customRuleCount === 0
        }),

        createStepRow({
            title: text.optimization,
            details:
                data.optimization.runCount > 0
                    ? `${data.optimization.runCount} ${text.runs}`
                    : text.neverRun,
            ready: data.optimization.runCount > 0,
            neutral:
                data.optimization.runCount === 0 &&
                data.dataReadyForOptimization
        })
    );

    if (nextStepText) {
        nextStepText.textContent =
            data.dataReadyForOptimization
                ? text.readyToOptimize
                : text.steps[data.nextStep] ??
                  text.steps.optimization;
    }

    if (nextStepButton) {
        nextStepButton.textContent = text.go;

        nextStepButton.onclick = () => {
            const target =
                getNextStepTarget(data.nextStep);

            if (target.startsWith("#")) {
                document
                    .querySelector(".optimization-panel")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                return;
            }

            window.location.href = target;
        };
    }
}

function renderSetupStatusError() {
    const list =
        document.getElementById("setupStatusList");

    if (!list) {
        return;
    }

    const text = getSetupText();

    list.innerHTML = "";

    const error =
        document.createElement("p");

    error.className =
        "setup-status-error";

    error.textContent =
        text.error;

    list.appendChild(error);
}

export async function initializeSetupStatus() {
    const list =
        document.getElementById("setupStatusList");

    if (!list) {
        return;
    }

    const text = getSetupText();

    list.innerHTML =
        `<p class="setup-status-loading">${text.loading}</p>`;

    try {
        const organizationId =
            window.appContext.requireOrganizationId();

        const response = await fetch(
            `/api/setup/status?organizationId=${encodeURIComponent(
                organizationId
            )}`
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data?.message ??
                `Could not load setup status. Status: ${response.status}`
            );
        }

        renderSetupStatus(data);
    } catch (error) {
        console.error(
            "Error loading school setup status:",
            error
        );

        renderSetupStatusError();
    }
}
