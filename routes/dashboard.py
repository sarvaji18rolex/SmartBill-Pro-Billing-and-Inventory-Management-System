from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from utils.database import get_db
from utils.helpers import serialize_doc, success_response, error_response

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    try:
        db = get_db()
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        month_start = today.replace(day=1)

        # Today sales
        today_pipeline = [
            {"$match": {"status": "active", "created_at": {"$gte": today, "$lt": tomorrow}}},
            {"$group": {"_id": None, "total": {"$sum": "$grand_total"}, "count": {"$sum": 1}}}
        ]
        today_result = list(db.invoices.aggregate(today_pipeline))
        today_sales = today_result[0] if today_result else {"total": 0, "count": 0}

        # Monthly sales
        month_pipeline = [
            {"$match": {"status": "active", "created_at": {"$gte": month_start}}},
            {"$group": {"_id": None, "total": {"$sum": "$grand_total"}, "count": {"$sum": 1}}}
        ]
        month_result = list(db.invoices.aggregate(month_pipeline))
        month_sales = month_result[0] if month_result else {"total": 0, "count": 0}

        # Counts
        total_products = db.products.count_documents({"is_active": True})
        total_customers = db.customers.count_documents({"is_active": True})
        low_stock_count = db.products.count_documents({
            "is_active": True,
            "$expr": {"$lte": ["$stock_quantity", "$min_stock_level"]}
        })
        pending_payments = db.invoices.count_documents({"status": "active", "payment_status": "pending"})

        response, code = success_response({
            "today_sales": round(today_sales.get("total", 0), 2),
            "today_invoices": today_sales.get("count", 0),
            "month_sales": round(month_sales.get("total", 0), 2),
            "month_invoices": month_sales.get("count", 0),
            "total_products": total_products,
            "total_customers": total_customers,
            "low_stock_count": low_stock_count,
            "pending_payments": pending_payments
        })
        return jsonify(response), code
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code


