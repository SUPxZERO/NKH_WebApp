---
description: Sprint P15 - Telegram Guest Ordering (Order without login using Telegram user data)
---

# Sprint P15: Telegram Guest Ordering System

## Overview
Enable Telegram users to place orders without requiring a traditional login or account creation. The system will use Telegram-provided user data (telegram_id, username, first_name, etc.) as the identity source, allowing seamless ordering while still supporting notifications via Telegram bot messages.

## Goals
1. **Frictionless Ordering**: Telegram users can browse menu, add to cart, and place orders without signing in
2. **Identity via Telegram**: Use `telegram_id` as the primary identifier (no email/password required)
3. **Notifications via Telegram**: Order status updates sent to user's Telegram chat (e.g., `https://t.me/username`)
4. **Optional Account Linking**: Allow users to optionally link to a full customer account later

---

## Current State Analysis
- `TelegramUser` model exists with `telegram_id`, `customer_id` (nullable), profile fields
- Current order flow requires `customer_id` - orders are linked via `Order.customer_id`
- `TelegramAuth` middleware validates `X-Telegram-User-ID` header
- Cart/Menu browsing already works without login via Telegram API endpoints
- Checkout currently requires linked `Customer` account (blocking point)

---

## Tasks

### Phase 1: Database & Model Updates (Priority: CRITICAL)
**Task 1.1: Add telegram_user_id to Orders Table**
- Create migration to add `telegram_user_id` column to `orders` table (nullable, FK to `telegram_users`)
- Keep `customer_id` as nullable (for linked accounts)
- Orders can now be created with either `telegram_user_id` OR `customer_id`
// turbo

**Task 1.2: Update Order Model Relationships**
- Add `telegramUser()` relationship to `Order` model
- Update order queries to support telegram user lookup
- Add `getCustomerOrTelegramUser()` helper method

**Task 1.3: Add Guest Contact Fields to TelegramUser**
- Add optional `phone_number` and `delivery_address` fields to `telegram_users` table
- These store contact info for guest orders without full account creation
// turbo

---

### Phase 2: Guest Checkout Flow (Priority: CRITICAL)
**Task 2.1: Create TelegramCheckoutController**
- New controller: `app/Http/Controllers/Api/Telegram/TelegramCheckoutController.php`
- Endpoints for guest checkout flow:
  - `POST /api/telegram/checkout/validate` - Validate cart before checkout
  - `POST /api/telegram/checkout/guest-info` - Save guest contact details
  - `POST /api/telegram/checkout/place-order` - Create order (no customer_id required)
  - `GET /api/telegram/checkout/confirm/{orderId}` - Confirm order placement

**Task 2.2: Implement Guest Order Creation**
- Modify order creation logic to accept `telegram_user_id` without `customer_id`
- Calculate order totals, apply promotions without customer-specific logic
- Generate order number for guest orders
- Store delivery address directly on order (from TelegramUser or input)

**Task 2.3: Update ExistingTelegramOrderController**
- Modify `list()` to work with `telegram_user_id` instead of requiring `customer_id`
- Update `detail()` to support guest orders
- Update `cancel()` for guest orders

---

### Phase 3: Guest Contact Information Collection (Priority: HIGH)
**Task 3.1: Contact Collection for Delivery Orders**
- For delivery orders, prompt for:
  - Phone number (for driver contact)
  - Delivery address
- Store in `telegram_users` table for repeat orders
- Use Telegram's `request_contact` for phone when possible

**Task 3.2: Minimal Info for Pickup Orders**
- Pickup orders only need:
  - Name (from Telegram first_name/last_name)
  - Optional phone for SMS alerts
- Much simpler flow than delivery

---

### Phase 4: Telegram Bot Checkout Integration (Priority: HIGH)
**Task 4.1: Update TelegramWebhookController for Checkout**
- Add checkout callback handlers
- Implement multi-step guest checkout conversation flow:
  ```
  Cart → Order Type → Location → Time Slot → Contact Info → Payment → Confirm
  ```

**Task 4.2: Create Guest Checkout Keyboards**
- Add to `TelegramKeyboardBuilder.php`:
  - `contactInfoRequest()` - Request phone/address
  - `guestCheckoutConfirmation()` - Order summary with confirm button
  - `skipAccountLinking()` - Option to continue as guest

**Task 4.3: WebApp Integration (if using Mini App)**
- Pass telegram user data via `initData` to frontend
- Frontend extracts `telegram_id` for API calls
- No separate login required in Mini App

---

