<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftSwap extends Model
{
    use HasFactory;

    protected $fillable = [
        'requester_id',
        'recipient_id',
        'shift_id',
        'type',
        'status',
        'reason',
        'responded_at',
        'approved_by',
        'approved_at',
        'denial_reason',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    /**
     * The employee requesting the shift swap
     */
    public function requester()
    {
        return $this->belongsTo(Employee::class, 'requester_id');
    }

    /**
     * The employee who will take the shift (for trades/give-aways)
     */
    public function recipient()
    {
        return $this->belongsTo(Employee::class, 'recipient_id');
    }

    /**
     * The shift being swapped
     */
    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    /**
     * The manager who approved the swap
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
