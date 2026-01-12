<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramUser extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'customer_id',
        'telegram_id',
        'telegram_username',
        'first_name',
        'last_name',
        'language_code',
        'phone_number',
        'delivery_address',
        'saved_addresses',
        'conversation_state',
        'conversation_data',
        'is_active',
        'notifications_enabled',
        'last_interaction_at',
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'conversation_data' => 'array',
        'saved_addresses' => 'array',
        'is_active' => 'boolean',
        'notifications_enabled' => 'boolean',
        'last_interaction_at' => 'datetime',
    ];

    // Conversation states
    const STATE_NONE = 'none';
    const STATE_AWAITING_PHONE = 'awaiting_phone';
    const STATE_AWAITING_EMAIL = 'awaiting_email';
    const STATE_AWAITING_OTP = 'awaiting_otp';
    const STATE_AWAITING_REGISTRATION = 'awaiting_registration';
    const STATE_AWAITING_SEARCH = 'awaiting_search';
    const STATE_BROWSING_MENU = 'browsing_menu';
    const STATE_VIEWING_CATEGORY = 'viewing_category';
    const STATE_AWAITING_QUANTITY = 'awaiting_quantity';
    const STATE_CART = 'cart';
    const STATE_CHECKOUT_ORDER_TYPE = 'checkout_order_type';
    const STATE_CHECKOUT_LOCATION = 'checkout_location';
    const STATE_CHECKOUT_TIME = 'checkout_time';
    const STATE_CHECKOUT_PAYMENT = 'checkout_payment';
    const STATE_CHECKOUT_CONFIRM = 'checkout_confirm';
    const STATE_VIEWING_ORDER = 'viewing_order';

    /**
     * Get the customer linked to this Telegram user
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the user through customer
     */
    public function user()
    {
        return $this->hasOneThrough(
            User::class,
            Customer::class,
            'id',
            'id',
            'customer_id',
            'user_id'
        );
    }

    /**
     * Get order notifications sent to this user
     */
    public function orderNotifications()
    {
        return $this->hasMany(TelegramOrderNotification::class);
    }

    /**
     * Get orders placed by this Telegram user (guest orders)
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get the user's display name
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->first_name && $this->last_name) {
            return "{$this->first_name} {$this->last_name}";
        }
        if ($this->first_name) {
            return $this->first_name;
        }
        return $this->telegram_username ?? "User {$this->telegram_id}";
    }

    /**
     * Get the full name
     */
    public function getFullNameAttribute(): string
    {
        return $this->display_name;
    }

    /**
     * Check if user has linked customer account
     */
    public function hasLinkedAccount(): bool
    {
        return $this->customer_id !== null;
    }

    /**
     * Update conversation state
     */
    public function setConversationState(string $state, ?array $data = null): self
    {
        $this->update([
            'conversation_state' => $state,
            'conversation_data' => $data,
            'last_interaction_at' => now(),
        ]);

        return $this;
    }

    /**
     * Clear conversation state
     */
    public function clearConversationState(): self
    {
        $this->update([
            'conversation_state' => self::STATE_NONE,
            'conversation_data' => null,
        ]);

        return $this;
    }

    /**
     * Get conversation data with default
     */
    public function getConversationData(string $key, $default = null)
    {
        return data_get($this->conversation_data, $key, $default);
    }

    /**
     * Set conversation data
     */
    public function setConversationData(string $key, $value): self
    {
        $data = $this->conversation_data ?? [];
        data_set($data, $key, $value);

        $this->update([
            'conversation_data' => $data,
            'last_interaction_at' => now(),
        ]);

        return $this;
    }

    /**
     * Set registration data
     */
    public function setRegistrationData(array $data): self
    {
        $this->update([
            'conversation_state' => self::STATE_AWAITING_REGISTRATION,
            'conversation_data' => $data,
            'last_interaction_at' => now(),
        ]);

        return $this;
    }

    /**
     * Get registration data
     */
    public function getRegistrationData(): ?array
    {
        return $this->conversation_data;
    }

    /**
     * Set pending registration
     */
    public function setPendingRegistration(array $data): self
    {
        $this->update([
            'conversation_state' => self::STATE_NONE,
            'conversation_data' => [
                'pending_registration' => $data,
                'pending_type' => 'registration',
            ],
            'last_interaction_at' => now(),
        ]);

        return $this;
    }

    /**
     * Get pending registration
     */
    public function getPendingRegistration(): ?array
    {
        return data_get($this->conversation_data, 'pending_registration');
    }

    /**
     * Scope active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope users with notifications enabled
     */
    public function scopeWithNotifications($query)
    {
        return $query->where('notifications_enabled', true);
    }

    /**
     * Scope linked accounts
     */
    public function scopeLinked($query)
    {
        return $query->whereNotNull('customer_id');
    }

    /**
     * Find by telegram ID
     */
    public static function findByTelegramId(int $telegramId): ?self
    {
        return static::where('telegram_id', $telegramId)->first();
    }

    /**
     * Find or create by telegram data
     * 
     * SPRINT P16: Now auto-creates a Customer record immediately,
     * giving Telegram users full customer features from first access.
     */
    public static function findOrCreate(array $telegramData): self
    {
        if (!isset($telegramData['id'])) {
            throw new \InvalidArgumentException(
                'Telegram user data must contain "id" key. Received keys: ' . implode(', ', array_keys($telegramData))
            );
        }

        $telegramId = (int) $telegramData['id'];

        $user = static::findByTelegramId($telegramId);

        if (!$user) {
            // Create new TelegramUser
            $user = static::create([
                'telegram_id' => $telegramId,
                'telegram_username' => $telegramData['username'] ?? null,
                'first_name' => $telegramData['first_name'] ?? null,
                'last_name' => $telegramData['last_name'] ?? null,
                'language_code' => $telegramData['language_code'] ?? 'en',
            ]);

            // SPRINT P16: Auto-create Customer immediately
            $customer = static::createCustomerForTelegramUser($user, $telegramData);
            $user->update(['customer_id' => $customer->id]);

            \Illuminate\Support\Facades\Log::info('TelegramUser: Created with auto-linked Customer', [
                'telegram_id' => $telegramId,
                'customer_id' => $customer->id,
                'customer_code' => $customer->customer_code,
            ]);
        } elseif (!$user->customer_id) {
            // SPRINT P16: Backfill - existing TelegramUser without Customer
            $customer = static::createCustomerForTelegramUser($user, $telegramData);
            $user->update(['customer_id' => $customer->id]);

            // Migrate orphaned addresses to the new customer
            CustomerAddress::where('telegram_user_id', $user->id)
                ->whereNull('customer_id')
                ->update(['customer_id' => $customer->id]);

            // Migrate orphaned orders to the new customer
            \App\Models\Order::where('telegram_user_id', $user->id)
                ->whereNull('customer_id')
                ->update(['customer_id' => $customer->id]);

            \Illuminate\Support\Facades\Log::info('TelegramUser: Backfilled with Customer', [
                'telegram_id' => $telegramId,
                'telegram_user_id' => $user->id,
                'customer_id' => $customer->id,
            ]);
        }

        return $user->fresh(['customer']);
    }

    /**
     * Create a Customer record for a TelegramUser
     * Used by findOrCreate() for both new and backfill cases
     */
    protected static function createCustomerForTelegramUser(self $telegramUser, array $telegramData = []): Customer
    {
        $firstName = $telegramData['first_name'] ?? $telegramUser->first_name ?? '';
        $lastName = $telegramData['last_name'] ?? $telegramUser->last_name ?? '';
        $name = trim("{$firstName} {$lastName}") ?: 'Telegram User';

        return Customer::create([
            'user_id' => null, // No traditional User account
            'name' => $name,
            'phone' => $telegramUser->phone_number, // If already collected
            'preferred_language' => $telegramData['language_code'] ?? $telegramUser->language_code ?? 'en',
            'customer_code' => Customer::generateCustomerCode('TG'),
            'customer_tier' => 'bronze',
            'points_balance' => 0,
            'loyalty_points' => 0,
            'total_spent' => 0,
            'visit_count' => 0,
            'marketing_consent' => true, // Default for Telegram users
        ]);
    }
}

