// Chart Setup
const chartCanvas = document.getElementById("expenseChart");

const expenseChart = new Chart(chartCanvas, {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Daily Spending",
            data: [],
            borderColor: "#35d07f",
            backgroundColor: "rgba(53, 208, 127, 0.12)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#35d07f",
            pointRadius: 3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: "#26342d" },
                ticks: { color: "#89968e" }
            },
            x: {
                grid: { display: false },
                ticks: {
                    color: "#89968e",
                    autoSkip: true,
                    maxTicksLimit: 10
                }
            }
        }
    }
});

// Modal Elements
const expenseModal = document.getElementById("expenseModal");
const expenseForm = document.getElementById("expenseForm");
const openExpenseModal = document.getElementById("openExpenseModal");
const navAddExpense = document.getElementById("navAddExpense");
const closeExpenseModal = document.getElementById("closeExpenseModal");
const cancelExpense = document.getElementById("cancelExpense");

const modalTitle = document.querySelector(".modal-heading h2");
const submitButton = expenseForm.querySelector('button[type="submit"]');

// Page Elements
const dashboardPage = document.getElementById("dashboardPage");
const transactionsPage = document.getElementById("transactionsPage");
const analyticsPage = document.getElementById("analyticsPage");

const navDashboard = document.getElementById("navDashboard");
const navTransactions = document.getElementById("navTransactions");
const navAnalytics = document.getElementById("navAnalytics");

const viewAllTransactions = document.getElementById("viewAllTransactions");
const transactionsAddButton = document.getElementById("transactionsAddButton");

// Load Expenses
let expenses = [];
let editingExpenseId = null;

try {
    const savedExpenses = JSON.parse(localStorage.getItem("expenses"));
    expenses = Array.isArray(savedExpenses) ? savedExpenses : [];
} catch (error) {
    console.error("Could not load expenses:", error);
}

function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Currency Formatter
function formatCurrency(amount) {
    return Number(amount).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR"
    });
}

// Page Navigation
function showPage(page) {
    dashboardPage.hidden = page !== "dashboard";
    transactionsPage.hidden = page !== "transactions";
    analyticsPage.hidden = page !== "analytics";

    navDashboard.classList.toggle("active", page === "dashboard");
    navTransactions.classList.toggle("active", page === "transactions");
    navAnalytics.classList.toggle("active", page === "analytics");

    if (page === "transactions") renderAllTransactions();
    if (page === "analytics") renderAnalytics();
}

navDashboard.addEventListener("click", (event) => {
    event.preventDefault();
    showPage("dashboard");
});

navTransactions.addEventListener("click", (event) => {
    event.preventDefault();
    showPage("transactions");
});

navAnalytics.addEventListener("click", (event) => {
    event.preventDefault();
    showPage("analytics");
});

viewAllTransactions.addEventListener("click", (event) => {
    event.preventDefault();
    showPage("transactions");
});

// Open Modal
function showExpenseModal() {
    editingExpenseId = null;
    expenseForm.reset();

    modalTitle.textContent = "Add New Expense";
    submitButton.textContent = "Save Expense";

    const today = new Date();
    const localDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);

    document.getElementById("expenseDate").value = localDate;
    expenseModal.classList.add("show");
}

openExpenseModal.addEventListener("click", showExpenseModal);

navAddExpense.addEventListener("click", (event) => {
    event.preventDefault();
    showExpenseModal();
});

transactionsAddButton.addEventListener("click", showExpenseModal);

// Close Modal
function hideExpenseModal() {
    expenseModal.classList.remove("show");
    editingExpenseId = null;
}

closeExpenseModal.addEventListener("click", hideExpenseModal);
cancelExpense.addEventListener("click", hideExpenseModal);

expenseModal.addEventListener("click", (event) => {
    if (event.target === expenseModal) hideExpenseModal();
});

