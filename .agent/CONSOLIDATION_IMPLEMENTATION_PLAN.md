# 🏗️ COMPLETE IMPLEMENTATION PLAN: Order Approval Consolidation

**Project**: NKH Restaurant Web Application  
**Technology Stack**: Laravel 11.x + Inertia.js + React/TypeScript  
**Database**: MySQL/PostgreSQL  
**Goal**: Consolidate all Order Approval/Rejection logic into the Orders module and eliminate the deprecated Customer Requests module  
**Root Cause**: "I messed up from the database up" - requires database-first refactoring approach

---

## 📋 Executive Summary

### Current Architecture (Flawed)
- **Orders Table**: Contains `approval_status`, `approved_by`, `approved_at`, `rejection_reason` columns (✅ Already present)
- **Customer Requests Table**: Redundant table that duplicates approval logic with `status`, `type`, `subject`, `description` columns
- **Dual Controllers**: Both `OrderController` and `CustomerRequestController` handle approval logic
- **Fragmented Logic**: Approval/rejection methods exist in 3 places:
  1. `OrderController::approve()` & `OrderController::reject()` (Lines 316-353)
  2. `CustomerRequestController::update()` (API, Lines 45-84)
  3. `CustomerRequestController::approve()` & `::reject()` (Admin, Lines 31-63)

### Target Architecture (Clean)
- **Orders Table Only**: Single source of truth for approval status
- **OrderController Only**: Centralized approval/rejection logic
- **No Customer Requests**: Table, model, and controllers completely removed
- **Unified Routes**: All approval endpoints under `/api/admin/orders/{order}/approve|reject`

---

## ⚙️ PREREQUISITES & ASSUMPTIONS

### Technology Stack
- **Framework**: Laravel 11.x (MVC)
- **Frontend**: Inertia.js with React/TypeScript
- **Database**: MySQL with InnoDB engine
- **Migration System**: Laravel Schema Builder

### Key Models Identified
1. **Order** (`app/Models/Order.php`)
   - ✅ Already has: `approval_status`, `approved_by`, `approved_at`, `rejection_reason`
   - ✅ Already has constants: `APPROVAL_STATUS_PENDING`, `APPROVAL_STATUS_APPROVED`, `APPROVAL_STATUS_REJECTED`
   
2. **CustomerRequest** (`app/Models/CustomerRequest.php`) - **TO BE DELETED**
   - Currently has: `customer_id`, `order_id`, `type`, `subject`, `description`, `status`, `priority`, `admin_notes`, `resolution`, `resolved_at`

### Key Controllers Identified
1. **OrderController** (`app/Http/Controllers/Api/OrderController.php`) - **TO BE ENHANCED**
   - ✅ Already has `approve()` and `reject()` methods (Lines 316-353)
   
2. **CustomerRequestController** (API: `app/Http/Controllers/Api/CustomerRequestController.php`) - **TO BE DELETED**
3. **CustomerRequestController** (Admin: `app/Http/Controllers/Admin/CustomerRequestController.php`) - **TO BE DELETED**

---

## 📝 PHASE I: DATABASE MIGRATION (The Critical Fix)

### Context
The Order model **ALREADY HAS** the necessary approval columns:
- `approval_status` (enum: 'pending', 'approved', 'rejected')
- `approved_by` (foreign key to users table)
- `approved_at` (timestamp)
- `rejection_reason` (text, nullable)
- `is_auto_approved` (boolean)

However, the `customer_requests` table exists as a redundant shadow system that needs to be eliminated.

---

### A. Migration 1: Data Verification & Cleanup
**File**: `database/migrations/2025_11_27_HHMMSS_verify_and_cleanup_customer_requests_data.php`

