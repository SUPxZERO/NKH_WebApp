---
description: Sprint P16 - Telegram Customer Auto-Creation (Auto-create Customer from Telegram user data, full feature parity without login)
---

# Sprint P16: Telegram Customer Auto-Creation System

## Overview
Transform the current Telegram guest ordering concept into a **first-class customer experience**. When a Telegram user first accesses the system, automatically create a `Customer` record using all available Telegram data, giving them immediate access to ALL customer features (loyalty points, order history, favorites, addresses, reservations, etc.) without requiring traditional login.

## Key Paradigm Shift
**Before (P15 - Guest Ordering):** TelegramUser exists independently → optionally links to Customer → guest features only
**After (P16 - Auto-Creation):** TelegramUser created → **immediately** creates linked Customer → FULL customer features from day 1

---

## Goals
1. **Zero-Friction Onboarding**: Telegram user gets full customer access instantly with NO registration
2. **Full Feature Parity**: Telegram users have ALL features that logged-in customers have
3. **Telegram as Identity Source**: Use `telegram_id`, `first_name`, `last_name`, `username`, `phone` (if shared) as customer data
4. **Seamless Profile Enhancement**: Users can add/modify info (email, full address, etc.) later in profile
5. **Database Integrity**: Ensure all related tables correctly support the `TelegramUser` → `Customer` linkage

---

## Current State Analysis

### What Exists (from P15)
- `TelegramUser` model with optional `customer_id` FK
- `Customer.user_id` is NOW nullable (migration exists)
- `Customer` has `name`, `email`, `phone` fields for standalone customers
- `CustomerAddress` supports `telegram_user_id` for guest addresses
- `Order.telegram_user_id` exists for guest orders
- Guest checkout and notifications working via Telegram

### What's Missing
1. **Auto-creation of Customer** when TelegramUser is created
2. **Data extraction** from Telegram (phone via `request_contact`, location, etc.)
3. **Customer code generation** for auto-created customers
4. **Address migration** from `telegram_user_id` to `customer_id` when Customer is created
5. **Order migration** to update orders with the new `customer_id`
6. **Full feature access** (favorites, loyalty points calculations, reservations)
7. **Profile completion flow** for adding email and full details later

---

## Telegram Data Available

| Field | Source | Usage |
|-------|--------|-------|
| `telegram_id` | Always available | Unique identifier, links to TelegramUser |
| `first_name` | Always available | Customer.name (part 1) |
| `last_name` | Often available | Customer.name (part 2) |
| `username` | Often available | Display reference |
| `language_code` | Always available | Customer.preferred_language |
| `phone_number` | Via request_contact | Customer.phone (most valuable!) |
| `photo_url` | Via getProfilePhotos API | Customer avatar (optional) |

---

## Tasks

### Phase 1: Core Auto-Creation Logic (Priority: CRITICAL)
// turbo-all

**Task 1.1: Modify TelegramUser::findOrCreate() to Auto-Create Customer**
```php
// In TelegramUser::findOrCreate()
public static function findOrCreate(array $telegramData): self
{
    $telegramUser = static::findByTelegramId($telegramData['id']);
    
    if (!$telegramUser) {
        // Create TelegramUser
        $telegramUser = static::create([...]);
        
        // AUTO-CREATE Customer immediately
        $customer = Customer::create([
            'user_id' => null, // No traditional user account
            'name' => trim(($telegramData['first_name'] ?? '') . ' ' . ($telegramData['last_name'] ?? '')),
            'phone' => null, // Will be added via request_contact later
            'preferred_language' => $telegramData['language_code'] ?? 'en',
            'customer_code' => Customer::generateCode(),
            'customer_tier' => 'Bronze',
            'points_balance' => 0,
        ]);
        
        $telegramUser->update(['customer_id' => $customer->id]);
    } elseif (!$telegramUser->customer_id) {
        // Existing TelegramUser without Customer - backfill
        // (migrate from P15 guest to full customer)
        $customer = Customer::create([...]);
        $telegramUser->update(['customer_id' => $customer->id]);
        
        // Migrate addresses and orders
        CustomerAddress::where('telegram_user_id', $telegramUser->id)
            ->whereNull('customer_id')
            ->update(['customer_id' => $customer->id]);
            
        Order::where('telegram_user_id', $telegramUser->id)
            ->whereNull('customer_id')
            ->update(['customer_id' => $customer->id]);
    }
    
    return $telegramUser->fresh(['customer']);
}
```

**Task 1.2: Add Customer Code Generation Helper**
- Add `Customer::generateCode()` static method
- Format: e.g., `TG-` prefix + 6-8 alphanumeric characters
- Ensure uniqueness check

