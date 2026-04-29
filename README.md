# SmartBill Pro — React + Flask + MongoDB Billing System

A complete, production-style billing and inventory management web application built for small and medium businesses in India. Supports GST-compliant invoicing, inventory management, customer tracking, and sales analytics.

---

## 🚀 Features

| Feature | Details |
|---|---|
| **POS Billing** | Add products by click or barcode scan, live total with GST, discount, PDF invoice |
| **GST Invoices** | CGST/SGST/IGST, HSN codes, Indian rupee format, printable & downloadable PDF |
| **Inventory** | Add/edit/delete products, categories, stock adjustments, low-stock alerts |
| **Customers** | Profiles, purchase history, credit tracking, GST number |
| **Dashboard** | Today's sales, monthly revenue, charts, low-stock panel |
| **Reports** | Sales trend, top products, payment breakdown, monthly comparison |
| **Smart Insights** | Reorder predictions, frequently bought together recommendations |
| **Authentication** | JWT-based login, role support (admin/cashier), password change |

---

## 🗂️ Project Structure

```
smartbill-pro/
├── backend/
│   ├── app.py              # Flask app factory + blueprints
│   ├── config.py           # Config from .env
│   ├── seed.py             # Sample data seeder
│   ├── .env                # Environment variables
│   ├── requirements.txt
│   ├── models/
│   │   ├── product.py      # Product schema + validation
│   │   ├── customer.py     # Customer schema + validation
│   │   └── invoice.py      # Invoice schema + GST calc
│   ├── routes/
│   │   ├── auth.py         # Login, /me, change-password
│   │   ├── products.py     # CRUD + barcode lookup + stock
│   │   ├── customers.py    # CRUD + invoice history
│   │   ├── invoices.py     # Create, cancel, PDF download
│   │   └── dashboard.py    # Summary, trends, insights
│   ├── services/
│   │   └── pdf_service.py  # ReportLab GST invoice PDF
│   └── utils/
│       ├── database.py     # PyMongo connection + indexes
│       └── helpers.py      # Serializer, validators, helpers
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx         # Router + Auth wrapper
│       ├── index.css       # Global design system CSS
│       ├── main.jsx
│       ├── hooks/
│       │   └── useAuth.jsx # Auth context + provider
│       ├── services/
│       │   └── api.js      # Axios API client
│       ├── utils/
│       │   └── format.js   # Currency, date formatters
│       ├── components/
│       │   └── common/
│       │       ├── Sidebar.jsx
│       │       └── Layout.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── POS.jsx
│           ├── Inventory.jsx
│           ├── Customers.jsx
│           ├── Invoices.jsx
│           ├── Reports.jsx
│           └── Settings.jsx
│
└── README.md
```

---

## ⚙️ Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **MongoDB Community Server** (local, no Docker needed)

### Install MongoDB (Ubuntu/Debian)
```bash
# Import key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod
```

### Install MongoDB (Windows)
Download from: https://www.mongodb.com/try/download/community  
Run the installer and MongoDB runs as a Windows Service automatically.

### Install MongoDB (macOS)
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb/brew/mongodb-community
```

---

## 🛠️ Setup & Run

### 1. Clone and enter the project
```bash
git clone <repo-url>
cd smartbill-pro
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed sample data (creates users, products, customers, 30 days of invoices)
python seed.py

# Start the Flask server
python app.py
```
Backend runs at: **http://localhost:5000**

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```
Frontend runs at: **http://localhost:3000**

---

## 🔑 Default Login Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Cashier | `cashier` | `cashier123` |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/products` | List products (paginated, searchable) |
| GET | `/api/products/barcode/:code` | Lookup by barcode/SKU |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Soft delete |
| POST | `/api/products/:id/stock` | Adjust stock |
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/:id/invoices` | Customer history |
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice (auto deducts stock) |
| POST | `/api/invoices/:id/cancel` | Cancel + restore stock |
| GET | `/api/invoices/:id/pdf` | Download PDF |
| GET | `/api/dashboard/summary` | KPI summary |
| GET | `/api/dashboard/sales-trend` | Daily trend |
| GET | `/api/dashboard/top-products` | Top sellers |
| GET | `/api/dashboard/smart-insights` | Reorder predictions |

---

## 🗄️ MongoDB Collections

| Collection | Purpose |
|---|---|
| `users` | Auth users with hashed passwords |
| `products` | Product catalog with stock levels |
| `customers` | Customer profiles and stats |
| `invoices` | GST invoices with full line items |
| `stock_logs` | Audit trail of all stock changes |

---

## 📄 Environment Variables (backend/.env)

```env
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=smartbill_pro
JWT_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
GST_NUMBER=29ABCDE1234F1Z5
COMPANY_NAME=SmartBill Pro
COMPANY_ADDRESS=123, MG Road, Bangalore, Karnataka - 560001
COMPANY_PHONE=+91-9876543210
COMPANY_EMAIL=billing@smartbillpro.com
```

---

## 🧰 Tech Stack

**Frontend:** React 18, Vite, React Router v6, Axios, Chart.js, react-chartjs-2, react-hot-toast, react-icons

**Backend:** Python 3, Flask 3, Flask-CORS, Flask-JWT-Extended, PyMongo, ReportLab, bcrypt

**Database:** MongoDB 7 (local, no Docker)

---

## 🎓 Final Year Project Notes

This project demonstrates:
- Full-stack SPA architecture with REST API
- JWT authentication & protected routes
- MongoDB schema design with indexing
- GST-compliant Indian invoicing
- Real-time POS billing interface
- Data visualization with Chart.js
- Responsive admin dashboard UI
- Barcode product lookup
- Smart reorder prediction algorithm
- PDF generation with ReportLab

---

## 📝 License

MIT License — Free to use for educational and commercial purposes.
