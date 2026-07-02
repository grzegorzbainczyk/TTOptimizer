document.addEventListener("DOMContentLoaded", () => {
    const runButton = document.getElementById("runOptimizationButton");
    const clearButton = document.getElementById("clearResultButton");
    const resultElement = document.getElementById("optimizationResult");
    const statusElement = document.getElementById("statusMessage");

    runButton.addEventListener("click", runOptimization);
    clearButton.addEventListener("click", clearResult);

    async function runOptimization() {
        setRunningState(true);

        statusElement.textContent = "Running optimization...";
        resultElement.textContent = "";

        try {
            const response = await fetch("http://api/optimization/run", {
                method: "POST"
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}: ${responseText}`);
            }

            const data = JSON.parse(responseText);

            resultElement.textContent = JSON.stringify(data, null, 2);

            if (data.success) {
                statusElement.textContent =
                    `Done. Initial penalty: ${data.initialPenalty}, best penalty: ${data.bestPenalty}.`;
            } else {
                statusElement.textContent = "Engine returned an error.";
            }
        } catch (error) {
            statusElement.textContent = "Error while running optimization.";
            resultElement.textContent = error.message;
        } finally {
            setRunningState(false);
        }
    }

    function clearResult() {
        resultElement.textContent = "// Result will appear here";
        statusElement.textContent = "Ready.";
    }

    function setRunningState(isRunning) {
        runButton.disabled = isRunning;

        if (isRunning) {
            runButton.textContent = "Running...";
        } else {
            runButton.textContent = "Run optimization";
        }
    }
});