from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
import io
from utils.database import get_db
from utils.helpers import serialize_doc, success_response, error_response, generate_invoice_number
from models.invoice import create_invoice, validate_invoice

invoices_bp = Blueprint('invoices', __name__, url_prefix='/api/invoices')

@invoices_bp.route('', methods=['GET'])
@jwt_required()
def get_invoices():
    try:
        db = get_db()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '').strip()
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        payment_status = request.args.get('payment_status', '')
        
        query = {"status": "active"}
        
        if search:
            query["$or"] = [
                {"invoice_number": {"$regex": search, "$options": "i"}},
                {"customer_name": {"$regex": search, "$options": "i"}},
                {"customer_phone": {"$regex": search, "$options": "i"}}
            ]
        
        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = datetime.fromisoformat(date_from)
            if date_to:
                date_filter["$lte"] = datetime.fromisoformat(date_to + "T23:59:59")
            query["created_at"] = date_filter
        
        if payment_status:
            query["payment_status"] = payment_status
        
        total = db.invoices.count_documents(query)
        skip = (page - 1) * per_page
        invoices = list(db.invoices.find(query).sort("created_at", -1).skip(skip).limit(per_page))
        
        return jsonify(*success_response({
            "invoices": serialize_doc(invoices),
            "total": total,
            "page": page,
            "pages": (total + per_page - 1) // per_page
        }))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@invoices_bp.route('/<invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    try:
        db = get_db()
        
        # Support both ObjectId and invoice_number lookup
        if len(invoice_id) == 24:
            invoice = db.invoices.find_one({"_id": ObjectId(invoice_id)})
        else:
            invoice = db.invoices.find_one({"invoice_number": invoice_id})
        
        if not invoice:
            return jsonify(*error_response("Invoice not found", 404))
        
        return jsonify(*success_response(serialize_doc(invoice)))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@invoices_bp.route('', methods=['POST'])
@jwt_required()
def create_invoice_route():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return jsonify(*error_response("No data provided"))
        
        errors = validate_invoice(data)
        if errors:
            return jsonify(*error_response("Validation failed", 400, errors))
        
        db = get_db()
        
        # Generate invoice number
        invoice_number = generate_invoice_number(db)
        data["created_by"] = user_id
        
        invoice_doc = create_invoice(data, invoice_number)
        
        # Check stock availability and deduct
        stock_errors = []
        for item in data["items"]:
            product = db.products.find_one({"_id": ObjectId(item["product_id"])})
            if not product:
                stock_errors.append(f"Product {item.get('product_name', item['product_id'])} not found")
                continue
            
            new_stock = product["stock_quantity"] - float(item["quantity"])
            if new_stock < 0:
                stock_errors.append(f"Insufficient stock for {product['name']} (available: {product['stock_quantity']})")
        
        if stock_errors:
            return jsonify(*error_response("Stock issues", 400, stock_errors))
        
        # Insert invoice
        result = db.invoices.insert_one(invoice_doc)
        
        # Deduct stock and log
        for item in data["items"]:
            product = db.products.find_one({"_id": ObjectId(item["product_id"])})
            new_stock = product["stock_quantity"] - float(item["quantity"])
            
            db.products.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$set": {"stock_quantity": new_stock, "updated_at": datetime.utcnow()}}
            )
            
            db.stock_logs.insert_one({
                "product_id": str(item["product_id"]),
                "product_name": item["product_name"],
                "type": "sale",
                "quantity": float(item["quantity"]),
                "previous_stock": product["stock_quantity"],
                "new_stock": new_stock,
                "reason": f"Sale - Invoice #{invoice_number}",
                "invoice_id": str(result.inserted_id),
                "invoice_number": invoice_number,
                "created_at": datetime.utcnow()
            })
        
        # Update customer stats
        if data.get("customer_id"):
            db.customers.update_one(
                {"_id": ObjectId(data["customer_id"])},
                {
                    "$inc": {
                        "total_purchases": 1,
                        "total_amount_spent": invoice_doc["grand_total"]
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        
        invoice_doc["_id"] = str(result.inserted_id)
        return jsonify(*success_response(serialize_doc(invoice_doc), "Invoice created", 201))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@invoices_bp.route('/<invoice_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_invoice(invoice_id):
    try:
        db = get_db()
        invoice = db.invoices.find_one({"_id": ObjectId(invoice_id)})
        
        if not invoice:
            return jsonify(*error_response("Invoice not found", 404))
        
        if invoice["status"] == "cancelled":
            return jsonify(*error_response("Invoice already cancelled"))
        
        # Restore stock
        for item in invoice["items"]:
            product = db.products.find_one({"_id": ObjectId(item["product_id"])})
            if product:
                new_stock = product["stock_quantity"] + float(item["quantity"])
                db.products.update_one(
                    {"_id": ObjectId(item["product_id"])},
                    {"$set": {"stock_quantity": new_stock}}
                )
                db.stock_logs.insert_one({
                    "product_id": item["product_id"],
                    "product_name": item["product_name"],
                    "type": "return",
                    "quantity": float(item["quantity"]),
                    "previous_stock": product["stock_quantity"],
                    "new_stock": new_stock,
                    "reason": f"Invoice cancelled - #{invoice['invoice_number']}",
                    "created_at": datetime.utcnow()
                })
        
        db.invoices.update_one(
            {"_id": ObjectId(invoice_id)},
            {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
        )
        
        return jsonify(*success_response(message="Invoice cancelled"))
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))

@invoices_bp.route('/<invoice_id>/pdf', methods=['GET'])
@jwt_required()
def download_invoice_pdf(invoice_id):
    try:
        from services.pdf_service import generate_invoice_pdf
        db = get_db()
        
        if len(invoice_id) == 24:
            invoice = db.invoices.find_one({"_id": ObjectId(invoice_id)})
        else:
            invoice = db.invoices.find_one({"invoice_number": invoice_id})
        
        if not invoice:
            return jsonify(*error_response("Invoice not found", 404))
        
        pdf_buffer = generate_invoice_pdf(invoice)
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"Invoice_{invoice['invoice_number']}.pdf"
        )
    
    except Exception as e:
        return jsonify(*error_response(str(e), 500))
