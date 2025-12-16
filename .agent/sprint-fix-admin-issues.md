# Sprint Plan: Fix All Admin Panel Issues

## Sprint Overview
**Goal**: Fix 11 critical issues in the admin panel affecting reservations, notifications, categories, menu items, recipes, purchase orders, and inventory management.

**Duration**: 1 Sprint
**Priority**: High - Blocking admin operations

---

## Issue Breakdown & Priorities

### 🔴 CRITICAL (Fix First)
1. **Inventory Transfer/Wastage Errors** - Database constraint violation blocking operations
2. **Inventory Reports Print Error** - SQL query ambiguity causing failures
3. **Reservations Floor/Table Not Showing** - Missing API routes blocking booking creation

### 🟡 HIGH (Fix Second)
4. **Categories Sub-category Duplication** - Data integrity issue
5. **Purchase Orders Duplication** - Data integrity issue
6. **Menu Item Images Not Displaying** - User-facing display issue

### 🟢 MEDIUM (Fix Third)
7. **Notifications UI/UX & Send Functionality** - Communication feature broken
8. **Recipe Cost Calculations** - Missing business logic
9. **Inventory View History Error** - Ambiguous column in query
10. **Inventory Reports Graphs Empty** - Analytics not working

---

## Sprint Tasks

### Phase 1: Database & Migration Fixes (CRITICAL)

#### Task 1.1: Fix Inventory Transactions `unit` Field
**File**: `database/migrations/2025_09_18_080046_create_inventory_transactions_table.php`
**Issue**: `unit` column is NOT NULL but never populated
**Fix**: Make `unit` nullable
**Lines**: 21

#### Task 1.2: Fix Ambiguous Column References in Reports
**Files**:
- `app/Http/Controllers/Api/ReportsController.php` (Lines: 55, 166, 241, 269)
- `app/Http/Controllers/Api/AnalyticsController.php` (Line: 269)
**Issue**: `created_at` column ambiguous when joining tables
**Fix**: Prefix with table name `inventory_transactions.created_at`

#### Task 1.3: Fix Inventory View History Ambiguous Column
**File**: `app/Http/Controllers/Api/InventoryController.php` (Line: 162)
**Issue**: Same ambiguous `created_at` issue
**Fix**: Add table prefix

---

### Phase 2: Missing API Routes (CRITICAL)

#### Task 2.1: Add Tables API Routes
**File**: `routes/admin-secure.php`
**Missing Routes**:
- GET `/api/admin/tables` (with floor_id filter)
- GET `/api/admin/tables/{table}`
- POST `/api/admin/tables`
- PUT `/api/admin/tables/{table}`
- DELETE `/api/admin/tables/{table}`

#### Task 2.2: Add Floors API Routes
**File**: `routes/admin-secure.php`
**Missing Routes**:
- GET `/api/admin/floors` (with location_id filter)
- GET `/api/admin/floors/{floor}`
- POST `/api/admin/floors`
- PUT `/api/admin/floors/{floor}`
- DELETE `/api/admin/floors/{floor}`

#### Task 2.3: Add Locations API Routes
**File**: `routes/admin-secure.php`
**Missing Routes**:
- GET `/api/admin/locations`

#### Task 2.4: Add Notifications API Routes
**File**: `routes/admin-secure.php`
**Missing Routes**:
- POST `/api/admin/notifications`

---

### Phase 3: Controller Fixes (HIGH)

#### Task 3.1: Fix CategoryController Duplication
**File**: `app/Http/Controllers/Api/CategoryController.php` (Lines: 147-169)
**Fix**:
- Add unique validation for (parent_id, slug) combination
- Add duplicate check before creating

#### Task 3.2: Fix PurchaseOrderController Duplication
**File**: `app/Http/Controllers/Api/PurchaseOrderController.php` (Line: 89)
**Fix**:
- Implement missing `generatePONumber()` method
- Add unique constraint to `po_number` column
- Wrap creation in DB transaction

#### Task 3.3: Fix InventoryController - Add Unit Field
**File**: `app/Http/Controllers/Api/InventoryController.php`
**Locations**:
- Lines 90-112 (transfer method)
- Lines 139-149 (recordWastage method)
**Fix**: Add `'unit' => $ingredient->unit` to InventoryTransaction creation

