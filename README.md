# Expense Tracker 💰

**Expense Tracker** is a Flask-based personal finance management application that helps users track expenses, manage monthly budgets, monitor savings goals, manage income, and understand their spending habits.

The platform allows users to manage:

- Expenses and spending records
- Monthly budgets
- Savings goals
- Income and bonus income
- Wishlist items
- Monthly financial insights

---

## ✨ Features

### Expense Management

- Add and manage personal expenses
- Track spending records
- Monitor monthly expenses
- View expense-related financial information

### Budget Management

- Create and manage monthly budgets
- Track spending against budget limits
- Monitor monthly financial progress
- Use 50/30/20 budgeting calculations

### Savings & Income

- Create and track savings goals
- Monitor savings progress
- Manage income information
- Track bonus income

### Financial Insights

- View monthly financial summaries
- Analyze expenses, income, and savings
- Organize finances using the **50/30/20 budgeting rule**
  - 50% for needs
  - 30% for wants
  - 20% for savings

### Wishlist Management

- Add and manage wishlist items
- Track planned purchases
- Manage financial goals alongside expenses and savings

### User Management

- User signup
- User login
- Password hashing
- User-linked financial records

---

## 🛠️ Technology Stack

| Category | Technology |
| --- | --- |
| Backend | Python, Flask |
| Frontend | HTML, CSS, JavaScript |
| Database | MySQL |
| Architecture | Flask Blueprints, Service Layer |
| Authentication | Password Hashing |
| API | REST-style Flask Endpoints |

---

## 📁 Project Structure

```text
expense-tracker-main/
├── app.py
├── requirements.txt
├── README.md
│
├── routes/
│   └── API route modules
│
├── services/
│   └── Business logic and database operations
│
├── templates/
│   └── HTML templates
│
├── static/
│   ├── CSS files
│   └── JavaScript files
│
└── database/
    └── Database configuration and operations
```

### Important Files and Folders

- `app.py` — Initializes and runs the Flask application.
- `routes/` — Contains application and API routes.
- `services/` — Contains business logic and database operations.
- `templates/` — Contains the HTML pages.
- `static/` — Contains CSS and JavaScript files.
- `requirements.txt` — Contains the required Python dependencies.

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd expense-tracker-main
```

### 2. Create a Virtual Environment

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

#### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure MySQL

- Install and start MySQL Server.
- Create the required database.
- Configure the database connection details used by the project.

The application requires:

- Database host
- Database username
- Database password
- Database name

> **Important:** Do not commit real database passwords or other sensitive credentials to GitHub.

### 5. Run the Application

```bash
python app.py
```

Open the application at the local address shown in the terminal, typically:

```text
http://127.0.0.1:5000/
```

---

## 🔄 How It Works

### Expense Tracking

1. Register or log in.
2. Add expense records.
3. Manage monthly spending.
4. Track expenses and financial activity.
5. View monthly financial information.

### Budget & Savings Management

1. Create a monthly budget.
2. Monitor spending against the budget.
3. Add and track savings goals.
4. Manage income and bonus income.
5. Review savings progress and financial summaries.

### Financial Analysis

1. The application processes income and expense data.
2. Monthly financial summaries are generated.
3. Spending can be analyzed using the **50/30/20 budgeting rule**.
4. Users can monitor needs, wants, and savings.

---

## 🗃️ Main Application Modules

- **Users** — Handles user signup, login, and account-related data.
- **Expenses** — Manages expense records.
- **Budgets** — Handles monthly budget tracking.
- **Savings** — Tracks savings goals and progress.
- **Income** — Manages income and bonus income.
- **Wishlist** — Manages planned purchases.
- **Insights** — Provides monthly summaries and financial calculations.

---

## 🔒 Security Notes

- Passwords should be stored using secure password hashing.
- Never commit database credentials or secret values to GitHub.
- Store sensitive configuration using environment variables.
- Add proper session or token-based authorization before production deployment.
- Use HTTPS when deploying the application publicly.

---

## 🔮 Future Improvements

- Secure session-based authentication
- Interactive financial charts and dashboards
- Expense filtering and search
- Recurring expense support
- Financial reminders and notifications
- Export reports to CSV or PDF
- PostgreSQL support
- Docker support
- Automated testing and CI/CD
- Cloud deployment

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Test the application.
5. Commit and push your changes.
6. Open a Pull Request.

---

## 📄 License

No license is currently included.

Add a license such as the **MIT License** if you want others to freely use, modify, and distribute the project.
