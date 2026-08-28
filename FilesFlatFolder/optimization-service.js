import { t } from "../i18n.js";
import { loadOptimizationSettings } from "./settings.js";
import {
    hideOptimizationProgress,
    setOptimizationRunningState,
    setResultMessage,
    setStatusText,
    showOptimizationProgress,
    updateOptimizationProgress
} from "./optimization-ui.js";
import {
    clearOptimizationResultForNewRun,
    renderOptimizationResult,
    saveLastOptimizationResultToStorage
} from "./timetable.js";

let optimizationHubConnection = null;
let currentOptimizationAbortController = null;

export async function initializeOptimization() {
    setupRunOptimizationButton();
    setupStopOptimizationButton();
    await initializeOptimizationHub();
}

async function initializeOptimizationHub() {
    const signalR = window.signalR;

    if (!signalR) {
        console.error(
            "SignalR JavaScript client is not loaded."
        );
        return null;
    }

    optimizationHubConnection =
        new signalR.HubConnectionBuilder()
            .withUrl("/hubs/optimization")
            .withAutomaticReconnect()
            .configureLogging(
                signalR.LogLevel.Information
            )
            .build();

    optimizationHubConnection.on(
        "OptimizationProgress",
        updateOptimizationProgress
    );

    optimizationHubConnection.onreconnecting(error => {
        console.warn(
            "SignalR connection is reconnecting.",
            error
        );
    });

    optimizationHubConnection.onreconnected(
        connectionId => {
            console.info(
                "SignalR connection restored:",
                connectionId
            );
        }
    );

    optimizationHubConnection.onclose(error => {
        console.error(
            "SignalR connection closed.",
            error
        );
    });

    try {
        await optimizationHubConnection.start();

        console.info(
            "SignalR connected:",
            optimizationHubConnection.connectionId
        );

        return optimizationHubConnection;
    } catch (error) {
        console.error(
            "Could not start SignalR connection.",
            error
        );

        return null;
    }
}

async function ensureOptimizationHubConnection() {
    if (!optimizationHubConnection) {
        return await initializeOptimizationHub();
    }

    const signalR = window.signalR;

    if (
        optimizationHubConnection.state ===
        signalR?.HubConnectionState.Disconnected
    ) {
        try {
            await optimizationHubConnection.start();
        } catch (error) {
            console.error(
                "Could not reconnect to SignalR.",
                error
            );

            return null;
        }
    }

    return optimizationHubConnection;
}

function setupRunOptimizationButton() {
    const runButton = document.getElementById(
        "runOptimizationButton"
    );

    if (!runButton) {
        console.warn("runOptimizationButton not found");
        return;
    }

    runButton.addEventListener("click", runOptimization);
}

function setupStopOptimizationButton() {
    const stopButton = document.getElementById(
        "stopOptimizationButton"
    );

    if (!stopButton) {
        console.warn("stopOptimizationButton not found");
        return;
    }

    stopButton.addEventListener("click", stopOptimization);
}

function stopOptimization() {
    if (!currentOptimizationAbortController) {
        return;
    }

    setStatusText(t("optimization.stopping"));
    currentOptimizationAbortController.abort();
}

async function runOptimization() {
    if (window.classFlowSchoolReadiness && !window.classFlowSchoolReadiness.canOptimize) {
        setStatusText("Optymalizacja jest zablokowana. Najpierw uzupełnij wymagane dane szkoły.");
        return;
    }

    try {
        clearOptimizationResultForNewRun();
        showOptimizationProgress();
        setStatusText(t("optimization.running"));
        setOptimizationRunningState(true);

        currentOptimizationAbortController =
            new AbortController();

        const organizationId = getOrganizationId();

        if (organizationId === null) {
            return;
        }

        const hubConnection =
            await ensureOptimizationHubConnection();

        if (!hubConnection?.connectionId) {
            throw new Error(
                "SignalR connection is not available."
            );
        }

        const optimizationSettings =
            loadOptimizationSettings();

        const response = await sendOptimizationRequest(
            organizationId,
            hubConnection.connectionId,
            optimizationSettings,
            currentOptimizationAbortController.signal
        );

        if (!response.ok) {
            await handleFailedResponse(response);
            return;
        }

        const data = await response.json();

        console.log("Optimization result:", data);

        renderOptimizationResult(data);
        saveLastOptimizationResultToStorage(data);
        setStatusText(t("optimization.finished"));

        updateOptimizationProgress({
            generation: optimizationSettings.generations,
            totalGenerations:
                optimizationSettings.generations,
            percentage: 100
        });

        hideOptimizationProgress();
    } catch (error) {
        handleOptimizationError(error);
    } finally {
        currentOptimizationAbortController = null;
        setOptimizationRunningState(false);
    }
}

function getOrganizationId() {
    try {
        return Number(
            window.appContext.requireOrganizationId()
        );
    } catch (error) {
        console.error(error);
        alert(t("organization.contextMissing"));
        return null;
    }
}

function sendOptimizationRequest(
    organizationId,
    connectionId,
    optimizationSettings,
    signal
) {
    const encodedConnectionId =
        encodeURIComponent(connectionId);

    return fetch(
        `/api/optimization/run` +
        `?organizationId=${organizationId}` +
        `&connectionId=${encodedConnectionId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(optimizationSettings),
            signal
        }
    );
}

async function handleFailedResponse(response) {
    const errorText = await response.text();

    setStatusText(t("optimization.failed"));

    console.error(
        "Optimization request failed:",
        response.status,
        errorText
    );

    alert(
        t("optimization.failedWithStatus")
            .replace("{status}", response.status)
    );
}

function handleOptimizationError(error) {
    hideOptimizationProgress();

    if (error?.name === "AbortError") {
        setStatusText(t("optimization.stopped"));

        setResultMessage(
            "warning",
            t("optimization.stoppedTitle"),
            t("optimization.stoppedByUser")
        );

        console.info(
            "Optimization request was aborted by the user."
        );

        return;
    }

    setStatusText(t("optimization.error"));

    console.error(
        "Error while running optimization:",
        error
    );

    alert(
        t("optimization.errorDetails")
    );
}
