from config.db import get_db_connection
from utils.logger import log_error
import datetime
import calendar

def get_time_info():
    today = datetime.date.today()
    total_days = calendar.monthrange(today.year, today.month)[1]
    current_day = today.day
    days_left = total_days - current_day
    month_progress = round((current_day / total_days) * 100)
    
    return {
        "days_left": days_left,
        "total_days": total_days,
        "current_day": current_day,
        "month_progress": month_progress
    }

def add_user(username, password):
    db = get_db_connection()
    if not db: return False
    cursor = db.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
        db.commit()
        return True
    except Exception as e:
        log_error(f"Signup error: {e}")
        return False
    finally:
        cursor.close()
        db.close()

def get_user_by_username(username):
    db = get_db_connection()
    if not db: return None
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()

def add_expense(user_id, title, amount, category):
    db = get_db_connection()
    if not db: return False
    cursor = db.cursor()
    try:
        cursor.execute("INSERT INTO expenses (user_id, title, amount, category) VALUES (%s, %s, %s, %s)", (user_id, title, amount, category))
        db.commit()
        return True
    except Exception as e:
        log_error(f"Add expense error: {e}")
        return False
    finally:
        cursor.close()
        db.close()

def get_expenses(user_id):
    db = get_db_connection()
    if not db: return []
    cursor = db.cursor(dictionary=True)
    today = datetime.date.today()
    month_year = today.strftime("%Y-%m")
    try:
        cursor.execute("SELECT * FROM expenses WHERE user_id = %s AND date LIKE %s ORDER BY date DESC", (user_id, f"{month_year}%"))
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()

def delete_expense(expense_id):
    db = get_db_connection()
    if not db: return False
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
        db.commit()
        return True
    finally:
        cursor.close()
        db.close()

# Enhanced Features Services
def add_goal(user_id, title, target):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO savings_goals (user_id, title, target_amount) VALUES (%s, %s, %s)", (user_id, title, target))
    db.commit()
    cursor.close()
    db.close()

def get_goals(user_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM savings_goals WHERE user_id = %s", (user_id,))
    res = cursor.fetchall()
    cursor.close()
    db.close()
    return res

def update_goal_progress(goal_id, amount):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("UPDATE savings_goals SET current_amount = current_amount + %s WHERE id = %s", (amount, goal_id))
    db.commit()
    cursor.close()
    db.close()

def add_wishlist_item(user_id, name, price, priority):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO wishlist (user_id, name, price, priority) VALUES (%s, %s, %s, %s)", (user_id, name, price, priority))
    db.commit()
    cursor.close()
    db.close()

def get_wishlist(user_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM wishlist WHERE user_id = %s", (user_id,))
    res = cursor.fetchall()
    cursor.close()
    db.close()
    return res

def delete_wishlist_item(item_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("DELETE FROM wishlist WHERE id = %s", (item_id,))
    db.commit()
    cursor.close()
    db.close()

def delete_goal(goal_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("DELETE FROM savings_goals WHERE id = %s", (goal_id,))
    db.commit()
    cursor.close()
    db.close()

def reset_goal(goal_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("UPDATE savings_goals SET current_amount = 0 WHERE id = %s", (goal_id,))
    db.commit()
    cursor.close()
    db.close()

def set_budget(user_id, month_year, amount):

    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO budgets (user_id, month_year, amount) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE amount = %s", (user_id, month_year, amount, amount))
    db.commit()
    cursor.close()
    db.close()

def get_budget(user_id, month_year):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT amount FROM budgets WHERE user_id = %s AND month_year = %s", (user_id, month_year))
    res = cursor.fetchone()
    cursor.close()
    db.close()
    return res

def get_monthly_spending(user_id, month_year):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT SUM(amount) FROM expenses WHERE user_id = %s AND date LIKE %s", (user_id, f"{month_year}%"))
    res = cursor.fetchone()[0]
    cursor.close()
    db.close()
    return float(res) if res else 0.0

def set_income(user_id, income):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("UPDATE users SET monthly_income = %s WHERE id = %s", (income, user_id))
    db.commit()
    cursor.close()
    db.close()

def add_bonus_income(user_id, amount, description):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO bonus_income (user_id, amount, description) VALUES (%s, %s, %s)", 
                   (user_id, amount, description))
    db.commit()
    cursor.close()
    db.close()

def get_financial_summary(user_id, month_year):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    # Get base monthly income
    cursor.execute("SELECT monthly_income FROM users WHERE id = %s", (user_id,))
    income = float(cursor.fetchone()['monthly_income'] or 0)
    
    # Get total bonuses for this month
    cursor.execute("SELECT SUM(amount) FROM bonus_income WHERE user_id = %s AND created_at LIKE %s", (user_id, f"{month_year}%"))
    bonus = float(cursor.fetchone()['SUM(amount)'] or 0)
    
    # Get total expenses for this month
    cursor.execute("SELECT SUM(amount) FROM expenses WHERE user_id = %s AND date LIKE %s", (user_id, f"{month_year}%"))
    spent = float(cursor.fetchone()['SUM(amount)'] or 0)
    
    # Get savings from goals
    cursor.execute("SELECT SUM(current_amount) FROM savings_goals WHERE user_id = %s", (user_id,))
    saved = float(cursor.fetchone()['SUM(current_amount)'] or 0)
    
    total_income = income + bonus
    
    return {
        "income": income,
        "bonus": bonus,
        "total_income": total_income,
        "spent": spent,
        "saved": saved,
        "remaining": total_income - spent,
        "advisor": {
            "needs_limit": total_income * 0.5,
            "wants_limit": total_income * 0.3,
            "savings_target": total_income * 0.2,
            "is_deficit": spent > total_income,
            "deficit_amount": max(0, spent - total_income)
        }
    }





