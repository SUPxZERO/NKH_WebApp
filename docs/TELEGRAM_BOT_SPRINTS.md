# NKH Restaurant Telegram Bot - Sprint Documentation

## Overview

This document outlines all sprints completed for the NKH Restaurant Telegram Bot integration with Laravel 11. The bot enables customers to browse menus, manage cart, place orders, track status, and receive notifications entirely through Telegram.

---

## Table of Contents

- [Sprint 0: Foundation Setup](#sprint-0-foundation-setup)
- [Sprint 1: Onboarding & Account Linking](#sprint-1-onboarding--account-linking)
- [Sprint 2: Menu Browsing](#sprint-2-menu-browsing)
- [Sprint 3: Shopping Cart](#sprint-3-shopping-cart)
- [Sprint 4: Order Placement Flow](#sprint-4-order-placement-flow)
- [Sprint 5: Order Confirmation & Tracking](#sprint-5-order-confirmation--tracking)
- [Sprint 6: Order Status Notifications](#sprint-6-order-status-notifications)

---

## Sprint 0: Foundation Setup

### Objectives
Establish the core infrastructure for Telegram bot integration.

### Files Created

| File | Path | Description |
|------|------|-------------|
| `TelegramBotService.php` | `app/Services/Telegram/` | Core bot API wrapper |
| `TelegramWebhookController.php` | `app/Http/Controllers/Api/Telegram/` | Main webhook handler |
| `TelegramCartSessionManager.php` | `app/Services/Telegram/` | Cart session management |
| `TelegramKeyboardBuilder.php` | `app/Services/Telegram/` | Inline keyboard factory |
| `TelegramUser.php` | `app/Models/` | User model with conversation state |
| `TelegramServiceProvider.php` | `app/Providers/` | Service provider for DI |
| `telegram.php` | `config/` | Configuration file |
| `TelegramWebhookController.php` | `routes/api.php` | Webhook route |

### Key Features Implemented

1. **Webhook Endpoint**
   - Secure secret token verification
   - Message, callback query, and inline query handling
   - Error handling with JSON responses

2. **User Management**
   - Auto-create users on first interaction
   - Track last interaction timestamp
   - Conversation state machine for multi-step flows

3. **Keyboard System**
   - Inline keyboard builder
   - Reply keyboard support
   - Pagination navigation

---

## Sprint 1: Onboarding & Account Linking

### Objectives
Enable user authentication and account linking via phone number or email.

### Files Modified

| File | Changes |
|------|---------|
| `TelegramWebhookController.php` | Added auth handlers |
| `TelegramUser.php` | Added linking methods |
| `TelegramKeyboardBuilder.php` | Added auth keyboards |

### Key Features

1. **Phone Number Authentication**
   ```
   /start → Share Phone Number → Lookup customer by phone
   ```
   - Uses `request_contact` for seamless sharing
   - Customer lookup by phone number
   - Auto-link existing accounts

2. **Email Authentication**
   ```
   /start → Enter Email → Send verification email → Link account
   ```
   - Email input via Telegram
   - Verification token generation
   - Secure linking process

3. **Welcome Flow**
   - New user registration prompt
   - Returning user stats display
   - Main menu navigation

### Command Handlers

| Command | Description |
|---------|-------------|
| `/start` | Initialize bot, show welcome |
| `/menu` | Browse menu |
| `/cart` | View shopping cart |
| `/orders` | View order history |
| `/help` | Show help menu |
| `/cancel` | Cancel current action |
| `/locations` | Show locations |

---

## Sprint 2: Menu Browsing

### Objectives
Enable users to browse menu categories and items with pagination.

### Files Modified

| File | Changes |
|------|---------|
| `TelegramWebhookController.php` | Added menu handlers |
| `TelegramKeyboardBuilder.php` | Added menu keyboards |
| `TelegramCartSessionManager.php` | Added item helpers |

### Key Features

1. **Category Browsing**
   - Grid layout with 2 categories per row
   - Category emojis based on type (pizza, burger, drinks, etc.)
   - Pagination (8 categories per page)
   - Search functionality

2. **Menu Item Display**
   - Item details with image placeholders
   - Price formatting
   - Availability status
   - Pagination support

3. **Item Search**
   - Inline search by name
   - Quick-add from search results

### Category Emojis

| Category | Emoji |
|----------|-------|
| Pizza | 🍕 |
| Burger | 🍔 |
| Noodles/Pasta | 🍜 |
| Rice | 🍚 |
| Salad | 🥗 |
| Drinks | 🍹 |
| Dessert | 🍰 |
| Appetizer | 🥟 |
| Seafood | 🦐 |
| Chicken | 🍗 |
| Beef | 🥩 |
| Combo/Set | 🍱 |
| Sides | 🍟 |
| Default | 🍽️ |

---

## Sprint 3: Shopping Cart

### Objectives
Full cart management with quantity controls and real-time updates.

### Files Modified

| File | Changes |
|------|---------|
| `TelegramCartSessionManager.php` | Full cart implementation |
| `TelegramWebhookController.php` | Added cart handlers |
| `TelegramKeyboardBuilder.php` | Added cart keyboards |

### Key Features

1. **Cart Operations**
   - Add items with quantity
   - Increment/decrement quantities
   - Remove items
   - Clear cart

2. **Cart Display**
   - Line items with quantities and prices
   - Subtotal, tax (10%), discount calculation
   - Total amount display
   - Special instructions support

3. **Session Management**
   - JSON-based cart storage
   - Per-user session isolation
   - Cart persistence across sessions

### Cart Session Structure

```json
{
  "items": [
    {
      "menu_item_id": 1,
      "name": "Classic Burger",
      "quantity": 2,
      "unit_price": 5.99,
      "total_price": 11.98,
      "special_instructions": "No onions"
    }
  ],
  "order_type": "pickup",
  "location_id": null,
  "time_slot_id": null,
  "payment_method": null
}
```

---

## Sprint 4: Order Placement Flow

### Objectives
Multi-step checkout process with location, time slot, and payment selection.

### Files Modified

| File | Changes |
|------|---------|
| `TelegramWebhookController.php` | Added checkout handlers |
| `TelegramKeyboardBuilder.php` | Added checkout keyboards |
| `TelegramCartSessionManager.php` | Added checkout helpers |

### Order Flow

```
Cart → Order Type → Location → Time Slot → Payment → Confirmation
```

### Steps

1. **Order Type Selection**
   - Pickup (🚶)
   - Delivery (🏠)

2. **Location Selection**
   - List of active locations
   - Operating hours display

3. **Time Slot Selection**
   - Date navigation (Today/Tomorrow)
   - Available time slots
   - 30-minute intervals

4. **Payment Method**
   - Bakong KHQR (🔵)
   - Cash on Delivery/Pickup (💵)

5. **Order Confirmation**
   - Order summary display
   - Confirm/Edit/Cancel options

### Order Status States

| Status | Emoji | Description |
|--------|-------|-------------|
| pending | ⏳ | Awaiting confirmation |
| received | ✅ | Confirmed by restaurant |
| preparing | 👨‍🍳 | Being prepared |
| ready | 🔔 | Ready for pickup/delivery |
| out_for_delivery | 🚗 | Out for delivery |
| completed | ⭐ | Successfully delivered |
| cancelled | 🚫 | Cancelled |

---

## Sprint 5: Order Confirmation & Tracking

### Objectives
View order details, track status, cancel orders, and reorder.

### Files Modified

| File | Changes |
|------|---------|
| `TelegramWebhookController.php` | Added order handlers |
| `TelegramKeyboardBuilder.php` | Added order keyboards |

### Key Features

1. **Order List**
   - Paginated display (5 orders per page)
   - Status emoji indicator
   - Order type icon (🚶/🏠)
   - Date and total amount

2. **Order Detail View**
   - Full order information
   - Items list with quantities
   - Status with progress bar
   - ETA estimation

3. **Order Tracking**
   - Visual progress bar
   ```ascii
   ⏳ Pending → ✅ Received → 👨‍🍳 Preparing → 🔔 Ready → ⭐ Completed
   ```
   - ETA based on current status

4. **Cancel Order**
   - Confirmation flow
   - Only cancellable if not yet preparing

5. **Reorder**
   - One-click reorder
   - Checks item availability
   - Adds to current cart

---

## Sprint 6: Order Status Notifications

### Objectives
Send proactive notifications for order status updates.

### Files Created/Modified

| File | Type | Description |
|------|------|-------------|
| `TelegramOrderNotificationService.php` | Created | Notification sending service |
| `TelegramOrderNotification.php` | Existing | Notification model |
| `TelegramWebhookController.php` | Modified | Added notification callbacks |
| `TelegramKeyboardBuilder.php` | Modified | Added notification keyboards |

### Key Features

1. **Status Notifications**
   - Automatic notifications on status changes
   - Rich message with order details
   - Context-aware action buttons

2. **Notification Types**

| Type | Trigger |
|------|---------|
| Status Update | Order status changes |
| ETA Update | Estimated time changes |
| Payment Confirmation | Payment received |
| Scheduled Reminder | Before pickup time |
| Custom | Manual notifications |

3. **User Preferences**
   - All notifications
   - Status updates only
   - Disabled

4. **Notification Message Templates**

   ```markdown
   ✅ Order Confirmed
   Your order #123 has been confirmed!

   📦 Order #123
   🚶 Pickup | 12:30 PM
   💰 Total: $25.99

   Items:
   • Classic Burger x2
   • Fries x1
   ```

### Service Methods

```php
// Send status notification
$notification = $notificationService->sendStatusNotification($order, 'preparing');

// Send ETA update
$notification = $notificationService->sendETAUpdate($order, 15);

// Send payment confirmation
$notification = $notificationService->sendPaymentConfirmation($order);

// Broadcast to multiple users
$sentCount = $notificationService->broadcastToOrderParticipants(
    [$orderId1, $orderId2],
    'Special Offer',
    'Get 20% off today!'
);
```

---

## Architecture Overview

### Service Layer

```
TelegramWebhookController
    ├── TelegramBotService (API calls)
    ├── TelegramKeyboardBuilder (UI)
    ├── TelegramCartSessionManager (Cart)
    └── TelegramOrderNotificationService (Notifications)
```

### Data Flow

```
User → Telegram API → Webhook → Controller → Service → Response
                                    ↓
                             TelegramUser (Session)
                                    ↓
                              Database/Storage
```

### Models

| Model | Description |
|-------|-------------|
| `TelegramUser` | Bot user with conversation state |
| `TelegramOrderNotification` | Notification history |
| `Order` | Customer orders |
| `OrderItem` | Order line items |
| `Customer` | Linked customer account |

---

## Configuration

### Environment Variables

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_SECRET_TOKEN=your_secret_token
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
```

### Config File (`config/telegram.php`)

```php
return [
    'bot_token' => env('TELEGRAM_BOT_TOKEN'),
    'secret_token' => env('TELEGRAM_SECRET_TOKEN'),
    'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),
    'parse_mode' => 'Markdown',
];
```

---

## Commands

### Setup Commands

```bash
# Show bot information
php artisan telegram:setup info

# Set webhook
php artisan telegram:setup webhook --url=https://yourdomain.com/api/telegram/webhook

# Delete webhook
php artisan telegram:setup delete-webhook
```

---

## Future Sprints (Not Yet Implemented)

### Sprint 7: Error Handling & Fallback
- Graceful degradation
- Retry mechanisms
- User-friendly error messages

### Sprint 8: Admin Integration
- Admin order management
- Real-time dashboard
- Sales analytics

### Sprint 9: Advanced Features
- Multi-language support (English/Khmer)
- AI-powered recommendations
- Loyalty points integration
- Promotions and coupons

---

## File Structure Summary

```
app/
├── Console/
│   └── Commands/
│       └── TelegramSetupCommand.php
├── Http/
│   └── Controllers/
│       └── Api/
│           └── Telegram/
│               └── TelegramWebhookController.php
├── Models/
│   ├── TelegramUser.php
│   └── TelegramOrderNotification.php
├── Providers/
│   └── TelegramServiceProvider.php
└── Services/
    └── Telegram/
        ├── TelegramBotService.php
        ├── TelegramCartSessionManager.php
        ├── TelegramKeyboardBuilder.php
        └── TelegramOrderNotificationService.php

config/
└── telegram.php

routes/
└── api.php

database/
└── migrations/
    └── *_create_telegram_users_table.php
```

---

## Security Features

1. **Secret Token Verification**
   - Custom header validation
   - Prevents unauthorized webhooks

2. **Input Sanitization**
   - XSS protection via Markdown parsing
   - SQL injection prevention via Eloquent

3. **Rate Limiting**
   - Conversation state prevents spam
   - Quantity limits on cart items

---

## Performance Considerations

1. **Stateless Design**
   - Minimal database queries per request
   - Efficient session management

2. **Caching**
   - Menu data caching
   - Location data caching

3. **Pagination**
   - Orders: 5 per page
   - Categories: 8 per page
   - Menu items: 10 per page

---

*Last Updated: 2025-12-25*
*Project: NKH Restaurant Telegram Bot*
*Framework: Laravel 11 + React*
