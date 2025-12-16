<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OnlineOrderController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerDashboardController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\EmployeeScheduleController;
use App\Http\Controllers\Api\EmployeeTimeOffController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\CustomerReservationController;
use App\Http\Controllers\Api\SettingController;
// CustomerRequestController removed - functionality consolidated to OrderController
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\LoyaltyPointController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\OrderHoldController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\TimeOffRequestController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\InventoryAdjustmentController;
use App\Http\Controllers\Api\StockAlertController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\OperatingHoursController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TranslationController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\TimeSlotController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\UserProfileController;
use Illuminate\Http\Request;

// Health check endpoint for Docker/Render
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'database' => DB::connection()->getDatabaseName()
    ]);
});

// DEBUG: Session and Auth diagnostic endpoint (only available in local/testing)
if (app()->environment(['local', 'testing'])) {
    Route::get('/debug-auth', function (\Illuminate\Http\Request $request) {
        return response()->json([
            'auth_check' => auth()->check(),
            'user_id' => auth()->id(),
            'session_id' => session()->getId(),
        ]);
    });
}

// Public endpoints with rate limiting and lockout protection
Route::middleware(['throttle.api:auth', 'account.lockout'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Token refresh endpoint (requires valid token)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/auth/refresh', [\App\Http\Controllers\Api\RefreshTokenController::class, 'refresh']);
    Route::post('/auth/revoke-all', [\App\Http\Controllers\Api\RefreshTokenController::class, 'revokeAll']);
    
    // MFA endpoints
    Route::prefix('auth/mfa')->group(function () {
        Route::get('/status', [\App\Http\Controllers\Api\MfaController::class, 'status']);
        Route::post('/setup', [\App\Http\Controllers\Api\MfaController::class, 'setup']);
        Route::post('/verify', [\App\Http\Controllers\Api\MfaController::class, 'verify']);
        Route::post('/disable', [\App\Http\Controllers\Api\MfaController::class, 'disable']);
        Route::post('/validate', [\App\Http\Controllers\Api\MfaController::class, 'validate']);
    });
});

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);
Route::get('/locations', [LocationController::class, 'index']);

// Menu Items CRUD routes
Route::controller(MenuItemController::class)->group(function () {
    Route::get('/menu-items', 'index');
    Route::post('/menu-items', 'store');
    Route::get('/menu-items/{menuItem}', 'show');
    Route::match(['put', 'patch'], '/menu-items/{menuItem}', 'update');
    Route::delete('/menu-items/{menuItem}', 'destroy');
});

Route::get('/time-slots', [OnlineOrderController::class, 'timeSlots']);

// New public menu route
Route::get('/menu', [MenuItemController::class, 'index']);

// Payment webhooks (secure with signature verification in production)
Route::post('/payments/webhook/success', [PaymentWebhookController::class, 'handleSuccess'])
    ->middleware('payment.rate:webhook');
Route::post('/webhooks/payment', [PaymentWebhookController::class, 'handle'])
    ->middleware('payment.rate:webhook');

// Payment endpoints
Route::prefix('payments')->group(function () {
    Route::post('/initiate', [\App\Http\Controllers\Api\PaymentController::class, 'initiate'])
        ->middleware('payment.rate:initiate');
    Route::get('/{payment}/status', [\App\Http\Controllers\Api\PaymentController::class, 'status'])
        ->middleware('payment.rate:status');
    Route::get('/uuid/{uuid}', [\App\Http\Controllers\Api\PaymentController::class, 'showByUuid'])
        ->middleware('payment.rate:status');
    Route::get('/{payment}/qr', [\App\Http\Controllers\Api\PaymentController::class, 'getQrCode'])
        ->middleware('payment.rate:status');
    Route::post('/{payment}/cancel', [\App\Http\Controllers\Api\PaymentController::class, 'cancel'])
        ->middleware('payment.rate:default');
    
    // Split Payment Routes (Sprint P7)
    Route::prefix('split')->group(function () {
        Route::get('/{order}/status', [\App\Http\Controllers\Api\SplitPaymentController::class, 'status']);
        Route::get('orders/payment-modes/{orderType}', [\App\Http\Controllers\Api\OrderPaymentController::class, 'getPaymentModes']);
    Route::get('orders/pending-collection', [\App\Http\Controllers\Api\OrderPaymentController::class, 'pendingCollection']);
    Route::get('orders/pos/active', [\App\Http\Controllers\Api\OrderPaymentController::class, 'activeOrders']);
    Route::post('pos/orders/{order}/quick-pay', [\App\Http\Controllers\Api\OrderPaymentController::class, 'quickPay']);
        Route::post('/{order}/add', [\App\Http\Controllers\Api\SplitPaymentController::class, 'addPayment']);
        Route::get('/{order}/suggestions', [\App\Http\Controllers\Api\SplitPaymentController::class, 'suggestions']);
        Route::post('/{order}/cancel/{payment}', [\App\Http\Controllers\Api\SplitPaymentController::class, 'cancelPayment']);
        Route::post('/{order}/complete', [\App\Http\Controllers\Api\SplitPaymentController::class, 'complete']);
    });
    
    // Development/testing only routes
    Route::post('/{payment}/simulate-success', [\App\Http\Controllers\Api\PaymentController::class, 'simulateSuccess'])
        ->middleware('payment.rate:simulate');
    Route::post('/{payment}/simulate-failure', [\App\Http\Controllers\Api\PaymentController::class, 'simulateFailure'])
        ->middleware('payment.rate:simulate');
});

