<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'preferred_location_id',
        'customer_code',
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
    ];

    protected $casts = [
        'birth_date' => 'date',
        'preferences' => 'array',
        'points_balance' => 'integer',
        'loyalty_points' => 'integer',
        'total_spent' => 'decimal:2',
        'marketing_consent' => 'boolean',
        'dietary_preferences' => 'array',
    ];

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
}