**Task 1.3: Update TelegramWebAppAuth Middleware**
- When authenticating Telegram user, ensure Customer exists
- If TelegramUser has no customer_id, trigger auto-creation

---

### Phase 2: Phone Number Collection via Telegram (Priority: HIGH)

**Task 2.1: Request Contact Button**
- Telegram provides verified phone number via `request_contact` keyboard button
- Add flow in bot to request phone on first interaction or checkout
- Store in both `TelegramUser.phone_number` AND `Customer.phone`

**Task 2.2: Update TelegramKeyboardBuilder**
```php
public static function requestContact(): array
{
    return [
        'keyboard' => [
            [['text' => '📱 Share Phone Number', 'request_contact' => true]],
            [['text' => '⏭️ Skip for Now']],
        ],
        'resize_keyboard' => true,
        'one_time_keyboard' => true,
    ];
}
```

**Task 2.3: Handle Contact Sharing in Webhook**
- Listen for `message.contact` updates
- Update `TelegramUser.phone_number` AND `Customer.phone`
- Optionally trigger phone verification status

---

### Phase 3: Feature Parity Implementation (Priority: HIGH)

**Task 3.1: Loyalty Points for Telegram Customers**
- Ensure `LoyaltyPoint` model works with `customer_id` (already does)
- On order completion, credit points to linked Customer
- Display points in Telegram account/profile views

**Task 3.2: Favorites Feature for Telegram**
- `customer_favorites` table already uses `customer_id`
- Add Telegram API endpoints for favorites:
  - `POST /api/telegram/favorites/{menuItemId}`
  - `DELETE /api/telegram/favorites/{menuItemId}`
  - `GET /api/telegram/favorites`
- Use customer_id from linked Customer

**Task 3.3: Reservations for Telegram Customers**
- `reservations` table uses `customer_id`
- Ensure Telegram users can make reservations
- Add endpoints if not already available

**Task 3.4: Full Order History**
- Query orders by `customer_id` (not just `telegram_user_id`)
- Orders placed before auto-creation should be migrated

---

### Phase 4: Address Management Cleanup (Priority: MEDIUM)

**Task 4.1: Unify Address Storage**
- All addresses for Telegram users should use `customer_id`
- Remove reliance on `telegram_user_id` for addresses
- Migration script to move existing addresses

**Task 4.2: Update TelegramAccountController**
```php
// addresses() method - simplify to always use customer_id
public function addresses(Request $request): JsonResponse
{
    $user = $request->user('telegram');
    $customer = $user->customer;
    
    if (!$customer) {
        return response()->json(['success' => false, 'error' => 'Customer not found'], 404);
    }
    
    $addresses = CustomerAddress::where('customer_id', $customer->id)
        ->orderBy('is_default', 'desc')
        ->get();
    // ...
}
```

---

### Phase 5: Profile Completion Flow (Priority: MEDIUM)

**Task 5.1: Profile Page in Telegram Mini App**
- Show current info (from Telegram + any additions)
- Allow editing:
  - Name (pre-filled from Telegram)
  - Phone (pre-filled if shared via request_contact)
  - Email (empty, optional)
  - Default delivery address
  - Communication preferences

**Task 5.2: Update Customer from Profile**
- `PUT /api/telegram/account/profile` → update both TelegramUser AND Customer
- Sync name, phone, etc.

**Task 5.3: Optional Full Account Upgrade**
- If user wants email/password login:
  - Create `User` record
  - Link existing `Customer.user_id`
  - Now accessible via web login too

---

### Phase 6: Data Migration & Cleanup (Priority: HIGH)

**Task 6.1: Backfill Migration Script**
Create artisan command: `php artisan telegram:migrate-to-customers`
```php
// For all TelegramUsers without customer_id:
// 1. Create Customer record
// 2. Link TelegramUser.customer_id
// 3. Migrate CustomerAddresses
// 4. Migrate Orders
```

**Task 6.2: Update Existing Orders**
- Orders with only `telegram_user_id` → add `customer_id`
- Don't remove `telegram_user_id` (keep for notification routing)

**Task 6.3: Database Constraints Audit**
Ensure these FKs/Indexes exist:
- `telegram_users.customer_id` → `customers.id`
- `customer_addresses.customer_id` → `customers.id`
- `orders.telegram_user_id` → `telegram_users.id`
- `orders.customer_id` → `customers.id`

---

## API Endpoints (New/Modified)

