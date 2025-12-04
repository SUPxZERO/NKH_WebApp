# 🔧 ADMIN BUGS - COMPREHENSIVE FIX PLAN

## 📋 EXECUTIVE SUMMARY

This document contains identified issues and fixes for all admin pages. Each section provides:
- **Problem**: What's broken
- **Root Cause**: Why it's broken
- **Fix**: How to fix it
- **Files**: What to modify

---

## 1. RESERVATIONS - "Invalid Date" & Validation Failed

### Problem
- Time always shows "Invalid Date" in the UI
- Cannot edit/update (validation.failed)

### Root Cause
1. **Backend**: `ReservationResource.php` constructs `reserved_for` as string concatenation of `reservation_date` + `T` + `reservation_time`, but if `reservation_time` is in `H:i:s` format (e.g., "14:30:00"), JavaScript `new Date()` might not parse it correctly in all browsers.
2. **Validation**: Backend expects `Y-m-d\TH:i` but the frontend may send different formats.

### Fix
**File: `app/Http/Resources/ReservationResource.php`**
```php
// Change line 12-15 to use Carbon for proper ISO formatting
$reservedAt = null;
if ($this->reservation_date && $this->reservation_time) {
    $reservedAt = \Carbon\Carbon::parse($this->reservation_date . ' ' . $this->reservation_time)->toIso8601String();
}
```

**File: `app/Http/Controllers/Api/ReservationController.php`**
```php
// Make validation more flexible (lines 62, 141)
// Change: 'reserved_for' => ['required', 'date_format:Y-m-d\\TH:i'],
// To: 'reserved_for' => ['required', 'date'],
```

---

## 2. CATEGORIES - Sub-category mismatch & Counts include soft-deleted

### Problem
- Data input doesn't match DB
- Counts include soft-deleted records
- Delete logic is broken (deletes before checking constraints)

### Root Cause
1. **Delete method (lines 214-243)**: Deletes record BEFORE checking if it has children/menu items, causing the check to fail
2. Categories don't use SoftDeletes but checking for them

### Fix
**File: `app/Http/Controllers/Api/CategoryController.php`**
```php
// Fix destroy method - check constraints BEFORE deleting
public function destroy(Category $category): JsonResponse
{
    // Check if category has children FIRST
    if ($category->children()->exists()) {
        return response()->json([
            'message' => 'Cannot delete category with sub-categories. Please delete sub-categories first.'
        ], 422);
    }

    // Check if category has menu items
    if ($category->menuItems()->exists()) {
        return response()->json([
            'message' => 'Cannot delete category with menu items. Please move or delete menu items first.'
        ], 422);
    }

    // Delete image if exists
    if ($category->image) {
        \Storage::disk('public')->delete($category->image);
    }

    $category->delete();
    
    return response()->json(['message' => 'Category deleted successfully.']);
}
```

---

## 3. MENU ITEMS - FK Delete Fails

### Problem
- Delete fails with "foreign key constraint order_items"

### Root Cause
The `order_items` table has a foreign key to `menu_items` with `RESTRICT` on delete.

### Fix
Add soft deletes to MenuItem model instead of hard delete:

**File: `app/Models/MenuItem.php`**
```php
use Illuminate\Database\Eloquent\SoftDeletes;

class MenuItem extends Model
{
    use HasFactory, SoftDeletes;
    // ... rest of code
}
```

**Create migration:**
```bash
php artisan make:migration add_soft_deletes_to_menu_items_table
```

```php
Schema::table('menu_items', function (Blueprint $table) {
    $table->softDeletes();
});
```

---

## 4. INVENTORY - "Data truncated for column 'type'"

### Problem
- Stock transfer fails with "Data truncated for column 'type'"

### Root Cause
**Model vs Migration Mismatch:**
- Migration: `$table->string('movement_type', 20)` and `$table->foreignId('user_id')`
- Model: Uses `type` and `created_by`

The model's `$fillable['type']` doesn't match the DB column `movement_type`.

### Fix
**Option A: Fix the Model to match DB**
```php
// app/Models/InventoryTransaction.php
protected $fillable = [
    'location_id',
    'ingredient_id',
    'movement_type', // Changed from 'type'
    'quantity',
    'unit', // Add this - matches DB
    'reference_type',
    'reference_id',
    'notes',
    'transacted_at',
    'user_id', // Changed from 'created_by'
];
```

