<?php

/**
 * Admin Routes with Permission Middleware
 * 
 * This file is included from routes/api.php and applies
 * granular permission middleware to admin endpoints.
 * 
 * Permission format: 'permission:slug1,slug2' (user needs any of them)
 */

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    CategoryController,
    MenuItemController,
    OrderController,
    EmployeeController,
    CustomerController,
    ReservationController,
    SettingController,
    FloorController,
    TableController,
    RoleController,
    PositionController,
    LocationController,
    InvoiceController,
    AuditLogController,
    PromotionController,
    LoyaltyPointController,
    ExpenseController,
    ExpenseCategoryController,
    SettingsController,
    OperatingHoursController,
    TranslationController,
    AnalyticsController,
    ReportsController,
    IngredientController,
    InventoryController,
    InventoryAdjustmentController,
    StockAlertController,
    PurchaseOrderController,
    RecipeController,
    ShiftController,
    TimeOffRequestController,
    AttendanceController,
    PayrollController,
    NotificationController,
    TimeSlotController,
    SupplierController,
    UnitController,
};
use App\Http\Controllers\Api\Admin\{
    PaymentAdminController,
    PaymentHealthController,
    RefundController,
    PaymentAnalyticsController,
};
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;

/*
|--------------------------------------------------------------------------
| Route-Permission Mapping
|--------------------------------------------------------------------------
|
| This section defines which permissions are required for each route group.
| Format: Route -> Permission(s) required
|
*/

// Categories - requires categories.* permissions
Route::middleware('permission:categories.view,categories.create,categories.update,categories.delete')
    ->group(function () {
        Route::get('/category-stats', [CategoryController::class, 'stats']);
        Route::get('/categories/stats', [CategoryController::class, 'stats']);
        Route::get('/categories/hierarchy', [CategoryController::class, 'hierarchy']);
        Route::get('/categories', [CategoryController::class, 'index']);
    });
Route::middleware('permission:categories.create')
    ->post('/categories', [CategoryController::class, 'store']);
Route::middleware('permission:categories.view')
    ->get('/categories/{category}', [CategoryController::class, 'show']);
Route::middleware('permission:categories.update')
    ->group(function () {
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::put('categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus']);
    });
Route::middleware('permission:categories.delete')
    ->delete('/categories/{category}', [CategoryController::class, 'destroy']);

// Menu Items - requires menu.* permissions
Route::middleware('permission:menu.view')->get('menu-items', [MenuItemController::class, 'index']);
Route::middleware('permission:menu.view')->get('menu-items/{menuItem}', [MenuItemController::class, 'show']);
Route::middleware('permission:menu.create')->post('menu-items', [MenuItemController::class, 'store']);
Route::middleware('permission:menu.update')->match(['put', 'patch'], 'menu-items/{menuItem}', [MenuItemController::class, 'update']);
Route::middleware('permission:menu.delete')->delete('menu-items/{menuItem}', [MenuItemController::class, 'destroy']);

// Employees - requires employees.* permissions
Route::middleware('permission:employees.view')
    ->group(function () {
        Route::get('employee-stats', [EmployeeController::class, 'stats']);
        Route::get('employees', [EmployeeController::class, 'index']);
        Route::get('employees/{employee}', [EmployeeController::class, 'show']);
    });
Route::middleware('permission:employees.create')->post('employees', [EmployeeController::class, 'store']);
Route::middleware('permission:employees.update')->match(['put', 'patch'], 'employees/{employee}', [EmployeeController::class, 'update']);
Route::middleware('permission:employees.delete')->delete('employees/{employee}', [EmployeeController::class, 'destroy']);

// Customers - requires customers.* permissions
Route::middleware('permission:customers.view')
    ->group(function () {
        Route::get('customer-stats', [CustomerController::class, 'aggregateStats']);
        Route::get('customers', [CustomerController::class, 'index']);
        Route::get('customers/{customer}', [CustomerController::class, 'show']);
        Route::get('customers/{customer}/history', [CustomerController::class, 'history']);
        Route::get('customers/{customer}/stats', [CustomerController::class, 'stats']);
    });
Route::middleware('permission:customers.update')
    ->group(function () {
        Route::match(['put', 'patch'], 'customers/{customer}', [CustomerController::class, 'update']);
        Route::post('customers/{customer}/update-tier', [CustomerController::class, 'updateTier']);
    });
