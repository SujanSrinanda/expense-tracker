import mysql.connector
from mysql.connector import Error
from utils.logger import log_success, log_error

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='123456',  # Default empty password, user may need to change this
            database='expense_tracker_db'
        )
        if connection.is_connected():
            log_success("DB Connected")
            return connection
    except Error as e:
        log_error(f"DB Connection Failed: {e}")
        return None

def init_db():
    """Initializes the database and tables."""
    try:
        # Connect without database first to create it
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='123456'
        )
        cursor = connection.cursor()
        cursor.execute("CREATE DATABASE IF NOT EXISTS expense_tracker_db")
        cursor.execute("USE expense_tracker_db")
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                monthly_income DECIMAL(10, 2) DEFAULT 0
            )
        """)
        # Ensure monthly_income exists (Migration)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN monthly_income DECIMAL(10, 2) DEFAULT 0")
        except:
            pass # Column already exists

        
        # Create expenses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(100) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                category VARCHAR(50) NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Create savings_goals table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS savings_goals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(100) NOT NULL,
                target_amount DECIMAL(10, 2) NOT NULL,
                current_amount DECIMAL(10, 2) DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Create wishlist table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wishlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Create budgets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                month_year VARCHAR(10) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                UNIQUE(user_id, month_year),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Create bonus_income table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bonus_income (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        
        connection.commit()
        cursor.close()
        connection.close()
        log_success("Database Initialized")
    except Error as e:
        log_error(f"Failed to initialize database: {e}")
