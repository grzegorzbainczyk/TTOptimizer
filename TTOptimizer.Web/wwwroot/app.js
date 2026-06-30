const sampleInput = {
    tasks: [
        { id: 1, name: "Task A", duration: 3 },
        { id: 2, name: "Task B", duration: 5 },
        { id: 3, name: "Task C", duration: 2 }
    ],
    resources: 2
};

document.getElementById("inputJson").value = JSON.stringify(sampleInput, null, 2);

document.getElementById("runButton").addEventListener("click", async () => {
    const inputText = document.getElementById("inputJson").value;
    const resultBox = document.getElementById("resultBox");

    resultBox.textContent = "Running optimizer...";

    let inputJson;

    try {
        inputJson = JSON.parse(inputText);
    }
    catch (error) {
        resultBox.textContent = "Invalid JSON:\n" + error;
        return;
    }

    try {
        const response = await fetch("/api/optimizer/run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(inputJson)
        });

        const text = await response.text();

        try {
            const json = JSON.parse(text);
            resultBox.textContent = JSON.stringify(json, null, 2);
        }
        catch {
            resultBox.textContent = text;
        }
    }
    catch (error) {
        resultBox.textContent = "Request failed:\n" + error;
    }
});