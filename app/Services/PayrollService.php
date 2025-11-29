<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollDetail;
use App\Models\Attendance;
use App\Models\AttendanceMetric;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollService
{
    /**
     * Generate payroll for employee for a period
     */
    public function generatePayroll(Employee $employee, Carbon $periodStart, Carbon $periodEnd, bool $includeOvertime = false): Payroll
    {
        return DB::transaction(function () use ($employee, $periodStart, $periodEnd, $includeOvertime) {
            // Calculate hours from attendance
            $attendances = Attendance::where('employee_id', $employee->id)
                ->whereBetween('clock_in_at', [$periodStart, $periodEnd])
                ->whereNotNull('clock_out_at')
                ->with('attendanceMetrics')
                ->get();

            $regularHours = 0;
            $overtimeHours = 0;

            foreach ($attendances as $attendance) {
                $hours = $attendance->clock_in_at->diffInHours($attendance->clock_out_at);
                
                // Get metrics
                $metric = $attendance->attendanceMetrics()->first();
                if ($metric) {
                    $overtimeHours += $metric->overtime_hours;
                    $regularHours += ($hours - $metric->overtime_hours);
                } else {
                    $regularHours += $hours;
                }
            }

            // Calculate gross pay
            $grossPay = 0;
            if ($employee->salary_type === 'hourly' && $employee->hourly_rate) {
                $grossPay = ($regularHours * $employee->hourly_rate);
                if ($includeOvertime) {
                    $grossPay += ($overtimeHours * $employee->hourly_rate * 1.5); // 1.5x for overtime
                }
            } else {
                // Monthly salary - prorate by days worked
                $daysInPeriod = $periodStart->diffInDays($periodEnd) + 1;
                $daysWorked = count($attendances);
                $grossPay = ($employee->salary / 30) * $daysWorked; // Assume 30 days per month
            }

            // Create payroll record
            $payroll = Payroll::create([
                'employee_id' => $employee->id,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'gross_pay' => $grossPay,
                'bonuses' => 0,
                'deductions' => 0,
                'net_pay' => $grossPay,
                'status' => 'draft',
            ]);

            // Add base salary as earning detail
            PayrollDetail::create([
                'payroll_id' => $payroll->id,
                'type' => 'earning',
                'description' => $employee->salary_type === 'hourly' ? 'Hourly Wages' : 'Monthly Salary',
                'amount' => $grossPay,
            ]);

            // Add overtime if applicable
            if ($includeOvertime && $overtimeHours > 0 && $employee->hourly_rate) {
                $overtimePay = $overtimeHours * $employee->hourly_rate * 0.5; // Additional 50%
                PayrollDetail::create([
                    'payroll_id' => $payroll->id,
                    'type' => 'earning',
                    'description' => 'Overtime Pay',
                    'amount' => $overtimePay,
                    'percentage' => 50,
                ]);

                $payroll->update(['gross_pay' => $grossPay + $overtimePay]);
            }

            return $payroll->fresh();
        });
    }

    /**
     * Recalculate payroll totals based on details
     */
    public function recalculatePayroll(Payroll $payroll): void
    {
        $earnings = $payroll->details()->earnings()->sum('amount');
        $deductions = $payroll->details()->deductions()->sum('amount');

        $bonuses = $payroll->details()
            ->earnings()
            ->where('description', 'like', '%bonus%')
            ->sum('amount');

        $netPay = $earnings - $deductions;

        $payroll->update([
            'gross_pay' => $earnings,
            'bonuses' => $bonuses,
            'deductions' => $deductions,
            'net_pay' => max(0, $netPay),
        ]);
    }

    /**
     * Apply standard tax withholding
     */
    public function applyTaxWithholding(Payroll $payroll, float $taxRate = 0.12): void
    {
        $grossPay = $payroll->gross_pay;
        $taxAmount = $grossPay * $taxRate;

        PayrollDetail::create([
            'payroll_id' => $payroll->id,
            'type' => 'deduction',
            'description' => 'Tax Withholding',
            'amount' => $taxAmount,
            'percentage' => ($taxRate * 100),
        ]);

        $this->recalculatePayroll($payroll);
    }

    /**
     * Apply health insurance deduction
     */
    public function applyHealthInsurance(Payroll $payroll, float $amount): void
    {
        PayrollDetail::create([
            'payroll_id' => $payroll->id,
            'type' => 'deduction',
            'description' => 'Health Insurance',
            'amount' => $amount,
        ]);

        $this->recalculatePayroll($payroll);
    }

    /**
     * Add bonus to payroll
     */
    public function addBonus(Payroll $payroll, string $description, float $amount): void
    {
        PayrollDetail::create([
            'payroll_id' => $payroll->id,
            'type' => 'earning',
            'description' => $description,
            'amount' => $amount,
        ]);

        $this->recalculatePayroll($payroll);
    }

    /**
     * Get payroll summary by month
     */
    public function getMonthlySummary(Employee $employee, Carbon $month): array
    {
        $payrolls = Payroll::where('employee_id', $employee->id)
            ->whereMonth('period_start', $month->month)
            ->whereYear('period_start', $month->year)
            ->get();

        $totalGrossPay = $payrolls->sum('gross_pay');
        $totalDeductions = $payrolls->sum('deductions');
        $totalBonuses = $payrolls->sum('bonuses');
        $totalNetPay = $payrolls->sum('net_pay');

        return [
            'employee_id' => $employee->id,
            'employee_name' => $employee->user->name,
            'month' => $month->format('Y-m'),
            'payroll_count' => $payrolls->count(),
            'total_gross_pay' => $totalGrossPay,
            'total_bonuses' => $totalBonuses,
            'total_deductions' => $totalDeductions,
            'total_net_pay' => $totalNetPay,
            'payrolls' => $payrolls->toArray(),
        ];
    }

    /**
     * Export payroll to array for PDF/CSV
     */
    public function exportPayroll(Payroll $payroll): array
    {
        return [
            'company_name' => config('app.name'),
            'employee_name' => $payroll->employee->user->name,
            'employee_code' => $payroll->employee->employee_code,
            'position' => $payroll->employee->position?->title,
            'period' => $payroll->period_start->format('Y-m-d') . ' to ' . $payroll->period_end->format('Y-m-d'),
            'earnings' => $payroll->details()->earnings()->get()->toArray(),
            'deductions' => $payroll->details()->deductions()->get()->toArray(),
            'gross_pay' => $payroll->gross_pay,
            'total_deductions' => $payroll->deductions,
            'total_bonuses' => $payroll->bonuses,
            'net_pay' => $payroll->net_pay,
            'status' => $payroll->status,
            'paid_at' => $payroll->paid_at?->format('Y-m-d'),
        ];
    }
}
