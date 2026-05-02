from flask import Flask, render_template
from backend.auth import auth_bp
from backend.routes import expense_bp
from config.db import init_db
from utils.logger import log_success, log_info

app = Flask(__name__)

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(expense_bp)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    # Initialize DB (create database and tables)
    init_db()
    
    log_info("Server running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
