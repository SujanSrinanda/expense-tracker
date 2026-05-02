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
                password_hash VARCHAR(255) NOT NULL
            )
        """)
        
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
        
        connection.commit()
        cursor.close()
        connection.close()
        log_success("Database Initialized")
    except Error as e:
        log_error(f"Failed to initialize database: {e}")
