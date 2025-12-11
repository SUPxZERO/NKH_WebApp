<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftSwap extends Model
{
    protected $fillable = [
        'requester_id',
        'shift_id',
        'recipient_id',
        'type',
        'status',
        'reason',
        'manager_id',
        'approved_at',
    ];
    
    protected $casts = [
        'approved_at' => 'datetime',
    ];
    
    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }
    
    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
    
    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
    
    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }
}
