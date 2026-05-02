import hashlib
from flask import Blueprint, request, jsonify
from config.db import get_db_connection
from utils.logger import log_info, log_success, log_error

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        log_error("Signup failed: Missing credentials")
        return jsonify({"error": "Username and password required"}), 400

    db = get_db_connection()
    if not db:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = db.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            log_error(f"Signup failed: User {username} already exists")
            return jsonify({"error": "Username already exists"}), 409

        hashed = hash_password(password)
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s)", (username, hashed))
        db.commit()
        log_success(f"User {username} signed up successfully")
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        log_error(f"Signup error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        db.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    log_info(f"POST /login - Attempt for user: {username}")

    if not username or not password:
        log_error("Login failed: Missing credentials")
        return jsonify({"error": "Username and password required"}), 400

    db = get_db_connection()
    if not db:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = db.cursor(dictionary=True)
    try:
        hashed = hash_password(password)
        cursor.execute("SELECT * FROM users WHERE username = %s AND password_hash = %s", (username, hashed))
        user = cursor.fetchone()

        if user:
            log_success(f"Login successful for user: {username}")
            return jsonify({"message": "Login successful", "user_id": user['id'], "username": user['username']}), 200
        else:
            log_error(f"Invalid login attempt for user: {username}")
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        log_error(f"Login error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        db.close()