### Phase 5: Order Notifications for Guest Users (Priority: HIGH)
**Task 5.1: Notification Service Updates**
- Update `TelegramOrderNotificationService.php` to find user by:
  1. `telegram_user_id` on order (priority)
  2. `customer_id` → `TelegramUser` relationship
- Send notifications using `telegram_id` chat ID

**Task 5.2: Order Status Notifications**
- Send updates for: confirmed, preparing, ready, out_for_delivery, completed
- Include order details and tracking info
- Deep link to order details in bot/Mini App

**Task 5.3: Create NotificationDeepLinks**
- Generate deep links like `https://t.me/NKHRestaurantBot?start=order_123`
- Handle start parameter to show order details
- Allow reordering from notification

---

### Phase 6: Optional Account Upgrade (Priority: MEDIUM)
**Task 6.1: Post-Order Account Linking Prompt**
- After successful order, offer to create full account
- Benefits: order history, loyalty points, saved addresses
- Simple conversion: enter email/password to upgrade

**Task 6.2: Merge Guest Orders to Account**
- When guest creates account, link previous orders
- Match by `telegram_user_id`
- Transfer any accumulated data

---

## API Endpoints (New)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/telegram/checkout/validate` | Validate cart for checkout | TelegramAuth |
| POST | `/api/telegram/checkout/guest-info` | Save guest contact details | TelegramAuth |
| POST | `/api/telegram/checkout/place-order` | Create guest order | TelegramAuth |
| GET | `/api/telegram/checkout/confirm/{id}` | Get order confirmation | TelegramAuth |
| POST | `/api/telegram/checkout/webhook-notify` | Internal: trigger notification | Internal |

## Modified Endpoints

| Method | Endpoint | Changes |
|--------|----------|---------|
| GET | `/api/telegram/orders` | Support telegram_user_id without customer_id |
| GET | `/api/telegram/orders/{id}` | Support telegram_user_id lookup |
| POST | `/api/telegram/orders/{id}/cancel` | Support guest order cancellation |

---

## Database Changes

### Migration: add_telegram_user_id_to_orders
```php
Schema::table('orders', function (Blueprint $table) {
    $table->foreignId('telegram_user_id')
        ->nullable()
        ->after('customer_id')
        ->constrained('telegram_users')
        ->nullOnDelete();
    
    // Add index for telegram user lookups
    $table->index('telegram_user_id');
});
```

### Migration: add_guest_fields_to_telegram_users
```php
Schema::table('telegram_users', function (Blueprint $table) {
    $table->string('phone_number', 20)->nullable()->after('language_code');
    $table->text('delivery_address')->nullable()->after('phone_number');
    $table->json('saved_addresses')->nullable()->after('delivery_address');
});
```

---

## Implementation Steps

1. **Database Migrations** (Task 1.1, 1.3)
   - Create and run migrations
   // turbo

2. **Model Updates** (Task 1.2)
   - Update Order model with telegram user relationship
   - Update TelegramUser model if needed

3. **Create TelegramCheckoutController** (Task 2.1)
   - Implement guest checkout endpoints

4. **Update Order Creation** (Task 2.2)
   - Modify OnlineOrderController or create dedicated logic
   - Remove customer_id requirement for telegram orders

5. **Bot Checkout Flow** (Task 4.1, 4.2)
   - Add checkout conversation handlers
   - Create keyboards for guest flow

6. **Notification Updates** (Task 5.1, 5.2)
   - Update notification service
   - Test order status notifications

7. **Testing & Verification**
   - Test complete guest checkout flow
   - Verify notifications are received
   - Test with Telegram Mini App

---

## Verification Plan

### Automated Tests
```bash
# Run after implementation
php artisan test --filter=TelegramGuestOrderTest
```

### Manual Testing Checklist
- [ ] Open Telegram bot, send /start
- [ ] Browse menu without linking account
- [ ] Add items to cart
- [ ] Proceed to checkout as guest
- [ ] Enter delivery/pickup details
- [ ] Complete order placement
- [ ] Receive order confirmation notification
- [ ] Receive status update notifications (preparing, ready, etc.)
- [ ] View order history via bot
- [ ] Reorder from previous order

---

## Security Considerations

1. **Rate Limiting**: Apply rate limits to prevent abuse
2. **Order Validation**: Validate cart contents before order creation
3. **Telegram ID Verification**: Verify telegram_id via initData signature
4. **Phone Number Validation**: Validate phone format if provided
5. **Address Sanitization**: Sanitize delivery address input

---

## Notes

- Guest orders have full functionality except loyalty points (no customer_id)
- Telegram `telegram_id` is unique per user, reliable identifier
- Mini App `initData` provides verified user data
- Notifications use Telegram API (no SMS/email required for guests)