// Edit Expense
function editExpense(id) {
    const expense = expenses.find((item) => item.id === id);
    if (!expense) return;

    editingExpenseId = id;

    document.getElementById("expenseAmount").value = expense.amount;
    document.getElementById("expenseCategory").value = expense.category;
    document.getElementById("expenseDate").value = expense.date;
    document.getElementById("expenseNote").value = expense.note || "";

    modalTitle.textContent = "Edit Expense";
    submitButton.textContent = "Update Expense";
    expenseModal.classList.add("show");
}

// Delete Expense
function deleteExpense(id) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    expenses = expenses.filter((expense) => expense.id !== id);
    saveExpenses();
    renderDashboard();
}

// Create Action Buttons
function createActionButtons(expense) {
    const cell = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.type = "button";
    editButton.className = "edit-expense";
    editButton.addEventListener("click", () => editExpense(expense.id));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.type = "button";
    deleteButton.className = "delete-expense";
    deleteButton.addEventListener("click", () => deleteExpense(expense.id));

    cell.append(editButton, deleteButton);
    return cell;
}

// Create Transaction Row
function createTransactionRow(expense) {
    const row = document.createElement("tr");

    const category = document.createElement("td");
    category.textContent = expense.category;

    const date = document.createElement("td");
    date.textContent = new Date(
        expense.date + "T00:00:00"
    ).toLocaleDateString("en-IN");

    const note = document.createElement("td");
    note.textContent = expense.note || "—";

    const amount = document.createElement("td");
    amount.textContent = formatCurrency(expense.amount);

    row.append(
        category,
        date,
        note,
        amount,
        createActionButtons(expense)
    );

    return row;
}

// Render All Transactions
function renderAllTransactions() {
    const table = document.getElementById("allTransactionsTable");
    const search = document.getElementById("transactionSearch")
        .value.trim().toLowerCase();

    const category = document.getElementById(
        "transactionCategoryFilter"
    ).value;

    const filtered = expenses.filter((expense) => {
        const matchesSearch =
            expense.category.toLowerCase().includes(search) ||
            (expense.note || "").toLowerCase().includes(search);

        const matchesCategory =
            category === "all" || expense.category === category;

        return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => b.date.localeCompare(a.date));
    table.innerHTML = "";

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent = "No matching transactions found.";

        row.appendChild(cell);
        table.appendChild(row);
        return;
    }

    filtered.forEach((expense) => {
        table.appendChild(createTransactionRow(expense));
    });
}

// Search and Filter
document.getElementById("transactionSearch").addEventListener(
    "input", renderAllTransactions
);

document.getElementById("transactionCategoryFilter").addEventListener(
    "change", renderAllTransactions
);

// Category Breakdown Helper
function renderCategoryBreakdown(container, categoryTotals, total) {
    container.innerHTML = "";

    const categories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    if (categories.length === 0) {
        container.innerHTML =
            '<p class="empty-state">No expenses to display yet.</p>';
        return;
    }

    categories.forEach(([category, amount]) => {
        const percentage = total > 0 ? (amount / total) * 100 : 0;

        const item = document.createElement("div");
        item.className = "category-item";

        const info = document.createElement("div");
        info.className = "category-info";

        const name = document.createElement("span");
        name.textContent = category;

        const value = document.createElement("strong");
        value.textContent = formatCurrency(amount);

        info.append(name, value);

        const progress = document.createElement("div");
        progress.className = "category-progress";

        const bar = document.createElement("div");
        bar.style.width = percentage + "%";
        progress.appendChild(bar);

        const small = document.createElement("small");
        small.textContent = percentage.toFixed(1) + "% of total spending";

        item.append(info, progress, small);
        container.appendChild(item);
    });
}

