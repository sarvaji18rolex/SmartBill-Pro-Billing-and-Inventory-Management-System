from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_doc, success_response, error_response
from models.customer import create_customer, validate_customer

customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')

@customers_bp.route('', methods=['GET'])
@jwt_required()
def get_customers():
    try:
        db = get_db()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        search = request.args.get('search', '').strip()
        
        query = {"is_active": True}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        total = db.customers.count_documents(query)
        skip = (page - 1) * per_page
        customers = list(db.customers.find(query).sort("name", 1).skip(skip).limit(per_page))
        
        return jsonify(*success_response({
            "customers": serialize_doc(customers),
            "total": total,
            "page": page,
            "pages": (total + per_page - 1) // per_page
        }))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@customers_bp.route('/<customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    try:
        db = get_db()
        customer = db.customers.find_one({"_id": ObjectId(customer_id)})
        
        if not customer:
            return jsonify(*error_response("Customer not found", 404))
        
        # Get purchase history
        invoices = list(db.invoices.find(
            {"customer_id": customer_id},
            {"invoice_number": 1, "grand_total": 1, "created_at": 1, "status": 1, "payment_status": 1}
        ).sort("created_at", -1).limit(20))
        
        result = serialize_doc(customer)
        result["recent_invoices"] = serialize_doc(invoices)
        
        return jsonify(*success_response(result))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@customers_bp.route('', methods=['POST'])
@jwt_required()
def create_customer_route():
    try:
        data = request.get_json()
        if not data:
            return jsonify(*error_response("No data provided"))
        
        errors = validate_customer(data)
        if errors:
            return jsonify(*error_response("Validation failed", 400, errors))
        
        db = get_db()
        
        if data.get("phone"):
            existing = db.customers.find_one({"phone": data["phone"], "is_active": True})
            if existing:
                return jsonify(*error_response("Customer with this phone already exists"))
        
        customer_doc = create_customer(data)
        result = db.customers.insert_one(customer_doc)
        customer_doc["_id"] = str(result.inserted_id)
        
        return jsonify(*success_response(serialize_doc(customer_doc), "Customer created", 201))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@customers_bp.route('/<customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    try:
        data = request.get_json()
        errors = validate_customer(data, is_update=True)
        if errors:
            return jsonify(*error_response("Validation failed", 400, errors))
        
        db = get_db()
        update_fields = {k: v for k, v in data.items() if k not in ['_id', 'created_at']}
        update_fields["updated_at"] = datetime.utcnow()
        
        result = db.customers.update_one(
            {"_id": ObjectId(customer_id)},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify(*error_response("Customer not found", 404))
        
        updated = db.customers.find_one({"_id": ObjectId(customer_id)})
        return jsonify(*success_response(serialize_doc(updated), "Customer updated"))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@customers_bp.route('/<customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    try:
        db = get_db()
        result = db.customers.update_one(
            {"_id": ObjectId(customer_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify(*error_response("Customer not found", 404))
        
        return jsonify(*success_response(message="Customer deleted"))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@customers_bp.route('/<customer_id>/invoices', methods=['GET'])
@jwt_required()
def get_customer_invoices(customer_id):
    try:
        db = get_db()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        skip = (page - 1) * per_page
        
        invoices = list(db.invoices.find(
            {"customer_id": customer_id}
        ).sort("created_at", -1).skip(skip).limit(per_page))
        
        total = db.invoices.count_documents({"customer_id": customer_id})
        
        return jsonify(*success_response({
            "invoices": serialize_doc(invoices),
            "total": total,
            "page": page,
            "pages": (total + per_page - 1) // per_page
        }))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))
