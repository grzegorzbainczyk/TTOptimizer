let currentReadiness = null;

const RULES = {
    schoolButton: () => true,
    buildingsButton: () => true,
    roomsButton: r => r.foundationReady,
    subjectsButton: r => r.foundationReady,
    teachersButton: r => r.foundationReady,
    classesButton: r => r.foundationReady,
    studentGroupsButton: r => r.foundationReady && r.counts.classes > 0,
    requirementsButton: r => r.canConfigureLessons,
    organizationPreferencesButton: r => r.foundationReady,
    rulesButton: r => r.foundationReady
};

export async function initializeSchoolReadiness() {
    const organizationId = window.appContext.requireOrganizationId();
    const response = await fetch(`/api/school-readiness?organizationId=${encodeURIComponent(organizationId)}`);
    if (!response.ok) throw new Error(`Could not load school readiness. Status: ${response.status}`);
    currentReadiness = await response.json();
    window.classFlowSchoolReadiness = currentReadiness;
    applyButtons(currentReadiness);
    applyOptimization(currentReadiness);
    renderPanel(currentReadiness);
    return currentReadiness;
}

function applyButtons(r) {
    for (const [id, rule] of Object.entries(RULES)) {
        const b = document.getElementById(id);
        if (!b) continue;
        const enabled = Boolean(rule(r));
        b.disabled = !enabled;
        b.classList.toggle('resource-button-disabled', !enabled);
        if (!enabled) b.title = disabledReason(id, r); else b.removeAttribute('title');
    }
}

function disabledReason(id, r) {
    if (!r.foundationReady) return 'Najpierw dodaj szkołę z określonym typem oraz co najmniej jeden budynek.';
    if (id === 'studentGroupsButton') return 'Najpierw dodaj co najmniej jedną klasę.';
    if (id === 'requirementsButton') return 'Najpierw dodaj przedmioty, nauczycieli i klasy.';
    return 'Ten obszar nie jest jeszcze dostępny.';
}

function applyOptimization(r) {
    const run = document.getElementById('runOptimizationButton');
    const status = document.getElementById('statusText');
    if (run) {
        run.disabled = !r.canOptimize;
        run.dataset.readinessBlocked = r.canOptimize ? 'false' : 'true';
        run.classList.toggle('app-button-disabled', !r.canOptimize);
        if (!r.canOptimize) run.title = 'Optymalizacja będzie dostępna po uzupełnieniu wymaganych danych.';
        else run.removeAttribute('title');
    }
    if (status) {
        const left = r.missingSteps?.length ?? 0;
        status.textContent = r.canOptimize
            ? 'Dane podstawowe są kompletne. Możesz uruchomić optymalizację.'
            : `Optymalizacja będzie dostępna po uzupełnieniu danych. Pozostało ${left} ${stepWord(left)}.`;
        status.classList.toggle('school-readiness-status-ready', r.canOptimize);
        status.classList.toggle('school-readiness-status-blocked', !r.canOptimize);
    }
}

function renderPanel(r) {
    const panel = document.getElementById('schoolReadinessPanel');
    const normal = document.getElementById('normalResultContent');
    const actions = document.getElementById('normalResultActions');
    if (!panel) return;
    panel.hidden = r.canOptimize;
    if (normal) normal.hidden = !r.canOptimize;
    if (actions) actions.hidden = !r.canOptimize;
    if (r.canOptimize) return;

    const list = document.getElementById('schoolReadinessList');
    const progress = document.getElementById('schoolReadinessProgress');
    if (progress) progress.textContent = `${r.completedSteps} z ${r.totalSteps} etapów ukończonych`;
    if (!list) return;
    list.innerHTML = '';
    r.missingSteps.forEach((step, index) => {
        const li = document.createElement('li');
        const number = document.createElement('span');
        number.className = 'school-readiness-step-number';
        number.textContent = String(index + 1);
        const content = document.createElement('div');
        const strong = document.createElement('strong');
        strong.textContent = step.label;
        const small = document.createElement('small');
        small.append('Użyj przycisku ');
        const b = document.createElement('b');
        b.textContent = `„${step.buttonLabel}”`;
        small.appendChild(b);
        small.append(' po lewej stronie.');
        content.append(strong, small);
        li.append(number, content);
        list.appendChild(li);
    });
}

function stepWord(n) {
    if (n === 1) return 'krok';
    if (n >= 2 && n <= 4) return 'kroki';
    return 'kroków';
}
