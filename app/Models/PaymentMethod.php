<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'display_order',
        'is_active',
        'processing_fee',
        'description'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'processing_fee' => 'decimal:2',
        'display_order' => 'integer'
    ];

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
