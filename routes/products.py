from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_doc, success_response, error_response
from models.product import create_product, validate_product

products_bp = Blueprint('products', __name__, url_prefix='/api/products')

@products_bp.route('', methods=['GET'])
@jwt_required()
def get_products():
    try:
        db = get_db()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        search = request.args.get('search', '').strip()
        category = request.args.get('category', '').strip()
        low_stock = request.args.get('low_stock', '').lower() == 'true'
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        query = {}
        if active_only:
            query["is_active"] = True
        if category:
            query["category"] = category
        if low_stock:
            query["$expr"] = {"$lte": ["$stock_quantity", "$min_stock_level"]}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"sku": {"$regex": search, "$options": "i"}},
                {"barcode": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}}
            ]
        
        total = db.products.count_documents(query)
        skip = (page - 1) * per_page
        
        products = list(db.products.find(query).sort("name", 1).skip(skip).limit(per_page))
        
        response, code = success_response({
            "products": serialize_doc(products),
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        })
        return jsonify(response), code
    
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code

@products_bp.route('/<product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    try:
        db = get_db()
        product = db.products.find_one({"_id": ObjectId(product_id)})
        
        if not product:
            return jsonify(*error_response("Product not found", 404))
        
        return jsonify(*success_response(serialize_doc(product)))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@products_bp.route('/barcode/<barcode>', methods=['GET'])
@jwt_required()
def get_product_by_barcode(barcode):
    try:
        db = get_db()
        product = db.products.find_one({
            "$or": [{"barcode": barcode}, {"sku": barcode}],
            "is_active": True
        })
        
        if not product:
            return jsonify(*error_response("Product not found", 404))
        
        return jsonify(*success_response(serialize_doc(product)))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@products_bp.route('', methods=['POST'])
@jwt_required()
def create_product_route():
    try:
        data = request.get_json()
        if not data:
            response, code = error_response("No data provided")
            return jsonify(response), code
        
        errors = validate_product(data)
        if errors:
            response, code = error_response("Validation failed", 400, errors)
            return jsonify(response), code
        
        db = get_db()
        
        # Check for duplicate SKU
        if data.get("sku"):
            existing = db.products.find_one({"sku": data["sku"]})
            if existing:
                response, code = error_response("SKU already exists")
                return jsonify(response), code
        
        product_doc = create_product(data)
        result = db.products.insert_one(product_doc)
        
        # Log initial stock
        if product_doc["stock_quantity"] > 0:
            db.stock_logs.insert_one({
                "product_id": str(result.inserted_id),
                "product_name": product_doc["name"],
                "type": "addition",
                "quantity": product_doc["stock_quantity"],
                "previous_stock": 0,
                "new_stock": product_doc["stock_quantity"],
                "reason": "Initial stock",
                "created_at": datetime.utcnow()
            })
        
        product_doc["_id"] = str(result.inserted_id)
        response, code = success_response(serialize_doc(product_doc), "Product created successfully", 201)
        return jsonify(response), code
    
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code

@products_bp.route('/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        data = request.get_json()
        if not data:
            response, code = error_response("No data provided")
            return jsonify(response), code
        
        errors = validate_product(data, is_update=True)
        if errors:
            response, code = error_response("Validation failed", 400, errors)
            return jsonify(response), code
        
        db = get_db()
        product = db.products.find_one({"_id": ObjectId(product_id)})
        
        if not product:
            response, code = error_response("Product not found", 404)
            return jsonify(response), code
        
        # Build update dict
        update_fields = {k: v for k, v in data.items() if k not in ['_id', 'created_at']}
        
        # Convert numeric fields
        numeric_fields = ['purchase_price', 'selling_price', 'mrp', 'tax_rate']
        int_fields = ['stock_quantity', 'min_stock_level', 'reorder_quantity']
        
        for field in numeric_fields:
            if field in update_fields:
                update_fields[field] = float(update_fields[field])
        
        for field in int_fields:
            if field in update_fields:
                update_fields[field] = int(update_fields[field])
        
        # Track stock changes
        if 'stock_quantity' in update_fields:
            old_stock = product['stock_quantity']
            new_stock = int(data['stock_quantity'])
            diff = new_stock - old_stock
            
            if diff != 0:
                db.stock_logs.insert_one({
                    "product_id": product_id,
                    "product_name": product["name"],
                    "type": "adjustment",
                    "quantity": abs(diff),
                    "previous_stock": old_stock,
                    "new_stock": new_stock,
                    "reason": data.get("stock_reason", "Manual adjustment"),
                    "created_at": datetime.utcnow()
                })
        
        update_fields["updated_at"] = datetime.utcnow()
        
        db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_fields}
        )
        
        updated = db.products.find_one({"_id": ObjectId(product_id)})
        response, code = success_response(serialize_doc(updated), "Product updated successfully")
        return jsonify(response), code
    
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code

@products_bp.route('/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        db = get_db()
        product = db.products.find_one({"_id": ObjectId(product_id)})
        
        if not product:
            response, code = error_response("Product not found", 404)
            return jsonify(response), code
        
        # Soft delete
        db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        response, code = success_response(message="Product deleted successfully")
        return jsonify(response), code
    
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code

@products_bp.route('/categories/list', methods=['GET'])
@jwt_required()
def get_categories():
    try:
        db = get_db()
        categories = db.products.distinct("category", {"is_active": True})
        response, code = success_response(sorted(categories))
        return jsonify(response), code
    
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code

@products_bp.route('/<product_id>/stock', methods=['POST'])
@jwt_required()
def update_stock(product_id):
    try:
        data = request.get_json()
        adjustment = int(data.get("adjustment", 0))
        reason = data.get("reason", "Manual adjustment")
        
        db = get_db()
        product = db.products.find_one({"_id": ObjectId(product_id)})
        
        if not product:
            response, code = error_response("Product not found", 404)
            return jsonify(response), code
        
        new_stock = product["stock_quantity"] + adjustment
        if new_stock < 0:
            response, code = error_response("Insufficient stock")
            return jsonify(response), code
        
        db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"stock_quantity": new_stock, "updated_at": datetime.utcnow()}}
        )
        
        db.stock_logs.insert_one({
            "product_id": product_id,
            "product_name": product["name"],
            "type": "addition" if adjustment > 0 else "reduction",
            "quantity": abs(adjustment),
            "previous_stock": product["stock_quantity"],
            "new_stock": new_stock,
            "reason": reason,
            "created_at": datetime.utcnow()
        })
        
        response, code = success_response({"new_stock": new_stock}, "Stock updated")
        return jsonify(response), code
    
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code
