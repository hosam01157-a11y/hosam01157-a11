const ADMIN_ORDER_STORAGE_KEY = "garageOrders";
const ADMIN_ROLE_STORAGE_KEY = "garageUserRole";
const ADMIN_USER_STORAGE_KEY = "garageCurrentUser";

function readOrders() {
    const raw = localStorage.getItem(ADMIN_ORDER_STORAGE_KEY);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function writeOrders(orders) {
    localStorage.setItem(ADMIN_ORDER_STORAGE_KEY, JSON.stringify(orders));
}

function normalizeStatus(status) {
    const value = String(status || "").toLowerCase().trim();
    if (value === "done" || value === "completed") return "done";
    if (value === "cancelled" || value === "canceled") return "cancelled";
    return "pending";
}

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function statusBadge(status) {
    const current = normalizeStatus(status);
    const labels = {
        pending: "Pending",
        done: "Done",
        cancelled: "Cancelled"
    };
    return `<span class="status-badge ${current}">${labels[current]}</span>`;
}

function ensureAdminAccess() {
    const role = localStorage.getItem(ADMIN_ROLE_STORAGE_KEY);
    if (role === "admin") return;
    if (role === "user") {
        window.location.href = "my_orders.html";
        return;
    }
    window.location.href = "login.html";
}

function setAdminLabel() {
    const label = document.getElementById("admin-label");
    if (!label) return;
    label.textContent = localStorage.getItem(ADMIN_USER_STORAGE_KEY) || "Admin";
}

function renderStats() {
    const orders = readOrders();
    const stats = {
        total: orders.length,
        pending: 0,
        done: 0,
        cancelled: 0
    };

    orders.forEach((order) => {
        const status = normalizeStatus(order.status);
        if (status === "done") stats.done += 1;
        else if (status === "cancelled") stats.cancelled += 1;
        else stats.pending += 1;
    });

    const total = document.getElementById("stat-total");
    const pending = document.getElementById("stat-pending");
    const done = document.getElementById("stat-done");
    const cancelled = document.getElementById("stat-cancelled");

    if (total) total.textContent = String(stats.total);
    if (pending) pending.textContent = String(stats.pending);
    if (done) done.textContent = String(stats.done);
    if (cancelled) cancelled.textContent = String(stats.cancelled);
}

function renderRecentTable() {
    const tbody = document.getElementById("recent-orders-body");
    if (!tbody) return;

    const orders = [...readOrders()].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 8);
    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td class="empty-row" colspan="7">No orders yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders
        .map((order) => {
            const id = String(order.id || "");
            return `
                <tr>
                    <td>${order.name || "-"}</td>
                    <td>${order.phone || "-"}</td>
                    <td>${order.service || "-"}</td>
                    <td>${order.car || "-"}</td>
                    <td>${formatDate(order.date)}</td>
                    <td>${statusBadge(order.status)}</td>
                    <td class="table-actions">
                        <button type="button" class="btn small done" onclick="setStatus('${id}', 'done')">Done</button>
                        <button type="button" class="btn small cancel" onclick="setStatus('${id}', 'cancelled')">Cancel</button>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function renderRequestsTable() {
    const tbody = document.getElementById("all-orders-body");
    if (!tbody) return;

    const query = (document.getElementById("admin-search")?.value || "").trim().toLowerCase();
    const statusFilter = (document.getElementById("admin-status-filter")?.value || "").trim().toLowerCase();
    const serviceFilter = (document.getElementById("admin-service-filter")?.value || "").trim().toLowerCase();

    const orders = readOrders().filter((order) => {
        const haystack = `${order.name || ""} ${order.phone || ""} ${order.service || ""} ${order.car || ""}`.toLowerCase();
        const status = normalizeStatus(order.status);
        const service = String(order.service || "").toLowerCase();

        if (query && !haystack.includes(query)) return false;
        if (statusFilter && status !== statusFilter) return false;
        if (serviceFilter && service !== serviceFilter) return false;
        return true;
    });

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td class="empty-row" colspan="8">No matching orders.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        .map((order, index) => {
            const id = String(order.id || "");
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${order.name || "-"}</td>
                    <td>${order.phone || "-"}</td>
                    <td>${order.service || "-"}</td>
                    <td>${order.car || "-"}</td>
                    <td>${formatDate(order.date)}</td>
                    <td>${statusBadge(order.status)}</td>
                    <td class="table-actions">
                        <button type="button" class="btn small done" onclick="setStatus('${id}', 'done')">Done</button>
                        <button type="button" class="btn small cancel" onclick="setStatus('${id}', 'cancelled')">Cancel</button>
                        <button type="button" class="btn small ghost" onclick="removeOrder('${id}')">Delete</button>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function renderUsers() {
    const container = document.getElementById("users-grid");
    if (!container) return;

    const orders = readOrders();
    const usersMap = new Map();

    orders.forEach((order) => {
        const name = (order.name || "Unknown").trim();
        const phone = (order.phone || "-").trim();
        const key = `${name.toLowerCase()}|${phone}`;
        const status = normalizeStatus(order.status);
        const current = usersMap.get(key) || {
            name,
            phone,
            total: 0,
            pending: 0
        };
        current.total += 1;
        if (status === "pending") current.pending += 1;
        usersMap.set(key, current);
    });

    const users = [...usersMap.values()].sort((a, b) => b.total - a.total);
    if (users.length === 0) {
        container.innerHTML = `<div class="empty-users">No customers yet.</div>`;
        return;
    }

    container.innerHTML = users
        .map((user) => {
            const initials = user.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0].toUpperCase())
                .join("");

            return `
                <article class="user-card">
                    <div class="avatar">${initials || "U"}</div>
                    <div>
                        <h3>${user.name}</h3>
                        <p>${user.phone}</p>
                    </div>
                    <div class="user-meta">
                        <span>Total: ${user.total}</span>
                        <span>Pending: ${user.pending}</span>
                    </div>
                </article>
            `;
        })
        .join("");
}

function refreshAll() {
    renderStats();
    renderRecentTable();
    renderRequestsTable();
    renderUsers();
}

function setStatus(orderId, status) {
    const target = String(orderId);
    const currentStatus = normalizeStatus(status);
    const orders = readOrders().map((order) => {
        if (String(order.id) !== target) return order;
        return {
            ...order,
            status: currentStatus
        };
    });

    writeOrders(orders);
    refreshAll();
}

function removeOrder(orderId) {
    if (!window.confirm("Delete this order?")) return;
    const target = String(orderId);
    const orders = readOrders().filter((order) => String(order.id) !== target);
    writeOrders(orders);
    refreshAll();
}

function clearAllOrders() {
    if (!window.confirm("Delete all orders from the system?")) return;
    localStorage.removeItem(ADMIN_ORDER_STORAGE_KEY);
    refreshAll();
}

function goToBooking() {
    window.location.href = "contact.html";
}

function logoutAdmin() {
    localStorage.removeItem(ADMIN_ROLE_STORAGE_KEY);
    localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
    window.location.href = "login.html";
}

function showPage(pageName, navElement) {
    const pages = document.querySelectorAll(".page");
    pages.forEach((page) => page.classList.remove("active"));

    const target = document.getElementById(`${pageName}-page`);
    if (target) target.classList.add("active");

    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    navItems.forEach((item) => item.classList.remove("active"));

    if (navElement) navElement.classList.add("active");
}

window.setStatus = setStatus;
window.removeOrder = removeOrder;
window.renderRequestsTable = renderRequestsTable;
window.showPage = showPage;
window.clearAllOrders = clearAllOrders;
window.goToBooking = goToBooking;
window.logoutAdmin = logoutAdmin;

document.addEventListener("DOMContentLoaded", () => {
    ensureAdminAccess();
    setAdminLabel();
    refreshAll();
});
