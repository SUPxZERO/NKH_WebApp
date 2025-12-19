# Comprehensive Seeder Improvement Plan
## NKH Restaurant Management System

---

## 🎯 MAIN OBJECTIVES

1. **Fix Menu Structure**: Menu items should ONLY connect to sub-categories (not main categories)
2. **Improve Data Quality**: Realistic, complete, and diverse data across all tables
3. **Ensure Data Integrity**: Proper relationships and foreign key constraints
4. **Add More Variety**: Expand datasets for better testing and demonstration
5. **Multi-language Support**: Consistent English and Khmer translations

---

## 📋 CRITICAL ISSUE TO FIX

### Current Problem:
```
MenuItem → Category (can be main category OR sub-category)
```

### Required Structure:
```
Category (Main) → Category (Sub-category) → MenuItem
   ↓                     ↓                      ↓
parent_id=NULL      parent_id=X           category_id=sub_category_id
```

**Rule**: Menu items must ONLY have `category_id` pointing to categories where `parent_id IS NOT NULL` (sub-categories only)

---

## 🗂️ SEEDER IMPROVEMENT BREAKDOWN

### **PHASE 1: FOUNDATION (Core Infrastructure)**

#### 1.1 LocationSeeder ✅ (Keep mostly as-is, minor improvements)
**Current**: 3 locations
**Improvements**:
- Add more realistic operating details
- Add coordinates for mapping features
- Add contact information

**Data**:
```php
[
    'Main Branch' => [
        'address' => 'Detailed address with landmarks',
        'latitude' => 11.5564,
        'longitude' => 104.9282,
        'phone' => '+855 23 XXX XXX',
        'email' => 'main@nkh.com',
        'capacity' => 100
    ],
    'Downtown Branch' => [...],
    'Airport Branch' => [...]
]
```

#### 1.2 ComprehensiveRolesPermissionsSeeder ✅ (Good, minor tweaks)
**Current**: 7 roles with permissions
**Improvements**:
- Ensure notification permissions are included
- Add customer-specific permissions
- Verify all CRUD permissions exist

#### 1.3 PositionSeeder ✅ (Expand)
**Current**: Basic positions
**Improvements**:
- Add more positions (Host/Hostess, Bartender, Kitchen Porter)
- Add salary ranges
- Add job descriptions

---

### **PHASE 2: MENU SYSTEM (Priority Fix)**

#### 2.1 CategorySeeder 🔴 **CRITICAL FIX**
**Current Structure**:
```
Main Categories (parent_id = NULL):
├── Appetizers
├── Main Dishes
├── Soups & Salads
├── Desserts
└── Beverages

Sub-categories (parent_id = category.id):
├── Appetizers
│   ├── Hot Appetizers
│   ├── Cold Appetizers
│   └── Sharing Platters
├── Main Dishes
│   ├── Grilled Specialties
│   ├── Pasta & Noodles
│   ├── Seafood
│   └── Vegetarian
[etc...]
```

**Improvements**:
1. Add more categories for Asian restaurant:
   - **Rice & Noodle Dishes** (Main)
     - Fried Rice
     - Steamed Rice Dishes
     - Noodle Soups
     - Stir-fried Noodles
   - **Curries** (Main)
     - Red Curry
     - Green Curry
     - Yellow Curry
   - **Street Food** (Main)
     - Grilled Items
     - Fried Snacks
     - Spring Rolls & Dumplings
   - **Signature Dishes** (Main)
     - Chef Specials
     - Traditional Cambodian
     - Fusion

2. Add images to categories
3. Better Khmer translations
4. Add category descriptions for SEO

#### 2.2 MenuItemSeeder 🔴 **CRITICAL FIX**
**Current**: 26 items, some linked to main categories
**Required Changes**:
1. **Remove any menu items linked to main categories**
2. **ALL menu items must link to sub-categories only**
3. Expand to 80-100 menu items across all sub-categories

**New Data Structure**:
```php
// ❌ WRONG - Linked to main category
MenuItem::create([
    'category_id' => $appetizersId, // Main category
    'name' => 'Spring Rolls'
]);

// ✅ CORRECT - Linked to sub-category
MenuItem::create([
    'category_id' => $hotAppetizersId, // Sub-category
    'name' => 'Spring Rolls'
]);
```

**Menu Items to Add** (Examples per sub-category):