Route::middleware('permission:customers.delete')->delete('customers/{customer}', [CustomerController::class, 'destroy']);

// Orders - requires orders.* permissions  
Route::middleware('permission:orders.view')
    ->group(function () {
        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/pending-approval', [OrderController::class, 'pendingApproval']);
    });
Route::middleware('permission:orders.update')
    ->group(function () {
        Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::patch('orders/{order}/payment-status', [OrderController::class, 'updatePaymentStatus']);
    });
Route::middleware('permission:orders.approve')
    ->group(function () {
        Route::patch('orders/{order}/approve', [OrderController::class, 'approve']);
        Route::patch('orders/{order}/reject', [OrderController::class, 'reject']);
    });
Route::middleware('permission:orders.delete')->delete('orders/{order}', [OrderController::class, 'destroy']);

// Reservations - requires reservations.* permissions
Route::middleware('permission:reservations.view')->get('reservations', [ReservationController::class, 'index']);
Route::middleware('permission:reservations.view')->get('reservations/{reservation}', [ReservationController::class, 'show']);
Route::middleware('permission:reservations.create')->post('reservations', [ReservationController::class, 'store']);
Route::middleware('permission:reservations.update')->match(['put', 'patch'], 'reservations/{reservation}', [ReservationController::class, 'update']);
Route::middleware('permission:reservations.delete')->delete('reservations/{reservation}', [ReservationController::class, 'destroy']);

// Inventory - requires inventory.* permissions
Route::middleware('permission:inventory.view')
    ->group(function () {
        Route::get('ingredients/categories', [IngredientController::class, 'categories']);
        Route::get('ingredients/stats', [IngredientController::class, 'stats']);
        Route::get('ingredients/low-stock', [IngredientController::class, 'lowStock']);
        Route::get('ingredients', [IngredientController::class, 'index']);
        Route::get('ingredients/{ingredient}', [IngredientController::class, 'show']);
        Route::get('ingredients/{ingredient}/cost-history', [IngredientController::class, 'costHistory']);
        Route::get('inventory', [InventoryController::class, 'index']);
        Route::get('inventory/valuation', [InventoryController::class, 'valuation']);
        Route::get('inventory/stats', [InventoryController::class, 'stats']);
        Route::get('inventory/movements/{ingredient}', [InventoryController::class, 'movements']);
        Route::get('inventory/{ingredient}', [InventoryController::class, 'show']);
        Route::get('inventory-adjustments', [InventoryAdjustmentController::class, 'index']);
        Route::get('inventory-adjustments/stats', [InventoryAdjustmentController::class, 'stats']);
        Route::get('stock-alerts', [StockAlertController::class, 'index']);
        Route::get('stock-alerts/reorder-recommendations', [StockAlertController::class, 'reorderRecommendations']);
        Route::get('stock-alerts/stats', [StockAlertController::class, 'stats']);
    });
Route::middleware('permission:inventory.adjust')
    ->group(function () {
        Route::post('ingredients', [IngredientController::class, 'store']);
        Route::match(['put', 'patch'], 'ingredients/{ingredient}', [IngredientController::class, 'update']);
        Route::delete('ingredients/{ingredient}', [IngredientController::class, 'destroy']);
        Route::post('inventory/transfer', [InventoryController::class, 'transfer']);
        Route::post('inventory/wastage', [InventoryController::class, 'recordWastage']);
        Route::post('inventory-adjustments', [InventoryAdjustmentController::class, 'store']);
        Route::post('stock-alerts/{alert}/acknowledge', [StockAlertController::class, 'acknowledge']);
        Route::put('stock-alerts/thresholds/{ingredient}', [StockAlertController::class, 'updateThresholds']);
    });
Route::middleware('permission:inventory.approve')
    ->group(function () {
        Route::post('inventory-adjustments/{adjustment}/approve', [InventoryAdjustmentController::class, 'approve']);
        Route::post('inventory-adjustments/{adjustment}/reject', [InventoryAdjustmentController::class, 'reject']);
    });

