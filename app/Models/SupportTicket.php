<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    protected $guarded = [
        'id',
        'user_id',
        'category',
        'subject',
        'description',
        'priority',
        'status',
        'admin_notes',
        'resolved_at',
        'resolved_by',
            'created_at',
        'updated_at',
    ];
    
    protected $casts = [
        'resolved_at' => 'datetime',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
