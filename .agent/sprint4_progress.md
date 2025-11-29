# 🚀 NKH Restaurant Admin Redesign - Sprint 4 Progress

## Sprint 4: Ingredients & Inventory Management

**Start Date:** 2025-11-29  
**Status:** 🔄 IN PROGRESS

---

## 📋 Sprint 4 Objectives

### Core Modules
1. **Ingredients** - Ingredient catalog with pricing
2. **Inventory Levels** - Current stock tracking
3. **Inventory Adjustments** - Manual stock corrections
4. **Stock Alerts** - Low stock notifications

---

## 🎯 Sprint 4 Features

### Ingredients Module
- Create/edit/delete ingredients
- Track cost per unit
- Link to suppliers
- Link to units of measurement
- Categorization (protein, vegetables, dairy, etc.)
- Allergen information  
- Storage requirements
- Expiration tracking
- Min/max stock levels
- Reorder points

### Inventory Levels Module
- Real-time stock tracking
- Location-specific inventory
- Batch/lot tracking
- Expiration date monitoring
- Stock valuation
- Movement history
- Wastage tracking
- Transfer between locations

### Inventory Adjustments Module
- Manual stock corrections
- Adjustment reasons (damaged, expired, theft, count error)
- Approval workflow for large adjustments
- Audit trail
- Before/after quantity tracking
- Cost impact calculation

### Stock Alerts Module
- Low stock warnings
- Expiring soon alerts
- Overstock notifications
- Automatic reorder suggestions
- Email/SMS notifications
- Alert dashboard
- Configurable thresholds

---

## ✅ Completed Tasks

### Backend API Controllers (0/4) ⏳ **0% COMPLETE**

#### 1. ⏳ IngredientController
**File:** `app/Http/Controllers/Api/IngredientController.php`
**Status:** Not started
**Features needed:**
- CRUD for ingredients
- Cost history tracking
- Supplier linking
- Category management
- Allergen tags
- Min/max stock levels
- Filter by category, supplier, status

#### 2. ⏳ InventoryController  
**File:** `app/Http/Controllers/Api/InventoryController.php`
**Status:** Not started
**Features needed:**
- View current stock levels
- Location-specific inventory
- Batch/lot tracking
- Movement history
- Stock valuation
- Transfer stock
- Wastage recording

#### 3. ⏳ InventoryAdjustmentController
**File:** `app/Http/Controllers/Api/InventoryAdjustmentController.php`
**Status:** Not started
**Features needed:**
- Create adjustments
- Approval workflow
- Audit trail
- Reason codes
- Cost impact
- Before/after tracking

#### 4. ⏳ Stock AlertController
**File:** `app/Http/Controllers/Api/StockAlertController.php`
**Status:** Not started
**Features needed:**
- Active alerts list
- Alert configuration
- Dismiss/acknowledge
- Reorder recommendations
- Threshold management

---

## Frontend Admin Pages (0/4) ⏳ **0% COMPLETE**

#### 1. ⏳ Ingredients Page
**File:** `resources/js/Pages/admin/Ingredients.tsx`
**Status:** Not started
**Features needed:**
- Ingredient grid with costs
- Create/edit forms
- Supplier association
- Unit measurement selection
- Category badges
- Allergen tags
- Min/max stock display
- Cost history graph

#### 2. ⏳ Inventory Page
**File:** `resources/js/Pages/admin/Inventory.tsx`
**Status:** Not started
**Features needed:**
- Current stock levels table
- Location filter
- Batch/lot details
- Movement history timeline
- Transfer stock modal
- Wastage recording
- Stock valuation display
- Export functionality

#### 3. ⏳ Inventory Adjustments Page
**File:** `resources/js/Pages/admin/InventoryAdjustments.tsx` 
**Status:** Not started
**Features needed:**
- Adjustments list
- Create adjustment form
- Reason dropdown
- Before/after display
- Approval buttons
- Audit trail
- Cost impact indicator

#### 4. ⏳ Stock Alerts Page
**File:** `resources/js/Pages/admin/StockAlerts.tsx`
**Status:** Not started
**Features needed:**
- Active alerts cards
- Alert type badges
- Acknowledge button
- Reorder recommendations
- Alert configuration
- Threshold settings
- Notification preferences

---

## 📋 Routes to Add

### API Routes Required
```php
// Sprint 4: Ingredients & Inventory
Route::prefix('admin')->group(function () {
    // Ingredients
    Route::apiResource('ingredients', IngredientController::class);
    Route::get('ingredients/{ingredient}/cost-history', [IngredientController::class, 'costHistory']);
    Route::get('ingredient-categories', [IngredientController::class, 'categories']);
    
    // Inventory
    Route::get('inventory', [InventoryController::class, 'index']);
    Route::get('inventory/{ingredient}', [InventoryController::class, 'show']);
    Route::post('inventory/transfer', [InventoryController::class, 'transfer']);
    Route::post('inventory/wastage', [InventoryController::class, 'recordWastage']);
    Route::get('inventory/movements/{ingredient}', [InventoryController::class, 'movements']);
    Route::get('inventory/valuation', [InventoryController::class, 'valuation']);
    
    // Inventory Adjustments
    Route::apiResource('inventory-adjustments', InventoryAdjustmentController::class);
    Route::post('inventory-adjustments/{adjustment}/approve', [InventoryAdjustmentController::class, 'approve']);
    Route::post('inventory-adjustments/{adjustment}/reject', [InventoryAdjustmentController::class, 'reject']);
    
    // Stock Alerts
    Route::get('stock-alerts', [StockAlertController::class, 'index']);
    Route::post('stock-alerts/{alert}/acknowledge', [StockAlertController::class, 'acknowledge']);
    Route::get('stock-alerts/reorder-recommendations', [StockAlertController::class, 'reorderRecommendations']);
    Route::put('stock-alerts/thresholds/{ingredient}', [StockAlertController::class, 'updateThresholds']);
});
```

