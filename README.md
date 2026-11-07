# FreshFarm – Online Vegetable Marketplace & Delivery System

**Department of Computer Engineering, Vishwakarma Institute of Technology (VIT Pune)**

---

## 🥦 Project Overview

**FreshFarm** is a direct farm-to-consumer e-commerce platform designed to eliminate middlemen, connect Maharashtra vegetable farmers directly with urban households, provide live inventory control, real-time delivery tracking, automated PDF invoice generation, multilingual support (English, Hindi, Marathi), and an intelligent AI Assistant powered by Google Gemini API.

---

## 🛠️ Technology Stack

| Domain | Technology / Library |
| :--- | :--- |
| **Frontend Framework** | React.js (Vite) |
| **Styling & Icons** | Custom Modern CSS3 (Variables, Flexbox/Grid), Lucide React |
| **Routing** | React Router DOM v6 |
| **State & API** | React Context API, Axios |
| **Animations** | Framer Motion |
| **Multilingual Support** | i18next & react-i18next (English, Hindi, Marathi) |
| **PDF Generation** | jsPDF & jsPDF-AutoTable |
| **Analytics & Charts** | Recharts |
| **Backend Runtime** | Node.js & Express.js |
| **Authentication** | JWT (JSON Web Tokens) & bcryptjs |
| **Image Uploads** | Multer |
| **Database** | MySQL (`mysql2/promise` Connection Pool) |
| **AI Assistant** | Google Gemini API (`@google/generative-ai`) |

---

## 📂 Project Directory Structure

```text
freshfarm/
├── database/
│   ├── schema.sql              # MySQL DDL & DML Schema with Seed Data
│   └── er_diagram.md           # ER Diagram in Mermaid Format
├── backend/
│   ├── config/
│   │   └── db.js               # MySQL Connection Pool Config
│   ├── controllers/
│   │   ├── adminController.js  # Analytics & Platform Management
│   │   ├── authController.js   # Farmer, Customer & Admin Auth
│   │   ├── cartController.js   # Shopping Cart Management
│   │   ├── chatController.js   # Google Gemini AI Integration
│   │   ├── orderController.js  # Order Checkout & Delivery Status
│   │   └── vegetableController.js # Produce CRUD & Image Upload
│   ├── middleware/
│   │   ├── auth.js             # JWT & Role Verification
│   │   └── upload.js           # Multer Image Upload Config
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── orderRoutes.js
│   │   └── vegetableRoutes.js
│   ├── uploads/                # Stored Vegetable Images
│   ├── .env                    # Environment Config File
│   ├── server.js               # Express Server Entry Point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── assets/             # Branding Images
    │   ├── components/         # Reusable Components (Navbar, Cards, Chatbot)
    │   ├── context/            # AuthContext & CartContext
    │   ├── locales/            # i18n Translations (en.json, hi.json, mr.json)
    │   ├── pages/              # Farmer, Customer, Admin & Public Pages
    │   ├── services/           # Axios API & jsPDF Invoice Generator
    │   ├── App.jsx             # React Routes Setup
    │   ├── main.jsx            # Entry Point
    │   └── index.css           # Global Stylesheet
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚡ Quick Setup & Execution Guide

### Razorpay Online Payments
Online UPI and card payments use Razorpay Standard Checkout. COD continues to place an order directly. For online payments, FreshFarm reserves the cart stock for 15 minutes, opens Razorpay Checkout, verifies the captured payment on the backend, and creates the FreshFarm order only after verification. Cancelled or expired attempts release the reserved stock.

1. Create a Razorpay account and use **Test Mode** API keys while developing. Add these values to `backend/.env` (never put the secret in frontend files):
   ```env
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_test_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```
2. From `backend/`, run the additive database migration once:
   ```bash
   npm run migrate:razorpay
   ```
   This adds payment tracking fields and the `payment_attempts` table. It does not drop existing data.
3. In the Razorpay Dashboard, enable automatic payment capture. For deployment, configure a webhook for `payment.captured` at `https://YOUR_DOMAIN/api/payments/razorpay/webhook`, use the same webhook secret in `.env`, and keep the endpoint publicly reachable over HTTPS.
4. Restart the backend and frontend, then make a Test Mode payment using Razorpay's test details. A FreshFarm order should appear only after payment verification. Cancelled/failed attempts should not appear as placed orders.
5. Before accepting live payments, deploy the frontend and backend over HTTPS, use a hosted MySQL database, and confirm Razorpay shows the account as activated. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` to the backend host's secret settings using **Live Mode** values. Set the frontend build variable `VITE_API_BASE_URL` to the deployed backend API URL, for example `https://api.example.com/api`, then rebuild and redeploy the frontend. Run successful, failed, cancelled, and webhook recovery scenarios in Test Mode before switching production settings to Live Mode.

