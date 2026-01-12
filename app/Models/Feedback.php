<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;

    protected $table = 'feedback';

    /**
     * SECURITY: Minimal guarding for Feedback (customer-generated)
     * Protect visibility flag (admin-controlled)
     */
    protected $guarded = [
        'id',
        'visibility',           // ⚠️ Admin controls public/private
        'created_at',
        'updated_at',
    ];


    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
