from datetime import datetime

def create_customer(data):
    """Create a customer document."""
    return {
        "name": data["name"].strip(),
        "phone": data.get("phone", "").strip(),
        "email": data.get("email", "").strip().lower(),
        "address": data.get("address", "").strip(),
        "city": data.get("city", "").strip(),
        "state": data.get("state", "").strip(),
        "pincode": data.get("pincode", "").strip(),
        "gst_number": data.get("gst_number", "").strip().upper(),
        "credit_limit": float(data.get("credit_limit", 0)),
        "outstanding_balance": float(data.get("outstanding_balance", 0)),
        "total_purchases": 0,
        "total_amount_spent": 0.0,
        "loyalty_points": 0,
        "customer_type": data.get("customer_type", "regular"),  # regular, wholesale, vip
        "notes": data.get("notes", "").strip(),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

def validate_customer(data, is_update=False):
    """Validate customer data."""
    errors = []
    
    if not is_update:
        if not data.get("name"):
            errors.append("Customer name is required")
    
    if data.get("phone"):
        phone = str(data["phone"]).strip()
        import re
        if not re.match(r'^[6-9]\d{9}$', phone):
            errors.append("Invalid Indian phone number (must be 10 digits starting with 6-9)")
    
    if data.get("email"):
        import re
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data["email"]):
            errors.append("Invalid email address")
    
    if data.get("credit_limit") is not None:
        try:
            limit = float(data["credit_limit"])
            if limit < 0:
                errors.append("Credit limit cannot be negative")
        except (ValueError, TypeError):
            errors.append("Credit limit must be a number")
    
    return errors