@dashboard_bp.route('/sales-trend', methods=['GET'])
@jwt_required()
def get_sales_trend():
    try:
        db = get_db()
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)

        pipeline = [
            {"$match": {"status": "active", "created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "total": {"$sum": "$grand_total"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        results = list(db.invoices.aggregate(pipeline))

        # Fill missing dates
        date_map = {r["_id"]: r for r in results}
        trend = []
        for i in range(days):
            d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            trend.append({
                "date": d,
                "total": round(date_map.get(d, {}).get("total", 0), 2),
                "count": date_map.get(d, {}).get("count", 0)
            })

        response, code = success_response(trend)
        return jsonify(response), code
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code


@dashboard_bp.route('/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    try:
        db = get_db()
        limit = int(request.args.get('limit', 10))
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)

        pipeline = [
            {"$match": {"status": "active", "created_at": {"$gte": start_date}}},
            {"$unwind": "$items"},
            {"$group": {
                "_id": "$items.product_id",
                "product_name": {"$first": "$items.product_name"},
                "total_qty": {"$sum": "$items.quantity"},
                "total_revenue": {"$sum": "$items.subtotal"}
            }},
            {"$sort": {"total_qty": -1}},
            {"$limit": limit}
        ]
        results = list(db.invoices.aggregate(pipeline))

        response, code = success_response([{
            "product_id": r["_id"],
            "product_name": r["product_name"],
            "total_qty": round(r["total_qty"], 2),
            "total_revenue": round(r["total_revenue"], 2)
        } for r in results])
        return jsonify(response), code
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code


@dashboard_bp.route('/monthly-comparison', methods=['GET'])
@jwt_required()
def get_monthly_comparison():
    try:
        db = get_db()
        months = int(request.args.get('months', 6))
        now = datetime.utcnow()
        start_date = (now.replace(day=1) - timedelta(days=months * 31)).replace(day=1)

        pipeline = [
            {"$match": {"status": "active", "created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
                "total": {"$sum": "$grand_total"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
            {"$limit": months}
        ]
        results = list(db.invoices.aggregate(pipeline))

        response, code = success_response([{
            "month": r["_id"],
            "total": round(r["total"], 2),
            "count": r["count"]
        } for r in results])
        return jsonify(response), code
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code


@dashboard_bp.route('/payment-methods', methods=['GET'])
@jwt_required()
def get_payment_breakdown():
    try:
        db = get_db()
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)

        pipeline = [
            {"$match": {"status": "active", "created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": "$payment_method",
                "total": {"$sum": "$grand_total"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total": -1}}
        ]
        results = list(db.invoices.aggregate(pipeline))

        response, code = success_response([{
            "method": r["_id"],
            "total": round(r["total"], 2),
            "count": r["count"]
        } for r in results])
        return jsonify(response), code
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code


@dashboard_bp.route('/low-stock', methods=['GET'])
@jwt_required()
def get_low_stock():
    try:
        db = get_db()
        products = list(db.products.find(
            {"is_active": True, "$expr": {"$lte": ["$stock_quantity", "$min_stock_level"]}},
            {"name": 1, "sku": 1, "stock_quantity": 1, "min_stock_level": 1, "reorder_quantity": 1, "category": 1}
        ).sort("stock_quantity", 1).limit(20))

        response, code = success_response(serialize_doc(products))
        return jsonify(response), code
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code


@dashboard_bp.route('/recent-invoices', methods=['GET'])
@jwt_required()
def get_recent_invoices():
    try:
        db = get_db()
        limit = int(request.args.get('limit', 10))
        invoices = list(db.invoices.find(
            {"status": "active"},
            {"invoice_number": 1, "customer_name": 1, "grand_total": 1,
             "payment_method": 1, "payment_status": 1, "created_at": 1}
        ).sort("created_at", -1).limit(limit))

        response, code = success_response(serialize_doc(invoices))
        return jsonify(response), code
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code


@dashboard_bp.route('/smart-insights', methods=['GET'])
@jwt_required()
def get_smart_insights():
    """Reorder predictions and frequently sold together."""
    try:
        db = get_db()
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)

        # Reorder prediction: products where avg daily sales * reorder_days > current stock
        pipeline = [
            {"$match": {"status": "active", "created_at": {"$gte": start_date}}},
            {"$unwind": "$items"},
            {"$group": {
                "_id": "$items.product_id",
                "product_name": {"$first": "$items.product_name"},
                "total_sold": {"$sum": "$items.quantity"}
            }}
        ]
        sales_data = list(db.invoices.aggregate(pipeline))
        sales_map = {s["_id"]: s for s in sales_data}

        reorder_alerts = []
        for product_id, data in sales_map.items():
            from bson import ObjectId
            try:
                product = db.products.find_one({"_id": ObjectId(product_id)}, {
                    "name": 1, "stock_quantity": 1, "reorder_quantity": 1, "min_stock_level": 1
                })
                if product:
                    avg_daily = data["total_sold"] / days
                    days_remaining = product["stock_quantity"] / avg_daily if avg_daily > 0 else 999
                    if days_remaining < 14:
                        reorder_alerts.append({
                            "product_id": str(product["_id"]),
                            "product_name": product["name"],
                            "current_stock": product["stock_quantity"],
                            "avg_daily_sales": round(avg_daily, 2),
                            "days_remaining": round(days_remaining, 1),
                            "suggested_reorder": product.get("reorder_quantity", 50)
                        })
            except Exception:
                continue

        reorder_alerts.sort(key=lambda x: x["days_remaining"])

        # Frequently sold together (co-occurrence in same invoice)
        pair_pipeline = [
            {"$match": {"status": "active", "created_at": {"$gte": start_date}}},
            {"$project": {"items": {"$slice": ["$items", 5]}}},
            {"$unwind": {"path": "$items", "includeArrayIndex": "idx1"}},
            {"$group": {"_id": "$_id", "products": {"$push": "$items.product_name"}}},
            {"$project": {"pairs": {"$map": {
                "input": {"$range": [0, {"$subtract": [{"$size": "$products"}, 1]}]},
                "as": "i",
                "in": {"$concat": [
                    {"$arrayElemAt": ["$products", "$$i"]},
                    " + ",
                    {"$arrayElemAt": ["$products", {"$add": ["$$i", 1]}]}
                ]}
            }}}},
            {"$unwind": "$pairs"},
            {"$group": {"_id": "$pairs", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gte": 2}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        try:
            pairs = list(db.invoices.aggregate(pair_pipeline))
            frequently_together = [{"pair": p["_id"], "count": p["count"]} for p in pairs]
        except Exception:
            frequently_together = []

        response, code = success_response({
            "reorder_alerts": reorder_alerts[:10],
            "frequently_together": frequently_together
        })
        return jsonify(response), code
    except Exception as e:
        response, code = error_response(str(e), 500)
        return jsonify(response), code