**Option B: Create migration to add missing columns**
```php
Schema::table('inventory_transactions', function (Blueprint $table) {
    $table->string('type', 20)->nullable()->after('location_id');
    $table->unsignedBigInteger('created_by')->nullable()->after('transacted_at');
});
```

**Also fix InventoryController.php (lines 90-108):**
```php
// Change 'type' to 'movement_type' or add the type column
InventoryTransaction::create([
    'location_id' => $validated['from_location_id'],
    'ingredient_id' => $validated['ingredient_id'],
    'movement_type' => 'transfer_out', // Changed from 'type'
    'quantity' => -$validated['quantity'],
    'unit' => '', // Required column
    'user_id' => auth()->id() ?? 1, // Changed from 'created_by'
    'notes' => "Transfer to location #{$validated['to_location_id']}. " . ($validated['notes'] ?? ''),
    'transacted_at' => now(),
]);
```

---

## 5. INVENTORY REPORTS - "toFixed is not a function"

### Problem
- `cat.turnover_rate.toFixed is not a function`

### Root Cause
Backend returns `turnover_rate` as string or null instead of number.

### Fix
**Frontend defensive code:**
```typescript
// In InventoryReports.tsx
const turnover = Number(cat.turnover_rate) || 0;
return turnover.toFixed(2);
```

**Backend cast to float:**
```php
// In ReportsController or wherever this data comes from
'turnover_rate' => (float) ($cat->turnover_rate ?? 0),
```

---

## 6. INGREDIENTS - Totals Not Showing

### Problem
- Total Items, Low Stock, Total Value not showing

### Root Cause
API returns null or incorrect types for aggregation values.

### Fix
**File: `app/Http/Controllers/Api/IngredientController.php`**
```php
public function stats(): JsonResponse
{
    $totalItems = (int) Ingredient::count();
    $lowStock = (int) Ingredient::whereColumn('current_stock', '<=', 'reorder_point')->count();
    $totalValue = (float) Ingredient::sum(\DB::raw('current_stock * cost_per_unit'));

    return response()->json([
        'total_items' => $totalItems,
        'low_stock' => $lowStock,
        'total_value' => round($totalValue, 2),
    ]);
}
```

---

## 7. UNIT DELETE - "Unknown column 'unit'"

### Problem
- Cannot delete unit: "Unknown column 'unit' in 'where clause'"

### Root Cause
**File: `app/Http/Controllers/Api/UnitController.php` line 138-139:**
```php
$inUseCheck = \DB::table('ingredients')
    ->where('unit', $unit->code)  // ❌ Wrong! Column is 'unit_id'
    ->exists();
```

The `ingredients` table has `unit_id` (FK) not `unit` column.

### Fix
```php
// Change from 'unit' to 'unit_id'
$inUseCheck = \DB::table('ingredients')
    ->where('unit_id', $unit->id)
    ->exists();
```

---

## 8. SUPPLIERS - "Food & Produce" Not Showing

### Problem
- Supplier types don't show correctly

### Root Cause
Likely a frontend filtering issue or incorrect data seeding.

### Fix
Check and verify supplier types in database and frontend display logic.

---

## 9. STOCK ALERTS - Acknowledge Not Working

### Problem
- Approve/reject/acknowledged actions don't work

### Root Cause
Check if the endpoints exist and are correctly implemented.

### Fix
**File: `app/Http/Controllers/Api/StockAlertController.php`**
Verify the `acknowledge` method exists and works:
```php
public function acknowledge(StockAlert $alert): JsonResponse
{
    $alert->update([
        'acknowledged_at' => now(),
        'acknowledged_by' => auth()->id(),
    ]);
    
    return response()->json(['message' => 'Alert acknowledged']);
}
```

---

## 10. EMPLOYEES/CUSTOMERS - "hasAnyRole() on null"

### Problem
- `Call to a member function hasAnyRole() on null`

### Root Cause
`auth()->user()` is null when the method is called, meaning no user is authenticated.

### Fix
**Option A: Add auth middleware to routes**
```php
// routes/api.php
Route::middleware(['auth:sanctum'])->group(function() {
    // Employee and Customer routes here
});
```

