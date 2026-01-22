<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeAchievement extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'achievement_code',
        'title',
        'description',
        'icon',
        'earned_at',
        'metadata',
    ];

    protected $casts = [
        'earned_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Get the employee that owns this achievement.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
