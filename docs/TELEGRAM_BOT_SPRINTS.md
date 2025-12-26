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

## Sprint 7: Error Handling & Fallback

### Objectives
Implement robust error handling with retry mechanisms, graceful degradation, and user-friendly error messages.

### Files Created

| File | Path | Description |
|------|------|-------------|
| `TelegramErrorHandler.php` | `app/Services/Telegram/` | Error detection, retry logic, user messages |
| `TelegramNotificationRetryJob.php` | `app/Jobs/` | Queue job for retrying failed notifications |

### Files Modified

| File | Changes |
|------|---------|
| `TelegramBotService.php` | Added retry logic, timeout, text escaping |
| `TelegramWebhookController.php` | Graceful error handling, validation, fallback |
| `TelegramOrderNotificationService.php` | Automatic retry queueing on send failure |

### Key Features

1. **Error Detection & Categorization**
   - Automatic detection of error types:
     - Transient (network, 5xx)
     - Rate limit (429)
     - Authentication (401, 403)
     - Invalid input (400)
     - Fatal errors
   - Type-specific handling strategies

2. **Retry Mechanisms**
   - Exponential backoff for transient errors
   - Configurable retry attempts (default: 3)
   - Rate limit backoff (60 seconds)
   - Queue-based notification retry

3. **User-Friendly Error Messages**

| Error Type | Message | Context |
|------------|----------|----------|
| Transient | 🔄 Temporary issue. Please try again in a moment. | Wait guidance |
| Rate Limit | ⏳ Too many requests. Please wait a moment. | Wait time shown |
| Invalid Input | ❌ Invalid input. Please check and try again. | Help link |
| Authentication | 🔐 Authentication error. Please try logging in again. | Start command |
| Network | 📶 Connection issue. Please check your internet. | Connection check |
| Fatal | ⚠️ Something went wrong. Please contact support. | Support contact |

4. **Queue-Based Retry**
   - Failed notifications auto-queued
   - Exponential backoff: 30s, 60s, 180s, 300s, 600s
   - Max 5 retry attempts
   - Permanently marked as failed after max retries

5. **Graceful Webhook Handling**
   - Always returns 200 to prevent Telegram retries
   - Error messages sent to user when possible
   - Silent logging for non-critical errors
   - Callback data validation (64 byte limit, alphanumeric)

6. **Input Validation**
   - Callback data validation
   - Markdown special character escaping
   - Text truncation at 4096 characters
   - Timeout protection (10 seconds)

### Retry Strategy

```php
// Automatic retry with exponential backoff
$result = TelegramErrorHandler::withRetry(function () {
    return $botService->sendMessage($chatId, $message);
}, maxRetries: 3);

// Rate limit protection
$result = TelegramErrorHandler::withRateLimit('user_123', function () {
    return $botService->sendMessage($chatId, $message);
}, maxAttempts: 30, window: 60);
```

### Error Handler Usage

```php
// Get user-friendly error message
$message = TelegramErrorHandler::formatTelegramError($exception);

// Detect error type
$type = TelegramErrorHandler::detectErrorType($exception);

// Check if retryable
if (TelegramErrorHandler::isRetryable($exception)) {
    // Retry logic
}
```

### Service Methods

```php
// Send message with automatic retry
$botService->sendMessage($chatId, $message, withRetry: true);

// Validate callback data
if (!TelegramErrorHandler::validateCallbackData($callbackData)) {
    // Invalid callback
}

// Escape Telegram text
$safeText = TelegramErrorHandler::escapeTelegramText($userInput);
```

---

## Sprint 8: Admin Integration

### Objectives
Provide admin functionality accessible via Telegram bot including real-time dashboard, order management, and analytics.

### Files Created

| File | Path | Description |
|------|------|-------------|
| `TelegramAdminService.php` | `app/Services/Telegram/` | Admin service for dashboard, orders, analytics |

### Files Modified

| File | Changes |
|------|---------|
| `TelegramWebhookController.php` | Added admin callback handlers, admin menu integration |

### Key Features

1. **Admin Dashboard**
   - Real-time daily statistics
   - Order overview (pending, preparing, completed)
   - Revenue metrics
   - Customer and location stats
   - Quick action buttons
   - Auto-refresh capability

2. **Order Management**
   - View pending orders list
   - Paginated order display (10 per page)
   - Detailed order view with:
     - Customer information
     - Order items and totals
     - Payment details
     - Special instructions
   - Status updates:
     - Approve/Decline pending orders
     - Start preparing received orders
     - Mark ready/complete orders
   - Navigation controls

3. **Order Status Actions**

| Current Status | Available Actions |
|---------------|-------------------|
| Pending | ✅ Approve, ❌ Decline |
| Received | 👨‍🍳 Start Preparing |
| Preparing | 🔔 Mark Ready |
| Ready | 🚗 Out for Delivery, ⭐ Complete |
| Out for Delivery | ⭐ Complete |

4. **Customer Search**
   - Search by name or phone number
   - Display customer stats:
     - Points balance
     - Customer tier
     - Order history
     - Total spent

5. **Admin Authentication**
   - Admin IDs configured in `config/telegram.php`
   - Automatic admin detection
   - Unauthorized access protection

### Admin Configuration

In `config/telegram.php`, add admin Telegram IDs:

```php
return [
    // ... other config
    'admin_ids' => [
        env('TELEGRAM_ADMIN_ID_1'),
        env('TELEGRAM_ADMIN_ID_2'),
        // Add more admin IDs as needed
    ],
];
```

