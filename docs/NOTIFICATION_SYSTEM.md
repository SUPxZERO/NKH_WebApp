# Notification System Documentation

## Overview

The NKH WebApp notification system provides a unified way to send notifications to users across multiple channels (in-app, push, email) with support for user preferences and advanced targeting options.

## Architecture

```
┌───────────────────┐    ┌────────────────────────┐    ┌─────────────────────┐
│   Controllers     │───▶│  NotificationService   │───▶│  UserNotification   │
│   (Triggers)      │    │   (Unified Logic)      │    │   (Database)        │
└───────────────────┘    └────────────────────────┘    └─────────────────────┘
                                    │                            │
                                    ▼                            ▼
                         ┌────────────────────────┐    ┌─────────────────────┐
                         │ NotificationPreference │    │ CustomerNotification│
                         │   (User Settings)      │    │   Sent Event        │
                         └────────────────────────┘    │   (WebSocket)       │
                                                       └─────────────────────┘
```

## Files Created

| File | Purpose |
|------|---------|
| `app/Services/NotificationService.php` | Central notification sending logic with targeting |
| `app/Events/CustomerNotificationSent.php` | Broadcast event for real-time notifications |
| `app/Events/AdminNotificationSent.php` | Broadcast event for admin notifications |
| `app/Models/NotificationPreference.php` | Model for user notification settings |
| `app/Models/UserNotification.php` | Model for stored notifications |
| `app/Http/Controllers/Api/NotificationPreferenceController.php` | API for managing preferences |
| `app/Http/Controllers/Api/TargetedNotificationController.php` | API for targeted sending |
| `app/Providers/NotificationServiceProvider.php` | Service provider for DI |
| `app/Console/Commands/TestNotification.php` | Artisan command for testing |
| `routes/channels.php` | Broadcasting channel authorization |
| `resources/js/app/hooks/useCustomerNotifications.ts` | Frontend real-time hook |
| `resources/js/app/components/customer/NotificationPreferencesSettings.tsx` | Customer preferences UI |
| `resources/js/app/components/admin/SendNotificationPanel.tsx` | Admin targeted sending UI |

## Notification Types

| Type | Constant | Description |
|------|----------|-------------|
| Order | `TYPE_ORDER` | Order status updates |
| Promotion | `TYPE_PROMOTION` | Marketing promotions |
| Reward | `TYPE_REWARD` | Loyalty points and rewards |
| System | `TYPE_SYSTEM` | General announcements |

## Targeting Options

| Target Type | Description |
|-------------|-------------|
| `all_users` | All registered users |
| `all_customers` | Users with customer profile |
| `all_employees` | Users with employee profile |
| `by_role` | By role (admin, manager, waiter, chef, cashier, delivery) |
| `by_tier` | By customer tier (bronze, silver, gold, platinum) |
| `by_location` | By location/branch |
| `specific_users` | Select individual users |
| `recent_customers` | Customers who ordered in last X days |

## Usage Examples

### Basic Sending

```php
use App\Services\NotificationService;

$notificationService = app(NotificationService::class);

// Send order notification
$notificationService->sendOrderNotification($order, 'approved');

// Send reward notification
$notificationService->sendRewardNotification($user, 50, "You earned 50 points!");

// Send promotion to all customers
$notificationService->sendPromotionNotification($promotion);

// Send system notification
$notificationService->sendSystemNotification('Maintenance Notice', 'We will be offline.');
```

### Targeted Sending

