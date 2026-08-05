export function setOptimizationRunningState(isRunning) {
    const runButton = document.getElementById(
        "runOptimizationButton"
    );

    const stopButton = document.getElementById(
        "stopOptimizationButton"
    );

    if (runButton) {
        runButton.disabled = isRunning;

        const runButtonLabel = runButton.querySelector(
            ".optimization-run-label"
        );

        if (runButtonLabel) {
            runButtonLabel.textContent = isRunning
                ? "Running..."
                : "Run optimization";
        }
    }

    if (stopButton) {
        stopButton.disabled = !isRunning;
    }
}

export function setStatusText(message) {
    setText("statusText", message);
}

export function setResultMessage(type, title, message) {
    const panel = document.getElementById(
        "resultMessagePanel"
    );

    const titleElement = document.getElementById(
        "resultMessageTitle"
    );

    const messageElement = document.getElementById(
        "resultMessageText"
    );

    const iconElement = panel?.querySelector(
        ".result-message-icon"
    );

    if (!panel || !titleElement || !messageElement) {
        return;
    }

    panel.classList.remove(
        "result-message-neutral",
        "result-message-success",
        "result-message-error",
        "result-message-warning"
    );

    panel.classList.add(`result-message-${type}`);
    titleElement.textContent = title;
    messageElement.textContent = message;

    if (iconElement) {
        iconElement.textContent = getResultMessageIcon(type);
    }
}

export function renderPreprocessingIssues(issues) {
    const details = document.getElementById(
        "preprocessingDetails"
    );

    const issuesList = document.getElementById(
        "preprocessingIssuesList"
    );

    const issueCount = document.getElementById(
        "preprocessingIssueCount"
    );

    if (!details || !issuesList || !issueCount) {
        return;
    }

    issuesList.innerHTML = "";

    if (!issues || issues.length === 0) {
        details.classList.add("hidden");
        return;
    }

    for (const issue of issues) {
        const listItem = document.createElement("li");
        const severity = String(
            issue.severity ?? "Error"
        ).toLowerCase();

        listItem.className =
            `preprocessing-issue preprocessing-issue-${severity}`;

        const heading = document.createElement("div");
        heading.className = "preprocessing-issue-heading";

        const title = document.createElement("strong");
        title.textContent = formatIssueCode(issue.code);

        const badge = document.createElement("span");
        badge.className = "preprocessing-issue-severity";
        badge.textContent = issue.severity ?? "Error";

        heading.append(title, badge);

        const message = document.createElement("p");
        message.textContent =
            issue.message ??
            "An unspecified preprocessing problem was found.";

        listItem.append(heading, message);

        const counts = createIssueCountsElement(issue);

        if (counts) {
            listItem.appendChild(counts);
        }

        issuesList.appendChild(listItem);
    }

    issueCount.textContent = issues.length === 1
        ? "1 problem"
        : `${issues.length} problems`;

    details.classList.remove("hidden");
}

export function hidePreprocessingIssues() {
    const details = document.getElementById(
        "preprocessingDetails"
    );

    const issuesList = document.getElementById(
        "preprocessingIssuesList"
    );

    details?.classList.add("hidden");

    if (issuesList) {
        issuesList.innerHTML = "";
    }
}

export function setTimetableContentVisible(isVisible) {
    document
        .getElementById("timetableContent")
        ?.classList.toggle("hidden", !isVisible);
}

export function showOptimizationProgress() {
    document
        .getElementById("optimizationProgressPanel")
        ?.classList.remove("hidden");

    updateOptimizationProgress({
        generation: 0,
        totalGenerations: 0,
        percentage: 0
    });
}

export function hideOptimizationProgress() {
    document
        .getElementById("optimizationProgressPanel")
        ?.classList.add("hidden");
}

export function updateOptimizationProgress(progress) {
    const percentage = Number(progress.percentage) || 0;
    const generation = Number(progress.generation) || 0;
    const totalGenerations =
        Number(progress.totalGenerations) || 0;

    const progressBar = document.getElementById(
        "optimizationProgressBar"
    );

    const percentageText = document.getElementById(
        "optimizationProgressPercentage"
    );

    const generationText = document.getElementById(
        "optimizationGenerationText"
    );

    if (progressBar) {
        progressBar.value = percentage;
    }

    if (percentageText) {
        percentageText.textContent = `${percentage}%`;
    }

    if (generationText) {
        generationText.textContent =
            `Generation: ${generation} / ${totalGenerations}`;
    }
}

export function setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

function getResultMessageIcon(type) {
    switch (type) {
        case "success":
            return "✓";
        case "error":
            return "!";
        case "warning":
            return "⚠";
        default:
            return "ℹ️";
    }
}

function createIssueCountsElement(issue) {
    const requiredCount = Number(issue.requiredCount);
    const availableCount = Number(issue.availableCount);

    if (
        !Number.isFinite(requiredCount) ||
        !Number.isFinite(availableCount)
    ) {
        return null;
    }

    if (requiredCount === 0 && availableCount === 0) {
        return null;
    }

    const element = document.createElement("div");
    element.className = "preprocessing-issue-counts";

    const required = document.createElement("span");
    required.append("Required: ");

    const requiredValue = document.createElement("strong");
    requiredValue.textContent = String(requiredCount);
    required.appendChild(requiredValue);

    const available = document.createElement("span");
    available.append("Available: ");

    const availableValue = document.createElement("strong");
    availableValue.textContent = String(availableCount);
    available.appendChild(availableValue);

    element.append(required, available);
    return element;
}

function formatIssueCode(code) {
    if (!code) {
        return "Preprocessing problem";
    }

    return String(code)
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
}
