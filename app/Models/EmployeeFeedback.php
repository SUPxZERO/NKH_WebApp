<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeFeedback extends Model
{
    protected $guarded = [
        'id',
        'user_id',
        'shift_id',
        'type',
        'rating',
        'comment',
        'is_anonymous',
        'status',
        'admin_response',
        'reviewed_at',
        'reviewed_by',
            'created_at',
        'updated_at',
    ];
    
    protected $casts = [
        'reviewed_at' => 'datetime',
        'is_anonymous' => 'boolean',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
    
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
