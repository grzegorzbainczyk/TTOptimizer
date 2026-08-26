const OPTIMIZATION_SETTINGS_STORAGE_KEY =
    "classflow.optimizationSettings";

export const DEFAULT_OPTIMIZATION_SETTINGS = {
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

export function loadOptimizationSettings() {
    const savedJson = localStorage.getItem(
        OPTIMIZATION_SETTINGS_STORAGE_KEY
    );

    if (!savedJson) {
        return cloneDefaultSettings();
    }

    try {
        const savedSettings = JSON.parse(savedJson);

        return {
            ...DEFAULT_OPTIMIZATION_SETTINGS,
            ...savedSettings,
            penalties: {
                ...DEFAULT_OPTIMIZATION_SETTINGS.penalties,
                ...(savedSettings.penalties ?? {})
            }
        };
    } catch (error) {
        console.error(
            "Could not read optimization settings from localStorage.",
            error
        );

        localStorage.removeItem(
            OPTIMIZATION_SETTINGS_STORAGE_KEY
        );

        return cloneDefaultSettings();
    }
}

function cloneDefaultSettings() {
    return {
        ...DEFAULT_OPTIMIZATION_SETTINGS,
        penalties: {
            ...DEFAULT_OPTIMIZATION_SETTINGS.penalties
        }
    };
}