**Purpose**: Before dropping the `customer_requests` table, verify that all critical data has been migrated to the `orders` table.

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\CustomerRequest;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Log any customer_requests that have an order_id
        $requestsWithOrders = DB::table('customer_requests')
            ->whereNotNull('order_id')
            ->get();

        foreach ($requestsWithOrders as $request) {
            $order = DB::table('orders')->where('id', $request->order_id)->first();
            
            if ($order) {
                // Sync approval status from customer_request to order if needed
                $needsUpdate = false;
                $updateData = [];

                // Map customer_request status to order approval_status
                if ($request->status === 'resolved' && $order->approval_status === 'pending') {
                    $updateData['approval_status'] = 'approved';
                    $updateData['approved_at'] = $request->resolved_at ?? now();
                    $needsUpdate = true;
                } elseif ($request->status === 'closed' && $order->approval_status === 'pending') {
                    $updateData['approval_status'] = 'rejected';
                    $updateData['rejection_reason'] = $request->resolution ?? 'Request closed';
                    $needsUpdate = true;
                }

                // Add admin notes to rejection_reason if present
                if (!empty($request->admin_notes) && empty($order->rejection_reason)) {
                    $updateData['rejection_reason'] = $request->admin_notes;
                    $needsUpdate = true;
                }

                if ($needsUpdate) {
                    DB::table('orders')
                        ->where('id', $order->id)
                        ->update($updateData);
                }
            }
        }

        // Step 2: Log orphaned customer_requests (no order_id)
        $orphanedRequests = DB::table('customer_requests')
            ->whereNull('order_id')
            ->get();

        if ($orphanedRequests->count() > 0) {
            \Log::warning('Found ' . $orphanedRequests->count() . ' orphaned customer_requests without order_id. These will be deleted.');
            // Optionally export to a backup file before deletion
            file_put_contents(
                storage_path('logs/orphaned_customer_requests_backup.json'),
                json_encode($orphanedRequests, JSON_PRETTY_PRINT)
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse this data migration
        throw new \Exception('This migration cannot be reversed. Restore from backup if needed.');
    }
};
```

---

### B. Migration 2: Drop Customer Requests Table
**File**: `database/migrations/2025_11_27_HHMMSS_drop_customer_requests_table.php`

**Purpose**: Safely drop the entire `customer_requests` table after data verification.

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the customer_requests table
        Schema::dropIfExists('customer_requests');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the table structure (but NOT the data)
        Schema::create('customer_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('subject');
            $table->text('description');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->text('admin_notes')->nullable();
            $table->text('resolution')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
        
        \Log::warning('customer_requests table structure recreated, but data was NOT restored. Restore from backup manually if needed.');
    }
};
```

---

### C. Migration 3: Ensure Order Table Approval Columns (Verification)
**File**: `database/migrations/2025_11_27_HHMMSS_verify_orders_approval_columns.php`

