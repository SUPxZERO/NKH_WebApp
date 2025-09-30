# 🎯 **MASTER PROMPT: Complete NKH Restaurant Database Seeding**

## **OBJECTIVE**
Create comprehensive Laravel database seeders for ALL tables in the NKH Restaurant Management System with realistic, working data that demonstrates the full functionality of the restaurant system.

## **DATABASE ANALYSIS REQUIRED**
Analyze the complete database schema from `/home/seng-sok-ang/Documents/NKH_WebApp/nkh_restaurant.sql` and create seeders for these core entities:

### **🏢 CORE BUSINESS ENTITIES**
- **locations** - Restaurant branches/locations
- **users** - System users (admin, managers, employees, customers)
- **employees** - Staff members with positions and schedules
- **customers** - Customer profiles with addresses and preferences
- **positions** - Job positions (Manager, Waiter, Chef, etc.)

### **📋 MENU & CATEGORIES**
- **categories** - Menu categories (with hierarchical parent/child support)
- **category_translations** - Multi-language category names
- **menu_items** - Restaurant menu items with pricing
- **menu_item_translations** - Multi-language menu item descriptions
- **ingredients** - Inventory ingredients for recipes
- **inventory_transactions** - Stock movements and adjustments

### **🛒 ORDERS & SALES**
- **orders** - Customer orders (dine-in, pickup, delivery)
- **order_items** - Individual items within orders
- **invoices** - Billing and payment records
- **payments** - Payment transactions and methods
- **payment_methods** - Available payment options

### **🏢 RESTAURANT OPERATIONS**
- **floors** - Restaurant floor layouts
- **tables** - Dining tables with capacity and status
- **reservations** - Table bookings and customer reservations
- **attendances** - Employee clock-in/out records
- **leave_requests** - Staff leave applications

### **💰 FINANCIAL MANAGEMENT**
- **expense_categories** - Business expense categories
- **expenses** - Business expenditures and costs
- **loyalty_points** - Customer reward points system
- **promotions** - Marketing campaigns and discounts

### **📊 SYSTEM & AUDIT**
- **feedback** - Customer reviews and ratings
- **audit_logs** - System activity tracking
- **settings** - Application configuration
- **notifications** - System alerts and messages

## **SEEDING REQUIREMENTS**

### **🎯 DATA QUALITY STANDARDS**
1. **Realistic Data**: Use authentic restaurant names, addresses, menu items, and prices
2. **Relational Integrity**: Ensure all foreign keys reference valid records
3. **Business Logic**: Follow restaurant industry standards and workflows
4. **Variety**: Create diverse data showing different scenarios and use cases
5. **Volume**: Generate sufficient data to test pagination, filtering, and search

### **📊 SPECIFIC DATA REQUIREMENTS**

#### **Locations (3-5 branches)**
```php
- Restaurant chain with multiple locations
- Real addresses in different cities
- Phone numbers, emails, operating hours
- Different location types (flagship, mall, street)
```

#### **Users & Authentication (50+ users)**
```php
- 2-3 Admin users
- 5-8 Manager users  
- 15-20 Employee users (waiters, chefs, cashiers)
- 25-30 Customer users
- Realistic names, emails, phone numbers
- Proper role assignments and permissions
```

#### **Menu System (100+ items)**
```php
Categories:
- Appetizers (Hot Appetizers, Cold Appetizers)
- Main Dishes (Pasta, Pizza, Grilled, Seafood)
- Desserts (Cakes, Ice Cream, Pastries)
- Beverages (Hot Drinks, Cold Drinks, Alcoholic)
- Salads & Soups

Menu Items:
- Authentic dish names and descriptions
- Realistic pricing ($8-45 range)
- Ingredient lists and allergen info
- High-quality food images (use placeholder URLs)
- Popularity ratings and availability status
```

#### **Orders & Sales (200+ orders)**
```php
- Mix of dine-in, pickup, and delivery orders
- Various order statuses (pending, preparing, ready, completed)
- Different payment methods and amounts
- Order items with quantities and customizations
- Realistic timestamps spanning last 3 months
```

#### **Restaurant Operations**
```php
Tables & Floors:
- 3-4 floors per location
- 8-12 tables per floor
- Different table capacities (2, 4, 6, 8 seats)
- Various table statuses

Reservations:
- Future and past reservations
- Different party sizes and occasions
- Customer contact information
- Special requests and notes

Staff Management:
- Employee schedules and attendance
- Leave requests (approved, pending, denied)
- Different positions and salary ranges
- Performance tracking data
```

#### **Financial Data**
```php
Expenses:
- Rent, utilities, supplies, marketing
- Monthly recurring and one-time expenses
- Different expense categories and amounts
- Proper approval workflows

Loyalty Points:
- Customer point earning and redemption history
- Different point values and transactions
- Reward tier systems

Promotions:
- Active and expired promotional campaigns
- Different discount types and conditions
- Usage tracking and performance metrics
```

