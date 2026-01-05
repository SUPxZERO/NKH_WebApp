<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory, \Illuminate\Notifications\Notifiable;

    protected $fillable = [
        'user_id',
        'preferred_location_id',
        'customer_code',
        'name',
        'email',
        'phone',
        'birth_date',
        'gender',
        'loyalty_points',
        'total_spent',
        'preferred_language',
        'dietary_preferences',
        'marketing_consent',
        'preferences',
        'points_balance',
        'notes',
        // New CRM fields
        'last_visit_date',
        'last_purchase_date',
        'visit_count',
        'average_order_value',
        'customer_tier',
        'referral_code',
        'email_verified_at',
        'phone_verified_at',
        'communication_preferences',
        'tags',
        'no_show_count',
    ];


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

