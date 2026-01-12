<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{

    protected $guarded = [
        'id',
        'location_id',
        'code',
        'name',
        'contact_name',
        'contact_phone',
        'email',
        'address',
        'type',
        'payment_terms',
        'notes',
        'tax_id',
        'is_active',
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