// Reports - requires reports.* permissions
Route::middleware('permission:reports.view')
    ->prefix('reports')
    ->group(function () {
        Route::get('inventory/valuation', [ReportsController::class, 'inventoryValuation']);
        Route::get('inventory/usage-rates', [ReportsController::class, 'usageRates']);
        Route::get('inventory/waste-tracking', [ReportsController::class, 'wasteTracking']);
        Route::get('inventory/cost-analysis', [ReportsController::class, 'costAnalysis']);
        Route::get('inventory/turnover', [ReportsController::class, 'inventoryTurnover']);
        Route::get('financial/profit-loss', [ReportsController::class, 'profitLoss']);
        Route::get('financial/revenue-expenses', [ReportsController::class, 'revenueExpenses']);
        Route::get('financial/cogs', [ReportsController::class, 'cogs']);
        Route::get('financial/margins', [ReportsController::class, 'margins']);
    });
Route::middleware('permission:reports.export')
    ->prefix('reports')
    ->group(function () {
        Route::get('inventory/export/pdf', [AnalyticsController::class, 'exportInventoryPDF']);
        Route::get('inventory/export/csv', [AnalyticsController::class, 'exportInventoryCSV']);
        Route::get('financial/export/pdf', [AnalyticsController::class, 'exportFinancialPDF']);
        Route::get('financial/export/csv', [AnalyticsController::class, 'exportFinancialCSV']);
    });

// Settings - requires settings.* permissions
Route::middleware('permission:settings.view')
    ->group(function () {
        Route::get('settings', [SettingController::class, 'index']);
        Route::get('settings/key/{key}', [SettingsController::class, 'getByKey']);
    });
Route::middleware('permission:settings.update')
    ->group(function () {
        Route::put('settings', [SettingController::class, 'update']);
        Route::post('settings/bulk-update', [SettingsController::class, 'bulkUpdate']);
    });

// Audit Logs - requires audit.* permissions
Route::middleware('permission:audit.view')
    ->group(function () {
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-stats', [AuditLogController::class, 'stats']);
    });

// Roles & Permissions - requires roles.manage or permissions.manage
Route::middleware('permission:roles.manage,permissions.manage')
    ->group(function () {
        Route::apiResource('roles', RoleController::class);
        Route::get('permissions/all', [RoleController::class, 'getAllPermissions']);
    });

// Users - requires users.* permissions
Route::middleware('permission:users.view')
    ->group(function () {
        Route::get('admin-users/stats', [\App\Http\Controllers\Api\AdminUserController::class, 'stats']);
        Route::get('admin-users', [\App\Http\Controllers\Api\AdminUserController::class, 'index']);
        Route::get('admin-users/{user}', [\App\Http\Controllers\Api\AdminUserController::class, 'show']);
    });
Route::middleware('permission:users.create')->post('admin-users', [\App\Http\Controllers\Api\AdminUserController::class, 'store']);
Route::middleware('permission:users.update')->match(['put', 'patch'], 'admin-users/{user}', [\App\Http\Controllers\Api\AdminUserController::class, 'update']);
Route::middleware('permission:users.delete')->delete('admin-users/{user}', [\App\Http\Controllers\Api\AdminUserController::class, 'destroy']);

// Dashboard - requires dashboard.view permission
Route::middleware('permission:dashboard.view')
    ->group(function () {
        Route::get('dashboard/analytics', [AdminDashboardController::class, 'analytics']);
        Route::get('dashboard/orders/stats', [AdminDashboardController::class, 'orderStats']);
        Route::get('dashboard/revenue/{period}', [AdminDashboardController::class, 'revenue'])->where('period', 'daily|weekly|monthly');
    });

// Locations - requires locations.* permissions
Route::middleware('permission:locations.view')
    ->group(function () {
        Route::get('locations', [LocationController::class, 'adminIndex']);
        Route::get('locations/{location}', [LocationController::class, 'show']);
    });
Route::middleware('permission:locations.manage')
    ->group(function () {
        Route::post('locations', [LocationController::class, 'store']);
        Route::put('locations/{location}', [LocationController::class, 'update']);
        Route::delete('locations/{location}', [LocationController::class, 'destroy']);
    });

