const OPTIMIZATION_SETTINGS_STORAGE_KEY = "classflow.optimizationSettings";

const DEFAULT_OPTIMIZATION_SETTINGS = {
    populationSize: 100,
    generations: 100,
    eliteCount: 5,
    tournamentSize: 3,
    mutationAttempts: 5,
    mutationProbability: 1.0,
    randomSeed: 12345,
    threadCount: 1,
    stopWhenPerfect: true,
    stagnationGenerationLimit: 0,
    enableProgressLogging: true,
    progressLogInterval: 100,
    penalties: {
        low: 10,
        medium: 100,
        high: 1000,
        hard: 1000000
    }
};

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("optimizationSettingsForm")?.addEventListener("submit", saveSettings);
    document.getElementById("resetSettingsButton")?.addEventListener("click", resetSettings);
    document.getElementById("backToMainButton")?.addEventListener("click", () => window.location.href = "main.html");
    document.getElementById("testAIButton")?.addEventListener("click", testAIConnection);

    populateForm(loadSettings());
});

function loadSettings() {
    const savedSettingsJson = localStorage.getItem(OPTIMIZATION_SETTINGS_STORAGE_KEY);

    if (!savedSettingsJson) {
        return structuredClone(DEFAULT_OPTIMIZATION_SETTINGS);
    }

    try {
        const savedSettings = JSON.parse(savedSettingsJson);

        return {
            ...DEFAULT_OPTIMIZATION_SETTINGS,
            ...savedSettings,
            penalties: {
                ...DEFAULT_OPTIMIZATION_SETTINGS.penalties,
                ...(savedSettings.penalties ?? {})
            }
        };
    } catch (error) {
        console.error("Could not read optimization settings from localStorage.", error);
        localStorage.removeItem(OPTIMIZATION_SETTINGS_STORAGE_KEY);
        showStatus("Saved settings were invalid. Default values were loaded.", true);
        return structuredClone(DEFAULT_OPTIMIZATION_SETTINGS);
    }
}

function populateForm(settings) {
    setInputValue("populationSize", settings.populationSize);
    setInputValue("generations", settings.generations);
    setInputValue("eliteCount", settings.eliteCount);
    setInputValue("tournamentSize", settings.tournamentSize);
    setInputValue("mutationAttempts", settings.mutationAttempts);
    setInputValue("mutationProbability", settings.mutationProbability);
    setInputValue("randomSeed", settings.randomSeed);
    setInputValue("threadCount", settings.threadCount);
    setCheckboxValue("stopWhenPerfect", settings.stopWhenPerfect);
    setInputValue("stagnationGenerationLimit", settings.stagnationGenerationLimit);
    setCheckboxValue("enableProgressLogging", settings.enableProgressLogging);
    setInputValue("progressLogInterval", settings.progressLogInterval);
    setInputValue("penaltyLow", settings.penalties.low);
    setInputValue("penaltyMedium", settings.penalties.medium);
    setInputValue("penaltyHigh", settings.penalties.high);
    setInputValue("penaltyHard", settings.penalties.hard);
}

function saveSettings(event) {
    event.preventDefault();

    const settings = readSettingsFromForm();
    const validationMessage = validateSettings(settings);

    if (validationMessage) {
        showStatus(validationMessage, true);
        return;
    }

    localStorage.setItem(OPTIMIZATION_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    showStatus("Optimization settings saved.");
}

function resetSettings() {
    localStorage.removeItem(OPTIMIZATION_SETTINGS_STORAGE_KEY);
    populateForm(DEFAULT_OPTIMIZATION_SETTINGS);
    showStatus("Default optimization settings restored.");
}

function readSettingsFromForm() {
    return {
        populationSize: getIntegerValue("populationSize"),
        generations: getIntegerValue("generations"),
        eliteCount: getIntegerValue("eliteCount"),
        tournamentSize: getIntegerValue("tournamentSize"),
        mutationAttempts: getIntegerValue("mutationAttempts"),
        mutationProbability: getNumberValue("mutationProbability"),
        randomSeed: getIntegerValue("randomSeed"),
        threadCount: getIntegerValue("threadCount"),
        stopWhenPerfect: getCheckboxValue("stopWhenPerfect"),
        stagnationGenerationLimit: getIntegerValue("stagnationGenerationLimit"),
        enableProgressLogging: getCheckboxValue("enableProgressLogging"),
        progressLogInterval: getIntegerValue("progressLogInterval"),
        penalties: {
            low: getIntegerValue("penaltyLow"),
            medium: getIntegerValue("penaltyMedium"),
            high: getIntegerValue("penaltyHigh"),
            hard: getIntegerValue("penaltyHard")
        }
    };
}

function validateSettings(settings) {
    if (settings.populationSize <= 0) return "Population size must be greater than zero.";
    if (settings.generations <= 0) return "generations must be greater than zero.";
    if (settings.eliteCount < 0 || settings.eliteCount >= settings.populationSize) return "Elite count must be non-negative and smaller than population size.";
    if (settings.tournamentSize <= 0 || settings.tournamentSize > settings.populationSize) return "Tournament size must be between 1 and population size.";
    if (settings.mutationAttempts < 0) return "Mutation attempts cannot be negative.";
    if (settings.mutationProbability < 0 || settings.mutationProbability > 1) return "Mutation probability must be between 0.0 and 1.0.";
    if (settings.threadCount <= 0) return "Thread count must be greater than zero.";
    if (settings.stagnationGenerationLimit < 0) return "Stagnation generation limit cannot be negative.";
    if (settings.progressLogInterval <= 0) return "Progress log interval must be greater than zero.";
    if (Object.values(settings.penalties).some(value => value < 0)) return "Penalty values cannot be negative.";

    return "";
}

function setInputValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.value = value;
}

function setCheckboxValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.checked = Boolean(value);
}

function getIntegerValue(elementId) {
    return Number.parseInt(document.getElementById(elementId)?.value ?? "0", 10);
}

function getNumberValue(elementId) {
    return Number.parseFloat(document.getElementById(elementId)?.value ?? "0");
}

function getCheckboxValue(elementId) {
    return Boolean(document.getElementById(elementId)?.checked);
}


async function testAIConnection() {
    const promptElement = document.getElementById("aiTestPrompt");
    const responseElement = document.getElementById("aiTestResponse");

    if (!promptElement || !responseElement) {
        return;
    }

    const prompt = promptElement.value.trim();

    if (!prompt) {
        showAIStatus("Enter a test prompt first.", true);
        return;
    }

    responseElement.value = "";
    showAIStatus("Testing AI connection...");

    try {
        const response = await fetch("/api/ai/test", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            responseElement.value = data.response ?? "";
            showAIStatus(data.message ?? "AI connection test failed.", true);
            return;
        }

        responseElement.value = data.response ?? "";
        showAIStatus("AI connection works.");
    } catch (error) {
        console.error("AI connection test failed.", error);
        showAIStatus("Could not connect to the AI endpoint.", true);
    }
}

function showAIStatus(message, isError = false) {
    const status = document.getElementById("aiTestStatus");
    if (!status) return;

    status.textContent = message;
    status.classList.toggle("settings-status-error", isError);
}

function showStatus(message, isError = false) {
    const status = document.getElementById("settingsStatus");
    if (!status) return;

    status.textContent = message;
    status.classList.toggle("settings-status-error", isError);
}
