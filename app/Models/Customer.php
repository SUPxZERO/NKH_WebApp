<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory, \Illuminate\Notifications\Notifiable;

    /**
     * SECURITY: Use $guarded instead of $fillable to protect sensitive fields
     * 
     * These fields MUST NOT be settable via user input/API requests:
     * - Financial: loyalty_points, points_balance, total_spent, average_order_value
     * - System-derived: customer_tier, visit_count, last_visit_date, last_purchase_date
     * - System-generated: customer_code, referral_code
     * - Verification timestamps: email_verified_at, phone_verified_at
     * - Audit fields: no_show_count
     * 
     * Attack prevented: User sending {"loyalty_points": 999999, "customer_tier": "platinum"}
     */
    protected $guarded = [
        'id',
        'loyalty_points',           // ⚠️ CRITICAL: Points manipulation
        'points_balance',           // ⚠️ CRITICAL: Points manipulation
        'total_spent',              // ⚠️ CRITICAL: Financial manipulation
        'average_order_value',      // ⚠️ System-calculated metric
        'customer_tier',            // ⚠️ System-calculated or admin-override only
        'loyalty_tier_id',          // ⚠️ Lookup table ID
        'visit_count',              // ⚠️ System-tracked engagement
        'last_visit_date',          // ⚠️ System-tracked timestamp
        'last_purchase_date',       // ⚠️ System-tracked timestamp
        'customer_code',            // ⚠️ System-generated identifier
        'referral_code',            // ⚠️ System-generated code
        'email_verified_at',        // ⚠️ Verification flow only
        'phone_verified_at',        // ⚠️ Verification flow only
        'no_show_count',            // ⚠️ System-tracked reliability
        'created_at',
        'updated_at',
    ];

    
    public function loyaltyTier()
    {
        return $this->belongsTo(LoyaltyTier::class);
    }

    // ==================== ACCESSORS (Backward Compatibility) ====================

    public function getCustomerTierAttribute($value)
    {
        if ($value !== null) return $value;
        return $this->loyaltyTier?->code ?? 'bronze';
    }

    protected $casts = [
        'birth_date' => 'date',
        'preferences' => 'array',
        'points_balance' => 'integer',
        'loyalty_points' => 'integer',
        'total_spent' => 'decimal:2',
        'marketing_consent' => 'boolean',
        'dietary_preferences' => 'array',
        // New CRM field casts
        'last_visit_date' => 'datetime',
        'last_purchase_date' => 'datetime',
        'visit_count' => 'integer',
        'average_order_value' => 'decimal:2',
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'communication_preferences' => 'array',
        'tags' => 'array',
        'no_show_count' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        // Auto-generate customer_code if not provided (since it's guarded)
        static::creating(function ($customer) {
            if (empty($customer->customer_code)) {
                $customer->customer_code = static::generateCustomerCode();
            }
        });
    }

    // Existing relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function preferredLocation()
    {
        return $this->belongsTo(Location::class, 'preferred_location_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function feedback()
    {
        return $this->hasMany(Feedback::class);
    }

    public function loyaltyPoints()
    {
        return $this->hasMany(LoyaltyPoint::class);
    }

    public function addresses()
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // New relationships
    public function customerPreferences()
    {
        return $this->hasMany(CustomerPreference::class);
    }

    public function loginHistory()
    {
        return $this->hasMany(CustomerLoginHistory::class);
    }

    public function communicationLog()
    {
        return $this->hasMany(CustomerCommunicationLog::class);
    }

    public function telegramUser()
    {
        return $this->hasOne(\App\Models\TelegramUser::class);
    }

    // Helper methods
    public function calculateTier()
    {
        $spent = floatval($this->total_spent);
        
        if ($spent >= 10000) return 'platinum';
        if ($spent >= 5000) return 'gold';
        if ($spent >= 2000) return 'silver';
        return 'bronze';
    }

    public function updateEngagementMetrics()
    {
        $orderCount = $this->orders()->count();
        $totalSpent = $this->orders()->sum('total_amount');
        
        $this->update([
            'visit_count' => $orderCount,
            'total_spent' => $totalSpent,
            'average_order_value' => $orderCount > 0 ? $totalSpent / $orderCount : 0,
            'customer_tier' => $this->calculateTier(),
        ]);
    }

    public function getDefaultAddress()
    {
        return $this->addresses()->where('is_default', true)->first() 
            ?? $this->addresses()->first();
    }

    /**
     * Generate a unique customer code for Telegram-created customers
     * Format: TG + 6 alphanumeric characters (e.g., TG-A3B7C9)
     */
    public static function generateCustomerCode(string $prefix = 'TG'): string
    {
        $maxAttempts = 10;
        $attempt = 0;

        do {
            $code = $prefix . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
            $exists = static::where('customer_code', $code)->exists();
            $attempt++;
        } while ($exists && $attempt < $maxAttempts);

        if ($exists) {
            // Fallback to timestamp-based code
            $code = $prefix . '-' . strtoupper(dechex(time() % 16777215));
        }

        return $code;
    }
}

