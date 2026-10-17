function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");

    const accounts = {
        admin: { password: "admin", role: "admin", displayName: "Admin" },
        habiba: { password: "2007", role: "user", displayName: "Habiba" },
        user: { password: "user", role: "user", displayName: "Customer" }
    };

    const account = accounts[username.toLowerCase()];
    if (!account || account.password !== password) {
        message.style.color = "#ef4444";
        message.innerText = "Log in failed. Please check your credentials.";
        return;
    }

    localStorage.setItem("garageUserRole", account.role);
    localStorage.setItem("garageCurrentUser", account.displayName);

    message.style.color = "#10b981";
    message.innerText = `${account.role === "admin" ? "Admin" : "User"} login completed successfully.`;

    const targetPage = account.role === "admin"
        ? "my admin dashboard (1).html"
        : "user_home.html";

    setTimeout(() => {
        window.location.href = targetPage;
    }, 700);
}
