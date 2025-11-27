# 🚀 QUICK START GUIDE - Order Approval System

## 📍 What Changed?

The **Customer Requests** module has been **completely eliminated**. All order approval functionality is now consolidated into the **Orders** module.

---

## 🔗 New URLs

### Admin Interface
- **Old**: `/admin/customer-requests`
- **New**: `/admin/pending-orders`

### API Endpoints

| Method | Old Endpoint | New Endpoint |
|--------|-------------|--------------|
| GET | `/api/admin/customer-requests` | `/api/admin/orders/pending-approval` |
| GET | `/api/admin/customer-requests/{id}` | `/api/admin/orders/{order}` |
| PATCH | `/api/admin/customer-requests/{id}` | `/api/admin/orders/{order}/approve` |
| PATCH | - | `/api/admin/orders/{order}/reject` |

---

## 💻 Usage Examples

### 1. View Pending Orders (Frontend)

Navigate to:
```
http://localhost:8000/admin/pending-orders
```

### 2. List Pending Orders (API)

```bash
curl -X GET http://localhost:8000/api/admin/orders/pending-approval \
  -H "Accept: application/json"
```

**With Filters**:
```bash
curl -X GET "http://localhost:8000/api/admin/orders/pending-approval?location_id=1&search=John" \
  -H "Accept: application/json"
```

### 3. Approve an Order (API)

```bash
curl -X PATCH http://localhost:8000/api/admin/orders/123/approve \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-CSRF-TOKEN: your-csrf-token"
```

**Response**:
```json
{
  "data": {
    "id": 123,
    "approval_status": "approved",
    "status": "received",
    "approved_by": 1,
    "approved_at": "2025-11-27T18:15:00Z",
    ...
  }
}
```

### 4. Reject an Order (API)

```bash
curl -X PATCH http://localhost:8000/api/admin/orders/123/reject \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-CSRF-TOKEN: your-csrf-token" \
  -d '{
    "rejection_reason": "Kitchen is closed for the day"
  }'
```

**Validation Rules**:
- `rejection_reason`: required, min:10, max:500

---

## 🧪 Testing

### Run All Tests

```bash
# Run all order approval tests
php artisan test --filter=OrderApproval

# Run order model tests
php artisan test --filter=OrderModel

# Run database integrity tests
php artisan test --filter=DatabaseIntegrity

# Run all tests
php artisan test
```

### Manual Testing Checklist

- [ ] Visit `/admin/pending-orders`
- [ ] Page loads without errors
- [ ] Orders are listed (if any pending)
- [ ] Click "Approve" button → Order approved
- [ ] Click "Reject" button → Modal opens
- [ ] Enter rejection reason (< 10 chars) → Validation error
- [ ] Enter valid reason → Order rejected
- [ ] Check logs: `storage/logs/laravel.log` for approval/rejection logs

---

## 🔍 Model Helper Methods

The `Order` model now has convenient helper methods:

```php
// Check if order requires approval
if ($order->requiresApproval()) {
    // ...
}

// Check current approval status
if ($order->isPendingApproval()) {
    // Show approve/reject buttons
}

if ($order->isApproved()) {
    // Process order
}

if ($order->isRejected()) {
    // Show rejection reason
}

// Approve an order
$order->approve($userId);

// Reject an order
$order->reject('Reason for rejection');
```

---

## 📊 Database Schema

### Orders Table (Approval Columns)

| Column | Type | Description |
|--------|------|-------------|
| `approval_status` | enum('pending', 'approved', 'rejected') | Current approval status |
| `approved_by` | bigint (FK to users) | User who approved (nullable) |
| `approved_at` | timestamp | When approved (nullable) |
| `rejection_reason` | text | Reason for rejection (nullable) |
| `is_auto_approved` | boolean | True for dine-in orders |

---

## 🎨 Frontend Component

The new `PendingOrders.tsx` component features:

- ✅ Real-time order list
- ✅ Customer information display
- ✅ Delivery address (if applicable)
- ✅ Order items preview
- ✅ One-click approve
- ✅ Reject modal with textarea
- ✅ Character counter (10-500 chars)
- ✅ Auto-refresh after actions
- ✅ Responsive design

---

## 🛠️ Development Workflow

### Adding New Features

1. **Add business logic to Service**:
   ```php
   // app/Services/OrderApprovalService.php
   public function approveWithNotification(Order $order, User $approver) {
       $this->approve($order, $approver);
       // Send notification
   }
   ```

2. **Use service in Controller**:
   ```php
   public function approve(Request $request, Order $order, OrderApprovalService $service) {
       $service->approveWithNotification($order, $request->user());
   }
   ```

3. **Write tests first**:
   ```php
   /** @test */
   public function sends_notification_on_approval() {
       // Arrange, Act, Assert
   }
   ```

---

## 🐛 Troubleshooting

### Issue: "Class CustomerRequest not found"

**Solution**: The class was deleted. Run:
```bash
php artisan optimize:clear
```

### Issue: Route not found

**Solution**: Clear route cache:
```bash
php artisan route:clear
php artisan route:cache
```

### Issue: Page shows 404

**Solution**: Check if you're using the new URL:
- ❌ `/admin/customer-requests`
- ✅ `/admin/pending-orders`

### Issue: Tests failing

**Solution**: Run migrations in test database:
```bash
php artisan migrate --env=testing
```

---

## 📝 Common Tasks

### Get count of pending orders

```php
use App\Models\Order;

$count = Order::where('approval_status', Order::APPROVAL_STATUS_PENDING)
    ->whereIn('order_type', ['delivery', 'pickup'])
    ->count();
```

### Get all approved orders today

```php
$approved = Order::where('approval_status', Order::APPROVAL_STATUS_APPROVED)
    ->whereDate('approved_at', today())
    ->get();
```

### Find who approved an order

```php
$order = Order::with('approvedBy')->find($orderId);
echo $order->approvedBy->name; // "John Admin"
```

---

## 🔐 Security Notes

- All approval endpoints require authentication
- Only admin/manager roles can approve/reject
- CSRF protection enabled on all PATCH requests
- Audit logs created for all approval actions

---

## 📞 Support

If you encounter issues:

1. Check logs: `storage/logs/laravel.log`
2. Run diagnostics: `php artisan about`
3. Clear caches: `php artisan optimize:clear`
4. Verify migrations: `php artisan migrate:status`

---

**Last Updated**: 2025-11-27  
**Version**: 1.0 (Post-Consolidation)
