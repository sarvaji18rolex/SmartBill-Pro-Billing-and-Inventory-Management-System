from datetime import datetime
from bson import ObjectId

def create_product(data):
    """Create a product document."""
    return {
        "name": data["name"].strip(),
        "description": data.get("description", "").strip(),
        "category": data.get("category", "General").strip(),
        "sku": data.get("sku", "").strip(),
        "barcode": data.get("barcode", "").strip(),
        "purchase_price": float(data.get("purchase_price", 0)),
        "selling_price": float(data["selling_price"]),
        "mrp": float(data.get("mrp", data["selling_price"])),
        "tax_rate": float(data.get("tax_rate", 18)),  # GST %
        "tax_type": data.get("tax_type", "GST"),  # GST, IGST, etc.
        "hsn_code": data.get("hsn_code", "").strip(),
        "unit": data.get("unit", "pcs"),  # pcs, kg, ltr, etc.
        "stock_quantity": int(data.get("stock_quantity", 0)),
        "min_stock_level": int(data.get("min_stock_level", 10)),
        "reorder_quantity": int(data.get("reorder_quantity", 50)),
        "supplier": data.get("supplier", "").strip(),
        "image_url": data.get("image_url", ""),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

def validate_product(data, is_update=False):
    """Validate product data and return errors list."""
    errors = []
    
    if not is_update:
        if not data.get("name"):
            errors.append("Product name is required")
        if not data.get("selling_price"):
            errors.append("Selling price is required")
    
    if data.get("selling_price") is not None:
        try:
            price = float(data["selling_price"])
            if price < 0:
                errors.append("Selling price cannot be negative")
        except (ValueError, TypeError):
            errors.append("Selling price must be a number")
    
    if data.get("stock_quantity") is not None:
        try:
            qty = int(data["stock_quantity"])
            if qty < 0:
                errors.append("Stock quantity cannot be negative")
        except (ValueError, TypeError):
            errors.append("Stock quantity must be an integer")
    
    if data.get("tax_rate") is not None:
        try:
            rate = float(data["tax_rate"])
            if rate < 0 or rate > 100:
                errors.append("Tax rate must be between 0 and 100")
        except (ValueError, TypeError):
            errors.append("Tax rate must be a number")
    
    return errors