### Inertia Routes Required
```php
Route::prefix('admin')->group(function () {
    Route::get('ingredients', fn() => Inertia::render('admin/Ingredients'))->name('admin.ingredients');
    Route::get('inventory', fn() => Inertia::render('admin/Inventory'))->name('admin.inventory');
    Route::get('inventory-adjustments', fn() => Inertia::render('admin/InventoryAdjustments'))->name('admin.inventory-adjustments');
    Route::get('stock-alerts', fn() => Inertia::render('admin/StockAlerts'))->name('admin.stock-alerts');
});
```

---

## 🎯 Sprint 4 Completion Checklist

### Backend (0/4 Complete) ⏳
- [ ] IngredientController
- [ ] InventoryController
- [ ] InventoryAdjustmentController
- [ ] StockAlertController

### Frontend (0/4 Complete) ⏳
- [ ] Ingredients page
- [ ] Inventory page
- [ ] Inventory Adjustments page
- [ ] Stock Alerts page

### Integration (0/2 Complete) ⏳
- [ ] Add API routes
- [ ] Add Inertia routes

### Navigation (0/1 Complete) ⏳
- [ ] Add menu items to admin sidebar

---

## 📊 Overall Progress: 0% Complete

**Completed:** 0/11 items
- ⏳ 0 Backend controllers
- ⏳ 0 Frontend pages
- ⏳ 0 Integration tasks

---

## 🎨 Key Features to Implement

### Ingredient Management
1. **Comprehensive catalog** with all ingredient details
2. **Cost tracking** with history
3. **Supplier linking** for quick reordering
4. **Allergen tagging** for safety
5. **Category organization** for easy finding
6. **Min/max levels** for automated alerts

### Inventory Tracking
1. **Real-time stock levels** by location
2. **Batch/lot tracking** for traceability
3. **Movement history** (in/out/adjustments)
4. **Wastage recording** with reasons
5. **Stock transfers** between locations
6. **Valuation reporting** for accounting

### Adjustment Management
1. **Easy corrections** with reason codes
2. **Approval workflow** for large changes
3. **Audit trail** for all changes
4. **Cost impact** calculation
5. **Before/after tracking**

### Alert System
1. **Low stock warnings** before runout
2. **Expiring soon** alerts
3. **Overstock** notifications
4. **Reorder suggestions** with quantities
5. **Configurable thresholds** per ingredient

---

## 🔗 Database Relationships

### Ingredients
```
ingredients
├── supplier_id → suppliers (preferred supplier)
├── unit_id → units (measurement unit)
└── category (varchar: protein, vegetable, etc.)
```

### Inventory
```
inventory
├── ingredient_id → ingredients
├── location_id → locations
└── batch/lot info
```

### Inventory Adjustments
```
inventory_adjustments
├── ingredient_id → ingredients
├── location_id → locations
├── adjusted_by → employees
└── approved_by → employees (optional)
```

---

## 💡 Business Rules

### Ingredients
- ✅ Must have unique name
- ✅ Cost must be positive
- ✅ Must link to a unit of measurement
- ✅ Min stock ≤ Max stock
- ✅ Reorder point between min and max

### Inventory
- ✅ Stock levels cannot go negative
- ✅ Wastage requires reason
- ✅ Transfers must have valid source/destination
- ✅ Batch numbers must be unique
- ✅ Expiring items flagged 7 days before

### Adjustments
- ✅ Adjustments > 20% require approval
- ✅ Must provide reason code
- ✅ Cannot adjust same item twice in 1 hour
- ✅ Audit trail is immutable

### Stock Alerts
- ✅ Alert when stock < reorder point
- ✅ Alert when stock < min level (critical)
- ✅ Alert 7 days before expiration
- ✅ Alert when stock > max level (overstock)
- ✅ Auto-suggest reorder quantity (max - current)

---

## 🚀 Next Steps

1. Create IngredientController
2. Create InventoryController
3. Create InventoryAdjustmentController
4. Create StockAlertController
5. Create Ingredients frontend page
6. Create Inventory page with real-time tracking
7. Create Adjustments page
8. Create Stock Alerts dashboard
9. Add routes
10. Test all workflows

**Estimated time:** 4-6 hours

---

*Last Updated: 2025-11-29 15:05*
*Status: Ready to start development*