**Purpose**: This is a verification migration to ensure all required columns exist. Based on the code review, these columns **already exist**, but this migration serves as documentation and safety check.

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // These columns SHOULD already exist, but we'll check and add if missing
            if (!Schema::hasColumn('orders', 'approval_status')) {
                $table->enum('approval_status', ['pending', 'approved', 'rejected'])
                    ->default('pending')
                    ->after('status');
            }
            
            if (!Schema::hasColumn('orders', 'approved_by')) {
                $table->foreignId('approved_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete()
                    ->after('approval_status');
            }
            
            if (!Schema::hasColumn('orders', 'approved_at')) {
                $table->timestamp('approved_at')
                    ->nullable()
                    ->after('approved_by');
            }
            
            if (!Schema::hasColumn('orders', 'rejection_reason')) {
                $table->text('rejection_reason')
                    ->nullable()
                    ->after('approved_at');
            }
            
            if (!Schema::hasColumn('orders', 'is_auto_approved')) {
                $table->boolean('is_auto_approved')
                    ->default(false)
                    ->after('rejection_reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't drop these columns in down() because they are critical to Order functionality
        \Log::warning('Down migration skipped - approval columns are core to Order model');
    }
};
```

---

## 🖥️ PHASE II: BACKEND LOGIC REFACTORING

### A. Update Order Model
**File**: `app/Models/Order.php`

**Changes Required**:
1. ✅ Remove relationship to CustomerRequest
2. ✅ Remove `is_customer_request` accessor (no longer needed)
3. ✅ Add relationship to User for `approved_by`
4. ✅ Add helper methods for approval workflow

**Complete Updated Order Model**:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\OrderStatus;

class Order extends Model
{
    use HasFactory;

    const APPROVAL_STATUS_PENDING = 'pending';
    const APPROVAL_STATUS_APPROVED = 'approved';
    const APPROVAL_STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'location_id',
        'table_id',
        'customer_id',
        'employee_id',
        'order_number',
        'order_type',
        'status',
        'payment_status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'service_charge',
        'delivery_fee',
        'total_amount',
        'currency',
        'ordered_at',
        'scheduled_at',
        'pickup_time',
        'completed_at',
        'special_instructions',
        'delivery_instructions',
        'customer_address_id',
        'time_slot_id',
        'estimated_ready_time',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'is_auto_approved',
        'promotion_id',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'ordered_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'pickup_time' => 'datetime',
        'completed_at' => 'datetime',
        'estimated_ready_time' => 'datetime',
        'approved_at' => 'datetime',
        'is_auto_approved' => 'boolean',
    ];

    // ==================== RELATIONSHIPS ====================

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function table()
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }

    public function payments()
    {
        return $this->hasManyThrough(Payment::class, Invoice::class, 'order_id', 'invoice_id', 'id', 'id');
    }

    public function customerAddress()
    {
        return $this->belongsTo(CustomerAddress::class, 'customer_address_id');
    }

    public function timeSlot()
    {
        return $this->belongsTo(OrderTimeSlot::class, 'time_slot_id');
    }

    /**
     * User who approved this order (admin/manager)
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if order requires manual approval
     */
    public function requiresApproval(): bool
    {
        return in_array($this->order_type, ['delivery', 'pickup']) 
            && !$this->is_auto_approved;
    }

    /**
     * Check if order is pending approval
     */
    public function isPendingApproval(): bool
    {
        return $this->approval_status === self::APPROVAL_STATUS_PENDING;
    }

    /**
     * Check if order is approved
     */
    public function isApproved(): bool
    {
        return $this->approval_status === self::APPROVAL_STATUS_APPROVED;
    }

    /**
     * Check if order is rejected
     */
    public function isRejected(): bool
    {
        return $this->approval_status === self::APPROVAL_STATUS_REJECTED;
    }

    /**
     * Approve the order
     */
    public function approve(int $userId): bool
    {
        return $this->update([
            'status' => 'received',
            'approval_status' => self::APPROVAL_STATUS_APPROVED,
            'approved_by' => $userId,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    /**
     * Reject the order
     */
    public function reject(string $reason): bool
    {
        return $this->update([
            'status' => 'cancelled',
            'approval_status' => self::APPROVAL_STATUS_REJECTED,
            'rejection_reason' => $reason,
        ]);
    }
}
```

---

### B. Enhanced OrderController
**File**: `app/Http/Controllers/Api/OrderController.php`

**Changes Required**:
1. ✅ Approve and reject methods already exist (Lines 316-353)
2. ✅ Add a new `index` method to list pending orders (replace CustomerRequestController::index)
3. ✅ Add validation to ensure robust error handling

**Additional Method to Add** (insert after line 353):

```php
/**
 * GET /api/admin/orders/pending-approval
 * List all orders pending approval (replaces CustomerRequestController::index)
 */
public function pendingApproval(Request $request)
{
    $query = Order::with(['customer.user', 'items.menuItem', 'customerAddress'])
        ->where('approval_status', Order::APPROVAL_STATUS_PENDING)
        ->whereIn('order_type', ['delivery', 'pickup']);

    // Optional filters
    if ($request->filled('location_id')) {
        $query->where('location_id', $request->location_id);
    }

    if ($request->filled('search')) {
        $search = $request->string('search');
        $query->where(function ($q) use ($search) {
            $q->where('order_number', 'like', "%{$search}%")
              ->orWhereHas('customer.user', function ($uq) use ($search) {
                  $uq->where('name', 'like', "%{$search}%")
                     ->orWhere('email', 'like', "%{$search}%");
              });
        });
    }

    $orders = $query->orderBy('ordered_at', 'desc')
                   ->paginate($request->get('per_page', 15));

    return OrderResource::collection($orders);
}
```

**Improved Approve Method** (replace lines 316-335):

```php
/**
 * PATCH /api/admin/orders/{order}/approve
 * Approve a pending online order
 */
public function approve(Request $request, Order $order): JsonResponse|OrderResource
{
    // Validation
    if ($order->approval_status !== Order::APPROVAL_STATUS_PENDING) {
        return response()->json([
            'message' => 'Order is not pending approval.',
            'current_status' => $order->approval_status
        ], 409);
    }

    // Ensure authenticated user exists
    if (!$request->user()) {
        abort(401, 'Unauthenticated.');
    }

    // Use the model method for approval
    $success = $order->approve($request->user()->id);

    if (!$success) {
        return response()->json([
            'message' => 'Failed to approve order.',
        ], 500);
    }

    // Log the approval action
    \Log::info('Order approved', [
        'order_id' => $order->id,
        'order_number' => $order->order_number,
        'approved_by' => $request->user()->id,
        'approved_by_name' => $request->user()->name,
    ]);

    return new OrderResource($order->fresh(['items.menuItem', 'customerAddress', 'approvedBy']));
}
```

**Improved Reject Method** (replace lines 337-353):

```php
/**
 * PATCH /api/admin/orders/{order}/reject
 * Reject a pending online order
 */
public function reject(Request $request, Order $order): JsonResponse|OrderResource
{
    // Validation
    if ($order->approval_status !== Order::APPROVAL_STATUS_PENDING) {
        return response()->json([
            'message' => 'Order is not pending approval.',
            'current_status' => $order->approval_status
        ], 409);
    }

    $validated = $request->validate([
        'rejection_reason' => 'required|string|min:10|max:500'
    ]);

    // Use the model method for rejection
    $success = $order->reject($validated['rejection_reason']);

    if (!$success) {
        return response()->json([
            'message' => 'Failed to reject order.',
        ], 500);
    }

    // Log the rejection action
    \Log::info('Order rejected', [
        'order_id' => $order->id,
        'order_number' => $order->order_number,
        'rejected_by' => $request->user()?->id,
        'rejection_reason' => $validated['rejection_reason'],
    ]);

    return new OrderResource($order->fresh(['items.menuItem', 'customerAddress']));
}
```

---

### C. Service Layer (Optional - Recommended)
**File**: `app/Services/OrderApprovalService.php` (NEW FILE)

**Purpose**: Centralize approval business logic, send notifications, trigger webhooks, etc.

```php
<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class OrderApprovalService
{
    /**
     * Approve an order with business logic
     */
    public function approve(Order $order, User $approver): bool
    {
        return DB::transaction(function () use ($order, $approver) {
            // Update order status
            $success = $order->approve($approver->id);

            if (!$success) {
                return false;
            }

            // Send notification to customer
            if ($order->customer && $order->customer->user) {
                // TODO: Implement notification
                // Notification::send($order->customer->user, new OrderApprovedNotification($order));
            }

            // Log audit trail
            Log::info('Order approved via service', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'approved_by' => $approver->id,
                'approved_by_name' => $approver->name,
                'approved_at' => $order->approved_at,
            ]);

            return true;
        });
    }

    /**
     * Reject an order with business logic
     */
    public function reject(Order $order, string $reason, ?User $rejector = null): bool
    {
        return DB::transaction(function () use ($order, $reason, $rejector) {
            // Update order status
            $success = $order->reject($reason);

            if (!$success) {
                return false;
            }

            // Send notification to customer
            if ($order->customer && $order->customer->user) {
                // TODO: Implement notification
                // Notification::send($order->customer->user, new OrderRejectedNotification($order));
            }

            // Log audit trail
            Log::info('Order rejected via service', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'rejected_by' => $rejector?->id,
                'rejection_reason' => $reason,
            ]);

            return true;
        });
    }

    /**
     * Get all orders pending approval
     */
    public function getPendingOrders(?int $locationId = null)
    {
        $query = Order::with(['customer.user', 'items.menuItem', 'customerAddress'])
            ->where('approval_status', Order::APPROVAL_STATUS_PENDING)
            ->whereIn('order_type', ['delivery', 'pickup']);

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        return $query->orderBy('ordered_at', 'desc')->get();
    }
}
```

---

## 🗑️ PHASE III: CODE REMOVAL AND CLEANUP

### A. Files to be DELETED

#### 1. Models
```
✗ app/Models/CustomerRequest.php
```

#### 2. Controllers
```
✗ app/Http/Controllers/Api/CustomerRequestController.php
✗ app/Http/Controllers/Admin/CustomerRequestController.php
```

#### 3. Resources (API Response Transformers)
```
✗ app/Http/Resources/CustomerRequestResource.php
```

#### 4. Form Requests (if any)
```
✗ app/Http/Requests/Api/CustomerRequest/* (entire directory)
```

#### 5. Frontend Pages
```
✗ resources/js/Pages/CustomerRequests.jsx
✗ resources/js/Pages/admin/CustomerRequests.tsx
```

#### 6. Compiled Assets (auto-regenerated on build)
```
✗ public/build/assets/CustomerRequests-*.js
```

---

### B. Routes to be REMOVED
**File**: `routes/api.php`

**Lines to DELETE**: 239-242

```php
// ❌ DELETE THESE LINES
// Customer Requests
Route::get('customer-requests', [CustomerRequestController::class, 'index']);
Route::get('customer-requests/{customerRequest}', [CustomerRequestController::class, 'show']);
Route::patch('customer-requests/{customerRequest}', [CustomerRequestController::class, 'update']);
```

**Lines to ADD** (after line 254):

```php
// ✅ ADD THIS LINE
Route::get('orders/pending-approval', [OrderController::class, 'pendingApproval']);
```

Also **DELETE** the import statement on line 21:

```php
// ❌ DELETE THIS IMPORT
use App\Http\Controllers\Api\CustomerRequestController;
```

---

### C. Database Migrations to DELETE (After Running)

After successfully running the consolidation migrations, you can optionally delete these old migration files:

```
✗ database/migrations/2025_10_21_000003_create_customer_requests_table.php
✗ database/migrations/2025_10_27_000000_add_order_id_to_customer_requests_table.php
✗ database/migrations/2025_10_27_122508_add_order_id_to_customer_requests_table.php
```

**⚠️ WARNING**: Only delete these AFTER the new migrations have run successfully in production.

---

### D. Update Frontend References

**Files to UPDATE** (replace CustomerRequests references with Orders):

1. **Admin Navigation** (likely in a layout file):
   ```typescript
   // Change from:
   { name: 'Customer Requests', href: '/admin/customer-requests' }
   
   // To:
   { name: 'Pending Orders', href: '/admin/orders?status=pending' }
   ```

2. **Admin Dashboard** (if it shows pending requests count):
   ```typescript
   // Change from:
   fetch('/api/admin/customer-requests')
   
   // To:
   fetch('/api/admin/orders/pending-approval')
   ```

3. **Create a New Pending Orders Page** (replace CustomerRequests.tsx):
   ```
   ✓ resources/js/Pages/admin/PendingOrders.tsx (NEW FILE - see Phase IV)
   ```

---

## ✅ PHASE IV: VERIFICATION & TESTING

### A. Unit Tests to Write/Update

#### 1. **OrderApprovalTest.php**
**File**: `tests/Feature/OrderApprovalTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Order;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderApprovalTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function admin_can_approve_pending_order()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'order_type' => 'delivery',
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/approve");

        $response->assertStatus(200);
        
        $this->assertEquals(Order::APPROVAL_STATUS_APPROVED, $order->fresh()->approval_status);
        $this->assertEquals('received', $order->fresh()->status);
        $this->assertEquals($admin->id, $order->fresh()->approved_by);
        $this->assertNotNull($order->fresh()->approved_at);
    }

    /** @test */
    public function admin_can_reject_pending_order()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'order_type' => 'pickup',
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/reject", [
                'rejection_reason' => 'Out of ingredients for this order'
            ]);

        $response->assertStatus(200);
        
        $this->assertEquals(Order::APPROVAL_STATUS_REJECTED, $order->fresh()->approval_status);
        $this->assertEquals('cancelled', $order->fresh()->status);
        $this->assertEquals('Out of ingredients for this order', $order->fresh()->rejection_reason);
    }

    /** @test */
    public function cannot_approve_already_approved_order()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_APPROVED,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/approve");

        $response->assertStatus(409);
        $response->assertJson(['message' => 'Order is not pending approval.']);
    }

    /** @test */
    public function rejection_requires_reason()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/reject", [
                'rejection_reason' => '' // Empty reason
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('rejection_reason');
    }

    /** @test */
    public function can_list_pending_approval_orders()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // Create 3 pending orders
        Order::factory()->count(3)->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'order_type' => 'delivery',
        ]);

        // Create 2 approved orders (should not appear)
        Order::factory()->count(2)->create([
            'approval_status' => Order::APPROVAL_STATUS_APPROVED,
            'order_type' => 'delivery',
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/orders/pending-approval');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }
}
```

---

#### 2. **OrderModelTest.php**
**File**: `tests/Unit/OrderModelTest.php`

```php
<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function requires_approval_returns_true_for_delivery_orders()
    {
        $order = Order::factory()->make([
            'order_type' => 'delivery',
            'is_auto_approved' => false,
        ]);

        $this->assertTrue($order->requiresApproval());
    }

    /** @test */
    public function requires_approval_returns_false_for_dine_in_orders()
    {
        $order = Order::factory()->make([
            'order_type' => 'dine-in',
        ]);

        $this->assertFalse($order->requiresApproval());
    }

    /** @test */
    public function approve_method_updates_order_correctly()
    {
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'status' => 'pending',
        ]);

        $admin = User::factory()->create();

        $result = $order->approve($admin->id);

        $this->assertTrue($result);
        $this->assertEquals(Order::APPROVAL_STATUS_APPROVED, $order->fresh()->approval_status);
        $this->assertEquals('received', $order->fresh()->status);
        $this->assertEquals($admin->id, $order->fresh()->approved_by);
        $this->assertNotNull($order->fresh()->approved_at);
    }

    /** @test */
    public function reject_method_updates_order_correctly()
    {
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'status' => 'pending',
        ]);

        $reason = 'Kitchen is closed';
        $result = $order->reject($reason);

        $this->assertTrue($result);
        $this->assertEquals(Order::APPROVAL_STATUS_REJECTED, $order->fresh()->approval_status);
        $this->assertEquals('cancelled', $order->fresh()->status);
        $this->assertEquals($reason, $order->fresh()->rejection_reason);
    }

    /** @test */
    public function approved_by_relationship_works()
    {
        $admin = User::factory()->create();
        
        $order = Order::factory()->create([
            'approved_by' => $admin->id,
        ]);

        $this->assertInstanceOf(User::class, $order->approvedBy);
        $this->assertEquals($admin->id, $order->approvedBy->id);
    }
}
```

---

#### 3. **DatabaseIntegrityTest.php**
**File**: `tests/Feature/DatabaseIntegrityTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Schema;

class DatabaseIntegrityTest extends TestCase
{
    /** @test */
    public function customer_requests_table_does_not_exist()
    {
        $this->assertFalse(
            Schema::hasTable('customer_requests'),
            'customer_requests table should be deleted after consolidation'
        );
    }

    /** @test */
    public function orders_table_has_approval_columns()
    {
        $this->assertTrue(Schema::hasColumn('orders', 'approval_status'));
        $this->assertTrue(Schema::hasColumn('orders', 'approved_by'));
        $this->assertTrue(Schema::hasColumn('orders', 'approved_at'));
        $this->assertTrue(Schema::hasColumn('orders', 'rejection_reason'));
        $this->assertTrue(Schema::hasColumn('orders', 'is_auto_approved'));
    }

    /** @test */
    public function customer_request_model_does_not_exist()
    {
        $this->assertFalse(
            class_exists('App\\Models\\CustomerRequest'),
            'CustomerRequest model should be deleted'
        );
    }
}
```

---

### B. Manual Testing Checklist

#### Pre-Migration Testing
- [ ] Export current `customer_requests` table data to backup
- [ ] Document any orders with `approval_status = 'pending'`
- [ ] Test current approval workflow in staging environment

#### Post-Migration Testing
- [ ] ✅ Verify `customer_requests` table no longer exists
- [ ] ✅ Verify all approval data migrated to `orders` table
- [ ] ✅ Test new `/api/admin/orders/{order}/approve` endpoint
- [ ] ✅ Test new `/api/admin/orders/{order}/reject` endpoint
- [ ] ✅ Test new `/api/admin/orders/pending-approval` endpoint
- [ ] ✅ Verify old `/api/admin/customer-requests` endpoints return 404
- [ ] ✅ Test frontend: Pending Orders page loads
- [ ] ✅ Test frontend: Approve button works
- [ ] ✅ Test frontend: Reject modal works
- [ ] ✅ Test permission checks (only admin/manager can approve)
- [ ] ✅ Test audit logs capture approval actions

---

### C. Deployment Checklist

#### 1. **Backup Database**
```bash
# Production backup before migration
php artisan db:backup
# Or manual mysqldump
mysqldump -u user -p database_name > backup_before_consolidation.sql
```

#### 2. **Run Migrations**
```bash
# Run in order
php artisan migrate --path=/database/migrations/2025_11_27_HHMMSS_verify_and_cleanup_customer_requests_data.php
php artisan migrate --path=/database/migrations/2025_11_27_HHMMSS_drop_customer_requests_table.php
php artisan migrate --path=/database/migrations/2025_11_27_HHMMSS_verify_orders_approval_columns.php
```

#### 3. **Clear Caches**
```bash
php artisan config:clear
php artisan route:clear
php artisan view:clear
composer dump-autoload
```

#### 4. **Rebuild Frontend**
```bash
npm run build
```

#### 5. **Verify Endpoints**
```bash
curl -X GET http://localhost:8000/api/admin/orders/pending-approval
curl -X GET http://localhost:8000/api/admin/customer-requests  # Should return 404
```

---

## 📊 PHASE V: FRONTEND UPDATES

### A. Create New PendingOrders.tsx Page
**File**: `resources/js/Pages/admin/PendingOrders.tsx`

```typescript
import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Order {
  id: number;
  order_number: string;
  order_type: string;
  total_amount: number;
  ordered_at: string;
  customer: {
    user: {
      name: string;
      email: string;
    };
  };
  customer_address?: {
    street: string;
    city: string;
  };
}

export default function PendingOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders/pending-approval');
      const data = await response.json();
      setOrders(data.data);
    } catch (error) {
      console.error('Failed to fetch pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId: number) => {
    if (!confirm('Are you sure you want to approve this order?')) return;

    try {
      await fetch(`/api/admin/orders/${orderId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      // Refresh list
      fetchPendingOrders();
    } catch (error) {
      console.error('Failed to approve order:', error);
      alert('Failed to approve order');
    }
  };

  const handleReject = async (orderId: number) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason || reason.length < 10) {
      alert('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });

      // Refresh list
      fetchPendingOrders();
    } catch (error) {
      console.error('Failed to reject order:', error);
      alert('Failed to reject order');
    }
  };

  return (
    <AdminLayout>
      <Head title="Pending Orders" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-2xl font-semibold mb-6">Orders Pending Approval</h2>

              {loading ? (
                <p>Loading...</p>
              ) : orders.length === 0 ? (
                <p className="text-gray-500">No orders pending approval</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{order.order_number}</td>
                        <td className="px-6 py-4">
                          <div>{order.customer.user.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap capitalize">{order.order_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${order.total_amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(order.ordered_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleApprove(order.id)}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(order.id)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
```

---

## 🎯 SUMMARY & NEXT STEPS

### What We've Accomplished
1. ✅ **Database Schema**: Verified Orders table has all approval columns
2. ✅ **Data Migration**: Created scripts to migrate data from customer_requests to orders
3. ✅ **Model Refactoring**: Enhanced Order model with approval helper methods
4. ✅ **Controller Enhancement**: Improved OrderController with robust approval logic
5. ✅ **Code Removal**: Identified all CustomerRequest files to delete
6. ✅ **Route Updates**: Mapped old routes to new consolidated endpoints
7. ✅ **Testing Strategy**: Complete test suite for approval workflow
8. ✅ **Frontend Replacement**: New PendingOrders page to replace CustomerRequests

### Execution Order
1. **Backup database** ⚠️ CRITICAL
2. Run migration 1: Data verification & cleanup
3. Run migration 2: Drop customer_requests table
4. Run migration 3: Verify orders approval columns
5. Update Order model
6. Update OrderController
7. Delete CustomerRequest files
8. Update routes/api.php
9. Create new PendingOrders.tsx
10. Run tests
11. Clear caches
12. Rebuild frontend
13. Deploy to staging
14. User acceptance testing
15. Deploy to production

### Rollback Plan
If anything goes wrong:
```bash
# Restore database from backup
mysql -u user -p database_name < backup_before_consolidation.sql

# Revert code changes
git revert <commit-hash>

# Rebuild
composer install
npm install && npm run build
php artisan migrate:rollback
```

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue**: Migration fails with foreign key constraint error  
**Solution**: Check if any other tables reference `customer_requests.id`. Drop those foreign keys first.

**Issue**: Orphaned data after migration  
**Solution**: Check `storage/logs/orphaned_customer_requests_backup.json` for data that wasn't migrated.

**Issue**: Frontend still shows CustomerRequests link  
**Solution**: Search codebase for "customer-request" (case-insensitive) and update all references.

**Issue**: Tests fail with "Class CustomerRequest not found"  
**Solution**: Run `composer dump-autoload` to regenerate the autoload files.

---

## ✅ COMPLETION CRITERIA

You can consider this consolidation **COMPLETE** when:

- [ ] `customer_requests` table no longer exists in database
- [ ] All CustomerRequest model/controller files deleted
- [ ] All tests pass
- [ ] Frontend shows "Pending Orders" instead of "Customer Requests"
- [ ] Admins can approve/reject orders from the new interface
- [ ] No references to "CustomerRequest" in codebase (except comments/docs)
- [ ] Production deployment successful with zero downtime
- [ ] Post-deployment monitoring shows no errors for 48 hours

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-27  
**Author**: Senior Software Architect  
**Status**: Ready for Implementation