### **🖼️ IMAGE HANDLING**
For image fields, use these approaches:
1. **Placeholder Services**: 
   - `https://picsum.photos/400/300` for general images
   - `https://foodish-api.herokuapp.com/images/` for food images
   - `https://ui-avatars.com/api/?name=John+Doe` for user avatars

2. **Sample Image URLs**: Create a collection of realistic food/restaurant images
3. **Local Placeholders**: Reference existing placeholder images in storage

### **🔧 TECHNICAL IMPLEMENTATION**

#### **Seeder Structure**
```php
Create these seeder files:
1. LocationSeeder.php
2. UserSeeder.php  
3. PositionSeeder.php
4. EmployeeSeeder.php
5. CustomerSeeder.php
6. CategorySeeder.php
7. MenuItemSeeder.php
8. IngredientSeeder.php
9. FloorSeeder.php
10. TableSeeder.php
11. OrderSeeder.php
12. InvoiceSeeder.php
13. ReservationSeeder.php
14. ExpenseSeeder.php
15. LoyaltyPointSeeder.php
16. PromotionSeeder.php
17. FeedbackSeeder.php
18. AuditLogSeeder.php
```

#### **Faker Usage**
```php
Use Laravel Faker for:
- Names, addresses, phone numbers
- Realistic dates and timestamps  
- Lorem ipsum text for descriptions
- Random numbers within business ranges
- Email addresses and URLs
```

#### **Factory Integration**
```php
Create Model Factories for:
- User, Employee, Customer
- MenuItem, Category, Order
- Reservation, Invoice, Expense
- All major entities with relationships
```

### **📋 EXECUTION CHECKLIST**

#### **Phase 1: Foundation Data**
- [ ] Locations (restaurant branches)
- [ ] Users (all roles and permissions)
- [ ] Positions (job roles and hierarchies)
- [ ] Settings (system configuration)

#### **Phase 2: Menu & Inventory**
- [ ] Categories (hierarchical structure)
- [ ] Menu Items (with images and pricing)
- [ ] Ingredients (inventory management)
- [ ] Category/Menu Item Translations

#### **Phase 3: Operations**
- [ ] Floors & Tables (restaurant layout)
- [ ] Employees (staff assignments)
- [ ] Customers (with addresses and preferences)

#### **Phase 4: Business Data**
- [ ] Orders (sales transactions)
- [ ] Order Items (detailed line items)
- [ ] Invoices (billing records)
- [ ] Payments (transaction history)

#### **Phase 5: Advanced Features**
- [ ] Reservations (table bookings)
- [ ] Expenses (business costs)
- [ ] Loyalty Points (customer rewards)
- [ ] Promotions (marketing campaigns)
- [ ] Feedback (customer reviews)
- [ ] Audit Logs (system tracking)

### **🎯 VALIDATION REQUIREMENTS**

After seeding, the system should demonstrate:
1. **Complete Restaurant Operations**: Orders, payments, reservations working
2. **Staff Management**: Employee schedules, attendance, leave requests
3. **Inventory Tracking**: Ingredient levels, stock movements, reorder alerts
4. **Customer Experience**: Menu browsing, ordering, loyalty points, feedback
5. **Financial Reporting**: Sales analytics, expense tracking, profit margins
6. **Multi-location Support**: Data distributed across restaurant branches

### **📊 SUCCESS CRITERIA**

The seeded database should enable:
- **Admin Dashboard**: Showing real analytics and KPIs
- **Menu Management**: Categories with items and proper hierarchy
- **Order Processing**: Complete order-to-payment workflows
- **Table Management**: Reservations and seating optimization
- **Staff Operations**: Employee management and scheduling
- **Customer Portal**: Account management and order history
- **Financial Reports**: Revenue, expenses, and profitability analysis

## **🚀 IMPLEMENTATION COMMAND**

```bash
# Create all seeders
php artisan make:seeder DatabaseSeeder
php artisan make:seeder LocationSeeder
php artisan make:seeder UserSeeder
# ... (create all required seeders)

# Run complete seeding
php artisan db:seed

# Verify data integrity
php artisan tinker
# Test relationships and data quality
```

## **📋 DELIVERABLES**

1. **Complete Seeder Files** - All 18+ seeder classes
2. **Model Factories** - Factory classes for major entities  
3. **DatabaseSeeder.php** - Master seeder orchestrating all others
4. **Seed Verification Script** - Commands to validate data integrity
5. **Documentation** - Seeding guide and data overview

**GOAL**: Create a fully populated, production-ready restaurant management system that showcases all features with realistic, interconnected data demonstrating the complete business workflow from menu management to customer orders to financial reporting.
