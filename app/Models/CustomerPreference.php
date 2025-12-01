<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'category',
        'preference_key',
        'preference_value',
    ];

    protected $casts = [
        'preference_value' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