// Receipt Routes (Sprint P8)
Route::prefix('receipts')->group(function () {
    Route::get('/{payment}', [\App\Http\Controllers\Api\ReceiptController::class, 'show']);
    Route::get('/{payment}/pdf', [\App\Http\Controllers\Api\ReceiptController::class, 'downloadPdf']);
    Route::get('/{payment}/html', [\App\Http\Controllers\Api\ReceiptController::class, 'viewHtml']);
    Route::get('/{payment}/thermal', [\App\Http\Controllers\Api\ReceiptController::class, 'thermal']);
    Route::get('/{payment}/print', [\App\Http\Controllers\Api\ReceiptController::class, 'print']);
    Route::post('/{payment}/email', [\App\Http\Controllers\Api\ReceiptController::class, 'sendEmail']);
    Route::get('/uuid/{uuid}', [\App\Http\Controllers\Api\ReceiptController::class, 'showByUuid']);
});

// Order Payment Routes (Sprint P11)
Route::prefix('orders')->group(function () {
    // Public - available payment modes by order type
    Route::get('/payment-modes/{orderType}', [\App\Http\Controllers\Api\OrderPaymentController::class, 'availablePaymentModes']);
});

Route::prefix('orders')->group(function () {
    // Get order payment status
    Route::get('/{order}/payment-status', [\App\Http\Controllers\Api\OrderPaymentController::class, 'paymentStatus']);
    
    // Update payment mode for an order
    Route::post('/{order}/payment-mode', [\App\Http\Controllers\Api\OrderPaymentController::class, 'updatePaymentMode']);
    
    // Collect payment (for delivery drivers/staff)
    Route::post('/{order}/collect-payment', [\App\Http\Controllers\Api\OrderPaymentController::class, 'collectPayment']);
    
    // Orders pending payment collection
    Route::get('/pending-collection', [\App\Http\Controllers\Api\OrderPaymentController::class, 'pendingCollection']);
});

// POS Quick Pay (for employees)
Route::prefix('pos')
    ->group(function () {
    Route::post('/orders/{order}/quick-pay', [\App\Http\Controllers\Api\OrderPaymentController::class, 'quickPay']);
});


// Public reference data
Route::get('/positions', [PositionController::class, 'index']);
Route::get('/locations', [LocationController::class, 'index']);
Route::get('/payment-methods', [\App\Http\Controllers\Api\PaymentController::class, 'availableMethods']);

// Webhooks (no auth required, verified by signature)
Route::prefix('webhooks')->group(function () {
    Route::post('/stripe', [\App\Http\Controllers\Api\StripeWebhookController::class, 'handle']);
});

// Time slots
Route::get('/timeslots', [TimeSlotController::class, 'index']);
Route::get('/timeslots/stats', [TimeSlotController::class, 'stats']);
Route::post('/timeslots/regenerate', [TimeSlotController::class, 'regenerate'])
->middleware('auth');
Route::post('/timeslots/cleanup', [TimeSlotController::class, 'cleanup'])
->middleware('auth');

// Sprint 1: Suppliers & Units (CRUD accessible to all for now)
Route::apiResource('suppliers', SupplierController::class);
Route::get('/suppliers/types', [SupplierController::class, 'types']);
Route::get('/supplier-stats', [SupplierController::class, 'stats']);
Route::apiResource('units', UnitController::class);
Route::get('/units/base-units', [UnitController::class, 'baseUnits']);