### New Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/telegram/account/request-phone` | Initiate phone sharing flow | TelegramAuth |
| GET | `/api/telegram/favorites` | List customer favorites | TelegramAuth |
| POST | `/api/telegram/favorites/{id}` | Add to favorites | TelegramAuth |
| DELETE | `/api/telegram/favorites/{id}` | Remove from favorites | TelegramAuth |
| PUT | `/api/telegram/account/profile` | Update full profile | TelegramAuth |
| POST | `/api/telegram/account/upgrade` | Convert to full User account | TelegramAuth |

### Modified Endpoints
| Method | Endpoint | Changes |
|--------|----------|---------|
| GET | `/api/telegram/account/me` | Include full customer data, loyalty, tier |
| GET | `/api/telegram/account/addresses` | Always use customer_id, not telegram_user_id |
| GET | `/api/telegram/orders` | Query by customer_id for complete history |

---

## Database Changes Required

### Migration 1: Ensure Customer fields are fillable
```php
// Already done: Customer has name, email, phone fields
// Update Customer::$fillable if needed
```

### Migration 2: Add customer_code generation (if not auto-generated)
```php
// Check if customer_code is auto-generated or needs trigger
// Add default value or generation logic
```

### Migration 3 (Optional): Add telegram_customer flag
```php
Schema::table('customers', function (Blueprint $table) {
    $table->boolean('is_telegram_customer')->default(false)->after('user_id');
});
```

---

## Implementation Steps (Execution Order)

1. **Phase 1.2**: Add `Customer::generateCode()` helper
   // turbo

2. **Phase 1.1**: Modify `TelegramUser::findOrCreate()` - the core change
   - Create Customer immediately
   - Backfill for existing TelegramUsers without customer

3. **Phase 1.3**: Update `TelegramWebAppAuth` middleware
   - Ensure Customer exists on auth

4. **Phase 6.1**: Create migration command
   // turbo
   ```bash
   php artisan make:command MigrateTelegramToCustomers
   ```

5. **Run migration command**
   ```bash
   php artisan telegram:migrate-to-customers
   ```

6. **Phase 4**: Update address controllers to use customer_id

7. **Phase 3**: Add favorites endpoints for Telegram

8. **Phase 2**: Add phone request flow

9. **Phase 5**: Profile completion UI/API

10. **Testing all flows**

---

## Verification Plan

### Automated Tests
```bash
# Create new test file
php artisan make:test TelegramCustomerAutoCreationTest

# Run tests
php artisan test --filter=TelegramCustomerAutoCreationTest
```

Test cases to cover:
1. New Telegram user → Customer created automatically
2. Existing TelegramUser without customer → backfilled on next access
3. Addresses migrate from telegram_user_id to customer_id
4. Orders include customer_id after migration
5. Loyalty points credited to correct customer
6. Favorites accessible for Telegram customers

### Manual Testing Checklist
- [ ] Clear database, start fresh Telegram session
- [ ] Send /start to bot → verify Customer created in database
- [ ] Check `telegram_users` has `customer_id` populated
- [ ] Check `customers` table has entry with Telegram name
- [ ] Add item to cart, place order → order has both `telegram_user_id` AND `customer_id`
- [ ] Add address → stored with `customer_id`
- [ ] View loyalty points in account screen
- [ ] Add menu item to favorites → check `customer_favorites` table
- [ ] Phone request: tap share phone → verify stored in both TelegramUser and Customer
- [ ] Order completion → loyalty points credited
- [ ] View complete order history (including retroactive orders)
- [ ] Profile update → changes reflected in Customer model

---

## Security Considerations

1. **Customer Code Uniqueness**: Ensure generated codes are unique
2. **Phone Verification**: Telegram-provided phone is verified by Telegram
3. **No Duplicate Customers**: Check for existing by telegram_id before creation
4. **Data Privacy**: Telegram user data is used only for order/service purposes
5. **Session Security**: Continue using existing TelegramAuth middleware

---

## Rollback Plan

If issues arise:
1. Keep `telegram_user_id` columns and data
2. Set `TelegramUser.customer_id` back to null is safe
3. Orders/Addresses retain their original IDs
4. Revert code changes, leave database intact

---

## Success Metrics

- 100% of new Telegram users get Customer records automatically
- 100% of existing TelegramUsers backfilled with Customer
- Order history shows complete history (pre and post migration)
- Loyalty points accumulating for Telegram orders
- Favorites feature working for Telegram customers

---

## Notes

- This builds on Sprint P15 (guest ordering) and enhances it
- Existing `telegram_user_id` columns remain for notification routing
- `Customer.user_id` remains null for Telegram-only customers
- Users can optionally upgrade to full User account later
- All Telegram data comes verified from Telegram API
