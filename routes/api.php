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
    
    // POS Active Orders
    Route::get('/pos/active', [\App\Http\Controllers\Api\OrderPaymentController::class, 'activeOrders']);
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


// Poll Helper for Smart Polling
Route::get('/poll-helper/sync-state', [\App\Http\Controllers\Api\PollHelperController::class, 'syncState'])
    ->middleware('auth:sanctum');

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
->middleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum', 'role:admin,manager,waiter,employee,chef,cashier,driver'])
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
    
    // Time Off Requests (available to all authenticated employees)
    Route::get('time-off-requests', [App\Http\Controllers\Api\EmployeeTimeOffController::class, 'index']);
    Route::post('time-off-requests', [App\Http\Controllers\Api\EmployeeTimeOffController::class, 'store']);
    Route::delete('time-off-requests/{id}', [App\Http\Controllers\Api\EmployeeTimeOffController::class, 'destroy']);
    
    // POS Operations
    Route::get('pos/tables', [App\Http\Controllers\Api\Employee\EmployeePOSController::class, 'getTables']);
    Route::post('pos/orders', [App\Http\Controllers\Api\Employee\EmployeePOSController::class, 'store']);
    
    // Delivery Driver
    Route::get('driver/orders', [App\Http\Controllers\Api\Employee\DriverOrderController::class, 'index']);
    Route::post('driver/orders/{order}/claim', [App\Http\Controllers\Api\Employee\DriverOrderController::class, 'claim']);
    Route::put('driver/orders/{order}/status', [App\Http\Controllers\Api\Employee\DriverOrderController::class, 'updateStatus']);

});


// ============================================================================
// TELEGRAM BOT WEBHOOK
// ============================================================================
// Telegram webhook endpoint - no authentication required (verified by secret token)
Route::post('/telegram/webhook', [App\Http\Controllers\Api\Telegram\TelegramWebhookController::class, 'handle'])
    ->withoutMiddleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum']);

// Debug endpoint to check Telegram bot configuration
Route::get('/telegram/debug', function () {
    $token = config('telegram.bot_token', env('TELEGRAM_BOT_TOKEN', ''));
    $hasToken = !empty($token);
    $tokenPreview = $hasToken ? substr($token, 0, 10) . '...' : 'NOT SET';
    
    // Test Telegram Connection
    $telegramStatus = 'SKIPPED';
    $telegramInfo = null;
    $telegramError = null;
    
    if ($hasToken) {
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(5)->get("https://api.telegram.org/bot{$token}/getMe");
            if ($response->successful()) {
                $telegramStatus = 'OK';
                $telegramInfo = $response->json('result');
            } else {
                $telegramStatus = 'FAILED';
                $telegramError = $response->body();
            }
        } catch (\Exception $e) {
            $telegramStatus = 'ERROR';
            $telegramError = $e->getMessage();
        }
    }

    // Test Database
    $dbStatus = 'UNKNOWN';
    $tables = [];
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbStatus = 'CONNECTED';
        
        // Check for key tables
        $tables['telegram_users'] = \Illuminate\Support\Facades\Schema::hasTable('telegram_users');
        $tables['users'] = \Illuminate\Support\Facades\Schema::hasTable('users');
    } catch (\Exception $e) {
        $dbStatus = 'FAILED: ' . $e->getMessage();
    }
    
    // Test keyboard builder methods
    $methodTests = [];
    try {
        \App\Services\Telegram\TelegramKeyboardBuilder::orderType();
        $methodTests['orderType'] = 'OK';
    } catch (\Throwable $e) {
        $methodTests['orderType'] = 'ERROR: ' . $e->getMessage();
    }
    try {
        \App\Services\Telegram\TelegramKeyboardBuilder::locations(collect([]));
        $methodTests['locations'] = 'OK';
    } catch (\Throwable $e) {
        $methodTests['locations'] = 'ERROR: ' . $e->getMessage();
    }
    try {
        \App\Services\Telegram\TelegramKeyboardBuilder::timeSlots(collect([]), now()->format('Y-m-d'), false);
        $methodTests['timeSlots'] = 'OK';
    } catch (\Throwable $e) {
        $methodTests['timeSlots'] = 'ERROR: ' . $e->getMessage();
    }
    try {
        \App\Services\Telegram\TelegramKeyboardBuilder::paymentMethods(false);
        $methodTests['paymentMethods'] = 'OK';
    } catch (\Throwable $e) {
        $methodTests['paymentMethods'] = 'ERROR: ' . $e->getMessage();
    }
    try {
        \App\Services\Telegram\TelegramKeyboardBuilder::welcomeKeyboard();
        $methodTests['welcomeKeyboard'] = 'OK';
    } catch (\Throwable $e) {
        $methodTests['welcomeKeyboard'] = 'ERROR: ' . $e->getMessage();
    }

    return response()->json([
        'token_configured' => $hasToken,
        'token_preview' => $tokenPreview,
        'telegram_api_check' => $telegramStatus,
        'telegram_info' => $telegramInfo,
        'telegram_error' => $telegramError,
        'webhook_url_env' => env('TELEGRAM_WEBHOOK_URL', 'NOT SET'),
        'database_status' => $dbStatus,
        'tables_exist' => $tables,
        'method_tests' => $methodTests,
    ]);
});

