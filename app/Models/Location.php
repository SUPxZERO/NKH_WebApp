<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string $address_line1
 * @property string|null $address_line2
 * @property string $city
 * @property string $state
 * @property string $postal_code
 * @property string $country
 */
class Location extends Model
{
    use HasFactory, \App\Traits\BranchScopable;

    /**
     * Override branch column for Location model (it uses 'id')
     */
    public function getBranchColumn(): string
    {
        return 'id';
    }

    /**
     * SECURITY: Minimal guarding for Location (business configuration)
     * Protect system-generated code
     */
    protected $guarded = [
        'id',
        // code is guarded but needed for seeding
        'created_at',
        'updated_at',
    ];


    protected $casts = [
        'is_active' => 'boolean',
        'accepts_online_orders' => 'boolean',
        'accepts_pickup' => 'boolean',
        'accepts_delivery' => 'boolean',
    ];

    /**
     * Scope to filter only active locations
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the full address string.
     * Combines address_line1 and address_line2 into a single address.
     */
    public function getAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address_line1,
            $this->address_line2,
        ]);

        return implode(', ', $parts);
    }

    public function settings()
    {
        return $this->hasMany(Setting::class);
    }

    public function users()
    {
        return $this->hasMany(User::class, 'default_location_id');
    }

    public function operatingHours()
    {
        return $this->hasMany(OperatingHour::class);
    }

    public function orderTimeSlots()
    {
        return $this->hasMany(OrderTimeSlot::class);
    }

    // ============================================
    // BUSINESS RELATIONSHIPS
    // ============================================

    public function floors()
    {
        return $this->hasMany(Floor::class);
    }

    public function tables()
    {
        // Model is DiningTable, table is 'tables'
        return $this->hasMany(DiningTable::class);
    }

    public function menuItems()
    {
        return $this->hasMany(MenuItem::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function shifts()
    {
        return $this->hasMany(Shift::class);
    }

    public function feedback()
    {
        return $this->hasMany(Feedback::class);
    }

    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }
}
