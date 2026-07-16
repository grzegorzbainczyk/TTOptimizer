window.appContext = {
    setLoginContext(userId, organizationId) {
        localStorage.setItem("userId", userId);
        localStorage.setItem("organizationId", organizationId);
    },

    getUserId() {
        return localStorage.getItem("userId");
    },

    getOrganizationId() {
        return localStorage.getItem("organizationId");
    },

    clear() {
        localStorage.removeItem("userId");
        localStorage.removeItem("organizationId");
    },

    requireOrganizationId() {
        const organizationId = localStorage.getItem("organizationId");

        if (!organizationId) {
            throw new Error("Missing organizationId. User is probably not logged in.");
        }

        return organizationId;
    }
};