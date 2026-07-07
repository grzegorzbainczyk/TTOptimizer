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

    function loginAsDemoUser() {
        // Temporary client-side demo login.
        // Later this should call POST /api/auth/demo-login.
        localStorage.setItem("ttorganizer_user", "demo@ttorganizer.local");
        localStorage.setItem("ttorganizer_organization", "Demo School");

        window.location.href = "/main.html";
    }
});