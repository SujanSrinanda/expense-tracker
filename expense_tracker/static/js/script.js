let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let charts = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) showApp();
    else showAuth();
});

function showApp() {
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('display-username').innerText = currentUser.username;
    document.getElementById('user-initials').innerText = currentUser.username.substring(0, 2).toUpperCase();
    loadDashboard();
}

function showAuth() {
    document.getElementById('auth-overlay').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

// Section Navigation
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar nav li').forEach(li => li.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.remove('hidden');
    document.querySelector(`li[onclick="showSection('${section}')"]`).classList.add('active');
    
    if (section === 'dashboard' || section === 'expenses') loadDashboard();
    else if (section === 'savings') loadGoals();
    else if (section === 'wishlist') loadWishlist();
    else if (section === 'analytics') loadAnalytics();
}

// Modals
function openModal() { document.getElementById('expense-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('expense-modal').style.display = 'none'; }
function openFinanceModal() { document.getElementById('finance-modal').style.display = 'flex'; fetchFinanceData(); }
function closeFinanceModal() { document.getElementById('finance-modal').style.display = 'none'; }
function openBonusModal() { document.getElementById('bonus-modal').style.display = 'flex'; }
function closeBonusModal() { document.getElementById('bonus-modal').style.display = 'none'; }
function openGoalModal() { document.getElementById('goal-modal').style.display = 'flex'; }
function closeGoalModal() { document.getElementById('goal-modal').style.display = 'none'; }
function openWishlistModal() { document.getElementById('wishlist-modal').style.display = 'flex'; }
function closeWishlistModal() { document.getElementById('wishlist-modal').style.display = 'none'; }

async function fetchFinanceData() {
    const monthYear = new Date().toISOString().slice(0, 7);
    try {
        const budgetRes = await fetch(`/budget?user_id=${currentUser.id}&month_year=${monthYear}`);
        const budgetData = await budgetRes.json();
        const statusRes = await fetch(`/financial-status?user_id=${currentUser.id}&month_year=${monthYear}`);
        const statusData = await statusRes.json();
        document.getElementById('finance-income').value = statusData.income || '';
        document.getElementById('finance-budget').value = budgetData.budget || '';
    } catch (e) { console.error(e); }
}

// Form Submissions
document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('expense-title').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    
    // Advisor Warning
    const statusRes = await fetch(`/financial-status?user_id=${currentUser.id}&month_year=${new Date().toISOString().slice(0, 7)}`);
    const status = await statusRes.json();
    if (status.total_income > 0 && amount > status.balance) {
        if (!confirm(`Advisor Warning: You cannot comfortably afford this ₹${amount} expense right now. It exceeds your monthly balance. Still proceed?`)) return;
    }

    await fetch('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, title, amount, category })
    });
    closeModal();
    loadDashboard();
});

document.getElementById('finance-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const income = document.getElementById('finance-income').value;
    const budget = document.getElementById('finance-budget').value;
    const monthYear = new Date().toISOString().slice(0, 7);
    await fetch('/set-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, income })
    });
    await fetch('/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, month_year: monthYear, amount: budget })
    });
    closeFinanceModal();
    loadDashboard();
});

document.getElementById('bonus-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('bonus-amount').value;
    const description = document.getElementById('bonus-description').value;
    await fetch('/bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, amount, description })
    });
    closeBonusModal();
    loadDashboard();
});

// Loaders
async function loadDashboard() {
    try {
        const res = await fetch(`/expenses?user_id=${currentUser.id}`);
        const expenses = await res.json();
        updateStats(Array.isArray(expenses) ? expenses : []);
        renderTable(Array.isArray(expenses) ? expenses : []);
        renderCharts(Array.isArray(expenses) ? expenses : []);
        loadBudget();
        loadFinancialStatus();
    } catch (err) { console.error(err); }
}

function updateStats(expenses) {
    const validExpenses = expenses.filter(e => e.category !== 'Income');
    const total = validExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    document.getElementById('total-spending').innerText = `₹${total.toFixed(2)}`;
    document.getElementById('total-transactions').innerText = validExpenses.length;
    const categories = {};
    validExpenses.forEach(exp => { categories[exp.category] = (categories[exp.category] || 0) + parseFloat(exp.amount); });
    let topCat = 'None', maxVal = 0;
    for (let cat in categories) { if (categories[cat] > maxVal) { maxVal = categories[cat]; topCat = cat; } }
    document.getElementById('top-category').innerText = topCat;
}

