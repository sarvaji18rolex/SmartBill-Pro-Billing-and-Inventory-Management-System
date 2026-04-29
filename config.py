import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "smartbill_pro")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("FLASK_DEBUG", "True") == "True"
    
    # Company Info
    GST_NUMBER = os.getenv("GST_NUMBER", "29ABCDE1234F1Z5")
    COMPANY_NAME = os.getenv("COMPANY_NAME", "SmartBill Pro")
    COMPANY_ADDRESS = os.getenv("COMPANY_ADDRESS", "123, MG Road, Bangalore")
    COMPANY_PHONE = os.getenv("COMPANY_PHONE", "+91-9876543210")
    COMPANY_EMAIL = os.getenv("COMPANY_EMAIL", "billing@smartbillpro.com")
