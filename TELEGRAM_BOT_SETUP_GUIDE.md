# NKH Restaurant Telegram Bot - Setup Guide

This guide walks you through setting up and running the NKH Restaurant Telegram Bot.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Bot Setup](#bot-setup)
3. [Environment Configuration](#environment-configuration)
4. [Webhook Configuration](#webhook-configuration)
5. [Admin Access Setup](#admin-access-setup)
6. [Testing](#testing)
7. [Available Commands](#available-commands)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ A Telegram account
- ✅ @BotFather account (to create bots)
- ✅ PHP 8.2+ installed
- ✅ Composer dependencies installed
- ✅ MySQL database configured
- ✅ Laravel application running

---

## Bot Setup

### Step 1: Create Your Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` to BotFather
3. Follow the prompts:
   - **Bot Name**: `NKH Restaurant Bot` (or your preferred name)
   - **Username**: `NKH_Restaurant_Bot` (must end with `_bot`)
   - **About**: Official NKH Restaurant bot for ordering food
4. BotFather will provide:
   - **Bot Token**: Save this! (e.g., `8422586723:AAHOLaauqDFQ4fAwy7et7uFyb04Oi37oE0`)
   - **Bot API Username**: `@NKH_Restaurant_Bot`

### Step 2: Configure Bot Settings (Optional but Recommended)

1. Go back to BotFather
2. Send `/mybots` command
3. Select `@NKH_Restaurant_Bot`
4. Configure the following:

| Setting | Recommended Value | Description |
|----------|------------------|-------------|
| Bot Pic | Upload restaurant logo | Shows in chat header |
| Description | Order food from NKH Restaurant | Shows in bot profile |
| Inline Mode | Enabled | Allows inline queries |
| Inline Feedback | Enabled | Users can see inline results |
| Commands | None (custom) | Disable default commands |

---

## Environment Configuration

### Step 1: Update `.env` File

Add or update the following variables in your `.env` file:

```bash
# ============================================================================
# TELEGRAM BOT CONFIGURATION
# ============================================================================

# Bot Token from @BotFather (REPLACE WITH YOUR TOKEN)
TELEGRAM_BOT_TOKEN=8422586723:AAHOLaauqDFQ4fAwy7et7uFyb04Oi37oE0

# Public webhook URL (must be accessible from internet)
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Optional: Secret token for webhook security
# Generate a random string for security
TELEGRAM_WEBHOOK_SECRET=your_random_secret_string_here

# Optional: Bot username for display
TELEGRAM_BOT_USERNAME=@NKH_Restaurant_Bot

# ============================================================================
# ADMIN CONFIGURATION
# ============================================================================

# Comma-separated list of admin Telegram IDs
# Get your Telegram ID by messaging @userinfobot
TELEGRAM_ADMIN_IDS=123456789,987654321

# ============================================================================
# BOT SETTINGS
# ============================================================================

# Enable/disable notifications
TELEGRAM_NOTIFICATIONS_ENABLED=true

# Cart expiration in minutes
TELEGRAM_CART_EXPIRY_MINUTES=60

# Maximum items per cart
TELEGRAM_MAX_CART_ITEMS=20

# Menu items per page
TELEGRAM_MENU_ITEMS_PER_PAGE=10

# Show menu images
TELEGRAM_MENU_SHOW_IMAGES=true

# Default language (en or km)
TELEGRAM_DEFAULT_LANGUAGE=en

# ============================================================================
# ORDER NOTIFICATION SETTINGS
# ============================================================================

# Notify on order placed
TELEGRAM_NOTIFY_ORDER_PLACED=true

# Notify on order approved
TELEGRAM_NOTIFY_ORDER_APPROVED=true

# Notify when preparing
TELEGRAM_NOTIFY_ORDER_PREPARING=true

# Notify when ready
TELEGRAM_NOTIFY_ORDER_READY=true

# Notify when completed
TELEGRAM_NOTIFY_ORDER_COMPLETED=true

# Notify when cancelled
TELEGRAM_NOTIFY_ORDER_CANCELLED=true

# Enable/disable promotional notifications
TELEGRAM_NOTIFY_PROMOTIONS=false
```

### Step 2: Update `config/telegram.php`

If the configuration file doesn't exist, create it with:

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Bot Token
    |--------------------------------------------------------------------------
    |
    | Your Telegram bot token from @BotFather
    |
    */
    'bot_token' => env('TELEGRAM_BOT_TOKEN', ''),

    /*
    |--------------------------------------------------------------------------
    | Secret Token for Webhook Security
    |--------------------------------------------------------------------------
    |
    | A secret token to verify webhook requests are legitimate
    | Generate a random string and use the same when setting webhook
    |
    */
    'secret_token' => env('TELEGRAM_WEBHOOK_SECRET', ''),

    /*
    |--------------------------------------------------------------------------
    | Webhook URL
    |--------------------------------------------------------------------------
    |
    | The public URL where Telegram will send updates
    |
    */
    'webhook_url' => env('TELEGRAM_WEBHOOK_URL', ''),

    /*
    |--------------------------------------------------------------------------
    | Admin Telegram IDs
    |--------------------------------------------------------------------------
    |
    | List of Telegram user IDs that have admin access
    | Get your ID by messaging @userinfobot on Telegram
    |
    */
    'admin_ids' => array_filter(array_map('trim', explode(',', env('TELEGRAM_ADMIN_IDS', ''))), // '123456789,987654321'

    /*
    |--------------------------------------------------------------------------
    | Parse Mode
    |--------------------------------------------------------------------------
    |
    | Default parsing mode for messages
    | Options: 'Markdown', 'MarkdownV2', 'HTML'
    |
    */
    'parse_mode' => env('TELEGRAM_PARSE_MODE', 'Markdown'),

    /*
    |--------------------------------------------------------------------------
    | Bot Settings
    |--------------------------------------------------------------------------
    |
    */
    'cart_expires_minutes' => env('TELEGRAM_CART_EXPIRY_MINUTES', 60),
    'max_cart_items' => env('TELEGRAM_MAX_CART_ITEMS', 20),
    'menu_items_per_page' => env('TELEGRAM_MENU_ITEMS_PER_PAGE', 10),
    'show_menu_images' => env('TELEGRAM_MENU_SHOW_IMAGES', true),
    'default_language' => env('TELEGRAM_DEFAULT_LANGUAGE', 'en'),

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    |
    */
    'notifications_enabled' => env('TELEGRAM_NOTIFICATIONS_ENABLED', true),
    'notify_order_placed' => env('TELEGRAM_NOTIFY_ORDER_PLACED', true),
    'notify_order_approved' => env('TELEGRAM_NOTIFY_ORDER_APPROVED', true),
    'notify_order_preparing' => env('TELEGRAM_NOTIFY_ORDER_PREPARING', true),
    'notify_order_ready' => env('TELEGRAM_NOTIFY_ORDER_READY', true),
    'notify_order_completed' => env('TELEGRAM_NOTIFY_ORDER_COMPLETED', true),
    'notify_order_cancelled' => env('TELEGRAM_NOTIFY_ORDER_CANCELLED', true),
    'notify_promotions' => env('TELEGRAM_NOTIFY_PROMOTIONS', false),

    /*
    |--------------------------------------------------------------------------
    | Queue Settings
    |--------------------------------------------------------------------------
    |
    */
    'queue_connection' => env('TELEGRAM_QUEUE_CONNECTION', env('QUEUE_CONNECTION', 'database')),
];
```

---

## Webhook Configuration

### Step 1: Set the Webhook

Run the following command to set your webhook:

```bash
php artisan telegram:setup webhook --url=https://your-domain.com/api/telegram/webhook
```

**OR** use the setup command with info:

```bash
# Show bot information
php artisan telegram:setup info

# Set webhook
php artisan telegram:setup webhook

# Delete webhook
php artisan telegram:setup delete-webhook
```

### Step 2: Verify Webhook

To verify the webhook is set correctly:

```bash
php artisan telegram:setup info
```

Expected output:
```
Bot Info:
  ID: 123456789
  Name: NKH Restaurant Bot
  Username: @NKH_Restaurant_Bot
  Webhook URL: https://your-domain.com/api/telegram/webhook
```

### Important Notes

1. **HTTPS Required**: Telegram requires HTTPS for webhooks in production
   - Use `ngrok` for local testing
   - Use Let's Encrypt, Cloudflare SSL, or other free SSL for production

2. **Public Access**: Your webhook URL must be publicly accessible
   - Not `localhost` or `127.0.0.1`
   - Check firewall allows incoming connections

3. **Secret Token**: Always set `TELEGRAM_WEBHOOK_SECRET` for security
   - Prevents unauthorized webhook requests
   - Should be a long, random string (e.g., `abc123xyz789def456`)

4. **Webhook Response**: The webhook always returns 200 OK
   - Prevents Telegram from retrying failed requests
   - Errors are logged but don't block webhook

---

## Admin Access Setup

### Step 1: Get Your Telegram ID

1. Open Telegram
2. Search for `@userinfobot`
3. Start a chat with the bot
4. It will reply with your Telegram ID (e.g., `123456789`)

### Step 2: Configure Admin IDs

Add your admin Telegram IDs to `.env`:

```bash
TELEGRAM_ADMIN_IDS=123456789,987654321,another_admin_id
```

### Admin Features

Once configured, admin users will see:

- 📊 **Admin Dashboard** - Real-time statistics
- 📦 **Pending Orders** - Manage incoming orders
- 📋 **Order Details** - View and update orders
- Status actions: Approve, Decline, Start Preparing, Mark Ready, Complete

### Admin Commands

| Command | Description |
|----------|-------------|
| `/start` | Shows admin dashboard |
| Click **Admin Dashboard** | Opens dashboard |

---

## Testing

### Local Testing with Ngrok

1. **Install ngrok**: Download from https://ngrok.com/
2. **Start Laravel**:
   ```bash
   php artisan serve
   ```
3. **Start ngrok**:
   ```bash
   ngrok http 127.0.0.1:8000
   ```
4. **Copy ngrok URL**: e.g., `https://abc123.ngrok.io`
5. **Set webhook**:
   ```bash
   php artisan telegram:setup webhook --url=https://abc123.ngrok.io/api/telegram/webhook
   ```

### Testing Commands

Test basic functionality:

1. **Open Telegram** and search for your bot
2. **Send `/start`** - Should show welcome message
3. **Browse Menu** - Click menu button
4. **Add to Cart** - Select items and add
5. **View Cart** - Check cart contents
6. **Admin Testing** (if configured):
   - Send `/start` as admin user
   - Should see dashboard option

### Test Webhook Logs

Monitor webhook activity:

```bash
# Tail Laravel logs
tail -f storage/logs/laravel.log

# Look for "Telegram webhook received" messages
```

---

## Available Commands

### User Commands

| Command | Description | Example |
|----------|-------------|----------|
| `/start` | Initialize bot, show welcome | `/start` |
| `/menu` | Browse menu categories | `/menu` |
| `/cart` | View shopping cart | `/cart` |
| `/orders` | View order history | `/orders` |
| `/locations` | Show restaurant locations | `/locations` |
| `/help` | Show help message | `/help` |
| `/cancel` | Cancel current action | `/cancel` |

### Inline Buttons

Most interactions use inline buttons instead of commands:

- **Menu**: 🍽️ Menu
- **Cart**: 🛒 Cart
- **Orders**: 📦 My Orders
- **Loyalty**: 🎁 Loyalty
- **Help**: ❓ Help
- **Locations**: 📍 Locations

### Admin Actions (for Admin Users)

- **Dashboard**: 📊 Admin Dashboard
- **Pending Orders**: 📦 Pending Orders
- **Order Actions**:
  - ✅ Approve
  - ❌ Decline
  - 👨‍🍳 Start Preparing
  - 🔔 Mark Ready
  - ⭐ Complete

---

## Troubleshooting

### Bot Not Responding

**Symptoms**: Bot doesn't reply to messages

**Solutions**:

1. **Check logs**:
   ```bash
   tail -f storage/logs/laravel.log | grep Telegram
   ```

2. **Verify webhook**:
   ```bash
   php artisan telegram:setup info
   ```

3. **Check BotFather settings**:
   - Ensure bot is not disabled
   - Verify webhook URL is correct

4. **Test webhook endpoint directly**:
   ```bash
   curl -X POST https://your-domain.com/api/telegram/webhook \
     -H "X-Telegram-Bot-Api-Secret-Token: your_secret" \
     -H "Content-Type: application/json" \
     -d '{"update_id": 123}'
   ```

### Webhook Not Working

**Symptoms**: Webhook not receiving updates from Telegram

**Solutions**:

1. **Verify HTTPS**: Telegram requires HTTPS in production
2. **Check firewall**: Ensure port 80/443 is open
3. **Test with webhook bot**:
   ```bash
   curl -X GET https://api.telegram.org/bot123456:TOKEN/getWebhookInfo
   ```

4. **Check secret token**: Ensure it matches what's configured

5. **Return 200 OK**: Webhook must return 200, not 4xx/5xx

### Auth Issues

**Symptoms**: User can't link account

**Solutions**:

1. **Check customer exists**: Verify customer has account in database
2. **Check phone format**: Should match format in database
3. **Verify email**: Email must exist in users table
4. **Check logs**:
   ```bash
   tail -f storage/logs/laravel.log | grep "Telegram: Account linked"
   ```

### Notification Issues

**Symptoms**: Users not receiving order updates

**Solutions**:

1. **Check notifications enabled**:
   ```bash
   TELEGRAM_NOTIFICATIONS_ENABLED=true
   ```

2. **Verify user settings**:
   - Check `notifications_enabled` column in `telegram_users` table
   - User can disable notifications in settings

3. **Check queue worker**:
   ```bash
   php artisan queue:work --tries=3 --timeout=90
   ```

4. **Check retry jobs**:
   ```bash
   php artisan queue:retry
   ```

### Database Issues

**Symptoms**: Errors with user data or orders

**Solutions**:

1. **Run migrations**:
   ```bash
   php artisan migrate
   ```

2. **Check model relationships**:
   ```bash
   php artisan tinker
   >>> TelegramUser::first()->customer
   ```

3. **Clear cache**:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```

---

## Queue Worker Setup

For background processing of notifications:

### Option 1: Development

```bash
# Run queue worker in foreground
php artisan queue:work
```

### Option 2: Production

```bash
# Run with supervisor for auto-restart
# Create /etc/supervisor/conf.d/telegram-worker.conf:
[program:telegram-worker]
process_num=1
command=php /path/to/your/project/artisan queue:work
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/your/project/storage/logs/worker.log
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start telegram-worker:*
```

---

## Security Best Practices

1. **Never commit .env** - Add to `.gitignore`
2. **Use strong secrets** - Generate random tokens
3. **Limit admin access** - Only grant to trusted staff
4. **Monitor logs** - Review for suspicious activity
5. **Update bot token** - If compromised, regenerate in BotFather
6. **Use HTTPS** - Required for production webhooks

---

## Production Deployment

### Deployment Checklist

- [ ] Bot token configured in `.env`
- [ ] Webhook URL set to production domain
- [ ] HTTPS enabled with valid SSL
- [ ] Admin Telegram IDs configured
- [ ] Queue worker running
- [ ] Database migrations applied
- [ ] Cache cleared
- [ ] Logs configured
- [ ] Error monitoring set up
- [ ] Backup strategy in place

### Post-Deployment

1. **Test all user flows**:
   - New user registration
   - Returning user login
   - Browse and order flow
   - Order tracking
   - Cart management

2. **Test admin flows**:
   - Dashboard viewing
   - Order approval
   - Status updates
   - Customer search

3. **Monitor for 24-48 hours**:
   - Check logs for errors
   - Verify notifications working
   - Monitor queue performance

---

## Maintenance Commands

```bash
# Clear all caches
php artisan optimize:clear

# Restart queue
php artisan queue:restart

# View queue status
php artisan queue:monitor

# Clear failed jobs
php artisan queue:flush

# View failed notifications
php artisan tinker
>>> TelegramOrderNotification::where('sent', false)->get()
```

---

## Getting Help

### Common Issues

| Issue | Solution |
|--------|----------|
| Bot doesn't respond | Check webhook, verify bot token, check logs |
| Can't link account | Verify customer exists, check phone/email format |
| No notifications | Check queue worker, verify notification settings |
| Admin not showing | Verify admin Telegram ID in config |
| Webhook errors | Check secret token matches, verify HTTPS |

### Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather](https://t.me/botfather)
- [Laravel Documentation](https://laravel.com/docs)
- [NKH Restaurant Sprints](./docs/TELEGRAM_BOT_SPRINTS.md)

---

## Feature Summary

### Implemented Sprints

✅ **Sprint 0**: Foundation Setup
✅ **Sprint 1**: Onboarding & Account Linking
✅ **Sprint 2**: Menu Browsing
✅ **Sprint 3**: Shopping Cart
✅ **Sprint 4**: Order Placement Flow
✅ **Sprint 5**: Order Confirmation & Tracking
✅ **Sprint 6**: Order Status Notifications
✅ **Sprint 7**: Error Handling & Fallback
✅ **Sprint 8**: Admin Integration
✅ **Sprint 9**: Advanced Features (documented)

### Key Capabilities

- ✅ User authentication (phone/email)
- ✅ Menu browsing with pagination
- ✅ Shopping cart management
- ✅ Complete order flow (pickup/delivery)
- ✅ Real-time order tracking
- ✅ Order status notifications
- ✅ Admin dashboard with statistics
- ✅ Order management for admins
- ✅ Robust error handling with retries
- ✅ User-friendly error messages

---

*Last Updated: 2025-12-26*
*Guide Version: 1.0*