// Debug endpoint to inspect auth in API context (only in local/testing)
if (app()->environment(['local', 'testing'])) {
    Route::get('/_debug/auth', function (Request $request) {
        return response()->json([
            'guard_default' => config('auth.defaults.guard'),
            'guards' => [
                'web' => auth('web')->check(),
                'sanctum' => auth('sanctum')->check(),
            ],
            'auth_check' => auth()->check(),
            'user_id' => optional($request->user())->id,
            'session_id' => session()->getId(),
            'session_cookie_name' => config('session.cookie'),
            'session_domain' => config('session.domain'),
            'stateful' => config('sanctum.stateful'),
            'cookies' => $request->cookies->all(),
            'headers' => $request->headers->all(),
        ]);
    });
}


Route::get('/user', [AuthController::class, 'me'])
->middleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum']);
Route::post('/logout', [AuthController::class, 'logout'])
->middleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum']);

// Admin routes - always need session for user() to work, auth is optional in local
// SECURITY: Admin routes ALWAYS require authentication
// No bypasses for development environments - use proper test credentials instead
$adminMiddleware = [
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    'auth:sanctum',
    // Support multiple admin roles: super-admin, admin, and specific manager roles
    'role:super-admin,admin,chief,service-manager,finance-manager,hr-manager,inventory-manager,operations-manager,viewer',
];

// Admin/Manager management endpoints with granular permission middleware
// Each route group in admin-secure.php enforces specific permissions
Route::prefix('admin')
    ->middleware($adminMiddleware)
    ->group(base_path('routes/admin-secure.php'));




// Kitchen Display System Routes
Route::prefix('kitchen')
    ->middleware(['auth:sanctum']) // Uncomment to enforce auth
    ->group(function () {
        Route::get('orders', [\App\Http\Controllers\Api\KitchenController::class, 'index']);
        Route::put('orders/{order}/status', [\App\Http\Controllers\Api\KitchenController::class, 'updateStatus']);
    });

// In-store operations for staff (Employee)
Route::prefix('employee')
->middleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum', 'role:admin,manager,waiter'])
->group(function () {
    // POS menu
    Route::get('menu', [MenuItemController::class, 'index']);
    // POS Orders (dine-in, auto-approved)
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::post('orders/{order}/items', [OrderController::class, 'addItem']);
    Route::put('order-items/{orderItem}', [OrderController::class, 'updateItem']);
    
    // Employee Dashboard
    Route::get('dashboard/stats', [\App\Http\Controllers\Api\EmployeeDashboardController::class, 'stats']);

    // Employee Schedule
    Route::get('shifts', [EmployeeScheduleController::class, 'shifts']);
    Route::get('shifts/{id}', [EmployeeScheduleController::class, 'showShift']);
    
    // Time Off Requests
    Route::get('time-off-requests', [EmployeeTimeOffController::class, 'index']);
    Route::post('time-off-requests', [EmployeeTimeOffController::class, 'store']);
    Route::delete('time-off-requests/{id}', [EmployeeTimeOffController::class, 'destroy']);
    
    // Cash Payment Management
    Route::get('payments/pending-cash', [\App\Http\Controllers\Api\CashPaymentController::class, 'pendingCashPayments']);
    Route::post('payments/{payment}/confirm-cash', [\App\Http\Controllers\Api\CashPaymentController::class, 'confirmCashPayment']);
    Route::post('payments/{payment}/reject-cash', [\App\Http\Controllers\Api\CashPaymentController::class, 'rejectCashPayment']);
    Route::get('payments/cash-stats', [\App\Http\Controllers\Api\CashPaymentController::class, 'cashStats']);
});

// Customer Dashboard Routes - MOVED TO WEB.PHP to share session state
// See routes/web.php for 'api/customer' routes

// Order Holds
Route::prefix('order-holds')
    ->middleware(['auth:sanctum'])
    ->group(function () {
        Route::get('/', [OrderHoldController::class, 'index']);
        Route::post('/', [OrderHoldController::class, 'store']);
        Route::delete('{id}', [OrderHoldController::class, 'destroy']);
    });
// ============================================================================
// MOVED ROUTES (Consolidated from web.php)
// ============================================================================

