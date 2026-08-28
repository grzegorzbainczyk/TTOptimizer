export function initializeAuthSession() {
    if (!window.appContext) {
        console.error("appContext is not available.");
        window.location.replace("index.html");
        return false;
    }

    if (!window.appContext.isLoggedIn()) {
        window.location.replace("index.html");
        return false;
    }

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            window.appContext.logout();
        });
    }

    return true;
}
