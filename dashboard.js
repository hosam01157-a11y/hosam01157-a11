const ORDER_STORAGE_KEY = "garageOrders";
const ROLE_STORAGE_KEY = "garageUserRole";
const USER_STORAGE_KEY = "garageCurrentUser";

function readOrders() {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveOrders(orders) {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
}

function normalizeStatus(status) {
    const value = String(status || "").trim().toLowerCase();
    if (value === "done" || value === "completed") {
        return "done";
    }
    if (value === "cancelled" || value === "canceled") {
        return "cancelled";
    }
    return "pending";
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getCurrentUser() {
    return localStorage.getItem(USER_STORAGE_KEY) || "Guest";
}

function ensureUserAccess() {
    const role = localStorage.getItem(ROLE_STORAGE_KEY);
    if (!role) {
        window.location.href = "login.html";
        return;
    }

    if (role === "admin") {
        window.location.href = "my%20admin%20dashboard%20(1).html";
    }
}

function setUserLabel() {
    const label = document.getElementById("current-user");
    if (label) {
        label.textContent = getCurrentUser();
    }
}

function calculateStats(orders) {
    let pending = 0;
    let done = 0;
    let cancelled = 0;

    orders.forEach((order) => {
        const status = normalizeStatus(order.status);
        if (status === "done") {
            done += 1;
        } else if (status === "cancelled") {
            cancelled += 1;
        } else {
            pending += 1;
        }
    });

    return {
        total: orders.length,
        pending,
        done,
        cancelled
    };
}

function createStatusBadge(status) {
    const normalized = normalizeStatus(status);
    const labels = {
        pending: "Pending",
        done: "Completed",
        cancelled: "Cancelled"
    };

    return `<span class="status-badge ${normalized}">${labels[normalized]}</span>`;
}

function createEmptyRow(colspan, text) {
    return `<tr><td colspan="${colspan}" class="empty-row">${text}</td></tr>`;
}

function renderDashboardTable(orders) {
    const tbody = document.getElementById("recent-orders-body");
    if (!tbody) {
        return;
    }

    if (orders.length === 0) {
        tbody.innerHTML = createEmptyRow(5, "No requests yet.");
        return;
    }

    const recentOrders = [...orders]
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        .slice(0, 5);

    tbody.innerHTML = recentOrders
        .map((order) => {
            return `
                <tr>
                    <td>${order.name || "-"}</td>
                    <td>${order.service || "-"}</td>
                    <td>${order.car || "-"}</td>
                    <td>${formatDate(order.date)}</td>
                    <td>${createStatusBadge(order.status)}</td>
                </tr>
            `;
        })
        .join("");
}

function matchOrder(order, query, statusFilter) {
    const haystack = `${order.name || ""} ${order.phone || ""} ${order.service || ""} ${order.car || ""}`.toLowerCase();
    const normalizedStatus = normalizeStatus(order.status);
    const queryMatch = !query || haystack.includes(query);
    const statusMatch = !statusFilter || normalizedStatus === statusFilter;
    return queryMatch && statusMatch;
}

function renderOrdersTable() {
    const tbody = document.getElementById("orders-body");
    if (!tbody) {
        return;
    }

    const searchInput = document.getElementById("orders-search");
    const statusSelect = document.getElementById("orders-status-filter");

    const query = (searchInput?.value || "").trim().toLowerCase();
    const statusFilter = normalizeStatus(statusSelect?.value || "");
    const rawStatusFilter = (statusSelect?.value || "").trim().toLowerCase();
    const hasStatusFilter = rawStatusFilter === "pending" || rawStatusFilter === "done" || rawStatusFilter === "cancelled";

    const orders = readOrders();
    const filtered = orders.filter((order) => matchOrder(order, query, hasStatusFilter ? statusFilter : ""));

    if (filtered.length === 0) {
        tbody.innerHTML = createEmptyRow(7, "No orders match your filters.");
        return;
    }

    tbody.innerHTML = filtered
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        .map((order) => {
            const id = String(order.id || "");
            return `
                <tr>
                    <td>${order.name || "-"}</td>
                    <td>${order.phone || "-"}</td>
                    <td>${order.service || "-"}</td>
                    <td>${order.car || "-"}</td>
                    <td>${formatDate(order.date)}</td>
                    <td>${createStatusBadge(order.status)}</td>
                    <td class="actions">
                        <button type="button" class="btn small done" onclick="setOrderStatus('${id}', 'done')">Done</button>
                        <button type="button" class="btn small cancel" onclick="setOrderStatus('${id}', 'cancelled')">Cancel</button>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function renderStats() {
    const stats = calculateStats(readOrders());
    const total = document.getElementById("count-total");
    const pending = document.getElementById("count-pending");
    const completed = document.getElementById("count-completed");
    const cancelled = document.getElementById("count-cancelled");

    if (total) total.textContent = String(stats.total);
    if (pending) pending.textContent = String(stats.pending);
    if (completed) completed.textContent = String(stats.done);
    if (cancelled) cancelled.textContent = String(stats.cancelled);
}

function renderAll() {
    renderStats();
    renderDashboardTable(readOrders());
    renderOrdersTable();
}

function setOrderStatus(id, status) {
    const targetId = String(id);
    const normalized = normalizeStatus(status);
    const orders = readOrders().map((order) => {
        if (String(order.id) === targetId) {
            return { ...order, status: normalized };
        }
        return order;
    });

    saveOrders(orders);
    renderAll();
}

function clearOrderHistory() {
    if (!window.confirm("Delete all your orders?")) {
        return;
    }

    localStorage.removeItem(ORDER_STORAGE_KEY);
    renderAll();
}

function logout() {
    localStorage.removeItem(ROLE_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = "login.html";
}

function changePage(pageName, navElement) {
    const pages = document.querySelectorAll(".page");
    pages.forEach((page) => {
        page.classList.remove("active");
    });

    const target = document.getElementById(`${pageName}-page`);
    if (target) {
        target.classList.add("active");
    }

    const navItems = document.querySelectorAll(".sidebar .nav-item");
    navItems.forEach((item) => {
        item.classList.remove("active");
    });

    if (navElement) {
        navElement.classList.add("active");
    }
}

function goToBooking() {
    window.location.href = "contact.html";
}

window.setOrderStatus = setOrderStatus;
window.changePage = changePage;
window.goToBooking = goToBooking;
window.clearOrderHistory = clearOrderHistory;
window.logout = logout;
window.renderOrdersTable = renderOrdersTable;

document.addEventListener("DOMContentLoaded", () => {
    ensureUserAccess();
    setUserLabel();
    renderAll();
});