// CUSTOMER API ROUTES
Route::prefix('customer')
    ->middleware(['auth:sanctum'])
    ->group(function () {
    // Profile & Dashboard
    Route::get('profile', [App\Http\Controllers\Api\CustomerDashboardController::class, 'profile']);
    Route::put('profile', [App\Http\Controllers\Api\CustomerController::class, 'updateProfile']);
    Route::get('dashboard/stats', [App\Http\Controllers\Api\CustomerDashboardController::class, 'dashboardStats']);
    
    // Orders
    Route::get('orders', [App\Http\Controllers\Api\CustomerDashboardController::class, 'orders']);
    Route::get('orders/{order}', [App\Http\Controllers\Api\CustomerDashboardController::class, 'show']);
    Route::post('orders/{order}/cancel', [App\Http\Controllers\Api\CustomerDashboardController::class, 'cancel']);
    Route::post('online-orders', [App\Http\Controllers\Api\OnlineOrderController::class, 'store']);
    
    // Favorites
    Route::get('favorites', [App\Http\Controllers\Api\CustomerDashboardController::class, 'favorites']);
    Route::get('favorites/ids', [App\Http\Controllers\Api\CustomerDashboardController::class, 'getExplicitFavorites']);
    Route::post('favorites/toggle', [App\Http\Controllers\Api\CustomerDashboardController::class, 'toggleFavorite']);
    
    // Notifications
    Route::get('notifications', [App\Http\Controllers\Api\CustomerDashboardController::class, 'notifications']);

    // Loyalty
    Route::get('loyalty/stats', [App\Http\Controllers\Api\CustomerDashboardController::class, 'loyaltyStats']);
    Route::get('loyalty/history', [App\Http\Controllers\Api\CustomerDashboardController::class, 'loyaltyHistory']);

    // CRM Data
    Route::get('stats', [App\Http\Controllers\Api\CustomerController::class, 'customerStats']);
    Route::get('history', [App\Http\Controllers\Api\CustomerController::class, 'customerHistory']);
    
    // Address Management
    Route::get('addresses', [App\Http\Controllers\Api\CustomerController::class, 'getAddresses']);
    Route::post('addresses', [App\Http\Controllers\Api\CustomerController::class, 'storeAddress']);
    Route::put('addresses/{address}', [App\Http\Controllers\Api\CustomerController::class, 'updateAddress']);
    Route::delete('addresses/{address}', [App\Http\Controllers\Api\CustomerController::class, 'destroyAddress']);
    Route::post('addresses/{address}/set-default', [App\Http\Controllers\Api\CustomerController::class, 'setDefaultAddress']);
    
    // Cart
    Route::get('cart', [App\Http\Controllers\Api\CartController::class, 'index']);
    Route::post('cart', [App\Http\Controllers\Api\CartController::class, 'store']);
    Route::put('cart/{cartItem}', [App\Http\Controllers\Api\CartController::class, 'update']);
    Route::delete('cart/{cartItem}', [App\Http\Controllers\Api\CartController::class, 'destroy']);
    Route::delete('cart', [App\Http\Controllers\Api\CartController::class, 'clear']);
    Route::post('cart/sync', [App\Http\Controllers\Api\CartController::class, 'sync']);
    
    // Reservations
    Route::get('reservations', [App\Http\Controllers\Api\CustomerReservationController::class, 'index']);
    Route::post('reservations', [App\Http\Controllers\Api\CustomerReservationController::class, 'store']);
    Route::get('reservations/availability', [App\Http\Controllers\Api\CustomerReservationController::class, 'availability']);
    Route::get('reservations/floors', [App\Http\Controllers\Api\CustomerReservationController::class, 'floors']);
    Route::get('reservations/tables', [App\Http\Controllers\Api\CustomerReservationController::class, 'tables']);
    Route::delete('reservations/{reservation}', [App\Http\Controllers\Api\CustomerReservationController::class, 'destroy']);
    
    // Rewards
    Route::get('rewards', [App\Http\Controllers\Api\RewardController::class, 'index']);
    Route::post('rewards/redeem', [App\Http\Controllers\Api\RewardController::class, 'redeem']);
    Route::get('rewards/history', [App\Http\Controllers\Api\RewardController::class, 'history']);
    
    // Notification Preferences
    Route::get('notification-preferences', [App\Http\Controllers\Api\NotificationPreferenceController::class, 'index']);
    Route::put('notification-preferences', [App\Http\Controllers\Api\NotificationPreferenceController::class, 'update']);
    Route::post('notification-preferences/toggle', [App\Http\Controllers\Api\NotificationPreferenceController::class, 'toggle']);
    Route::post('notification-preferences/disable-all', [App\Http\Controllers\Api\NotificationPreferenceController::class, 'disableAll']);
    Route::post('notification-preferences/enable-all', [App\Http\Controllers\Api\NotificationPreferenceController::class, 'enableAll']);
});

