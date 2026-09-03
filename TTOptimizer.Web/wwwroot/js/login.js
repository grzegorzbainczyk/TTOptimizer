document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("loginButton");
    const registerButton = document.getElementById("registerButton");
    const cancelRegistrationButton =
        document.getElementById("cancelRegistrationButton");

    const loginFields =
        document.getElementById("loginFields");

    const registrationFields =
        document.getElementById("registrationFields");

    const demoEmptyButton =
        document.getElementById("demoEmptyButton");

    const demoSmallButton =
        document.getElementById("demoSmallButton");

    const demoPrimarySchoolButton =
        document.getElementById("demoPrimarySchoolButton");

    const authMessage =
        document.getElementById("authMessage");

    let registrationMode = false;

    loginButton?.addEventListener("click", handleLogin);
    registerButton?.addEventListener("click", handleRegister);

    cancelRegistrationButton?.addEventListener(
        "click",
        () => setRegistrationMode(false)
    );

    demoEmptyButton?.addEventListener(
        "click",
        loginAsEmptyDemo
    );

    demoSmallButton?.addEventListener(
        "click",
        loginAsSmallDemo
    );

    demoPrimarySchoolButton?.addEventListener(
        "click",
        loginAsPrimarySchoolDemo
    );

    document.getElementById("loginPasswordInput")
        ?.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                handleLogin();
            }
        });

    document.getElementById("confirmPasswordInput")
        ?.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                handleRegister();
            }
        });

    async function handleLogin() {
        const email =
            document.getElementById("loginEmailInput")
                ?.value.trim() ?? "";

        const password =
            document.getElementById("loginPasswordInput")
                ?.value ?? "";

        if (!email || !password) {
            showMessage(
                "Podaj e-mail i hasło.",
                true
            );
            return;
        }

        setAuthBusy(true);
        showMessage("Logowanie...", false);

        try {
            const response = await fetch(
                "/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data =
                await readJsonResponse(response);

            if (!response.ok || !data?.success) {
                showMessage(
                    data?.message ??
                    "Nie udało się zalogować.",
                    true
                );
                return;
            }

            setAppContext(
                data.userId,
                data.organizationId
            );

            window.location.href =
                "main.html";
        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            showMessage(
                "Nie udało się połączyć z serwerem.",
                true
            );
        } finally {
            setAuthBusy(false);
        }
    }

    async function handleRegister() {
        if (!registrationMode) {
            setRegistrationMode(true);
            return;
        }

        const email =
            document.getElementById("registerEmailInput")
                ?.value.trim() ?? "";

        const displayName =
            document.getElementById("displayNameInput")
                ?.value.trim() ?? "";

        const organizationName =
            document.getElementById("organizationNameInput")
                ?.value.trim() ?? "";

        const password =
            document.getElementById("registerPasswordInput")
                ?.value ?? "";

        const confirmPassword =
            document.getElementById("confirmPasswordInput")
                ?.value ?? "";

        if (
            !email ||
            !displayName ||
            !organizationName ||
            !password ||
            !confirmPassword
        ) {
            showMessage(
                "Uzupełnij wszystkie pola rejestracji.",
                true
            );
            return;
        }

        if (password !== confirmPassword) {
            showMessage(
                "Hasła nie są identyczne.",
                true
            );
            return;
        }

        setAuthBusy(true);

        showMessage(
            "Tworzenie konta i organizacji...",
            false
        );

        try {
            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        displayName,
                        organizationName
                    })
                }
            );

            const data =
                await readJsonResponse(response);

            if (!response.ok || !data?.success) {
                showMessage(
                    data?.message ??
                    "Nie udało się utworzyć konta.",
                    true
                );
                return;
            }

            setAppContext(
                data.userId,
                data.organizationId
            );

            window.location.href =
                "school.html?setup=1";
        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            showMessage(
                "Nie udało się połączyć z serwerem.",
                true
            );
        } finally {
            setAuthBusy(false);
        }
    }

    function setRegistrationMode(enabled) {
        registrationMode = enabled;

        if (loginFields) {
            loginFields.hidden = enabled;
        }

        if (registrationFields) {
            registrationFields.hidden = !enabled;
        }

        if (cancelRegistrationButton) {
            cancelRegistrationButton.hidden = !enabled;
        }

        if (loginButton) {
            loginButton.hidden = enabled;
        }

        if (registerButton) {
            registerButton.textContent =
                enabled
                    ? "Utwórz konto i organizację"
                    : "Zarejestruj";
        }

        if (enabled) {
            const loginEmail =
                document.getElementById("loginEmailInput")
                    ?.value.trim() ?? "";

            const registerEmail =
                document.getElementById("registerEmailInput");

            if (
                registerEmail &&
                !registerEmail.value &&
                loginEmail
            ) {
                registerEmail.value = loginEmail;
            }

            document.getElementById("registerEmailInput")
                ?.focus();
        } else {
            const registerEmail =
                document.getElementById("registerEmailInput")
                    ?.value.trim() ?? "";

            const loginEmail =
                document.getElementById("loginEmailInput");

            if (
                loginEmail &&
                !loginEmail.value &&
                registerEmail
            ) {
                loginEmail.value = registerEmail;
            }

            document.getElementById("loginEmailInput")
                ?.focus();
        }

        showMessage("", false);
    }

    function setAppContext(
        userId,
        organizationId
    ) {
        if (
            !window.appContext ||
            typeof window.appContext.setLoginContext !==
                "function"
        ) {
            throw new Error(
                "appContext.setLoginContext is not available."
            );
        }

        window.appContext.setLoginContext(
            userId,
            organizationId
        );
    }

    async function loginAsEmptyDemo() {
        await loginDemo(
            "/api/demo/login/empty",
            "Pusta szkoła"
        );
    }

    async function loginAsSmallDemo() {
        await loginDemo(
            "/api/demo/login",
            "Mała szkoła"
        );
    }

    async function loginAsPrimarySchoolDemo() {
        await loginDemo(
            "/api/demo/login/hard",
            "Szkoła podstawowa"
        );
    }

    async function loginDemo(url, label) {
        setAuthBusy(true);

        showMessage(
            `Wczytywanie: ${label}...`,
            false
        );

        try {
            const response = await fetch(
                url,
                {
                    method: "POST"
                }
            );

            const data =
                await readJsonResponse(response);

            if (!response.ok || !data?.success) {
                showMessage(
                    data?.message ??
                    `Nie udało się uruchomić: ${label}.`,
                    true
                );
                return;
            }

            setAppContext(
                data.userId,
                data.organizationId
            );

            window.location.href =
                "main.html";
        } catch (error) {
            console.error(
                `${label} login error:`,
                error
            );

            showMessage(
                "Nie udało się połączyć z serwerem.",
                true
            );
        } finally {
            setAuthBusy(false);
        }
    }

    function showMessage(
        message,
        isError = false
    ) {
        if (!authMessage) {
            return;
        }

        authMessage.textContent = message;

        authMessage.classList.toggle(
            "auth-message-error",
            Boolean(isError)
        );

        authMessage.classList.toggle(
            "auth-message-info",
            Boolean(message) && !isError
        );
    }

    function setAuthBusy(disabled) {
        for (const button of [
            loginButton,
            registerButton,
            cancelRegistrationButton,
            demoEmptyButton,
            demoSmallButton,
            demoPrimarySchoolButton
        ]) {
            if (button) {
                button.disabled = disabled;
            }
        }
    }

    async function readJsonResponse(response) {
        const text =
            await response.text();

        if (!text) {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch {
            return {
                message: text
            };
        }
    }
});
