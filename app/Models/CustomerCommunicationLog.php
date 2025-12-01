<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerCommunicationLog extends Model
{
    use HasFactory;

    protected $table = 'customer_communication_log';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'type',
        'category',
        'subject',
        'message',
        'sent_at',
        'delivered_at',
        'opened_at',
        'clicked_at',
        'status',
        'metadata',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'opened_at' => 'datetime',
        'clicked_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
