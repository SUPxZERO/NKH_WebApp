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
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_default' => 'boolean',
    ];

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
