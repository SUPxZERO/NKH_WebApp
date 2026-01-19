<div align="center">

# 🍜 NKH Restaurant Management System

### Enterprise-Grade Full-Stack Restaurant Operations Platform

[![Laravel 11](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MySQL 8](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)

**A comprehensive restaurant management ecosystem built for modern hospitality businesses — from quick-service cafés to multi-location restaurant chains.**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🎯 Why NKH?

NKH Restaurant is not just another POS system — it's a **complete digital transformation platform** designed to handle every aspect of restaurant operations:

| Challenge | NKH Solution |
|-----------|--------------|
| Slow order processing | ⚡ Real-time POS with <100ms response |
| Staff scheduling chaos | 📅 Automated shift management with conflict detection |
| Inventory wastage | 📊 Recipe-based auto-deduction + predictive alerts |
| Customer retention | 💎 Built-in loyalty program with tier progression |
| Multi-location complexity | 🏢 Centralized dashboard with per-location analytics |

---

## ✨ Features

### 🖥️ **Point of Sale (POS)**
- Lightning-fast menu browsing with category filtering
- Cart management with modifiers and special instructions
- Multiple payment methods: Cash, Card, QR (Stripe integration)
- Split payments and partial refunds
- Table QR code ordering for dine-in customers

### 📦 **Order Management**
- Real-time order tracking: `Pending → Preparing → Ready → Completed`
- Kitchen Display System (KDS) ready
- Order type badges: Dine-in, Takeaway, Delivery
- Scheduled orders and time slot management
- Telegram bot notifications for staff

### 🍔 **Menu & Recipe Management**
- Multi-language support (English, Khmer)
- Ingredient-level recipe building with cost calculation
- Allergen and dietary tagging
- Featured items and promotional pricing
- Image upload with automatic optimization

### 📊 **Inventory Control**
- Real-time stock tracking per location
- Purchase order workflow with supplier management
- Automatic inventory deduction on order completion
- Low stock alerts with configurable thresholds
- Adjustment logs with approval workflow

### 👥 **Human Resources**
- Employee profiles with position and department hierarchy
- Shift scheduling with drag-and-drop calendar
- Time-off request management
- Attendance tracking with clock-in/out
- Payroll generation with hourly/monthly rates

### 📅 **Reservations**
- Online table booking with availability calendar
- Party size and special request handling
- SMS/Email confirmation (configurable)
- No-show tracking and customer behavior analytics

### 💎 **Customer Loyalty**
- Points-based reward system
- Tiered membership (Bronze → Silver → Gold → Platinum)
- Referral code generation
- Order history and preferences tracking
- Targeted promotional campaigns

### 📈 **Analytics & Reporting**
- Real-time dashboard with KPIs
- Sales analytics by time period, category, item
- Employee performance metrics
- Financial reports with expense tracking
- Exportable reports (PDF/Excel)

### 🔐 **Security & Access Control**
- Role-based access control (RBAC) with granular permissions
- Multi-factor authentication (MFA)
- Audit logs for all critical operations
- Session management and device tracking
- API token management via Laravel Sanctum

### 🤖 **Telegram Integration**
- Customer ordering via Telegram bot
- Real-time order notifications for staff
- Admin commands for quick operations
- Guest ordering without login

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React 18  │──│ TypeScript  │──│  TailwindCSS + Shadcn   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│              │           │                    │                  │
│              └───────────┴────────────────────┘                  │
│                          │                                       │
│                   ┌──────▼──────┐                                │
│                   │ Inertia.js  │ (SPA Bridge)                   │
│                   └──────┬──────┘                                │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                        Backend Layer                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Laravel 11                               │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────────┐  │  │
│  │  │ Sanctum │ │ Eloquent│ │ Jobs/    │ │ Event           │  │  │
│  │  │ Auth    │ │ ORM     │ │ Queues   │ │ Broadcasting    │  │  │
│  │  └─────────┘ └─────────┘ └──────────┘ └─────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          │                                       │
│              ┌───────────┴───────────┐                           │
│              ▼                       ▼                           │
│       ┌────────────┐          ┌────────────┐                     │
│       │  MySQL 8.0 │          │   Redis    │                     │
│       │  (70 Tables)│          │  (Cache)   │                     │
│       └────────────┘          └────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | Type-safe, component-driven UI |
| **Styling** | TailwindCSS + Shadcn/UI | Utility-first design system |
| **State** | Zustand + React Query | Client state & server cache |
| **Routing** | Inertia.js | SPA experience without API boilerplate |
| **Backend** | Laravel 11 | Enterprise PHP framework |
| **Auth** | Laravel Sanctum | SPA + API token authentication |
| **Database** | MySQL 8.0 | Relational data with 70 normalized tables |
| **Payments** | Stripe | Card & QR payments |
| **PDF** | DomPDF | Invoice & receipt generation |
| **Charts** | Recharts + Nivo | Data visualization |

---

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+
- Node.js 18+
- MySQL 8.0+
- Composer 2.x

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nkh-restaurant.git
cd nkh-restaurant

# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Configure your database in .env, then:
php artisan migrate:fresh --seed

# Build frontend assets
npm run build

# Start development servers
composer dev   # Runs PHP + Vite + Queue + Logs concurrently
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `demo@admin.com` | `Demo123` |
| **Manager** | `manager@nkhrestaurant.com` | `manager123` |
| **Employee** | `staff@restaurant.com` | `Demo123` |
| **Customer** | `customer@example.com` | `Demo123` |

---

## 🐳 Docker Deployment

```bash
# Production build
docker compose up -d

# View logs
docker compose logs -f app

# Reset database
docker compose exec app php artisan migrate:fresh --seed
```

---

## 📁 Project Structure

```
nkh-restaurant/
├── app/
│   ├── Http/Controllers/
│   │   ├── Api/              # 87 API controllers
│   │   │   ├── OrderController.php
│   │   │   ├── PaymentController.php
│   │   │   ├── InventoryController.php
│   │   │   └── ...
│   │   └── Auth/             # Authentication controllers
│   ├── Models/               # 59 Eloquent models
│   └── Services/             # Business logic
├── resources/
│   └── js/
│       ├── Pages/
│       │   ├── admin/        # 37+ admin views
│       │   ├── Customer/     # 19 customer-facing views
│       │   └── Employee/     # 14 employee portal views
│       └── Components/       # Reusable UI components
├── database/
│   ├── migrations/           # 70 table migrations
│   └── seeders/              # Comprehensive demo data
├── routes/
│   ├── api.php              # ~45KB of API routes
│   ├── web.php              # Web routes with Inertia
│   └── admin-secure.php     # Protected admin routes
└── tests/
    ├── Feature/              # 23 feature tests
    └── Unit/                 # 7 unit tests
```

---

## 🗄️ Database Schema

The system uses **70 normalized tables** organized into these domains:

| Domain | Tables | Description |
|--------|--------|-------------|
| **Core** | `users`, `roles`, `permissions`, `locations` | Authentication & multi-tenancy |
| **Menu** | `categories`, `menu_items`, `recipes`, `ingredients` | Product catalog with costing |
| **Orders** | `orders`, `order_items`, `invoices`, `payments` | Transaction processing |
| **Inventory** | `inventory`, `purchase_orders`, `suppliers` | Stock management |
| **HR** | `employees`, `shifts`, `attendances`, `payrolls` | Workforce management |
| **CRM** | `customers`, `loyalty_points`, `reservations` | Customer relationship |
| **System** | `audit_logs`, `settings`, `notifications` | Platform operations |

---

## 🔐 Role-Based Access

| Role | Dashboard | POS | Orders | Menu | Inventory | HR | Reports | Settings |
|------|:---------:|:---:|:------:|:----:|:---------:|:--:|:-------:|:--------:|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **Manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ |
| **Chef** | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| **Cashier** | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Waiter** | ⚠️ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

✅ Full Access | ⚠️ Limited | ❌ No Access

---

## 📡 API Reference

All API endpoints are prefixed with `/api/` and require authentication via Sanctum.

### Core Endpoints

```http
# Orders
GET    /api/orders              # List orders with filters
POST   /api/orders              # Create new order
PATCH  /api/orders/{id}/status  # Update order status
DELETE /api/orders/{id}         # Cancel order

# Menu
GET    /api/menu-items          # List menu items
POST   /api/menu-items          # Create menu item
PUT    /api/menu-items/{id}     # Update menu item

# Payments
POST   /api/payments            # Process payment
POST   /api/payments/split      # Split payment
POST   /api/refunds             # Issue refund

# Inventory
GET    /api/inventory           # Stock levels
POST   /api/inventory/adjust    # Adjust stock
POST   /api/purchase-orders     # Create PO
```

See [docs/API.md](docs/) for complete API documentation.

---

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific suite
php artisan test --testsuite=Feature
```

---

## 📋 Roadmap

- [ ] Kitchen Display System (KDS) real-time board
- [ ] Mobile app (React Native)
- [ ] AI-powered demand forecasting
- [ ] Multi-currency support
- [ ] Accounting software integrations (QuickBooks, Xero)
- [ ] Advanced analytics with ML insights

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the hospitality industry**

[Report Bug](https://github.com/your-org/nkh-restaurant/issues) • [Request Feature](https://github.com/your-org/nkh-restaurant/issues)

</div>