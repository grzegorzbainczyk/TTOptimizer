document.addEventListener("DOMContentLoaded", () => {
  
    const loginButton = document.getElementById("loginButton");
    const registerButton = document.getElementById("registerButton");
    const demoLoginButton = document.getElementById("demoLoginButton");

    const authMessage = document.getElementById("authMessage");

    loginButton.addEventListener("click", handleLogin);
    registerButton.addEventListener("click", handleRegister);
    demoLoginButton.addEventListener("click", loginAsDemoUser);

    function handleLogin() {
        authMessage.textContent = "Login is not implemented yet. Use demo user for now.";
    }

    function handleRegister() {
        authMessage.textContent = "Registration is not implemented yet. Use demo user for now.";
    }

    async function loginAsDemoUser() {
        try {
            const response = await fetch("/api/demo/login", {
                method: "POST"
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.message || "Demo login failed.");
                return;
            }

            window.appContext.setLoginContext(data.userId, data.organizationId);

            window.location.href = "main.html";
        } catch (error) {
            console.error("Demo login error:", error);
            alert("Demo login failed. Check if the backend is running.");
        }
    }
});