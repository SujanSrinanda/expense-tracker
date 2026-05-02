let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let isLoginMode = true;
let charts = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showApp();
    } else {
        showAuth();
    }
});

function showAuth() {
    document.getElementById('auth-overlay').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showApp() {
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('display-username').innerText = currentUser.username;
    document.getElementById('user-initials').innerText = currentUser.username.substring(0, 2).toUpperCase();
    loadDashboard();
}

// Auth Logic
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    const toggle = document.getElementById('auth-toggle');

    if (isLoginMode) {
        title.innerText = 'Login to ExpenseTracker';
        btn.innerText = 'Login';
        toggle.innerHTML = 'Don\'t have an account? <span onclick="toggleAuthMode()">Sign Up</span>';
    } else {
        title.innerText = 'Create Account';
        btn.innerText = 'Sign Up';
        toggle.innerHTML = 'Already have an account? <span onclick="toggleAuthMode()">Login</span>';
    }
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const endpoint = isLoginMode ? '/login' : '/signup';

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            if (isLoginMode) {
                currentUser = { id: data.user_id, username: data.username };
                localStorage.setItem('user', JSON.stringify(currentUser));
                showApp();
            } else {
                alert('Account created! Please login.');
                toggleAuthMode();
            }
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Connection error');
    }
});

function logout() {
    localStorage.removeItem('user');
    currentUser = null;
    location.reload();
}

// Section Navigation
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar nav li').forEach(li => li.classList.remove('active'));
    
    document.getElementById(`${section}-section`).classList.remove('hidden');
    document.querySelector(`li[onclick="showSection('${section}')"]`).classList.add('active');
    document.getElementById('section-title').innerText = section.charAt(0).toUpperCase() + section.slice(1);

    if (section === 'dashboard' || section === 'analytics') {
        loadDashboard();
    }
}

// Modal Logic
function openModal() { document.getElementById('expense-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('expense-modal').style.display = 'none'; }

document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('expense-title').value;
    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;

    try {
        const res = await fetch('/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, title, amount, category })
        });

        if (res.ok) {
            closeModal();
            document.getElementById('expense-form').reset();
            loadDashboard();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    } catch (err) {
        alert('Error adding expense');
    }
});

// Data Loading
async function loadDashboard() {
    try {
        const res = await fetch(`/expenses?user_id=${currentUser.id}`);
        const expenses = await res.json();

        updateStats(expenses);
        renderTable(expenses);
        renderCharts(expenses);
    } catch (err) {
        console.error('Failed to load data', err);
    }
}

function updateStats(expenses) {
    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    document.getElementById('total-spending').innerText = `$${total.toFixed(2)}`;
    document.getElementById('total-transactions').innerText = expenses.length;

    const categories = {};
    expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + parseFloat(exp.amount);
    });

    let topCat = 'None';
    let maxVal = 0;
    for (let cat in categories) {
        if (categories[cat] > maxVal) {
            maxVal = categories[cat];
            topCat = cat;
        }
    }
    document.getElementById('top-category').innerText = topCat;
}

function renderTable(expenses) {
    const tbody = document.querySelector('#recent-table tbody');
    const expensesBody = document.getElementById('expenses-body');
    
    const rows = expenses.map(exp => `
        <tr>
            <td>${exp.title}</td>
            <td><span class="badge ${exp.category.toLowerCase()}">${exp.category}</span></td>
            <td>$${parseFloat(exp.amount).toFixed(2)}</td>
            <td>${new Date(exp.date).toLocaleDateString()}</td>
            <td><button class="delete-btn" onclick="deleteExp(${exp.id})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');

    tbody.innerHTML = rows;
    expensesBody.innerHTML = rows;
}

async function deleteExp(id) {
    if (confirm('Are you sure?')) {
        await fetch(`/expenses/${id}`, { method: 'DELETE' });
        loadDashboard();
    }
}

// Chart Logic
function renderCharts(expenses) {
    const categories = {};
    expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + parseFloat(exp.amount);
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);

    // Destroy existing charts to prevent memory leaks/re-rendering issues
    if (charts.category) charts.category.destroy();
    if (charts.analytics) charts.analytics.destroy();

    const chartConfig = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
        }
    };

    const ctx1 = document.getElementById('categoryChart').getContext('2d');
    charts.category = new Chart(ctx1, chartConfig);

    const ctx2 = document.getElementById('analyticsCategoryChart').getContext('2d');
    charts.analytics = new Chart(ctx2, chartConfig);

    // Monthly Trend (Simplified for demo - uses last 7 entries)
    if (charts.trend) charts.trend.destroy();
    const trendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    const trendData = expenses.slice(0, 10).reverse();
    
    charts.trend = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: trendData.map(e => new Date(e.date).toLocaleDateString()),
            datasets: [{
                label: 'Spending',
                data: trendData.map(e => e.amount),
                borderColor: '#3b82f6',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
        },
        options: {
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}
