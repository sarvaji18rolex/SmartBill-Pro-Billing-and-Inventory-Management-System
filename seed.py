"""
Run this script to seed the database with sample data.
Usage: python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import bcrypt
from datetime import datetime, timedelta
import random
from utils.database import get_db

def seed():
    db = get_db()

    # ── Users ────────────────────────────────────────────────────────────────────
    db.users.delete_many({})
    users = [
        {
            "username": "admin",
            "name": "Admin User",
            "email": "admin@smartbill.com",
            "password": bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()),
            "role": "admin",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "username": "cashier",
            "name": "Ravi Kumar",
            "email": "cashier@smartbill.com",
            "password": bcrypt.hashpw("cashier123".encode(), bcrypt.gensalt()),
            "role": "cashier",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    db.users.insert_many(users)
    print("✅ Users seeded  (admin/admin123 | cashier/cashier123)")

    # ── Products ─────────────────────────────────────────────────────────────────
    db.products.delete_many({})
    products = [
        # Electronics
        {"name": "Samsung 65W Charger", "category": "Electronics", "sku": "ELEC-001",
         "barcode": "8901234567890", "hsn_code": "8504", "unit": "pcs",
         "purchase_price": 450, "selling_price": 699, "mrp": 799,
         "tax_rate": 18, "stock_quantity": 45, "min_stock_level": 10, "reorder_quantity": 50,
         "supplier": "Samsung India"},
        {"name": "Boat Bassheads 100 Earphone", "category": "Electronics", "sku": "ELEC-002",
         "barcode": "8901234567891", "hsn_code": "8518", "unit": "pcs",
         "purchase_price": 280, "selling_price": 499, "mrp": 599,
         "tax_rate": 18, "stock_quantity": 8, "min_stock_level": 10, "reorder_quantity": 30,
         "supplier": "Boat Lifestyle"},
        {"name": "Type-C USB Cable 1m", "category": "Electronics", "sku": "ELEC-003",
         "barcode": "8901234567892", "hsn_code": "8544", "unit": "pcs",
         "purchase_price": 80, "selling_price": 149, "mrp": 199,
         "tax_rate": 18, "stock_quantity": 120, "min_stock_level": 20, "reorder_quantity": 100},
        {"name": "Screen Guard Tempered Glass", "category": "Electronics", "sku": "ELEC-004",
         "barcode": "8901234567893", "hsn_code": "7007", "unit": "pcs",
         "purchase_price": 30, "selling_price": 99, "mrp": 149,
         "tax_rate": 18, "stock_quantity": 5, "min_stock_level": 15, "reorder_quantity": 100},
        # Groceries
        {"name": "Aashirvaad Atta 5kg", "category": "Groceries", "sku": "GROC-001",
         "barcode": "8901234560001", "hsn_code": "1101", "unit": "bag",
         "purchase_price": 195, "selling_price": 238, "mrp": 250,
         "tax_rate": 5, "stock_quantity": 60, "min_stock_level": 20, "reorder_quantity": 100,
         "supplier": "ITC Limited"},
        {"name": "Tata Salt 1kg", "category": "Groceries", "sku": "GROC-002",
         "barcode": "8901234560002", "hsn_code": "2501", "unit": "pkt",
         "purchase_price": 18, "selling_price": 22, "mrp": 24,
         "tax_rate": 0, "stock_quantity": 200, "min_stock_level": 50, "reorder_quantity": 200},
        {"name": "Amul Butter 500g", "category": "Dairy", "sku": "DAIRY-001",
         "barcode": "8901234560010", "hsn_code": "0405", "unit": "pkt",
         "purchase_price": 210, "selling_price": 250, "mrp": 260,
         "tax_rate": 5, "stock_quantity": 30, "min_stock_level": 10, "reorder_quantity": 50},
        {"name": "Nandini Full Cream Milk 1L", "category": "Dairy", "sku": "DAIRY-002",
         "barcode": "8901234560011", "hsn_code": "0401", "unit": "ltr",
         "purchase_price": 52, "selling_price": 60, "mrp": 62,
         "tax_rate": 0, "stock_quantity": 3, "min_stock_level": 20, "reorder_quantity": 100},
        # Beverages
        {"name": "Nescafe Classic 50g", "category": "Beverages", "sku": "BEV-001",
         "barcode": "8901234561001", "hsn_code": "0901", "unit": "jar",
         "purchase_price": 145, "selling_price": 189, "mrp": 210,
         "tax_rate": 12, "stock_quantity": 40, "min_stock_level": 10, "reorder_quantity": 50},
        {"name": "Red Bull Energy Drink 250ml", "category": "Beverages", "sku": "BEV-002",
         "barcode": "8901234561002", "hsn_code": "2202", "unit": "can",
         "purchase_price": 90, "selling_price": 120, "mrp": 130,
         "tax_rate": 12, "stock_quantity": 72, "min_stock_level": 24, "reorder_quantity": 72},
        # Stationery
        {"name": "Classmate Notebook 200pg A4", "category": "Stationery", "sku": "STAT-001",
         "barcode": "8901234562001", "hsn_code": "4820", "unit": "pcs",
         "purchase_price": 55, "selling_price": 80, "mrp": 90,
         "tax_rate": 12, "stock_quantity": 85, "min_stock_level": 20, "reorder_quantity": 100},
        {"name": "Reynolds Ball Pen Blue (10pk)", "category": "Stationery", "sku": "STAT-002",
         "barcode": "8901234562002", "hsn_code": "9608", "unit": "pack",
         "purchase_price": 45, "selling_price": 65, "mrp": 70,
         "tax_rate": 12, "stock_quantity": 60, "min_stock_level": 15, "reorder_quantity": 60},
        # Personal Care
        {"name": "Dove Soap 3-bar Pack", "category": "Personal Care", "sku": "PC-001",
         "barcode": "8901234563001", "hsn_code": "3401", "unit": "pack",
         "purchase_price": 105, "selling_price": 138, "mrp": 150,
         "tax_rate": 18, "stock_quantity": 45, "min_stock_level": 10, "reorder_quantity": 60},
        {"name": "Head & Shoulders Shampoo 200ml", "category": "Personal Care", "sku": "PC-002",
         "barcode": "8901234563002", "hsn_code": "3305", "unit": "bottle",
         "purchase_price": 145, "selling_price": 190, "mrp": 210,
         "tax_rate": 18, "stock_quantity": 7, "min_stock_level": 10, "reorder_quantity": 40},
    ]
    for p in products:
        p.update({
            "description": f"{p['name']} - {p['category']}",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    db.products.insert_many(products)
    print(f"✅ {len(products)} products seeded")

    # ── Customers ────────────────────────────────────────────────────────────────
    db.customers.delete_many({})
    customers = [
        {"name": "Arjun Sharma", "phone": "9876543210", "email": "arjun@email.com",
         "city": "Bangalore", "state": "Karnataka", "pincode": "560001",
         "customer_type": "regular", "credit_limit": 5000, "outstanding_balance": 0},
        {"name": "Priya Nair", "phone": "9876543211", "email": "priya@email.com",
         "city": "Chennai", "state": "Tamil Nadu", "pincode": "600001",
         "customer_type": "vip", "credit_limit": 20000, "outstanding_balance": 1500,
         "gst_number": "33ABCDE1234F1Z5"},
        {"name": "Rohit Gupta", "phone": "9876543212", "email": "rohit@email.com",
         "city": "Mumbai", "state": "Maharashtra", "pincode": "400001",
         "customer_type": "wholesale", "credit_limit": 50000, "outstanding_balance": 0,
         "gst_number": "27FGHIJ5678K2Z9"},
        {"name": "Sunita Devi", "phone": "9876543213",
         "city": "Delhi", "state": "Delhi", "pincode": "110001",
         "customer_type": "regular", "credit_limit": 2000, "outstanding_balance": 0},
        {"name": "Vikram Patel", "phone": "9876543214", "email": "vikram@email.com",
         "city": "Ahmedabad", "state": "Gujarat", "pincode": "380001",
         "customer_type": "wholesale", "credit_limit": 100000, "outstanding_balance": 3200,
         "gst_number": "24KLMNO9012P3Z1"},
    ]
    for c in customers:
        c.update({
            "address": f"{c.get('city', '')} Main Road",
            "total_purchases": 0, "total_amount_spent": 0.0,
            "loyalty_points": 0, "notes": "",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    result = db.customers.insert_many(customers)
    customer_ids = [str(cid) for cid in result.inserted_ids]
    print(f"✅ {len(customers)} customers seeded")

    # ── Sample Invoices ──────────────────────────────────────────────────────────
    db.invoices.delete_many({})
    db.stock_logs.delete_many({})

    all_products = list(db.products.find())
    invoice_count = 0
    for day_offset in range(29, -1, -1):
        date = datetime.utcnow() - timedelta(days=day_offset)
        num_invoices = random.randint(2, 6)
        for _ in range(num_invoices):
            num_items = random.randint(1, 4)
            sampled = random.sample(all_products, min(num_items, len(all_products)))
            items = []
            subtotal = 0
            for prod in sampled:
                qty = random.randint(1, 3)
                price = prod['selling_price']
                item_sub = qty * price
                subtotal += item_sub
                items.append({
                    "product_id": str(prod["_id"]),
                    "product_name": prod["name"],
                    "sku": prod.get("sku", ""),
                    "hsn_code": prod.get("hsn_code", ""),
                    "quantity": qty,
                    "unit": prod.get("unit", "pcs"),
                    "unit_price": price,
                    "mrp": prod.get("mrp", price),
                    "item_discount": 0,
                    "tax_rate": prod.get("tax_rate", 18),
                    "subtotal": item_sub
                })
            tax = subtotal * 0.18
            grand_total = round(subtotal + tax, 2)
            year = date.year
            invoice_count += 1
            invoice_number = f"INV-{year}-{str(invoice_count).zfill(5)}"
            cust = random.choice(customers)
            cust_rec = db.customers.find_one({"phone": cust["phone"]})
            payment = random.choice(["cash", "upi", "card", "cash", "cash"])
            invoice_doc = {
                "invoice_number": invoice_number,
                "customer_id": str(cust_rec["_id"]) if cust_rec else None,
                "customer_name": cust["name"],
                "customer_phone": cust.get("phone", ""),
                "customer_gst": cust.get("gst_number", ""),
                "customer_address": cust.get("city", ""),
                "items": items,
                "subtotal": round(subtotal, 2),
                "discount_amount": 0,
                "discount_percent": 0,
                "taxable_amount": round(subtotal, 2),
                "cgst": round(tax / 2, 2),
                "sgst": round(tax / 2, 2),
                "igst": 0,
                "total_tax": round(tax, 2),
                "grand_total": grand_total,
                "tax_details": [],
                "is_interstate": False,
                "payment_method": payment,
                "payment_status": "paid",
                "amount_paid": grand_total,
                "amount_due": 0,
                "notes": "",
                "status": "active",
                "created_by": "admin",
                "created_at": date,
                "updated_at": date
            }
            db.invoices.insert_one(invoice_doc)

    print(f"✅ {invoice_count} sample invoices seeded (30 days)")
    print("\n🎉 Database seeded successfully!")
    print("   Login: admin / admin123")


if __name__ == "__main__":
    seed()
