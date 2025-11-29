<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $user_id
 * @property int $position_id
 * @property int $location_id
 * @property string $employee_code
 * @property string $hire_date
 * @property string $salary_type
 * @property float $salary
 * @property string|null $salary_type
 * @property float|null $hourly_rate
 * @property string $address
 * @property string $status
 */
class Employee extends Model
{

    protected $fillable = [
        'user_id',
        'position_id',
        'location_id',
        'employee_code',
        'hire_date',
        'salary_type',
        'salary',
        'address',
        'status',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'salary' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function shifts()
    {
        return $this->hasMany(Shift::class);
    }

    public function timeOffBalances()
    {
        return $this->hasMany(TimeOffBalance::class);
    }

    public function employmentHistory()
    {
        return $this->hasMany(EmploymentHistory::class);
    }

    public function attendanceMetrics()
    {
        return $this->hasMany(AttendanceMetric::class);
    }
}
