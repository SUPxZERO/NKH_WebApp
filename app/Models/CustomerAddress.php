<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'telegram_user_id',
        'label',
        'address_line_1',
        'address_line_2',
        'city',
        'province',
        'postal_code',
        'latitude',
        'longitude',
        'delivery_instructions',
        'is_default',
        'geocoding_attempted_at',
        'geocoding_failed',
        'geocoding_provider',
        'geocoding_quality',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_default' => 'boolean',
        'geocoding_failed' => 'boolean',
        'geocoding_quality' => 'float',
        'geocoding_attempted_at' => 'datetime',
    ];

    /**
     * Get full formatted address
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address_line_1,
            $this->address_line_2,
            $this->city,
            $this->province,
            $this->postal_code,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Check if address needs geocoding
     */
    public function needsGeocoding(): bool
    {
        // Needs geocoding if:
        // 1. No coordinates exist, OR
        // 2. Geocoding failed and hasn't been attempted in last 24 hours
        if (!$this->latitude || !$this->longitude) {
            if ($this->geocoding_failed && $this->geocoding_attempted_at) {
                return $this->geocoding_attempted_at->lt(now()->subDay());
            }
            return true;
        }

        return false;
    }

    /**
     * Mark geocoding as failed
     */
    public function markGeocodingFailed(): void
    {
        $this->update([
            'geocoding_failed' => true,
            'geocoding_attempted_at' => now(),
        ]);
    }

    /**
     * Update coordinates from geocoding result
     */
    public function updateCoordinates(float $lat, float $lng, string $provider, ?float $quality = null): void
    {
        $this->update([
            'latitude' => $lat,
            'longitude' => $lng,
            'geocoding_provider' => $provider,
            'geocoding_quality' => $quality,
            'geocoding_failed' => false,
            'geocoding_attempted_at' => now(),
        ]);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function telegramUser()
    {
        return $this->belongsTo(\App\Models\TelegramUser::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'customer_address_id');
    }
}