**Hot Appetizers**:
- Spring Rolls (Fresh/Fried)
- Chicken Satay
- Fish Cakes
- Crab Cakes
- Tempura Vegetables
- Stuffed Chicken Wings

**Cold Appetizers**:
- Papaya Salad
- Fresh Summer Rolls
- Beef Salad
- Seafood Platter

**Fried Rice**:
- Chicken Fried Rice
- Shrimp Fried Rice
- Pineapple Fried Rice
- Crab Fried Rice
- Vegetable Fried Rice

**Noodle Soups**:
- Pho Beef
- Pho Chicken
- Seafood Noodle Soup
- Wonton Noodle Soup

**Red Curry**:
- Red Curry Chicken
- Red Curry Beef
- Red Curry Seafood
- Red Curry Vegetables

[Continue for all sub-categories...]

**Required Fields for Each Item**:
```php
[
    'location_id' => $location->id,
    'category_id' => $subCategoryId, // MUST be sub-category
    'sku' => 'UNIQUE-SKU',
    'slug' => 'unique-slug',
    'price' => realistic_price,
    'cost' => cost (70-80% of price),
    'image_path' => 'menu/item-image.jpg',
    'is_popular' => true/false (20% should be popular),
    'is_featured' => true/false (10% should be featured),
    'featured_order' => order_number,
    'prep_time' => 5-15 minutes,
    'cook_time' => 10-30 minutes,
    'calories' => realistic_calories,
    'rating' => 4.0-5.0,
    'reviews_count' => 0-150,
    'nutrition' => ['protein' => 25, 'carbs' => 45, 'fat' => 15],
    'ingredients' => ['ingredient1', 'ingredient2'],
    'allergens' => ['peanuts', 'shellfish'],
    'dietary_tags' => ['halal', 'gluten-free', 'vegan'],
    'serving_size' => '1 plate',
    'spice_level' => 0-5,
    'availability_status' => 'available',
    'is_active' => true,
    'display_order' => sequential
]
```

#### 2.3 MenuItemTranslationSeeder ✅ (Improve)
**Current**: Basic translations
**Improvements**:
- Ensure ALL menu items have translations
- Better Khmer translations (not just transliterations)
- Add descriptive text for each item

---

### **PHASE 3: USERS & AUTHENTICATION**

#### 3.1 UserSeeder ✅ (Expand)
**Current**: ~15 users
**Improvements**:
- Add 30-50 users total:
  - 2 Super Admins
  - 3 Admins
  - 5 Managers (one per location)
  - 8 Waiters
  - 6 Chefs
  - 3 Cashiers
  - 4 Delivery Drivers
  - 20 Customers

**User Data**:
```php
[
    'name' => 'Full Name',
    'email' => 'unique@email.com',
    'password' => bcrypt('password'),
    'phone' => '+855 XX XXX XXX',
    'address' => 'Full address',
    'avatar' => 'avatars/user.jpg',
    'is_active' => true,
    'default_location_id' => $location->id
]
```

#### 3.2 EmployeeSeeder 🟡 (Improve)
**Improvements**:
- Link ALL employee users to employee records
- Add realistic salary data:
  - Chef: $800-1200
  - Waiter: $300-500
  - Manager: $1000-1500
- Add emergency contacts
- Add hire dates (spread over last 1-3 years)

#### 3.3 CustomerSeeder 🟡 (Expand & Improve)
**Current**: Basic customers
**Improvements**:
- Create customer records for ALL customer users
- Add customer tiers:
  - Bronze: 30 customers (new/low spending)
  - Silver: 15 customers (regular)
  - Gold: 10 customers (frequent)
  - Platinum: 5 customers (VIP)
- Add loyalty points based on tier:
  - Bronze: 0-500 points
  - Silver: 500-2000 points
  - Gold: 2000-5000 points
  - Platinum: 5000+ points
- Add visit counts and spending history
- Add last visit dates

---

### **PHASE 4: INVENTORY SYSTEM**

#### 4.1 UnitSeeder ✅ (Expand)
**Current**: Basic units
**Improvements**:
- Add more units:
  - kg, g, mg (weight)
  - L, mL (liquid)
  - piece, dozen, pack
  - bottle, can, bag
  - bunch, head (vegetables)

#### 4.2 IngredientSeeder 🟡 (Major Expansion)
**Current**: ~30 ingredients
**Target**: 100-150 ingredients

**Categories**:
1. **Proteins** (20):
   - Chicken (breast, thigh, whole), Beef, Pork, Shrimp, Fish, Crab, Squid, Duck, etc.

