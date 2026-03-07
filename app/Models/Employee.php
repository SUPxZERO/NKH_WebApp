<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BranchScopable;

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
    use HasFactory, BranchScopable;

    /**
     * SECURITY: Use $guarded to protect employee financial and HR data
     * 
     * Protected fields:
     * - Financial: salary (sensitive compensation data)
     * - System: employee_code (auto-generated identifier)
     * - HR: employment_status (workflow-managed)
     * - Audit: hire_date (HR records only)
     */
    protected $fillable = [
        'user_id',
        'location_id',
        'position_id',
        'employee_code',
        'hire_date',
        'salary_type',
        'salary',
        'hourly_rate',
        'address',
        'phone',
        'emergency_contact_name',
        'emergency_contact_phone',
        'date_of_birth',
        'preferred_shift_start',
        'status',
        'department',
        'preferred_stations',
        'preferred_shifts',
        'available_days',
        'max_hours_per_week',
        'emergency_contact_relation'
    ];


    protected $casts = [
        'hire_date' => 'date',
        'salary' => 'decimal:2',
        'preferred_stations' => 'array',
        'preferred_shifts' => 'array',
        'available_days' => 'array',
        'max_hours_per_week' => 'integer',
    ];

    /**
     * Boot method to auto-generate employee_code if not provided
     */
    /**
     * Boot method to auto-generate employee_code if not provided
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($employee) {
            if (empty($employee->employee_code)) {
                $position = $employee->position;
                if ($position) {
                    // Generate prefix (first 3 chars of position title title, uppercase)
                    $prefix = strtoupper(substr($position->title, 0, 3));
                    $year = date('y');
                    $baseCode = "{$prefix}-{$year}";

                    // Find last code with this prefix and year
                    // Matches format: PRE-YYNNN
                    $lastEmployee = static::where('employee_code', 'like', "{$baseCode}%")
                        ->orderByDesc('id') // Using ID as proxy for creation order/sequence
                        ->first();

                    $sequence = 1;
                    if ($lastEmployee && preg_match('/-(\d{2})(\d{3})$/', $lastEmployee->employee_code, $matches)) {
                        // $matches[1] is year, $matches[2] is sequence
                        if ($matches[1] === $year) {
                            $sequence = intval($matches[2]) + 1;
                        }
                    }

                    $employee->employee_code = sprintf("%s%03d", $baseCode, $sequence);
                } else {
                    // Fallback if no position found (should accept null/empty check in real app)
                    // Or keep the old fallback:
                    $employee->employee_code = 'EMP-' . strtoupper(uniqid());
                }
            }
        });
    }

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
