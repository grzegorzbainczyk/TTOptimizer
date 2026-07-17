document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("loginButton");
    const registerButton = document.getElementById("registerButton");

    const demoEasyButton = document.getElementById("demoEasyButton");
    const demoMediumButton = document.getElementById("demoMediumButton");
    const demoHardButton = document.getElementById("demoHardButton");

    const authMessage = document.getElementById("authMessage");

    loginButton?.addEventListener("click", handleLogin);
    registerButton?.addEventListener("click", handleRegister);

    demoEasyButton?.addEventListener("click", loginAsEasyDemo);
    demoMediumButton?.addEventListener("click", handleMediumDemo);
    demoHardButton?.addEventListener("click",loginAsHardDemo);

    function handleLogin() {
        showMessage(
            "Login is not implemented yet. Use one of the demo modes for now."
        );
    }

    function handleRegister() {
        showMessage(
            "Registration is not implemented yet."
        );
    }

    function handleMediumDemo() {
        showMessage(
            "Medium demo is not implemented yet."
        );
    }

    async function loginAsHardDemo() {
        setDemoButtonsDisabled(true);
        showMessage("Loading Hard demo...");

        try {
            const response = await fetch(
                "/api/demo/login/hard",
                {
                    method: "POST"
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                showMessage(
                    data.message || "Hard demo login failed."
                );

                return;
            }

            window.appContext.setLoginContext(
                data.userId,
                data.organizationId
            );

            window.location.href = "main.html";
        } catch (error) {
            console.error(
                "Hard demo login error:",
                error
            );

            showMessage(
                "Hard demo login failed. Check if the backend is running."
            );
        } finally {
            setDemoButtonsDisabled(false);
        }
    }

    async function loginAsEasyDemo() {
        setDemoButtonsDisabled(true);
        showMessage("Loading Easy demo...");

        try {
            const response = await fetch("/api/demo/login", {
                method: "POST"
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showMessage(
                    data.message || "Easy demo login failed."
                );

                return;
            }

            if (
                !window.appContext ||
                typeof window.appContext.setLoginContext !== "function"
            ) {
                throw new Error(
                    "appContext.setLoginContext is not available."
                );
            }

            window.appContext.setLoginContext(
                data.userId,
                data.organizationId
            );

            window.location.href = "main.html";
        } catch (error) {
            console.error("Easy demo login error:", error);

            showMessage(
                "Easy demo login failed. Check the browser console and make sure the backend is running."
            );
        } finally {
            setDemoButtonsDisabled(false);
        }
    }

    function showMessage(message) {
        if (!authMessage) {
            console.warn(
                "Element with id 'authMessage' was not found."
            );

            return;
        }

        authMessage.textContent = message;
    }

    function setDemoButtonsDisabled(disabled) {
        if (demoEasyButton) {
            demoEasyButton.disabled = disabled;
        }

        if (demoMediumButton) {
            demoMediumButton.disabled = disabled;
        }

        if (demoHardButton) {
            demoHardButton.disabled = disabled;
        }
    }
});