**Option B: Guard the call with optional()**
```php
if (optional(auth()->user())->hasAnyRole(['admin', 'manager'])) {
    // ...
}
// Or use null-safe operator
if (auth()->user()?->hasAnyRole(['admin', 'manager'])) {
    // ...
}
```

---

## 11. LOYALTY POINTS - "location_id has no default"

### Problem
- Cannot create loyalty point: "Field 'location_id' doesn't have a default value"

### Root Cause
`location_id` is required in DB but not being sent/validated.

### Fix
**File: `app/Http/Controllers/Api/LoyaltyPointController.php`**
```php
public function store(Request $request): LoyaltyPoint
{
    $data = $request->validate([
        'customer_id' => ['required', 'exists:customers,id'],
        'location_id' => ['nullable', 'exists:locations,id'], // Add this
        'type' => ['required', 'in:earn,redeem,adjust'],
        'points' => ['required', 'integer'],
        'occurred_at' => ['required', 'date'],
        'notes' => ['nullable', 'string'],
    ]);

    // Set default location_id if not provided
    $data['location_id'] = $data['location_id'] 
        ?? auth()->user()?->employee?->location_id 
        ?? 1;
    
    // ... rest of method
```

**OR create migration to make nullable:**
```php
Schema::table('loyalty_points', function (Blueprint $table) {
    $table->unsignedBigInteger('location_id')->nullable()->change();
});
```

---

## 12. LOCATIONS - "POST method not supported"

### Problem
- Cannot create location: "The POST method is not supported for route api/locations"

### Root Cause
The POST route is missing in api.php. Only `GET /api/locations` and `GET /api/admin/locations` exist.

### Fix
**File: `routes/api.php`**
Add the missing routes in the admin group:
```php
// Around line 302
Route::post('locations', [LocationController::class, 'store']);
Route::put('locations/{location}', [LocationController::class, 'update']);
Route::delete('locations/{location}', [LocationController::class, 'destroy']);
```

---

## 13. EXPENSES - "location_id cannot be null"

### Problem
- Cannot create expense: "location_id cannot be null"

### Root Cause
Same as Loyalty Points - `location_id` is required but not provided.

### Fix
**File: `app/Http/Controllers/Api/ExpenseController.php`**
```php
public function store(Request $request)
{
    $validated = $request->validate([
        // ... existing rules
        'location_id' => ['nullable', 'exists:locations,id'],
    ]);

    // Set default location_id
    $validated['location_id'] = $validated['location_id'] 
        ?? auth()->user()?->employee?->location_id 
        ?? 1;
    
    $expense = Expense::create($validated);
    // ...
}
```

---

## 14. PURCHASE ORDERS / RECIPES - "Everything not work"

### Problem
- General failures in CRUD operations

### Root Cause
Need to investigate specific errors. Likely issues:
- Missing validation rules
- Missing fillable fields
- Route definition issues

### Fix
Run diagnostics to capture specific error messages, then fix accordingly.

---

## 🔧 QUICK FIX SCRIPT

Run these commands to apply critical fixes:

```bash
# 1. Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 2. Check route list
php artisan route:list --path=admin

# 3. Run migrations
php artisan migrate

# 4. Check for errors
php artisan tinker --execute="App\Models\Order::count()"
```

---

## 📊 FIX PRIORITY

| Priority | Issue | Complexity | Impact |
|----------|-------|------------|--------|
| P0 | Orders showing 0 | ✅ Fixed | Critical |
| P1 | Reservations Invalid Date | Medium | High |
| P1 | Inventory type truncation | Medium | High |
| P1 | Location POST missing | Low | High |
| P2 | Unit delete column error | Low | Medium |
| P2 | Categories delete order | Low | Medium |
| P2 | Loyalty/Expense location_id | Low | Medium |
| P3 | Auth hasAnyRole | Medium | Medium |
| P3 | Inventory Reports toFixed | Low | Low |

---

## 🚀 IMPLEMENTATION ORDER

1. ✅ Fix Orders visibility (DONE)
2. Fix critical route issues (Location POST)
3. Fix validation issues (Reservations)
4. Fix DB column mismatches (Inventory, Unit)
5. Fix null checks (Auth)
6. Add soft deletes (Menu Items)
7. Fix default values (Loyalty, Expense)