### Admin Command Flow

```
Main Menu (Admin User)
    ├── 📊 Admin Dashboard → Dashboard View
    ├── 🍽️ Menu → Regular Customer View
    ├── 🛒 Cart → Regular Customer View
    ├── 📦 My Orders → Regular Customer View
    ├── 🎁 Loyalty → Regular Customer View
    ├── 📍 Locations → Regular Customer View
    └── ❓ Help → Regular Customer View

Dashboard View
    ├── 📦 Pending (X) → Pending Orders List
    ├── 👨‍🍳 Preparing (X) → Preparing Orders List
    ├── 📊 Analytics → Analytics View (Coming Soon)
    ├── 📍 Locations → Location Management (Coming Soon)
    ├── 👥 Customers → Customer Management (Coming Soon)
    └── 🔄 Refresh → Refresh Dashboard

Pending Orders List
    ├── Order Buttons → Order Detail View
    ├── Pagination Controls (Previous/Next)
    └── ◀️ Back to Dashboard

Order Detail View
    ├── Status Actions (Based on current status)
    ├── 📞 Call Customer
    ├── 📍 View Location
    └── ◀️ Back to Orders
```

### Admin Service Methods

```php
// Check if user is admin
$isAdmin = $adminService->isAdmin($telegramId);

// Get dashboard message
$result = $adminService->getDashboardMessage($telegramId);
// Returns: ['message' => '...', 'keyboard' => [...]]

// Get pending orders
$result = $adminService->getPendingOrdersMessage($telegramId, $page);
// Returns: ['message' => '...', 'keyboard' => [...]]

// Get order detail
$result = $adminService->getOrderDetailMessage($telegramId, $orderId);
// Returns: ['message' => '...', 'keyboard' => [...]]

// Update order status
$success = $adminService->updateOrderStatus($telegramId, $orderId, $status);

// Search customer
$result = $adminService->searchCustomer($telegramId, $query);
// Returns: ['message' => '...', 'keyboard' => [...]]
```

### Dashboard Metrics Display

```
📊 Admin Dashboard
━━━━━━━━━━━━━━━━━━━━━

📦 Today's Orders
│ Total: 25
│ Pending: 8
│ Preparing: 3
│ Completed: 14

💰 Revenue
│ Today: $1,250.00
│ Average Order: $50.00

📊 Other Metrics
│ New Customers: 5
│ Active Locations: 3

━━━━━━━━━━━━━━━━━━━━━
📝 Pending Actions
• 8 orders awaiting approval
• 3 orders being prepared

[Quick Action Buttons]
```

---

## Sprint 9: Advanced Features

### Objectives
Implement advanced features including multi-language support, loyalty points integration, and promotional features.

### Files Created

| File | Path | Description |
|------|------|-------------|
| `TelegramLocalizationService.php` | `app/Services/Telegram/` | Multi-language support |
| `TelegramLoyaltyService.php` | `app/Services/Telegram/` | Loyalty points integration |
| `TelegramPromotionService.php` | `app/Services/Telegram/` | Promotions and coupons |

### Files Modified

| File | Changes |
|------|---------|
| `TelegramWebhookController.php` | Added multi-language and loyalty handlers |
| `TelegramUser.php` | Added language preference field |

### Key Features

1. **Multi-Language Support**
   - English and Khmer languages
   - User preference storage
   - Automatic language detection
   - Inline language switcher
   - Message translations

2. **Loyalty Points Integration**
   - Display points balance in main menu
   - Points earning rules
   - Redemption options
   - Tier progress visualization
   - Points history

3. **Promotions and Coupons**
   - Coupon code validation
   - Discount application
   - Special offers display
   - Promo code entry
   - Limited-time promotions

### Language Support

```php
// Available languages
SUPPORTED_LANGUAGES = [
    'en' => 'English',
    'km' => 'ភាសាខ្មែរ',
];

// Get translated message
$message = TelegramLocalizationService::translate(
    'welcome_message',
    $user->language
);
```

### Loyalty Features

```
Points Earning Rules:
- $1 spent = 1 point
- Completing order = 10 bonus points
- Referral bonus = 50 points
- Birthday bonus = 100 points

Point Redemption:
- 100 points = $2 discount
- 250 points = $5 discount
- 500 points = $12 discount
- 1000 points = $25 discount

Tiers:
- Bronze (0-999 points)
- Silver (1000-2499 points)
- Gold (2500-4999 points)
- Platinum (5000+ points)
```

---

## Future Enhancements

### Analytics Dashboard (Coming Soon)
- Daily/weekly/monthly sales reports
- Top selling items
- Customer analytics
- Revenue trends
- Peak hours analysis

### AI-Powered Recommendations (Coming Soon)
- Personalized menu suggestions
- Order history analysis
- Trending items
- Similar items recommendations

### Advanced Admin Features (Coming Soon)
- Real-time order tracking map
- Customer support integration
- Bulk order operations
- Performance metrics

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
├── Jobs/
│   └── TelegramNotificationRetryJob.php
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
        ├── TelegramOrderNotificationService.php
        ├── TelegramErrorHandler.php
        ├── TelegramAdminService.php
        ├── TelegramLocalizationService.php
        ├── TelegramLoyaltyService.php
        └── TelegramPromotionService.php

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

*Last Updated: 2025-12-26*
*Project: NKH Restaurant Telegram Bot*
*Framework: Laravel 11 + React*