// TEST WEBHOOK ROUTE - Simulates /start command to debug errors
Route::get('/telegram/debug/test-start', function () {
    try {
        $botService = app(\App\Services\Telegram\TelegramBotService::class);

        // Simulate a user sending /start
        $testData = [
            'id' => 123456789,
            'first_name' => 'Test',
            'last_name' => 'User',
            'username' => 'testuser',
            'language_code' => 'en',
        ];

        // Try to create/find user
        $user = \App\Models\TelegramUser::findOrCreate($testData);

        // Check if user has linked account
        $hasLinked = $user->hasLinkedAccount();

        // Test keyboard builder methods that might be missing
        $tests = [];

        // Test orderType method
        try {
            $keyboard = \App\Services\Telegram\TelegramKeyboardBuilder::orderType();
            $tests['orderType'] = 'EXISTS';
        } catch (\Error $e) {
            $tests['orderType'] = 'MISSING: ' . $e->getMessage();
        }

        // Test locations method
        try {
            $keyboard = \App\Services\Telegram\TelegramKeyboardBuilder::locations(collect([]));
            $tests['locations'] = 'EXISTS';
        } catch (\Error $e) {
            $tests['locations'] = 'MISSING: ' . $e->getMessage();
        }

        // Test timeSlots method
        try {
            $keyboard = \App\Services\Telegram\TelegramKeyboardBuilder::timeSlots(collect([]), now()->format('Y-m-d'), false);
            $tests['timeSlots'] = 'EXISTS';
        } catch (\Error $e) {
            $tests['timeSlots'] = 'MISSING: ' . $e->getMessage();
        }

        // Test paymentMethods method
        try {
            $keyboard = \App\Services\Telegram\TelegramKeyboardBuilder::paymentMethods(false);
            $tests['paymentMethods'] = 'EXISTS';
        } catch (\Error $e) {
            $tests['paymentMethods'] = 'MISSING: ' . $e->getMessage();
        }

        // Test welcomeKeyboard method
        try {
            $keyboard = \App\Services\Telegram\TelegramKeyboardBuilder::welcomeKeyboard();
            $tests['welcomeKeyboard'] = 'EXISTS';
        } catch (\Error $e) {
            $tests['welcomeKeyboard'] = 'MISSING: ' . $e->getMessage();
        }

        return response()->json([
            'status' => 'success',
            'user_created' => $user->id,
            'has_linked_account' => $hasLinked,
            'method_tests' => $tests,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => array_slice($e->getTrace(), 0, 5),
        ], 500);
    }
});

// EMERGENCY MIGRATION ROUTE - Creates telegram tables directly
Route::get('/telegram/debug/migrate', function () {
    $results = [];

    try {
        // Reset any stuck transactions first
        \Illuminate\Support\Facades\DB::reconnect();
        $results['reconnect'] = 'OK';

        // Check if telegram_users table exists
        if (!\Illuminate\Support\Facades\Schema::hasTable('telegram_users')) {
            \Illuminate\Support\Facades\Schema::create('telegram_users', function ($table) {
                $table->id();
                $table->unsignedBigInteger('customer_id')->nullable();
                $table->bigInteger('telegram_id')->unique();
                $table->string('telegram_username', 100)->nullable();
                $table->string('first_name', 100)->nullable();
                $table->string('last_name', 100)->nullable();
                $table->string('language_code', 10)->default('en');
                $table->string('conversation_state', 50)->default('none');
                $table->json('conversation_data')->nullable();
                $table->boolean('is_active')->default(true);
                $table->boolean('notifications_enabled')->default(true);
                $table->timestamp('last_interaction_at')->nullable();
                $table->timestamps();
                $table->index(['is_active', 'notifications_enabled']);
                $table->index('customer_id');
                $table->index('conversation_state');
            });
            $results['telegram_users'] = 'CREATED';
        } else {
            $results['telegram_users'] = 'EXISTS';
        }

        // Check if telegram_order_notifications table exists
        if (!\Illuminate\Support\Facades\Schema::hasTable('telegram_order_notifications')) {
            \Illuminate\Support\Facades\Schema::create('telegram_order_notifications', function ($table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->unsignedBigInteger('telegram_user_id');
                $table->string('status', 50);
                $table->text('message')->nullable();
                $table->boolean('sent')->default(false);
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
                $table->index(['order_id', 'telegram_user_id']);
                $table->index('sent');
            });
            $results['telegram_order_notifications'] = 'CREATED';
        } else {
            $results['telegram_order_notifications'] = 'EXISTS';
        }

        return response()->json([
            'status' => 'success',
            'results' => $results,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'results' => $results,
        ], 500);
    }
});