2. **Vegetables** (25):
   - Onion, Garlic, Ginger, Tomato, Carrot, Bell Pepper, Chili, Lettuce, Cabbage, etc.

3. **Rice & Noodles** (10):
   - Jasmine Rice, Sticky Rice, Rice Noodles, Egg Noodles, etc.

4. **Sauces & Condiments** (15):
   - Soy Sauce, Fish Sauce, Oyster Sauce, Sesame Oil, etc.

5. **Spices & Herbs** (20):
   - Lemongrass, Kaffir Lime, Basil, Cilantro, Turmeric, etc.

6. **Dairy & Eggs** (5):
   - Milk, Cream, Butter, Cheese, Eggs

7. **Oils & Fats** (5):
   - Vegetable Oil, Coconut Oil, Palm Oil, etc.

8. **Beverages** (15):
   - Coffee, Tea, Soft Drinks, Juices

9. **Dry Goods** (10):
   - Sugar, Salt, Flour, Cornstarch, etc.

**Data Structure**:
```php
[
    'name' => 'Ingredient Name',
    'category' => 'proteins',
    'unit_id' => $unit->id,
    'cost_per_unit' => realistic_cost,
    'stock_quantity' => current_stock,
    'minimum_stock' => reorder_point,
    'supplier_id' => $supplier->id,
    'is_active' => true,
    'allergen' => true/false,
    'storage_instructions' => 'Keep refrigerated',
    'shelf_life_days' => days
]
```

#### 4.3 SupplierSeeder ✅ (Expand)
**Current**: 3-5 suppliers
**Target**: 10-15 suppliers

**Types**:
- Fresh Meat Suppliers (2)
- Seafood Suppliers (2)
- Vegetable Suppliers (2)
- Dry Goods Suppliers (2)
- Beverage Distributors (2)
- Dairy Suppliers (1)
- Spice & Condiment Suppliers (2)

**Data**:
```php
[
    'name' => 'Supplier Name Co., Ltd.',
    'contact_person' => 'Contact Name',
    'email' => 'supplier@email.com',
    'phone' => '+855 XX XXX XXX',
    'address' => 'Full address',
    'payment_terms' => 'Net 30',
    'tax_id' => 'TAX-ID',
    'is_active' => true,
    'location_id' => $location->id
]
```

#### 4.4 InventorySeeder 🟡 (Improve)
**Improvements**:
- Create inventory records for ALL ingredients
- Set realistic stock levels:
  - High-use items: High stock
  - Perishables: Medium stock
  - Special items: Low stock
- Add batch numbers and expiry dates

#### 4.5 RecipeSeeder 🔴 **CRITICAL**
**Current**: Minimal recipes
**Target**: Recipes for 70-80% of menu items

**Structure**:
```php
Recipe::create([
    'menu_item_id' => $menuItem->id,
    'name' => $menuItem->name,
    'instructions' => 'Detailed cooking steps...',
    'prep_time' => 15,
    'cook_time' => 20,
    'difficulty' => 'medium',
    'servings' => 1
]);

// Recipe Ingredients
RecipeIngredient::create([
    'recipe_id' => $recipe->id,
    'ingredient_id' => $ingredient->id,
    'quantity' => 200, // grams
    'unit_id' => $unit->id,
    'preparation_notes' => 'Diced'
]);
```

---

### **PHASE 5: ORDERS & PAYMENTS**

#### 5.1 OrderSeeder 🟡 (Major Expansion)
**Current**: Limited orders
**Target**: 200-500 orders with variety

**Order Types**:
- Dine-in: 40%
- Takeout: 35%
- Delivery: 25%

**Order Status Distribution**:
- Pending: 5%
- Approved: 10%
- Preparing: 10%
- Ready: 5%
- Out for Delivery: 5%
- Delivered: 30%
- Completed: 30%
- Cancelled: 5%

**Date Range**: Last 3 months with realistic patterns
- Lunch peak: 11:30 AM - 1:30 PM
- Dinner peak: 6:00 PM - 9:00 PM
- Weekend higher volume

