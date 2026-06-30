document.getElementById("runButton").addEventListener("click", async () => {
    const input = document.getElementById("inputText").value;
    const resultBox = document.getElementById("resultBox");

    resultBox.textContent = "Running optimizer...";

    try {
        const response = await fetch("/api/optimizer/run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input: input
            })
        });

        const data = await response.json();

        if (!response.ok) {
            resultBox.textContent = "Error:\n" + (data.error || JSON.stringify(data, null, 2));
            return;
        }

        resultBox.textContent = data.output;
    }
    catch (error) {
        resultBox.textContent = "Request failed:\n" + error;
    }
});