// ============================================================================
// TELEGRAM BOT API ROUTES (For bot to call)
// ============================================================================
Route::prefix('telegram')
    ->middleware(['throttle:api']) // Rate limiting
    ->group(function () {

    // Public endpoints for menu browsing
    Route::get('/menu/categories', [App\Http\Controllers\Api\Telegram\TelegramMenuController::class, 'categories']);
    Route::get('/menu/items/{categoryId}', [App\Http\Controllers\Api\Telegram\TelegramMenuController::class, 'items']);
    Route::get('/menu/items/{categoryId}/paginated', [App\Http\Controllers\Api\Telegram\TelegramMenuController::class, 'itemsPaginated']);
    Route::get('/menu/item/{itemId}', [App\Http\Controllers\Api\Telegram\TelegramMenuController::class, 'itemDetail']);

    // Locations
    Route::get('/locations', [App\Http\Controllers\Api\Telegram\TelegramMenuController::class, 'locations']);

    // Time slots
    Route::get('/time-slots', [App\Http\Controllers\Api\Telegram\TelegramOrderController::class, 'timeSlots']);

    // Payment modes
    Route::get('/payment-modes/{orderType}', [App\Http\Controllers\Api\Telegram\TelegramOrderController::class, 'paymentModes']);

    // Cart endpoints (require Telegram user session)
    Route::middleware([\App\Http\Middleware\TelegramAuth::class])
        ->group(function () {

        // Cart management
        Route::get('/cart', [App\Http\Controllers\Api\Telegram\TelegramCartController::class, 'get']);
        Route::post('/cart/add', [App\Http\Controllers\Api\Telegram\TelegramCartController::class, 'add']);
        Route::put('/cart/update/{menuItemId}', [App\Http\Controllers\Api\Telegram\TelegramCartController::class, 'update']);
        Route::delete('/cart/remove/{menuItemId}', [App\Http\Controllers\Api\Telegram\TelegramCartController::class, 'remove']);
        Route::delete('/cart/clear', [App\Http\Controllers\Api\Telegram\TelegramCartController::class, 'clear']);
        Route::get('/cart/total', [App\Http\Controllers\Api\Telegram\TelegramCartController::class, 'total']);

        // Order management
        Route::get('/orders', [App\Http\Controllers\Api\Telegram\TelegramOrderController::class, 'list']);
        Route::get('/orders/{orderId}', [App\Http\Controllers\Api\Telegram\TelegramOrderController::class, 'detail']);
        Route::post('/orders/{orderId}/cancel', [App\Http\Controllers\Api\Telegram\TelegramOrderController::class, 'cancel']);

        // Account management
        Route::get('/me', [App\Http\Controllers\Api\Telegram\TelegramAccountController::class, 'me']);
        Route::post('/link-account', [App\Http\Controllers\Api\Telegram\TelegramAccountController::class, 'linkByPhone']);
        Route::post('/link-account/email', [App\Http\Controllers\Api\Telegram\TelegramAccountController::class, 'linkByEmail']);

        // Addresses
        Route::get('/addresses', [App\Http\Controllers\Api\Telegram\TelegramAccountController::class, 'addresses']);

        // Loyalty
        Route::get('/loyalty/stats', [App\Http\Controllers\Api\Telegram\TelegramAccountController::class, 'loyaltyStats']);

        // Notification preferences
        Route::get('/notifications/preferences', [App\Http\Controllers\Api\Telegram\TelegramAccountController::class, 'notificationPreferences']);
        Route::put('/notifications/preferences', [App\Http\Controllers\Api\Telegram\TelegramAccountController::class, 'updateNotificationPreferences']);
    });
});


// ============================================================================
// ADMIN TELEGRAM SETTINGS (Optional - for managing bot settings)
// ============================================================================
Route::prefix('admin/telegram')
    ->middleware(['auth:sanctum', 'role:super-admin,admin'])
    ->group(function () {
    Route::get('/stats', [App\Http\Controllers\Api\Telegram\TelegramAdminController::class, 'stats']);
    Route::get('/users', [App\Http\Controllers\Api\Telegram\TelegramAdminController::class, 'users']);
    Route::post('/set-webhook', [App\Http\Controllers\Api\Telegram\TelegramAdminController::class, 'setWebhook']);
    Route::get('/webhook-info', [App\Http\Controllers\Api\Telegram\TelegramAdminController::class, 'webhookInfo']);
    Route::post('/broadcast', [App\Http\Controllers\Api\Telegram\TelegramAdminController::class, 'broadcast']);
});



