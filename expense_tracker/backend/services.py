from config.db import get_db_connection
from utils.logger import log_error

def create_expense(user_id, title, amount, category):
    db = get_db_connection()
    if not db: return None
    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO expenses (user_id, title, amount, category) VALUES (%s, %s, %s, %s)",
            (user_id, title, amount, category)
        )
        db.commit()
        return cursor.lastrowid
    except Exception as e:
        log_error(f"Create expense error: {e}")
        return None
    finally:
        cursor.close()
        db.close()

def get_expenses(user_id):
    db = get_db_connection()
    if not db: return []
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM expenses WHERE user_id = %s ORDER BY date DESC", (user_id,))
        return cursor.fetchall()
    except Exception as e:
        log_error(f"Get expenses error: {e}")
        return []
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
        return cursor.rowcount > 0
    except Exception as e:
        log_error(f"Delete expense error: {e}")
        return False
    finally:
        cursor.close()
        db.close()