// USER API ROUTES
Route::prefix('user')
    ->middleware(['auth:sanctum'])
    ->group(function () {
    Route::put('profile', [App\Http\Controllers\Api\UserProfileController::class, 'update']);
    Route::post('profile/avatar', [App\Http\Controllers\Api\UserProfileController::class, 'uploadAvatar']);
    Route::delete('profile/avatar', [App\Http\Controllers\Api\UserProfileController::class, 'deleteAvatar']);
    Route::get('profile/avatar', [App\Http\Controllers\Api\UserProfileController::class, 'getAvatarUrl']);
    Route::post('change-password', [App\Http\Controllers\Api\UserProfileController::class, 'changePassword']);
});

// EMPLOYEE API ROUTES
Route::prefix('employee')
    ->middleware(['auth:sanctum'])
    ->group(function () {
    // Dashboard
    Route::get('dashboard/stats', [App\Http\Controllers\Api\Employee\EmployeeDashboardController::class, 'stats']);
    Route::get('dashboard/shifts', [App\Http\Controllers\Api\Employee\EmployeeDashboardController::class, 'upcomingShifts']);
    Route::get('dashboard/announcements', [App\Http\Controllers\Api\Employee\EmployeeDashboardController::class, 'announcements']);
    
    // Notifications
    Route::get('notifications', [App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [App\Http\Controllers\Api\NotificationController::class, 'unreadCount']);
    Route::put('notifications/read-all', [App\Http\Controllers\Api\NotificationController::class, 'markAllRead']);
    Route::put('notifications/{id}/read', [App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    
    // Settings
    Route::get('settings/notifications', [App\Http\Controllers\Api\NotificationPreferenceController::class, 'index']);
    Route::put('settings/notifications', [App\Http\Controllers\Api\NotificationPreferenceController::class, 'update']);
    Route::post('settings/notifications/toggle', [App\Http\Controllers\Api\NotificationPreferenceController::class, 'toggle']);
    Route::get('settings/work-preferences', [App\Http\Controllers\Api\Employee\EmployeeSettingsController::class, 'getWorkPreferences']);
    Route::put('settings/work-preferences', [App\Http\Controllers\Api\Employee\EmployeeSettingsController::class, 'updateWorkPreferences']);
    Route::get('settings/emergency-contact', [App\Http\Controllers\Api\Employee\EmployeeSettingsController::class, 'getEmergencyContact']);
    Route::put('settings/emergency-contact', [App\Http\Controllers\Api\Employee\EmployeeSettingsController::class, 'updateEmergencyContact']);
    
    // Support & Feedback
    Route::get('support-tickets', [App\Http\Controllers\Api\Employee\SupportTicketController::class, 'index']);
    Route::post('support-tickets', [App\Http\Controllers\Api\Employee\SupportTicketController::class, 'store']);
    Route::get('support-tickets/{id}', [App\Http\Controllers\Api\Employee\SupportTicketController::class, 'show']);
    Route::post('feedback', [App\Http\Controllers\Api\Employee\EmployeeFeedbackController::class, 'store']);
    
    // Performance
    Route::get('performance', [App\Http\Controllers\Api\Employee\EmployeePerformanceController::class, 'stats']);
    
    // Schedule & Shifts
    Route::get('shift-swaps', [App\Http\Controllers\Api\Employee\ShiftSwapController::class, 'index']);
    Route::post('shift-swaps', [App\Http\Controllers\Api\Employee\ShiftSwapController::class, 'store']);
    Route::put('shift-swaps/{id}', [App\Http\Controllers\Api\Employee\ShiftSwapController::class, 'update']);
    
    // POS Operations
    Route::get('pos/tables', [App\Http\Controllers\Api\Employee\EmployeePOSController::class, 'getTables']);
    Route::post('pos/orders', [App\Http\Controllers\Api\Employee\EmployeePOSController::class, 'store']);
    
    // Delivery Driver
    Route::get('driver/orders', [App\Http\Controllers\Api\Employee\DriverOrderController::class, 'index']);
    Route::post('driver/orders/{order}/claim', [App\Http\Controllers\Api\Employee\DriverOrderController::class, 'claim']);
    Route::put('driver/orders/{order}/status', [App\Http\Controllers\Api\Employee\DriverOrderController::class, 'updateStatus']);
});