The browser receives only the Razorpay Key ID. The Key Secret and webhook secret stay on the backend. Payment success is accepted only after server-side signature and captured-payment checks.

### Step 1: Set Up MySQL Database
1. For a new database, open MySQL Workbench or MySQL CLI and execute `database/schema.sql`:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   This creates database `freshfarm_db` with seed data. The script drops and recreates its tables, so do not rerun it on a database with data you need to keep.
2. For an existing installation, configure `backend/.env` and run `npm run migrate:reviews` from `backend/` instead. This adds the reviews table and rating columns without recreating existing data.
3. The new database includes these seed accounts:
   - **Admin Email**: `admin@freshfarm.com` | **Password**: `password123`
   - **Farmer Email**: `ramesh.patil@freshfarm.com` | **Password**: `password123`
   - **Customer Email**: `rahul.sharma@gmail.com` | **Password**: `password123`

### Step 2: Start Backend Server
1. Open terminal in `backend/`:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env` file in `backend/`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=freshfarm_db
   JWT_SECRET=freshfarm_super_secret_jwt_key_2026_vit_pune
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```
3. Launch Express server:
   ```bash
   npm start
   ```
   Server runs on `http://localhost:5000`.

### Fresh Produce Rescue & Donation Network
After configuring the backend database connection, run this additive migration once from `backend/`:
```bash
npm run migrate:rescue
```
Farmers publish discounted surplus listings from `/farmer/rescue`. Customers can find locality-matched Rescue Deals at `/rescue-deals` and add them to the existing cart. Organizations can apply publicly from `/ngo/rescue` with their organization details and login email/password; an admin approves them from the Rescue NGO approvals option in the admin portal. After approval, they use the existing Customer Login page and JWT session to access donation listings. Applications remain pending and cannot authenticate as an NGO until approval. When a listing deadline passes, the backend creates in-app notifications for approved organizations matching the listing locality. The donation request window is 24 hours; unrequested stock is recorded as expired/discarded after that window. The deadline processor runs while the backend server is running.

Surplus quantity is reserved from regular inventory when published. Online payment attempts temporarily reserve the Rescue Deal quantity and release it if the attempt expires or fails. A successful COD or Razorpay order records the discounted price in order history and the invoice, and donation approvals claim from the same remaining quantity.

### Step 3: Start React Frontend
1. Open terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open browser at `http://localhost:3000`.

---

## 🔑 Key Features Highlight

1. **Role-Based Portals**:
   - **Customer**: Browse vegetables, filter by category/price, search, cart management, checkout with COD/UPI/Card, delivery timeline tracking, PDF bill download.
   - **Farmer**: Dashboard stats, add/edit/delete crop listings with image upload (Multer), view received orders, update delivery status dropdown, earnings graph.
   - **Admin**: Dashboard stats, revenue charts (Recharts), manage farmers, customers, vegetables, and order fulfillment.

2. **Multilingual i18next Support**:
   - Seamlessly switch between **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)** using the navbar selector.

3. **Google Gemini AI Chatbot ("Greeny")**:
   - Floating widget on all pages.
   - Answers natural language questions regarding FreshFarm, vegetables, recipes, farming tips, and order guidance in the user's language.

4. **PDF Invoice Generation**:
   - One-click PDF invoice generation via `jsPDF` containing tax breakdown, GST (5%), delivery fees, farmer details, and order line items.
5. **Customer Product Feedback**:
   - Customers can submit one 1–5 star rating and required written review for each product in a delivered order.
   - Product averages and review counts update automatically and appear on product cards and the product reviews page.

---

## 🎓 Viva Questions & Answers Guide

1. **Q: Why MySQL over MongoDB for FreshFarm?**  
   *A:* FreshFarm requires strict relational integrity (Foreign Keys, Cascading Deletes) across Farmers, Customers, Vegetables, Orders, and Order Items. Financial transactions and stock deduction during checkout require ACID transactions to prevent stock over-selling.

2. **Q: How does stock consistency work during order checkout?**  
   *A:* Inside `orderController.js`, `connection.beginTransaction()` is initialized. Stock is checked against `vegetables.quantity`. If valid, stock is decremented (`UPDATE vegetables SET quantity = quantity - ?`) and committed. If stock is insufficient, `connection.rollback()` reverts all operations.

3. **Q: How is JWT authentication implemented?**  
   *A:* Upon login, `jwt.sign()` generates a signed token containing user ID and role. The frontend stores this token in `localStorage` and attaches it via Axios Interceptor (`Authorization: Bearer <token>`). The backend `auth.js` middleware verifies it before protected API execution.
