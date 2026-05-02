from flask import Blueprint, request, jsonify
from backend.services import create_expense, get_expenses, delete_expense
from utils.logger import log_info, log_success, log_error

expense_bp = Blueprint('expenses', __name__)

@expense_bp.route('/expenses', methods=['POST'])
def add_expense():
    data = request.json
    user_id = data.get('user_id')
    title = data.get('title')
    amount = data.get('amount')
    category = data.get('category')

    if not all([user_id, title, amount, category]):
        log_error("Add expense failed: Missing fields")
        return jsonify({"error": "Missing required fields"}), 400

    expense_id = create_expense(user_id, title, amount, category)
    if expense_id:
        log_success(f"Expense added: {title} (₹{amount})")
        return jsonify({"message": "Expense added", "id": expense_id}), 201
    return jsonify({"error": "Failed to add expense"}), 500

@expense_bp.route('/expenses', methods=['GET'])
def list_expenses():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
    
    expenses = get_expenses(user_id)
    return jsonify(expenses), 200

@expense_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
def remove_expense(expense_id):
    if delete_expense(expense_id):
        log_success(f"Expense deleted: ID {expense_id}")
        return jsonify({"message": "Expense deleted"}), 200
    return jsonify({"error": "Failed to delete expense"}), 500