function renderTable(expenses) {
    const recentTbody = document.querySelector('#recent-table tbody');
    const fullTbody = document.getElementById('expenses-body');
    const rows = expenses.map(exp => `
        <tr class="${exp.category === 'Income' ? 'income-row' : ''}">
            <td>${exp.title}</td>
            <td><span class="badge ${exp.category.toLowerCase()}">${exp.category}</span></td>
            <td>${exp.category === 'Income' ? '+' : ''}₹${Math.abs(parseFloat(exp.amount)).toFixed(2)}</td>
            <td>${new Date(exp.date).toLocaleDateString()}</td>
            <td><button class="delete-btn" onclick="deleteExp(${exp.id})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    if (recentTbody) recentTbody.innerHTML = expenses.slice(0, 10).map(exp => `
        <tr class="${exp.category === 'Income' ? 'income-row' : ''}">
            <td>${exp.title}</td>
            <td><span class="badge ${exp.category.toLowerCase()}">${exp.category}</span></td>
            <td>${exp.category === 'Income' ? '+' : ''}₹${Math.abs(parseFloat(exp.amount)).toFixed(2)}</td>
            <td>${new Date(exp.date).toLocaleDateString()}</td>
            <td><button class="delete-btn" onclick="deleteExp(${exp.id})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    if (fullTbody) fullTbody.innerHTML = rows;
}

async function loadFinancialStatus() {
    const monthYear = new Date().toISOString().slice(0, 7);
    try {
        const res = await fetch(`/financial-status?user_id=${currentUser.id}&month_year=${monthYear}`);
        const data = await res.json();
        const banner = document.getElementById('advisor-banner');
        const insight = document.getElementById('smart-insight');
        const advisorSection = document.getElementById('advisor-section');

        if (data.total_income === 0) {
            insight.innerText = "Setup your finance profile to activate professional advisory.";
            advisorSection.classList.add('hidden');
            return;
        }
        advisorSection.classList.remove('hidden');
        updateAdvisorCard('needs', data.spent * 0.7, data.advisor.needs_limit);
        updateAdvisorCard('wants', data.spent * 0.3, data.advisor.wants_limit);
        updateAdvisorCard('savings', data.saved, data.advisor.savings_target);

        if (data.advisor.is_deficit) {
            banner.classList.add('warning');
            insight.innerText = `Professional Warning: You are running a deficit of ₹${data.advisor.deficit_amount.toFixed(0)}. Reduce non-essential spending immediately.`;
        } else if (data.spent > data.total_income * 0.9) {
            banner.classList.add('warning');
            insight.innerText = "Advisory: You have exhausted 90% of your income. Delaying new purchases is recommended.";
        } else {
            banner.classList.remove('warning');
            insight.innerText = "Financial health is stable. You are living within your prescribed capacity.";
        }
    } catch (e) { console.error(e); }
}

function updateAdvisorCard(type, spent, limit) {
    const perc = Math.min((spent / (limit || 1)) * 100, 100);
    const el = document.getElementById(`${type}-status`);
    const bar = document.getElementById(`${type}-bar`);
    if (el) el.innerText = `₹${spent.toFixed(0)} / ₹${limit.toFixed(0)}`;
    if (bar) bar.style.width = `${perc}%`;
    if (bar) bar.style.backgroundColor = perc > 90 ? 'var(--accent-red)' : (type === 'savings' ? 'var(--accent-purple)' : 'var(--accent-blue)');
}

async function loadBudget() {
    const monthYear = new Date().toISOString().slice(0, 7);
    try {
        const res = await fetch(`/budget?user_id=${currentUser.id}&month_year=${monthYear}`);
        const data = await res.json();
        const leftEl = document.getElementById('budget-left');
        if (data && data.budget > 0) {
            leftEl.innerText = `₹${data.remaining.toFixed(2)}`;
            leftEl.style.color = data.remaining < 0 ? 'var(--accent-red)' : 'var(--text-primary)';
        } else leftEl.innerText = 'Set Budget';
    } catch (e) { console.error(e); }
}

async function loadWishlist() {
    const res = await fetch(`/wishlist?user_id=${currentUser.id}`);
    const items = await res.json();
    const statusRes = await fetch(`/financial-status?user_id=${currentUser.id}&month_year=${new Date().toISOString().slice(0, 7)}`);
    const status = await statusRes.json();
    const container = document.getElementById('wishlist-container');
    container.innerHTML = items.map(item => {
        const remaining = Math.max(0, item.price - status.saved);
        const monthlySaving = status.advisor.savings_target || 1;
        const months = (remaining / monthlySaving).toFixed(1);
        const affordable = status.saved >= item.price;

        return `<div class="wish-card">
            <h3>${item.name}</h3><p>₹${parseFloat(item.price).toFixed(0)}</p>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">
                ${affordable ? '<span style="color:var(--accent-green)">Available in Savings</span>' : `Needs ₹${remaining.toFixed(0)} more. (~${months} months at recommended rate)`}
            </p>
            <div style="display:flex; gap: 10px;">
                <button class="btn-primary" style="flex:1" ${!affordable ? 'disabled style="opacity:0.5"' : ''} onclick="buyWishItem(${item.id},'${item.name}',${item.price})">Buy Now</button>
                <button class="btn-secondary" onclick="deleteWish(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

async function loadAnalytics() {
    const res = await fetch(`/expenses?user_id=${currentUser.id}`);
    const expenses = await res.json();
    const statusRes = await fetch(`/financial-status?user_id=${currentUser.id}&month_year=${new Date().toISOString().slice(0, 7)}`);
    const status = await statusRes.json();
    renderAnalyticsCharts(expenses, status);
}

function renderAnalyticsCharts(expenses, status) {
    const validExpenses = expenses.filter(e => e.category !== 'Income');
    const categories = {};
    validExpenses.forEach(exp => { categories[exp.category] = (categories[exp.category] || 0) + parseFloat(exp.amount); });
    
    // Category Chart
    if (charts.analyticsCategory) charts.analyticsCategory.destroy();
    const catCtx = document.getElementById('analyticsCategoryChart').getContext('2d');
    charts.analyticsCategory = new Chart(catCtx, {
        type: 'doughnut',
        data: { labels: Object.keys(categories), datasets: [{ data: Object.values(categories), backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'], borderWidth: 0 }] },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }
    });

    // Income vs Spending
    if (charts.incomeVsSpend) charts.incomeVsSpend.destroy();
    const ivsCtx = document.getElementById('incomeVsSpendingChart').getContext('2d');
    charts.incomeVsSpend = new Chart(ivsCtx, {
        type: 'bar',
        data: { labels: ['Income', 'Spending'], datasets: [{ data: [status.total_income, status.spent], backgroundColor: ['#10b981', '#ef4444'], borderRadius: 10 }] },
        options: { scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } } }
    });

    // Trend
    if (charts.trend) charts.trend.destroy();
    const trendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    charts.trend = new Chart(trendCtx, {
        type: 'line',
        data: { labels: ['W1', 'W2', 'W3', 'W4'], datasets: [{ label: 'Spending', data: [status.spent * 0.2, status.spent * 0.3, status.spent * 0.4, status.spent * 0.1], borderColor: '#3b82f6', tension: 0.4 }] },
        options: { scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }
    });
}

function renderCharts(expenses) {
    const validExpenses = expenses.filter(e => e.category !== 'Income');
    const categories = {};
    validExpenses.forEach(exp => { categories[exp.category] = (categories[exp.category] || 0) + parseFloat(exp.amount); });
    if (charts.category) charts.category.destroy();
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    charts.category = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: { labels: Object.keys(categories), datasets: [{ data: Object.values(categories), backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'], borderWidth: 0 }] },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }
    });
}

async function addGoalProgress(id) {
    const amount = prompt('Amount saved:');
    if (amount) {
        await fetch('/goals/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal_id: id, amount }) });
        loadGoals(); loadDashboard();
    }
}
async function deleteGoal(id) { if (confirm('Delete?')) { await fetch(`/goals/${id}`, { method: 'DELETE' }); loadGoals(); } }
async function resetGoal(id) { if (confirm('Reset?')) { await fetch('/goals/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal_id: id }) }); loadGoals(); loadDashboard(); } }
async function buyWishItem(id, name, price) {
    await fetch('/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUser.id, title: name, amount: price, category: 'Shopping' }) });
    await deleteWish(id); loadDashboard();
}
async function deleteWish(id) { await fetch(`/wishlist/${id}`, { method: 'DELETE' }); loadWishlist(); }
async function deleteExp(id) { await fetch(`/expenses/${id}`, { method: 'DELETE' }); loadDashboard(); }

function logout() { localStorage.removeItem('user'); location.reload(); }
function openAuth() { document.getElementById('auth-overlay').classList.remove('hidden'); }
function closeAuth() { document.getElementById('auth-overlay').classList.add('hidden'); }
function showAuth() { openAuth(); }
