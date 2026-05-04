let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let charts = {};
let isLoginMode = true;

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

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    const toggle = document.getElementById('auth-toggle');
    if (isLoginMode) {
        title.innerText = 'Login to Expensy';
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
        } else alert(data.error);
    } catch (err) { alert('Connection error'); }
});

function logout() {
    localStorage.removeItem('user');
    location.reload();
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
function openModal() {
    const modal = document.getElementById('expense-modal');
    modal.style.display = 'flex';
    
    const titleInput = document.getElementById('expense-title');
    const amountInput = document.getElementById('expense-amount');
    const saveBtn = document.getElementById('expense-save-btn');

    const validate = () => {
        const isValid = titleInput.value.trim() !== '' && amountInput.value.trim() !== '';
        saveBtn.disabled = !isValid;
    };

    titleInput.addEventListener('input', validate);
    amountInput.addEventListener('input', validate);
    validate();
}
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
    const incomeInput = document.getElementById('finance-income');
    const budgetInput = document.getElementById('finance-budget');
    const saveBtn = document.getElementById('finance-save-btn');

    const validate = () => {
        const isValid = incomeInput.value.trim() !== '' && budgetInput.value.trim() !== '';
        saveBtn.disabled = !isValid;
    };

    try {
        const budgetRes = await fetch(`/budget?user_id=${currentUser.id}&month_year=${monthYear}`);
        const budgetData = await budgetRes.json();
        const statusRes = await fetch(`/financial-status?user_id=${currentUser.id}&month_year=${monthYear}`);
        const statusData = await statusRes.json();
        
        incomeInput.value = statusData.income || '';
        budgetInput.value = budgetData.budget || '';
        
        // Setup validation listeners
        incomeInput.addEventListener('input', validate);
        budgetInput.addEventListener('input', validate);
        validate(); // Initial check
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

// Bonus Submission & Validation
const bonusAmount = document.getElementById('bonus-amount');
const bonusSubmit = document.getElementById('bonus-submit');

if (bonusAmount && bonusSubmit) {
    bonusAmount.addEventListener('input', () => {
        bonusSubmit.disabled = !bonusAmount.value;
        bonusSubmit.style.opacity = bonusAmount.value ? '1' : '0.5';
    });
}

document.getElementById('bonus-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('bonus-amount').value;
    const description = document.getElementById('bonus-description').value;
    try {
        const res = await fetch('/bonus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, amount, description })
        });
        if (res.ok) {
            alert("Bonus added successfully!");
            closeBonusModal();
            loadDashboard();
        }
    } catch (e) { console.error(e); }
});

document.getElementById('goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('goal-title').value;
    const target = document.getElementById('goal-target').value;
    await fetch('/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, title, target })
    });
    closeGoalModal();
    loadGoals();
});

document.getElementById('wishlist-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('wishlist-name').value;
    const price = document.getElementById('wishlist-price').value;
    const priority = document.getElementById('wishlist-priority').value;
    await fetch('/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, name, price, priority })
    });
    closeWishlistModal();
    loadWishlist();
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

        if (!data || data.total_income === 0) {
            insight.innerText = "Setup your finance profile to activate professional advisory.";
            if (advisorSection) advisorSection.classList.add('hidden');
            return;
        }

        if (advisorSection) advisorSection.classList.remove('hidden');

        // Update 50/30/20 Cards
        updateAdvisorCard('needs', data.spent * 0.7, data.advisor.needs_limit);
        updateAdvisorCard('wants', data.spent * 0.3, data.advisor.wants_limit);
        updateAdvisorCard('savings', data.saved, data.advisor.savings_target);

        // Update Insight Banner
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
        const res = await fetch(`/financial-summary?user_id=${currentUser.id}&month_year=${monthYear}`);
        const data = await res.json();
        
        // Fetch time info
        const timeRes = await fetch('/time-info');
        const timeData = await timeRes.json();

        const leftEl = document.getElementById('budget-left');
        const daysLeftEl = document.getElementById('days-left');
        const progressEl = document.getElementById('month-progress-text');

        if (data) {
            leftEl.innerText = `₹${data.remaining.toFixed(2)}`;
            leftEl.style.color = data.remaining < 0 ? 'var(--accent-red)' : 'var(--text-primary)';
        }

        if (timeData) {
            daysLeftEl.innerText = `${timeData.days_left} days left`;
            progressEl.innerText = `Month progress: ${timeData.month_progress}%`;
        }
    } catch (e) { console.error(e); }
}