// Analytics Rendering
function renderAnalytics() {
    const selectedMonth = document.getElementById(
        "analyticsMonthFilter"
    ).value;

    const monthlyExpenses = expenses.filter((expense) =>
        expense.date.startsWith(selectedMonth)
    );

    const total = monthlyExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount), 0
    );

    const amounts = monthlyExpenses.map(
        (expense) => Number(expense.amount)
    );

    const count = monthlyExpenses.length;
    const average = count ? total / count : 0;
    const largest = count ? Math.max(...amounts) : 0;
    const smallest = count ? Math.min(...amounts) : 0;

    const categoryTotals = {};

    monthlyExpenses.forEach((expense) => {
        categoryTotals[expense.category] =
            (categoryTotals[expense.category] || 0) +
            Number(expense.amount);
    });

    const highestCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0];

    document.getElementById("analyticsTotal").textContent =
        formatCurrency(total);

    document.getElementById("analyticsHighest").textContent =
        highestCategory ? highestCategory[0] : "—";

    document.getElementById("analyticsLargest").textContent =
        formatCurrency(largest);

    document.getElementById("analyticsCount").textContent = count;

    document.getElementById("analyticsAverage").textContent =
        formatCurrency(average);

    document.getElementById("analyticsSmallest").textContent =
        formatCurrency(smallest);

    renderCategoryBreakdown(
        document.getElementById("analyticsCategoryList"),
        categoryTotals,
        total
    );
}

// Dashboard Rendering
function renderDashboard() {
    const selectedMonth = document.getElementById("monthFilter").value;

    const monthlyExpenses = expenses.filter((expense) =>
        expense.date.startsWith(selectedMonth)
    );

    const total = monthlyExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount), 0
    );

    const count = monthlyExpenses.length;
    const average = count ? total / count : 0;

    document.getElementById("totalAmount").textContent =
        formatCurrency(total);

    document.getElementById("totalCount").textContent = count;

    document.getElementById("averageAmount").textContent =
        formatCurrency(average);

    // Dynamic Daily Spending Chart
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyTotals = Array(daysInMonth).fill(0);

    monthlyExpenses.forEach((expense) => {
        const day = Number(expense.date.slice(8, 10));
        dailyTotals[day - 1] += Number(expense.amount);
    });

    expenseChart.data.labels = dailyTotals.map(
        (_, index) => String(index + 1)
    );

    expenseChart.data.datasets[0].data = dailyTotals;
    expenseChart.update();

    // Dashboard Category Breakdown
    const categoryTotals = {};

    monthlyExpenses.forEach((expense) => {
        categoryTotals[expense.category] =
            (categoryTotals[expense.category] || 0) +
            Number(expense.amount);
    });

    renderCategoryBreakdown(
        document.getElementById("categoryList"),
        categoryTotals,
        total
    );

    // Recent Transactions
    const expenseTable = document.getElementById("expenseTable");
    expenseTable.innerHTML = "";

    const sorted = [...monthlyExpenses].sort(
        (a, b) => b.date.localeCompare(a.date)
    );

    if (sorted.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent = "No transactions yet.";

        row.appendChild(cell);
        expenseTable.appendChild(row);
    } else {
        sorted.forEach((expense) => {
            expenseTable.appendChild(createTransactionRow(expense));
        });
    }

    renderAllTransactions();
    renderAnalytics();
}

// Add or Update Expense
expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const wasEditing = editingExpenseId !== null;

    const expense = {
        amount: Number(document.getElementById("expenseAmount").value),
        category: document.getElementById("expenseCategory").value,
        date: document.getElementById("expenseDate").value,
        note: document.getElementById("expenseNote").value.trim()
    };

    if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (wasEditing) {
        expenses = expenses.map((item) =>
            item.id === editingExpenseId
                ? { ...item, ...expense }
                : item
        );
    } else {
        expenses.push({
            id: Date.now(),
            ...expense
        });
    }

    saveExpenses();
    renderDashboard();

    expenseForm.reset();
    hideExpenseModal();

    alert(wasEditing
        ? "Expense updated successfully!"
        : "Expense added successfully!"
    );
});

// Month Filters
document.getElementById("monthFilter").addEventListener(
    "change", renderDashboard
);

document.getElementById("analyticsMonthFilter").addEventListener(
    "change", renderAnalytics
);

// Initial Dashboard
renderDashboard();