#### Task 3.4: Fix NotificationController Store Method
**File**: `app/Http/Controllers/Api/NotificationController.php` (Lines: 86-114)
**Fix**:
- Use Laravel's notification system properly
- Remove manual UUID and timestamp setting
- Fix notification creation logic

---

### Phase 4: Resource & Frontend Fixes (MEDIUM)

#### Task 4.1: Fix Menu Item Image URLs
**File**: `app/Http/Resources/MenuItemResource.php`
**Fix**:
- Convert `image_path` to full URL using `Storage::url()`
- Format: `'image_url' => $this->image_path ? Storage::url($this->image_path) : null`

#### Task 4.2: Ensure Storage Symlink Exists
**Command**: Run `php artisan storage:link`

#### Task 4.3: Fix Notifications UI/UX
**File**: `resources/js/Pages/admin/Notifications.tsx`
**Fix**:
- Improve form clarity (who to send to)
- Add loading states
- Show success/error feedback clearly

#### Task 4.4: Add Recipe Cost Calculation Methods
**File**: `app/Http/Controllers/Api/RecipeController.php`
**Fix**:
- Implement `updateRecipeCost()` method
- Implement `costing()` endpoint
- Calculate: total_cost, cost_per_serving, margin, breakdown

#### Task 4.5: Fix Inventory Reports Data Structure
**File**: `app/Http/Controllers/Api/ReportsController.php`
**Fix**:
- Ensure data format matches frontend chart expectations
- Return proper date/value arrays for graphs

---

### Phase 5: Database Constraints & Validation

#### Task 5.1: Add Unique Constraint for PO Numbers
**Migration**: Create new migration
**Fix**: Add unique index on `purchase_orders.po_number`

#### Task 5.2: Add Unique Constraint for Categories
**Migration**: Create new migration
**Fix**: Add unique index on `categories (parent_id, slug)`

#### Task 5.3: Add Frontend Debouncing
**Files**: Various admin pages
**Fix**: Add submission debouncing to prevent double-clicks

---

## Implementation Order

1. ✅ **Database Migration Fixes** (Task 1.1) - Make unit nullable
2. ✅ **Fix SQL Ambiguous Columns** (Tasks 1.2, 1.3) - Add table prefixes
3. ✅ **Add Missing API Routes** (Tasks 2.1-2.4) - Enable frontend communication
4. ✅ **Fix InventoryController Unit Field** (Task 3.3) - Add unit to transactions
5. ✅ **Fix Category Duplication** (Task 3.1) - Add validation
6. ✅ **Fix PO Duplication** (Task 3.2) - Implement generatePONumber
7. ✅ **Fix Menu Item Images** (Tasks 4.1, 4.2) - URL conversion & symlink
8. ✅ **Fix Recipe Calculations** (Task 4.4) - Implement costing methods
9. ✅ **Fix Notifications** (Tasks 3.4, 4.3) - Controller + UI
10. ✅ **Fix Inventory Reports** (Task 4.5) - Data structure
11. ✅ **Add Database Constraints** (Tasks 5.1, 5.2) - Prevent future duplicates
12. ✅ **Add Frontend Debouncing** (Task 5.3) - Prevent double submissions

---

## Testing Checklist

- [ ] Reservations: Can select location → floor → table
- [ ] Notifications: Can send notification and see confirmation
- [ ] Categories: Sub-category creation doesn't duplicate
- [ ] Menu Items: Uploaded images display correctly
- [ ] Recipes: Cost calculations show all metrics
- [ ] Purchase Orders: No duplication on creation
- [ ] Inventory: Transfer works without unit error
- [ ] Inventory: Wastage works without unit error
- [ ] Inventory: View history displays correctly
- [ ] Inventory Reports: Graphs show data
- [ ] Inventory Reports: Print/export works

---

## Risk Assessment

**Low Risk**: Tasks 1.1, 1.2, 1.3, 2.x, 3.3, 4.1, 4.2
**Medium Risk**: Tasks 3.1, 3.2, 3.4, 4.4, 4.5
**High Risk**: None (all fixes are well-scoped)

---

## Success Criteria

1. All 11 issues resolved
2. No new bugs introduced
3. Database integrity maintained
4. All tests pass
5. Admin panel fully operational
