<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerLoginHistory extends Model
{
    use HasFactory;

    protected $table = 'customer_login_history';
    public $timestamps = false;

    protected $guarded = [
        'id',
        'customer_id',
        'ip_address',
        'user_agent',
        'login_at',
        'logout_at',
        'session_duration',
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'login_at' => 'datetime',
        'logout_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
