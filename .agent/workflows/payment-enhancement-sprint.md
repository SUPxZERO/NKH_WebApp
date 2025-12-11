---
description: Post-Payment System Enhancement Sprint - Payment Flow Fixes & POS Integration
---

# Sprint P11: Payment Flow Enhancement & POS Integration

## Analysis of Current Issues

### Issue 1: Cash Payment UI Not Updating
**Problem**: When cashier confirms cash payment, customer UI doesn't redirect to orders page.
**Root Cause**: The payment status polling on the customer side only updates local state but doesn't trigger a proper redirect when the payment is fully confirmed.
**Solution**: Ensure polling properly detects completed status and redirects to orders page.

### Issue 2: Pay-on-Delivery/Pickup Cash Payments Unsafe
**Problem**: No safe mechanism for cash payments on delivery/pickup orders. 
**Current Flow**: Customer selects cash → waits for cashier confirmation (designed for dine-in)
**Required Flow for Delivery/Pickup**: 
  - Mark order as "Pay on Delivery/Pickup" 
  - Driver/staff confirms payment upon delivery/pickup
  - Option to collect cash at door or counter

### Issue 3: Order Payment Status Visibility in POS
**Problem**: No easy way for POS to see which orders are paid/unpaid at a glance.
**Solution**: 
  - Add `payment_status` indicators to order lists
  - QuickPay feature for POS to mark orders as paid directly
  - Payment collection workflow for POS operators

---

## Sprint Tasks

### Phase 1: Fix Cash Payment Customer Flow (Priority: HIGH)

**Task 1.1: Improve Payment Status Polling**
- Enhance `usePaymentStatus` hook to handle all status transitions
- Add explicit redirect after completed status detected
- Show success animation before redirect

**Task 1.2: Add Payment Completion Event**
- Create a customer-facing payment confirmation screen
- Show receipt summary after successful payment
- Clear redirect to orders page with success state

### Phase 2: Pay-on-Delivery/Pickup Support (Priority: HIGH)

**Task 2.1: Add Order Payment Mode**
- Add `payment_mode` to orders table: 'pay_now', 'pay_on_delivery', 'pay_on_pickup', 'pay_at_counter'
- Allow customers to select payment timing during checkout
- For delivery/pickup orders with `pay_on_delivery` mode, skip immediate payment

**Task 2.2: Delivery Payment Collection**
- Add `/api/orders/{order}/collect-payment` endpoint for delivery personnel
- Allow driver to confirm cash collected
- Support partial collection or full collection
- Audit trail for who collected payment

**Task 2.3: Update Order Workflow**
- Update order status flow to include payment collection step
- Orders with pending payment cannot be marked as complete
- SMS/notification when driver is collecting payment

### Phase 3: POS Payment Integration (Priority: MEDIUM-HIGH)

**Task 3.1: Order Payment Status Display**
- Add visual payment status badges to order lists
- Color-coded: Green (paid), Yellow (partial), Red (unpaid), Orange (pay-on-delivery)
- Show payment method icon

**Task 3.2: Quick Pay for POS**
- Add `/api/pos/orders/{order}/quick-pay` endpoint
- POS can instantly mark an order as paid
- Automatically creates invoice + payment record
- Support for multiple payment methods

**Task 3.3: POS Order Management Component**
- Create `POSOrderPaymentPanel.tsx` component
- Show order details with payment status
- Quick actions: Mark Paid, Split Payment, Take Payment
- Cash register integration

### Phase 4: Cash Payment Enhancements (Priority: MEDIUM)

**Task 4.1: Cash Collection Modes**
- Cash at Counter (existing)
- Cash on Delivery (new)
- Cash on Pickup (new)

**Task 4.2: Cash Collection Confirmation**
- Driver/delivery person confirms cash received
- Amount verification with photo option (optional)
- Automatic order status update after payment

---

## Implementation Order

1. **Phase 1** - Fix immediate cash payment redirect issue
2. **Phase 2** - Add pay-on-delivery support (critical for delivery orders)
3. **Phase 3** - POS payment integration
4. **Phase 4** - Enhanced cash collection features

---

## Database Changes

### New Fields for `orders` table:
```sql
ALTER TABLE orders ADD COLUMN payment_mode ENUM('pay_now', 'pay_on_delivery', 'pay_on_pickup', 'pay_at_counter') DEFAULT 'pay_now' AFTER payment_status;
ALTER TABLE orders ADD COLUMN payment_collected_by INT NULL AFTER payment_mode;
ALTER TABLE orders ADD COLUMN payment_collected_at DATETIME NULL AFTER payment_collected_by;
```

### New Index:
```sql
CREATE INDEX idx_orders_payment_mode ON orders(payment_mode, payment_status);
```

---

## API Endpoints to Create

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/{order}/collect-payment` | Driver confirms cash collected |
| POST | `/api/pos/orders/{order}/quick-pay` | POS quick pay |
| GET | `/api/orders?payment_status=unpaid` | Filter by payment status |
| POST | `/api/orders/{order}/update-payment-mode` | Change payment mode |

---

## Files to Create/Modify

### New Files:
- `app/Http/Controllers/Api/OrderPaymentController.php`
- `app/Http/Controllers/Api/PosPaymentController.php`
- `resources/js/app/hooks/useOrderPayment.ts`
- `resources/js/app/components/pos/OrderPaymentPanel.tsx`
- `resources/js/app/components/payment/PaymentSuccessScreen.tsx`
- `database/migrations/xxx_add_payment_mode_to_orders_table.php`

### Modified Files:
- `resources/js/Pages/Customer/Payment.tsx` - Fix redirect
- `app/Models/Order.php` - Add payment mode, helpers
- `app/Http/Controllers/Api/OrderController.php` - Add payment filters

---

## Estimated Effort

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1 | 2 | 1-2 hours |
| Phase 2 | 3 | 3-4 hours |
| Phase 3 | 3 | 3-4 hours |
| Phase 4 | 2 | 2-3 hours |
| **Total** | **10** | **~10 hours** |

---

## Next Steps

Start with Phase 1 to immediately fix the cash payment redirect issue, then move to Phase 2 for delivery payment support.
