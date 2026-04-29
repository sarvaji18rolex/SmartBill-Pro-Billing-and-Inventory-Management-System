from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure
from config import Config

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        try:
            _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
            _client.admin.command('ping')
            _db = _client[Config.MONGO_DB_NAME]
            _create_indexes(_db)
            print(f"✅ Connected to MongoDB: {Config.MONGO_DB_NAME}")
        except ConnectionFailure as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise
    return _db

def _create_indexes(db):
    # Products
    db.products.create_index([("sku", ASCENDING)], unique=True, sparse=True)
    db.products.create_index([("name", "text"), ("barcode", "text")])
    db.products.create_index([("category", ASCENDING)])
    db.products.create_index([("stock_quantity", ASCENDING)])
    
    # Customers
    db.customers.create_index([("phone", ASCENDING)], unique=True, sparse=True)
    db.customers.create_index([("email", ASCENDING)], sparse=True)
    db.customers.create_index([("name", "text")])
    
    # Invoices
    db.invoices.create_index([("invoice_number", ASCENDING)], unique=True)
    db.invoices.create_index([("customer_id", ASCENDING)])
    db.invoices.create_index([("created_at", DESCENDING)])
    db.invoices.create_index([("status", ASCENDING)])
    
    # Users
    db.users.create_index([("username", ASCENDING)], unique=True)
    db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
    
    # Stock Logs
    db.stock_logs.create_index([("product_id", ASCENDING)])
    db.stock_logs.create_index([("created_at", DESCENDING)])
