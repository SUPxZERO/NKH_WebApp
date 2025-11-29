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
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'phone',
        'is_active',
        'accepts_online_orders',
        'accepts_pickup',
        'accepts_delivery',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'accepts_online_orders' => 'boolean',
        'accepts_pickup' => 'boolean',
        'accepts_delivery' => 'boolean',
    ];

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
}