```php
// Send to specific roles
$notificationService->notifyByRole(
    ['waiter', 'chef'],
    'New Order Received',
    'Table 5 has placed an order.',
    '/admin/orders'
);

// Send to VIP customers (Gold & Platinum)
$notificationService->notifyVIPCustomers(
    'Exclusive Offer!',
    'As a VIP, enjoy 30% off this weekend.',
    '/menu'
);

// Send to customers by tier
$notificationService->notifyByTier(
    ['gold', 'platinum'],
    'Special Promotion',
    'Gold and Platinum members get early access!'
);

// Send to users at specific locations
$notificationService->notifyByLocation(
    [1, 2], // location IDs
    'Location Update',
    'New menu items available at your location!'
);

// Send to recent customers
$notificationService->notifyRecentCustomers(
    30, // last 30 days
    'We Miss You!',
    'Come back for 10% off your next order.'
);

// Quick role shortcuts
$notificationService->notifyWaiters('Table 3 needs attention!', 'Customer requesting service.');
$notificationService->notifyKitchen('Rush order!', 'Priority: Table 5 order.');
$notificationService->notifyDelivery('New delivery assigned', 'Order #123 ready for pickup.');

// Flexible targeted sending
$notificationService->sendTargeted(
    NotificationService::TARGET_BY_TIER,
    ['tiers' => ['gold', 'platinum']],
    NotificationService::TYPE_PROMOTION,
    'VIP Deal',
    'Exclusive offer just for you!',
    '/promotions'
);
```

## CLI Commands

```bash
# Basic usage
php artisan notification:test system

# Target specific user
php artisan notification:test system --user=5

# Target by role
php artisan notification:test system --role=waiter
php artisan notification:test system --role=chef
php artisan notification:test system --role=admin

# Target by customer tier
php artisan notification:test promotion --tier=gold
php artisan notification:test promotion --tier=platinum

# Target all employees
php artisan notification:test system --employees

# Target all customers
php artisan notification:test promotion --all
```

## API Endpoints

### Targeted Notifications (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/notifications/targeted/options` | Get all targeting options |
| POST | `/api/admin/notifications/targeted/preview` | Preview recipient count |
| POST | `/api/admin/notifications/targeted/send` | Send targeted notification |
| POST | `/api/admin/notifications/targeted/send-to-roles` | Quick send to roles |
| POST | `/api/admin/notifications/targeted/send-to-users` | Quick send to specific users |
| GET | `/api/admin/notifications/targeted/search-users` | Search users for selection |

### User Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer/notification-preferences` | Get all preferences |
| PUT | `/api/customer/notification-preferences` | Update all preferences |
| POST | `/api/customer/notification-preferences/toggle` | Toggle single preference |
| POST | `/api/customer/notification-preferences/enable-all` | Enable all |
| POST | `/api/customer/notification-preferences/disable-all` | Disable all |

## Admin UI Integration

The `SendNotificationPanel` component is integrated into the Admin Notifications page (`/admin/notifications`):

- **Target Selection** - Choose from all users, customers, employees, roles, tiers, locations
- **Role Picker** - Multi-select roles (admin, manager, waiter, chef, etc.)
- **Tier Picker** - Multi-select customer tiers (bronze, silver, gold, platinum)
- **Location Picker** - Multi-select restaurant locations
- **User Search** - Search and select individual users
- **Preview** - See recipient count before sending
- **Type Selection** - Order, Promotion, Reward, or System
- **Message Composer** - Title, message, and optional action URL

## Customer Preferences UI

The `NotificationPreferencesSettings` component is integrated into the Customer Profile page (`/customer/profile`):

- Toggle notifications by type (order, promotion, reward, system, reservation)
- Toggle notifications by channel (in-app, push, email)
- Quick enable/disable all
- Real-time save on toggle

## Database Tables

### `user_notifications`
- `id` - Primary key
- `user_id` - Foreign key to users
- `type` - Notification type
- `title` - Notification title
- `message` - Notification body
- `action_url` - Optional link
- `read` / `read_at` - Read status

### `notification_preferences`
- `id` - Primary key
- `user_id` - Foreign key to users
- `channel` - Channel type (in_app, push, email)
- `type` - Notification type
- `enabled` - Boolean

## WebSocket Channels

| Channel | Type | Authorization |
|---------|------|---------------|
| `customer.{id}` | Private | Current user only |
| `admin-notifications` | Private | Admin/Manager roles |
| `orders` | Public | Anyone |

## Future Enhancements

- [ ] Email notification implementation
- [ ] Web Push API integration
- [ ] SMS notifications
- [ ] Notification scheduling
- [ ] Template management
- [ ] Analytics dashboard
- [ ] A/B testing for messages
