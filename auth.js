/**
 * GARAGE Auth & Navigation Handler
 * This script ensures consistent navigation and authentication state across all pages.
 */

document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();
    handleProtectedPages();
});

function updateNavbar() {
    const role = localStorage.getItem("garageUserRole");
    const name = localStorage.getItem("garageCurrentUser") || "User";
    
    // Find the auth buttons container or the navbar
    const authButtons = document.querySelector(".auth-buttons");
    const nav = document.querySelector(".main-nav-bar nav");
    
    if (!authButtons || !nav) return;

    if (role) {
        // User is logged in
        let dashboardLink = "dashboard.html";
        if (role === "admin") {
            dashboardLink = "my%20admin%20dashboard%20(1).html";
        } else {
            // For regular users, we can use user_home.html or dashboard.html
            // Let's ensure they have a link to their orders/dashboard
            if (!nav.querySelector('a[href="dashboard.html"]') && !nav.querySelector('a[href="my_orders.html"]')) {
                const ordersLink = document.createElement("a");
                ordersLink.href = "my_orders.html";
                ordersLink.textContent = "My Orders";
                nav.appendChild(ordersLink);
            }
        }

        authButtons.innerHTML = `
            <div class="user-profile-nav">
                <span class="user-greeting">Hi, ${name}</span>
                <a href="${dashboardLink}" class="login-btn">Dashboard</a>
                <a href="#" class="login-btn outline" onclick="logoutUser(event)">Logout</a>
            </div>
        `;
    }
}

function handleProtectedPages() {
    const role = localStorage.getItem("garageUserRole");
    const path = window.location.pathname;
    const page = path.split("/").pop();

    // Pages that require login
    const userPages = ["user_home.html", "my_orders.html", "dashboard.html"];
    const adminPages = ["my admin dashboard (1).html"];

    if (userPages.includes(page) && !role) {
        window.location.href = "login.html";
    }

    if (adminPages.includes(page) && role !== "admin") {
        if (role === "user") {
            window.location.href = "dashboard.html";
        } else {
            window.location.href = "login.html";
        }
    }

    // Redirect logged in users away from login page
    if (page === "login.html" && role) {
        if (role === "admin") {
            window.location.href = "my%20admin%20dashboard%20(1).html";
        } else {
            window.location.href = "user_home.html";
        }
    }
}

function logoutUser(event) {
    if (event) event.preventDefault();
    localStorage.removeItem("garageUserRole");
    localStorage.removeItem("garageCurrentUser");
    window.location.href = "index.html";
}

// Make logout available globally
window.logoutUser = logoutUser;