**Data**:
```php
[
    'order_number' => 'ORD-2024-0001',
    'customer_id' => $customer->id,
    'location_id' => $location->id,
    'table_id' => $table->id (dine-in only),
    'employee_id' => $waiter->id,
    'order_type' => 'dine_in',
    'status' => 'completed',
    'subtotal' => calculated,
    'tax' => 10% of subtotal,
    'discount' => promotional_discount,
    'total_amount' => final_amount,
    'payment_method' => 'cash/card/online',
    'payment_status' => 'paid',
    'special_instructions' => 'No peanuts',
    'created_at' => realistic_timestamp
]
```

#### 5.2 OrderItemSeeder 🟡 (Expand)
**Target**: 2-6 items per order

**Data**:
```php
[
    'order_id' => $order->id,
    'menu_item_id' => $menuItem->id,
    'quantity' => 1-3,
    'unit_price' => $menuItem->price,
    'subtotal' => quantity * unit_price,
    'special_instructions' => 'Extra spicy',
    'status' => 'completed'
]
```

#### 5.3 PaymentMethodSeeder ✅ (Complete)
**Methods**:
- Cash
- Credit Card (Visa, Mastercard, Amex)
- Debit Card
- Mobile Banking (ABA, Wing, etc.)
- QR Code (Bakong)
- Points Redemption

#### 5.4 InvoiceSeeder & PaymentSeeder 🟡 (Improve)
**Improvements**:
- Generate invoices for ALL paid orders
- Add payment records for ALL invoices
- Support split payments (20% of orders)
- Add payment confirmation details

---

### **PHASE 6: EMPLOYEE MANAGEMENT**

#### 6.1 ShiftSeeder (New) 🆕
**Create realistic shift schedules**:
- Morning: 6:00 AM - 2:00 PM
- Afternoon: 2:00 PM - 10:00 PM
- Evening: 6:00 PM - 11:00 PM
- Full Day: 9:00 AM - 5:00 PM (managers)

**Coverage**: Last 30 days + Next 14 days

#### 6.2 AttendanceSeeder (New/Improve) 🟡
**Create attendance records**:
- 95% attendance rate
- 5% late/absent
- Realistic clock-in/clock-out times
- Break times

#### 6.3 PayrollSeeder 🟡 (Expand)
**Create payroll for last 3 months**:
- Monthly salary payments
- Overtime calculations
- Deductions (tax, insurance)
- Bonuses for high performers

#### 6.4 LeaveRequestSeeder ✅ (Expand)
**Types**:
- Annual Leave
- Sick Leave
- Emergency Leave
- Unpaid Leave

**Status Distribution**:
- Approved: 70%
- Pending: 20%
- Rejected: 10%

---

### **PHASE 7: CUSTOMER ENGAGEMENT**

#### 7.1 CustomerAddressSeeder ✅ (Expand)
**Target**: 1-3 addresses per customer
- Home address (primary)
- Work address
- Other addresses

#### 7.2 LoyaltyPointSeeder 🟡 (Improve)
**Create transactions**:
- Points earned from orders (1 point per $1)
- Points redeemed
- Birthday bonuses
- Sign-up bonuses
- Referral bonuses

#### 7.3 ReservationSeeder ✅ (Expand)
**Target**: 50-100 reservations
**Status**:
- Confirmed: 40%
- Completed: 40%
- Cancelled: 10%
- No-show: 5%
- Pending: 5%

**Date Range**: Last 30 days + Next 30 days

#### 7.4 FeedbackSeeder (New/Improve) 🟡
**Target**: 30-40% of completed orders
**Ratings**: 3.5-5.0 stars (realistic distribution)
**Comments**: Variety of feedback types

---

### **PHASE 8: OPERATIONS**

#### 8.1 FloorSeeder & TableSeeder ✅ (Expand)
**Per Location**:
- Ground Floor: 15-20 tables (2-6 seats each)
- First Floor: 10-15 tables
- VIP Room: 3-5 tables (6-10 seats)
- Outdoor: 5-10 tables

**Table Status**:
- Available: 70%
- Occupied: 20%
- Reserved: 5%
- Maintenance: 5%

#### 8.2 OperatingHoursSeeder ✅ (Detail)
**Per Location**:
- Monday-Friday: 10:00 AM - 10:00 PM
- Saturday-Sunday: 9:00 AM - 11:00 PM
- Holidays: Special hours

#### 8.3 ExpenseSeeder 🟡 (Expand)
**Categories**:
- Utilities (electricity, water, internet)
- Rent/Lease
- Salaries (link to payroll)
- Marketing & Advertising
- Supplies & Equipment
- Maintenance & Repairs
- Insurance
- Licenses & Permits

