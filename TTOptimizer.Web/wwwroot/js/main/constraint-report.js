import { getCurrentLanguage, t } from "../i18n.js";

const DIRECT_HARD_VIOLATION_TYPES = new Set([
    "InvalidChromosome",
    "InvalidScheduleSlot",
    "TeacherUnavailable",
    "ClassGroupUnavailable",
    "RoomUnavailable",
    "SubjectUnavailable",
    "TeacherConflict",
    "ClassGroupConflict",
    "StudentGroupConflict",
    "RoomConflict"
]);

export function renderConstraintReport(result) {
    const panel = document.getElementById("constraintReport");
    const body = document.getElementById("constraintReportBody");

    if (!panel || !body) {
        return;
    }

    const hardViolationCount = toNonNegativeNumber(
        result.hardViolationCount
    );
    const softPenalty = toNonNegativeNumber(result.bestPenalty);
    const rows = createReportRows(
        result,
        hardViolationCount,
        softPenalty
    );

    setText("constraintReportHardValue", hardViolationCount);
    setText("constraintReportSoftValue", formatNumber(softPenalty));

    body.innerHTML = "";

    for (const rowData of rows) {
        body.appendChild(createReportRow(rowData));
    }

    const emptyMessage = document.getElementById(
        "constraintReportEmpty"
    );
    const tableWrapper = document.getElementById(
        "constraintReportTableWrapper"
    );
    const isPerfect = rows.length === 0 &&
        hardViolationCount === 0 &&
        softPenalty === 0;

    if (emptyMessage) {
        emptyMessage.hidden = !isPerfect;
    }
    if (tableWrapper) {
        tableWrapper.hidden = isPerfect;
    }

    panel.classList.remove("hidden");
}

export function clearConstraintReport() {
    const panel = document.getElementById("constraintReport");
    const body = document.getElementById("constraintReportBody");

    if (body) {
        body.innerHTML = "";
    }
    if (panel) {
        panel.classList.add("hidden");
    }
}

function createReportRows(
    result,
    hardViolationCount,
    softPenalty
) {
    const ruleResults = Array.isArray(result.ruleResults)
        ? result.ruleResults
        : [];
    const violations = Array.isArray(result.violations)
        ? result.violations
        : [];
    const rows = [];

    for (const rule of ruleResults) {
        const occurrenceCount = toNonNegativeNumber(
            rule.violationCount
        );
        const penalty = toNonNegativeNumber(rule.penalty);

        if (occurrenceCount === 0 && penalty === 0) {
            continue;
        }

        rows.push({
            name: translateRuleName(rule),
            description: "",
            kind: String(rule.kind).toLowerCase() === "hard"
                ? "Hard"
                : "Soft",
            occurrenceCount,
            penalty
        });
    }

    const groupedDirectViolations = new Map();

    for (const violation of violations) {
        const type = String(violation.type ?? "Unknown");

        if (!DIRECT_HARD_VIOLATION_TYPES.has(type)) {
            continue;
        }

        const count = Math.max(
            1,
            toNonNegativeNumber(violation.occurrenceCount)
        );
        groupedDirectViolations.set(
            type,
            (groupedDirectViolations.get(type) ?? 0) + count
        );
    }

    for (const [type, occurrenceCount] of groupedDirectViolations) {
        rows.push({
            name: t(
                `constraintViolation.${type}`,
                splitPascalCase(type)
            ),
            description: "",
            kind: "Hard",
            occurrenceCount,
            penalty: 0
        });
    }

    const reportedHardViolations = rows
        .filter(row => row.kind === "Hard")
        .reduce(
            (sum, row) => sum + (row.occurrenceCount ?? 0),
            0
        );
    const unreportedHardViolations =
        hardViolationCount - reportedHardViolations;

    if (unreportedHardViolations > 0) {
        rows.push({
            name: t("constraintReport.unattributedHardViolations"),
            description: t("constraintReport.unattributedHardViolationsDescription"),
            kind: "Hard",
            occurrenceCount: unreportedHardViolations,
            penalty: 0
        });
    }

    const reportedSoftPenalty = rows
        .filter(row => row.kind === "Soft")
        .reduce((sum, row) => sum + row.penalty, 0);
    const unreportedPenalty = softPenalty - reportedSoftPenalty;

    if (unreportedPenalty > 0.000001) {
        rows.push({
            name: t("constraintReport.unattributedPenalty"),
            description: t("constraintReport.unattributedPenaltyDescription"),
            kind: "Soft",
            occurrenceCount: null,
            penalty: unreportedPenalty
        });
    }

    return rows.sort((left, right) => {
        if (left.kind !== right.kind) {
            return left.kind === "Hard" ? -1 : 1;
        }

        return right.penalty - left.penalty ||
            right.occurrenceCount - left.occurrenceCount;
    });
}

function createReportRow(rowData) {
    const row = document.createElement("tr");
    const constraintCell = document.createElement("td");
    const name = document.createElement("strong");
    name.textContent = rowData.name;
    constraintCell.appendChild(name);

    if (rowData.description) {
        const description = document.createElement("small");
        description.textContent = rowData.description;
        constraintCell.appendChild(description);
    }

    row.appendChild(constraintCell);

    const kindCell = document.createElement("td");
    const kindBadge = document.createElement("span");
    const isHard = rowData.kind === "Hard";
    kindBadge.className = isHard
        ? "constraint-kind constraint-kind-hard"
        : "constraint-kind constraint-kind-soft";
    kindBadge.textContent = t(
        isHard ? "constraintReport.hard" : "constraintReport.soft"
    );
    kindCell.appendChild(kindBadge);
    row.appendChild(kindCell);

    appendCell(
        row,
        rowData.occurrenceCount === null
            ? "—"
            : formatNumber(rowData.occurrenceCount)
    );
    appendCell(
        row,
        isHard ? "—" : formatNumber(rowData.penalty),
        "constraint-penalty-value"
    );

    return row;
}

function translateRuleName(rule) {
    const code = String(rule.code ?? "")
        .replace(/\.(Low|Medium|High|Hard)$/i, "");

    return t(
        `constraintRule.${code}`,
        rule.name || splitPascalCase(code)
    );
}

function splitPascalCase(value) {
    return String(value || t("constraintReport.unknown"))
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function appendCell(row, value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    cell.className = className;
    row.appendChild(cell);
}

function setText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = String(value);
    }
}

function toNonNegativeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatNumber(value) {
    return new Intl.NumberFormat(getCurrentLanguage(), {
        maximumFractionDigits: 2
    }).format(value);
}
