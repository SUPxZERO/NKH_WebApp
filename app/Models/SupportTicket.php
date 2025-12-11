<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    protected $fillable = [
        'user_id',
        'category',
        'subject',
        'description',
        'priority',
        'status',
        'admin_notes',
        'resolved_at',
        'resolved_by',
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