**Frequency**: Last 6 months, realistic amounts

---

### **PHASE 9: NOTIFICATIONS & SYSTEM**

#### 9.1 NotificationSeeder (Improve) 🟡
**Create broadcast notifications**:
- System announcements
- Promotions
- Order updates
- Loyalty program updates
- Special events

**Target**: 20-30 notifications with proper targeting

#### 9.2 AuditLogSeeder ✅ (Expand)
**Log Types**:
- User login/logout
- Order creation/updates
- Payment transactions
- Menu changes
- Inventory adjustments
- Employee clock-in/out

**Volume**: Last 30 days, 100-200 entries

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Backup Current Database
```bash
php artisan db:seed --class=DatabaseSeeder > backup_before_changes.sql
```

### Step 2: Create New Seeder Files
Create improved versions:
- `ImprovedCategorySeeder.php`
- `ImprovedMenuItemSeeder.php`
- `ImprovedOrderSeeder.php`
- etc.

### Step 3: Update DatabaseSeeder.php
Update the order and include new seeders

### Step 4: Test Incrementally
Test each phase separately:
```bash
php artisan migrate:fresh
php artisan db:seed --class=ImprovedCategorySeeder
# Verify
php artisan db:seed --class=ImprovedMenuItemSeeder
# Verify
# Continue...
```

### Step 5: Validation
- Check all foreign keys are valid
- Verify menu items only link to sub-categories
- Test data integrity
- Check multilingual support

---

## ✅ SUCCESS CRITERIA

1. ✅ **Menu Structure**: 0 menu items linked to main categories (all linked to sub-categories)
2. ✅ **Data Volume**: 100+ menu items, 200+ orders, 50+ customers
3. ✅ **Relationships**: All foreign keys valid, no orphaned records
4. ✅ **Translations**: 100% menu items and categories have EN + KM translations
5. ✅ **Realism**: Prices, dates, quantities are realistic
6. ✅ **Variety**: Good distribution across categories, statuses, types
7. ✅ **Performance**: Seeding completes in under 5 minutes

---

## 📊 EXPECTED FINAL DATA COUNTS

| Table | Current | Target |
|-------|---------|--------|
| Categories (Main) | 5 | 8-10 |
| Sub-categories | 15 | 30-35 |
| Menu Items | 26 | 80-120 |
| Ingredients | 30 | 100-150 |
| Recipes | 10 | 60-90 |
| Users | 15 | 40-60 |
| Customers | 10 | 30-40 |
| Employees | 10 | 15-20 |
| Orders | 50 | 200-500 |
| Order Items | 100 | 600-1500 |
| Reservations | 10 | 50-100 |
| Payments | 40 | 200-500 |
| Loyalty Transactions | 20 | 100-200 |
| Feedbacks | 10 | 60-150 |
| Audit Logs | 50 | 150-300 |

---

## 🚨 CRITICAL VALIDATIONS

After seeding, run these checks:

```sql
-- CHECK 1: Menu items should ONLY link to sub-categories
SELECT mi.id, mi.name, c.name as category_name, c.parent_id
FROM menu_items mi
JOIN categories c ON mi.category_id = c.id
WHERE c.parent_id IS NULL;
-- Expected: 0 rows

-- CHECK 2: All menu items have translations
SELECT COUNT(*) FROM menu_items;
SELECT COUNT(DISTINCT menu_item_id) FROM menu_item_translations;
-- Should be equal

-- CHECK 3: All orders have items
SELECT COUNT(*) FROM orders WHERE id NOT IN (SELECT DISTINCT order_id FROM order_items);
-- Expected: 0

-- CHECK 4: All paid orders have payments
SELECT COUNT(*) FROM orders WHERE payment_status = 'paid'
AND id NOT IN (SELECT DISTINCT order_id FROM invoices);
-- Expected: 0

-- CHECK 5: Customer tiers are distributed
SELECT customer_tier, COUNT(*) FROM customers GROUP BY customer_tier;
-- Should show all tiers
```

---

## 📝 NOTES

- **Run incrementally**: Don't seed everything at once
- **Verify at each step**: Check data before moving to next phase
- **Keep backups**: Before major changes
- **Document changes**: Update this plan as you go
- **Test relationships**: Ensure foreign keys work
- **Consider performance**: Use chunk() for large datasets

---

**Plan Created**: 2024-12-19
**Status**: Ready for Implementation
**Priority**: HIGH - Menu structure fix is critical
