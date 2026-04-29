from datetime import datetime

def create_invoice(data, invoice_number):
    """Create an invoice document."""
    items = data.get("items", [])
    
    # Calculate totals
    subtotal = sum(float(item["quantity"]) * float(item["unit_price"]) for item in items)
    discount_amount = float(data.get("discount_amount", 0))
    discount_percent = float(data.get("discount_percent", 0))
    
    if discount_percent > 0:
        discount_amount = subtotal * (discount_percent / 100)
    
    taxable_amount = subtotal - discount_amount
    
    # Calculate GST
    cgst = 0
    sgst = 0
    igst = 0
    tax_details = []
    
    is_interstate = data.get("is_interstate", False)
    
    for item in items:
        item_taxable = (float(item["quantity"]) * float(item["unit_price"])) - float(item.get("item_discount", 0))
        tax_rate = float(item.get("tax_rate", 18))
        tax_amount = item_taxable * (tax_rate / 100)
        
        if is_interstate:
            igst += tax_amount
        else:
            cgst += tax_amount / 2
            sgst += tax_amount / 2
        
        tax_details.append({
            "hsn_code": item.get("hsn_code", ""),
            "taxable_amount": round(item_taxable, 2),
            "tax_rate": tax_rate,
            "cgst": round(tax_amount / 2, 2) if not is_interstate else 0,
            "sgst": round(tax_amount / 2, 2) if not is_interstate else 0,
            "igst": round(tax_amount, 2) if is_interstate else 0
        })
    
    total_tax = cgst + sgst + igst
    grand_total = taxable_amount + total_tax
    
    return {
        "invoice_number": invoice_number,
        "customer_id": data.get("customer_id"),
        "customer_name": data.get("customer_name", "Walk-in Customer"),
        "customer_phone": data.get("customer_phone", ""),
        "customer_gst": data.get("customer_gst", ""),
        "customer_address": data.get("customer_address", ""),
        "items": [
            {
                "product_id": str(item["product_id"]),
                "product_name": item["product_name"],
                "sku": item.get("sku", ""),
                "hsn_code": item.get("hsn_code", ""),
                "quantity": float(item["quantity"]),
                "unit": item.get("unit", "pcs"),
                "unit_price": float(item["unit_price"]),
                "mrp": float(item.get("mrp", item["unit_price"])),
                "item_discount": float(item.get("item_discount", 0)),
                "tax_rate": float(item.get("tax_rate", 18)),
                "subtotal": float(item["quantity"]) * float(item["unit_price"]) - float(item.get("item_discount", 0))
            }
            for item in items
        ],
        "subtotal": round(subtotal, 2),
        "discount_amount": round(discount_amount, 2),
        "discount_percent": round(discount_percent, 2),
        "taxable_amount": round(taxable_amount, 2),
        "cgst": round(cgst, 2),
        "sgst": round(sgst, 2),
        "igst": round(igst, 2),
        "total_tax": round(total_tax, 2),
        "grand_total": round(grand_total, 2),
        "tax_details": tax_details,
        "is_interstate": is_interstate,
        "payment_method": data.get("payment_method", "cash"),  # cash, card, upi, credit
        "payment_status": data.get("payment_status", "paid"),  # paid, pending, partial
        "amount_paid": float(data.get("amount_paid", grand_total)),
        "amount_due": round(grand_total - float(data.get("amount_paid", grand_total)), 2),
        "notes": data.get("notes", ""),
        "status": "active",
        "created_by": data.get("created_by", "admin"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

def validate_invoice(data):
    """Validate invoice data."""
    errors = []
    
    if not data.get("items") or len(data["items"]) == 0:
        errors.append("At least one item is required")
        return errors
    
    for i, item in enumerate(data["items"]):
        if not item.get("product_id"):
            errors.append(f"Item {i+1}: Product ID is required")
        if not item.get("product_name"):
            errors.append(f"Item {i+1}: Product name is required")
        if not item.get("quantity") or float(item.get("quantity", 0)) <= 0:
            errors.append(f"Item {i+1}: Quantity must be greater than 0")
        if not item.get("unit_price") and item.get("unit_price") != 0:
            errors.append(f"Item {i+1}: Unit price is required")
    
    valid_payment_methods = ["cash", "card", "upi", "credit", "cheque", "bank_transfer"]
    if data.get("payment_method") and data["payment_method"] not in valid_payment_methods:
        errors.append(f"Payment method must be one of: {', '.join(valid_payment_methods)}")
    
    return errors