async function loadGoals() {
    try {
        const res = await fetch(`/goals?user_id=${currentUser.id}`);
        const goals = await res.json();
        const container = document.getElementById('goals-container');
        if (!container) return;

        container.innerHTML = goals.map(g => {
            const perc = Math.min((g.current_amount / (g.target_amount || 1)) * 100, 100);
            return `
                <div class="goal-card">
                    <div class="goal-header">
                        <h3>${g.title}</h3>
                        <div class="goal-actions">
                            <button onclick="resetGoal(${g.id})"><i class="fas fa-undo"></i></button>
                            <button onclick="deleteGoal(${g.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <p class="goal-target">Target: ₹${parseFloat(g.target_amount).toFixed(0)}</p>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${perc}%"></div>
                    </div>
                    <div class="goal-footer">
                        <span>₹${parseFloat(g.current_amount).toFixed(0)} saved</span>
                        <span>${perc.toFixed(0)}%</span>
                    </div>
                    <button class="btn-outline" style="width:100%; margin-top:10px" onclick="addGoalProgress(${g.id})">
                        <i class="fas fa-plus"></i> Add Savings
                    </button>
                </div>
            `;
        }).join('');
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
    if (typeof Chart === 'undefined') return;
    
    const validExpenses = expenses.filter(e => e.category !== 'Income');
    const categories = {};
    validExpenses.forEach(exp => { categories[exp.category] = (categories[exp.category] || 0) + parseFloat(exp.amount); });
    
    const dashboardColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

    // 1. Category Breakdown (Same as Dashboard)
    if (charts.analyticsCategory) charts.analyticsCategory.destroy();
    const catCanvas = document.getElementById('analyticsCategoryChart');
    if (catCanvas) {
        charts.analyticsCategory = new Chart(catCanvas.getContext('2d'), {
            type: 'doughnut',
            data: { 
                labels: Object.keys(categories), 
                datasets: [{ 
                    data: Object.values(categories), 
                    backgroundColor: dashboardColors, 
                    borderWidth: 0 
                }] 
            },
            options: { 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 } } } 
                } 
            }
        });
    }

    // 2. Income vs Spending
    if (charts.incomeVsSpend) charts.incomeVsSpend.destroy();
    const ivsCanvas = document.getElementById('incomeVsSpendingChart');
    if (ivsCanvas) {
        charts.incomeVsSpend = new Chart(ivsCanvas.getContext('2d'), {
            type: 'bar',
            data: { 
                labels: ['Income', 'Spending'], 
                datasets: [{ 
                    label: '₹ Amount',
                    data: [status.total_income, status.spent], 
                    backgroundColor: ['#10b981', '#ef4444'], 
                    borderRadius: 10 
                }] 
            },
            options: { 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { ticks: { color: '#94a3b8' } }
                } 
            }
        });
    }

    // 3. Monthly Spending Trend
    if (charts.trend) charts.trend.destroy();
    const trendCanvas = document.getElementById('monthlyTrendChart');
    if (trendCanvas) {
        charts.trend = new Chart(trendCanvas.getContext('2d'), {
            type: 'line',
            data: { 
                labels: ['W1', 'W2', 'W3', 'W4'], 
                datasets: [{ 
                    label: 'Spending', 
                    data: [status.spent * 0.2, status.spent * 0.3, status.spent * 0.4, status.spent * 0.1], 
                    borderColor: '#3b82f6', 
                    tension: 0.4,
                    fill: false
                }] 
            },
            options: { 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { ticks: { color: '#94a3b8' } }
                } 
            }
        });
    }
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
