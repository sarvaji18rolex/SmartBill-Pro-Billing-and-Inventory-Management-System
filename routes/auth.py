from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import bcrypt
from pymongo.errors import DuplicateKeyError
from utils.database import get_db
from utils.helpers import serialize_doc, success_response, error_response, validate_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            response, code = error_response("No data provided")
            return jsonify(response), code
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            response, code = error_response("Username and password required")
            return jsonify(response), code
        
        db = get_db()
        user = db.users.find_one({"username": username, "is_active": True})
        
        if not user:
            response, code = error_response("Invalid credentials", 401)
            return jsonify(response), code
        
        if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
            response, code = error_response("Invalid credentials", 401)
            return jsonify(response), code
        
        # Update last login
        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        access_token = create_access_token(identity=str(user["_id"]))
        
        user_data = {
            "_id": str(user["_id"]),
            "username": user["username"],
            "name": user.get("name", username),
            "email": user.get("email", ""),
            "role": user.get("role", "cashier")
        }
        
        response, code = success_response({
            "token": access_token,
            "user": user_data
        }, "Login successful")
        return jsonify(response), code
    
    except Exception as e:
        response, code = error_response(f"Login failed: {str(e)}", 500)
        return jsonify(response), code

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            response, code = error_response("No data provided")
            return jsonify(response), code

        username = data.get('username', '').strip()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()

        if not username or not password or not name:
            response, code = error_response("Name, username and password are required")
            return jsonify(response), code

        if len(password) < 6:
            response, code = error_response("Password must be at least 6 characters")
            return jsonify(response), code

        if email and not validate_email(email):
            response, code = error_response("Invalid email address")
            return jsonify(response), code

        db = get_db()
        if db.users.find_one({"username": username}):
            response, code = error_response("Username already taken", 400)
            return jsonify(response), code
        if email and db.users.find_one({"email": email}):
            response, code = error_response("Email already registered", 400)
            return jsonify(response), code

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user = {
            "username": username,
            "password": hashed_password,
            "name": name,
            "email": email,
            "role": "cashier",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = db.users.insert_one(user)

        user_data = {
            "_id": str(result.inserted_id),
            "username": username,
            "name": name,
            "email": email,
            "role": "cashier"
        }

        response, code = success_response(user_data, "Registration successful")
        return jsonify(response), code

    except DuplicateKeyError:
        response, code = error_response("Username or email already exists", 400)
        return jsonify(response), code
    except Exception as e:
        response, code = error_response(f"Registration failed: {str(e)}", 500)
        return jsonify(response), code

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        from bson import ObjectId
        user_id = get_jwt_identity()
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            response, code = error_response("User not found", 404)
            return jsonify(response), code
        
        user_data = serialize_doc({
            "_id": user["_id"],
            "username": user["username"],
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", "cashier")
        })
        
        response, code = success_response(user_data)
        return jsonify(response), code
    
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        from bson import ObjectId
        user_id = get_jwt_identity()
        data = request.get_json()
        
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')
        
        if not old_password or not new_password:
            response, code = error_response("Old and new passwords required")
            return jsonify(response), code
        
        if len(new_password) < 6:
            response, code = error_response("New password must be at least 6 characters")
            return jsonify(response), code
        
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not bcrypt.checkpw(old_password.encode('utf-8'), user['password']):
            response, code = error_response("Current password is incorrect")
            return jsonify(response), code
        
        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed, "updated_at": datetime.utcnow()}}
        )
        
        response, code = success_response(message="Password changed successfully")
        return jsonify(response), code
    
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code
