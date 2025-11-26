# 🍽️ **NKH Restaurant Web Application**

A full-stack restaurant management system built with **Laravel**, **React + TypeScript**, **Inertia.js**, **TailwindCSS**, and **MySQL** — designed for restaurant owners, managers, cashiers, and kitchen staff to efficiently manage orders, menus, invoices, reservations, customers, inventory, staff schedules, and more.

---

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-11-red" />
  <img src="https://img.shields.io/badge/React-18-blue" />
  <img src="https://img.shields.io/badge/Inertia.js-purple" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38bdf8" />
  <img src="https://img.shields.io/badge/MySQL-8.0-yellow" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

# 📌 **Table of Contents**

* [Overview](#overview)
* [Key Features](#key-features)
* [Screenshots](#screenshots)
* [System Architecture](#system-architecture)
* [Tech Stack](#tech-stack)
* [Database Schema](#database-schema)
* [Project Structure](#project-structure)
* [Installation](#installation)
* [Environment Setup](#environment-setup)
* [Database Seeding](#database-seeding)
* [Running with Docker](#running-with-docker)
* [API Documentation](#api-documentation)
* [User Roles & Permissions](#user-roles--permissions)
* [Testing](#testing)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [License](#license)

---

# 🌟 **Overview**

The **NKH Restaurant Web App** is a complete end-to-end management system for restaurants.
It includes a modern dashboard, POS system, order management, reservations, menu control, customer tracking, loyalty points, promo management, and staff administration.

The UI is clean, dark-themed, and optimized for productivity — minimizing clicks and speeding up daily operations.

---

# 🚀 **Key Features**

### 🔧 **Admin Dashboard**

* Overview of sales, revenue, active orders, reservations, staff, and more.
* Role-based analytics based on user permissions.

### 🛒 **Point of Sale (POS)**

* Fast item selection.
* Category-based filtering.
* Cart management (add, remove, increase, decrease qty).
* Customer selection + loyalty point system.
* Apply promotions/discounts.
* Supports dine-in, takeaway, delivery.

### 📦 **Order Management**

* Track all orders in real time.
* Status workflow: `received → preparing → ready → completed`.
* Order type badges: **pickup**, **delivery**, **dine-in**.
* Edit, view, cancel, or complete orders.
* Sort + filter by status or type.

> **Screenshot Placeholder**
> *Insert screenshot: /screenshots/orders.png*

### 🍔 **Menu Items**

* CRUD menu items.
* Upload images.
* Manage ingredients & cost.
* Assign to multiple categories.

### 📂 **Categories**

* Supports parent/child category hierarchy.
* Prevents deletion if subcategories or items exist.

### 📅 **Reservations**

* Schedule tables.
* Automatically block time slots.
* Assign customers & tables.

### 👤 **Customers**

* Customer profile.
* Order history.
* Loyalty points tracking.

### 🏷️ **Promotions**

* Auto apply percentage/fixed discounts.
* Date & time-based activation.

### 👥 **Employees**

* Role management.
* Work schedule.
* Permissions.

### 🧾 **Invoices**

* Auto-generated invoice numbers.
* Export to PDF.
* Tax configuration.

### 💰 **Expenses**

* Track daily restaurant expenses.
* Attach receipts.

### 🗂️ **Floors & Tables**

* Manage restaurant floor plans.
* Assign tables to orders.

---

# 🖼️ **Screenshots**

(Replace these with your real images)

```
/screenshots/dashboard.png
/screenshots/orders.png
/screenshots/pos.png
/screenshots/menu.png
/screenshots/customers.png
```

---

# 🏗️ **System Architecture**

```
┌──────────────────┐       ┌──────────────────────┐
│   React (TS)      │ ◀───▶ │   Inertia.js Bridge   │
└──────────────────┘       └──────────────────────┘
             ▲                      │
             │                      ▼
┌──────────────────┐       ┌──────────────────────┐
│   TailwindCSS     │       │   Laravel 11 (API)   │
└──────────────────┘       └──────────────────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │    MySQL 8.0       │
                           └───────────────────┘
```

---

# 🛠️ **Tech Stack**

### **Frontend**

* React 18
* TypeScript
* Inertia.js
* TailwindCSS
* ShadCN UI
* Axios
* Zustand / Redux (if used)

### **Backend**

* Laravel 11
* Laravel Sanctum (Auth)
* MySQL 8
* Eloquent ORM
* Spatie Permission (if used)

### **DevOps**

* Docker & Docker Compose
* NGINX
* GitHub Actions CI/CD (optional)

---

# 🗄️ **Database Schema (Summary)**

### Core Tables

| Table          | Description                      |
| -------------- | -------------------------------- |
| users          | Admins, managers, waiters, chefs |
| roles          | Role-based access                |
| categories     | Menu categories                  |
| menu_items     | Menu items                       |
| orders         | Customer orders                  |
| order_items    | Order line items                 |
| reservations   | Table reservations               |
| customers      | Customer profile                 |
| invoices       | Sales invoices                   |
| expenses       | Cost tracking                    |
| loyalty_points | Customer reward system           |

---

# 📁 **Project Structure**

```
project/
├── app/
│   ├── Models/
│   ├── Http/
│   └── ...
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   ├── Components/
│   │   └── ...
│   ├── views/
├── routes/
│   ├── api.php
│   ├── web.php
│   └── admin.php
├── database/
│   ├── migrations/
│   ├── seeders/
└── docker/
    ├── nginx/
    ├── php/
    ├── mysql/
```

---

# ⚙️ **Installation**

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/yourname/nkh-restaurant.git
cd nkh-restaurant
```

### 2️⃣ Install Backend Dependencies

```bash
composer install
```

### 3️⃣ Install Frontend Dependencies

```bash
npm install
```

### 4️⃣ Build Frontend

```bash
npm run build
```

### 5️⃣ Run Migrations

```bash
php artisan migrate
```

---

# 🔧 **Environment Setup (.env)**

Example `.env` configuration:

```
APP_NAME=NKH Restaurant
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nkh_db
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost
SESSION_DOMAIN=localhost
```

---

# 🌱 **Database Seeding**

```bash
php artisan db:seed
```

Seeds:

* Admin account
* Roles
* Sample menu categories
* Demo menu items

---

# 🐳 **Running with Docker**

### Run full stack

```bash
docker compose up -d
```

### Rebuild

```bash
docker compose build --no-cache
```

### View logs

```bash
docker compose logs -f
```

---

# 📡 **API Documentation**

### Example: **GET Orders**

```
GET /api/admin/orders?status=preparing
```

Response:

```json
{
  "id": 12,
  "customer": "Sample Customer",
  "total": 69.85,
  "status": "preparing"
}
```

### Example: **POST Create Order**

```
POST /api/orders
```

---

# 🔐 **User Roles & Permissions**

| Role    | Abilities                    |
| ------- | ---------------------------- |
| Admin   | Full system access           |
| Manager | Manage staff, menu, orders   |
| Chef    | View & update kitchen orders |
| Cashier | POS, payments                |
| Waiter  | Create orders, reservations  |

---

# 🧪 **Testing**

### Backend tests

```bash
php artisan test
```

### Frontend tests

```bash
npm run test
```

---

# 🩺 **Troubleshooting**

### 401 / 403 Errors

* Check Sanctum configuration
* Verify CSRF token
* Confirm your SPA domain matches `.env`

### Docker MySQL not connecting

```bash
docker compose down -v
docker compose up -d
```

### Node build failing

```bash
rm -rf node_modules
npm install
```

---

# 🤝 **Contributing**

1. Fork repo
2. Create feature branch
3. Submit PR

---

# 📄 **License**

MIT License — free to use and modify.

---