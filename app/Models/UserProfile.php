<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [
        'id',
        'user_id',
        'customer_code',
        'birth_date',
        'gender',
        'preferred_language',
        'marketing_consent',
        'points_balance',
        'customer_tier',
        'tier_updated_at',
        'preferred_location_id',
        'dietary_restrictions',
        'favorite_menu_items',
        'last_order_at',
        'total_spent',
        'total_orders',
            'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'birth_date' => 'date',
        'marketing_consent' => 'boolean',
        'tier_updated_at' => 'datetime',
        'dietary_restrictions' => 'array',
        'favorite_menu_items' => 'array',
        'last_order_at' => 'datetime',
        'total_spent' => 'decimal:2',
        'points_balance' => 'integer',
        'total_orders' => 'integer',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the preferred location.
     */
    public function preferredLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'preferred_location_id');
    }

    /**
     * Add loyalty points to the user's balance.
     */
    public function addPoints(int $points, string $reason = 'purchase'): void
    {
        $this->increment('points_balance', $points);
        
        // Log the points transaction
        LoyaltyPoint::create([
            'user_id' => $this->user_id,
            'points' => $points,
            'type' => 'earn',
            'reason' => $reason,
            'occurred_at' => now(),
        ]);
        
        // Check for tier upgrade
        $this->checkTierUpgrade();
    }

    /**
     * Deduct loyalty points from the user's balance.
     */
    public function deductPoints(int $points, string $reason = 'redemption'): bool
    {
        if ($this->points_balance < $points) {
            return false;
        }
        
        $this->decrement('points_balance', $points);
        
        LoyaltyPoint::create([
            'user_id' => $this->user_id,
            'points' => -$points,
            'type' => 'redeem',
            'reason' => $reason,
            'occurred_at' => now(),
        ]);
        
        return true;
    }

    /**
     * Check and upgrade customer tier based on points.
     */
    protected function checkTierUpgrade(): void
    {
        $tierThresholds = [
            'platinum' => 10000,
            'gold' => 5000,
            'silver' => 1000,
            'bronze' => 0,
        ];
        
        $currentTier = $this->customer_tier;
        $newTier = 'bronze';
        
        foreach ($tierThresholds as $tier => $threshold) {
            if ($this->points_balance >= $threshold) {
                $newTier = $tier;
                break;
            }
        }
        
        if ($newTier !== $currentTier) {
            $this->update([
                'customer_tier' => $newTier,
                'tier_updated_at' => now(),
            ]);
        }
    }

    /**
     * Generate a unique customer code.
     */
    public static function generateCustomerCode(): string
    {
        do {
            $code = 'C' . str_pad(mt_rand(1, 9999999), 7, '0', STR_PAD_LEFT);
        } while (self::where('customer_code', $code)->exists());
        
        return $code;
    }
}
