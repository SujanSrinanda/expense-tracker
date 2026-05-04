from flask import Blueprint, request, jsonify
from backend.services import *
from utils.logger import log_success, log_error

expense_bp = Blueprint('expense', __name__)

@expense_bp.route('/time-info', methods=['GET'])
def get_time_data():
    return jsonify(get_time_info()), 200

@expense_bp.route('/expenses', methods=['GET', 'POST'])
def handle_expenses():
    if request.method == 'POST':
        data = request.json
        if add_expense(data['user_id'], data['title'], data['amount'], data['category']):
            log_success(f"Expense added: {data['title']}")
            return jsonify({"message": "Expense added"}), 201
        return jsonify({"error": "Failed to add expense"}), 500
    
    user_id = request.args.get('user_id')
    expenses = get_expenses(user_id)
    return jsonify(expenses), 200

@expense_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
def remove_expense(expense_id):
    if delete_expense(expense_id):
        log_success(f"Expense deleted: ID {expense_id}")
        return jsonify({"message": "Expense deleted"}), 200
    return jsonify({"error": "Failed to delete expense"}), 500

# Savings Goals Routes
@expense_bp.route('/goals', methods=['GET', 'POST'])
def manage_goals():
    if request.method == 'POST':
        data = request.json
        add_goal(data['user_id'], data['title'], data['target'])
        return jsonify({"message": "Goal added"}), 201
    user_id = request.args.get('user_id')
    return jsonify(get_goals(user_id)), 200

@expense_bp.route('/goals/<int:goal_id>', methods=['DELETE'])
def remove_goal(goal_id):
    delete_goal(goal_id)
    return jsonify({"message": "Goal deleted"}), 200

@expense_bp.route('/goals/reset', methods=['POST'])
def reset_goal_route():
    data = request.json
    reset_goal(data['goal_id'])
    return jsonify({"message": "Goal reset"}), 200

@expense_bp.route('/goals/progress', methods=['POST'])

def update_progress():
    data = request.json
    update_goal_progress(data['goal_id'], data['amount'])
    return jsonify({"message": "Progress updated"}), 200

# Wishlist Routes
@expense_bp.route('/wishlist', methods=['GET', 'POST'])
def manage_wishlist():
    if request.method == 'POST':
        data = request.json
        add_wishlist_item(data['user_id'], data['name'], data['price'], data['priority'])
        return jsonify({"message": "Item added"}), 201
    user_id = request.args.get('user_id')
    return jsonify(get_wishlist(user_id)), 200

@expense_bp.route('/wishlist/<int:item_id>', methods=['DELETE'])
def remove_wishlist_item(item_id):
    delete_wishlist_item(item_id)
    return jsonify({"message": "Item deleted"}), 200

# Budget Routes
@expense_bp.route('/budget', methods=['GET', 'POST'])
def manage_budget():
    if request.method == 'POST':
        data = request.json
        set_budget(data['user_id'], data['month_year'], data['amount'])
        return jsonify({"message": "Budget updated"}), 200
    
    user_id = request.args.get('user_id')
    month_year = request.args.get('month_year')
    budget_data = get_budget(user_id, month_year)
    spent = get_monthly_spending(user_id, month_year)
    
    total_budget = float(budget_data['amount']) if budget_data else 0.0
    return jsonify({
        "budget": total_budget,
        "spent": spent,
        "remaining": total_budget - spent
    }), 200

# Smart Advisor Routes
@expense_bp.route('/set-income', methods=['POST'])
def update_income():
    data = request.json
    set_income(data['user_id'], data['income'])
    return jsonify({"message": "Income updated"}), 200

@expense_bp.route('/bonus', methods=['POST'])
def update_bonus():
    data = request.json
    add_bonus_income(data['user_id'], data['amount'], data['description'])
    return jsonify({"message": "Bonus added successfully"}), 200

@expense_bp.route('/financial-summary', methods=['GET'])
def fetch_summary():
    user_id = request.args.get('user_id')
    month_year = request.args.get('month_year')
    summary = get_financial_summary(user_id, month_year)
    return jsonify(summary), 200

@expense_bp.route('/financial-status', methods=['GET'])
def fetch_status():
    user_id = request.args.get('user_id')
    month_year = request.args.get('month_year')
    # Backward compatibility or fallback
    status = get_financial_summary(user_id, month_year)
    return jsonify(status), 200





# Insights Route
@expense_bp.route('/insights', methods=['GET'])
def get_insights():
    user_id = request.args.get('user_id')
    expenses = get_expenses(user_id)
    if not expenses: return jsonify({"insights": ["Add expenses to see insights!"]}), 200
    
    total = sum(float(e['amount']) for e in expenses)
    categories = {}
    for e in expenses: categories[e['category']] = categories.get(e['category'], 0) + float(e['amount'])
    
    max_cat = max(categories, key=categories.get)
    insights = [f"You spend {(categories[max_cat]/total)*100:.1f}% of your money on {max_cat}."]
    if total > 10000: insights.append("Your spending is high this month!")
    
    return jsonify({"insights": insights}), 200