// Payments - requires payments.* permissions
Route::middleware('permission:payments.view')
    ->prefix('payments')
    ->group(function () {
        Route::get('stats', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'stats']);
        Route::get('/', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'index']);
        Route::get('{payment}', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'show']);
        Route::get('{payment}/audit-log', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'auditLog']);
        Route::get('revenue/chart', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'revenueChart']);
        Route::get('health', [\App\Http\Controllers\Api\Admin\PaymentHealthController::class, 'status']);
        Route::get('metrics', [\App\Http\Controllers\Api\Admin\PaymentHealthController::class, 'metrics']);
        Route::get('integrity-check', [\App\Http\Controllers\Api\Admin\PaymentHealthController::class, 'integrityCheck']);
    });
Route::middleware('permission:payments.refund')
    ->post('payments/{payment}/refund', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'refund']);

// Recipes - requires recipes.* permissions
Route::middleware('permission:recipes.view')
    ->group(function () {
        Route::get('recipes', [RecipeController::class, 'index']);
        Route::get('recipes-stats', [RecipeController::class, 'stats']);
        Route::get('recipes/{recipe}', [RecipeController::class, 'show']);
        Route::get('recipes/{recipe}/costing', [RecipeController::class, 'costing']);
    });
Route::middleware('permission:recipes.create,recipes.update')
    ->group(function () {
        Route::post('recipes', [RecipeController::class, 'store']);
        Route::put('recipes/{recipe}', [RecipeController::class, 'update']);
        Route::post('recipes/{recipe}/duplicate', [RecipeController::class, 'duplicate']);
    });
Route::middleware('permission:recipes.delete')
    ->delete('recipes/{recipe}', [RecipeController::class, 'destroy']);

// Promotions - requires promotions.* permissions
Route::middleware('permission:promotions.view')
    ->group(function () {
        Route::get('promotions', [PromotionController::class, 'index']);
        Route::get('promotion-stats', [PromotionController::class, 'stats']);
        Route::get('promotions/{promotion}', [PromotionController::class, 'show']);
    });
Route::middleware('permission:promotions.manage')
    ->group(function () {
        Route::post('promotions', [PromotionController::class, 'store']);
        Route::match(['put', 'patch'], 'promotions/{promotion}', [PromotionController::class, 'update']);
        Route::delete('promotions/{promotion}', [PromotionController::class, 'destroy']);
    });

// Purchase Orders - requires inventory.* permissions
Route::middleware('permission:inventory.view')
    ->group(function () {
        Route::get('purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::get('purchase-orders-stats', [PurchaseOrderController::class, 'stats']);
        Route::get('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show']);
    });
Route::middleware('permission:inventory.adjust')
    ->group(function () {
        Route::post('purchase-orders', [PurchaseOrderController::class, 'store']);
        Route::match(['put', 'patch'], 'purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update']);
        Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy']);
        Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
        Route::post('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel']);
    });
Route::middleware('permission:inventory.approve')
    ->group(function () {
        Route::post('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve']);
        Route::post('purchase-orders/{purchaseOrder}/mark-ordered', [PurchaseOrderController::class, 'markOrdered']);
    });

// Suppliers - requires inventory.* permissions (admin routes under /api/admin/suppliers)
Route::middleware('permission:inventory.view')
    ->group(function () {
        Route::get('suppliers', [SupplierController::class, 'index']);
        Route::get('suppliers-stats', [SupplierController::class, 'stats']);
        Route::get('suppliers/types', [SupplierController::class, 'types']);
        Route::get('suppliers/{supplier}', [SupplierController::class, 'show']);
    });
Route::middleware('permission:inventory.adjust')
    ->group(function () {
        Route::post('suppliers', [SupplierController::class, 'store']);
        Route::match(['put', 'patch'], 'suppliers/{supplier}', [SupplierController::class, 'update']);
        Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy']);
    });

// Translations - requires settings.* permissions
Route::middleware('permission:settings.view')
    ->prefix('translations')
    ->group(function () {
        Route::get('categories', [TranslationController::class, 'getCategoryTranslations']);
        Route::get('menu-items', [TranslationController::class, 'getMenuItemTranslations']);
        Route::get('missing', [TranslationController::class, 'getMissingTranslations']);
    });
Route::middleware('permission:settings.update')
    ->prefix('translations')
    ->group(function () {
        Route::post('bulk-update', [TranslationController::class, 'bulkUpdateTranslations']);
        Route::put('categories/{categoryId}', [TranslationController::class, 'updateCategoryTranslation']);
        Route::put('menu-items/{menuItemId}', [TranslationController::class, 'updateMenuItemTranslation']);
    });
