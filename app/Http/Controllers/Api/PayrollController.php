<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\PayrollDetail;
use App\Models\Employee;
use App\Models\Attendance;
use App\Services\PayrollService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class PayrollController extends Controller
{
    protected $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * Generate payroll for employees
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'month' => 'nullable|date_format:Y-m',
            'period_start' => 'required_without:month|date_format:Y-m-d',
            'period_end' => 'required_without:month|date_format:Y-m-d|after:period_start',
            'include_overtime' => 'nullable|boolean',
        ]);

        try {
            if ($request->filled('month')) {
                $date = Carbon::parse($validated['month']);
                $startDate = $date->copy()->startOfMonth();
                $endDate = $date->copy()->endOfMonth();
            } else {
                $startDate = Carbon::parse($validated['period_start']);
                $endDate = Carbon::parse($validated['period_end']);
            }

            $payrolls = [];

            DB::transaction(function () use ($validated, &$payrolls, $startDate, $endDate) {
                foreach ($validated['employee_ids'] as $employeeId) {
                    // Check if payroll already exists for this period
                    $existing = Payroll::where('employee_id', $employeeId)
                        ->where('period_start', $startDate->format('Y-m-d'))
                        ->where('period_end', $endDate->format('Y-m-d'))
                        ->first();

                    if ($existing) {
                        $payrolls[] = $existing;
                        continue;
                    }

                    $employee = Employee::findOrFail($employeeId);

                    // Calculate payroll
                    $payroll = $this->payrollService->generatePayroll(
                        $employee,
                        $startDate,
                        $endDate,
                        $validated['include_overtime'] ?? false
                    );

                    $payrolls[] = $payroll;
                }
            });

            return response()->json([
                'message' => 'Payroll generated successfully',
                'payrolls' => collect($payrolls)->map(function ($payroll) {
                    return [
                        'id' => $payroll->id,
                        'employee_id' => $payroll->employee_id,
                        'period_start' => $payroll->period_start->format('Y-m-d'),
                        'period_end' => $payroll->period_end->format('Y-m-d'),
                        'gross_pay' => $payroll->gross_pay,
                        'bonuses' => $payroll->bonuses,
                        'deductions' => $payroll->deductions,
                        'net_pay' => $payroll->net_pay,
                        'status' => $payroll->status,
                    ];
                }),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate payroll',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Finalize/approve payroll
     */
    public function finalize(Request $request, Payroll $payroll): JsonResponse
    {
        try {
            DB::transaction(function () use ($payroll) {
                if ($payroll->status !== 'draft') {
                    throw new \Exception('Only draft payrolls can be finalized');
                }

                $payroll->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                // Log to employment history
                $payroll->employee->employmentHistory()->create([
                    'action' => 'payroll_finalized',
                    'previous_value' => ['status' => 'draft'],
                    'new_value' => ['status' => 'paid', 'paid_at' => now()->format('Y-m-d H:i:s')],
                    'changed_by_user_id' => auth()->id(),
                    'effective_date' => today(),
                ]);
            });

            return response()->json([
                'message' => 'Payroll finalized successfully',
                'data' => [
                    'id' => $payroll->id,
                    'status' => $payroll->status,
                    'paid_at' => $payroll->paid_at->format('Y-m-d H:i:s'),
                    'net_pay' => $payroll->net_pay,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to finalize payroll',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payroll history for employee
     */
    public function history(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|exists:employees,id', // Keep for backward compatibility if needed
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:employees,id',
            'month' => 'nullable|date_format:Y-m',
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        try {
            $query = Payroll::with('employee.user');

            if ($request->filled('employee_id')) {
                $query->where('employee_id', $validated['employee_id']);
            }

            if ($request->filled('employee_ids')) {
                $query->whereIn('employee_id', $validated['employee_ids']);
            }

            if ($request->filled('month')) {
                $date = Carbon::parse($validated['month']);
                $query->whereYear('period_start', $date->year)
                      ->whereMonth('period_start', $date->month);
            }

            if ($validated['from'] ?? null) {
                $query->where('period_start', '>=', $validated['from']);
            }

            if ($validated['to'] ?? null) {
                $query->where('period_end', '<=', $validated['to']);
            }

            $payrolls = $query->orderBy('period_start', 'desc')
                ->paginate($validated['per_page'] ?? 25);

            return response()->json([
                'data' => $payrolls->map(function ($payroll) {
                    return [
                        'id' => $payroll->id,
                        'employee_id' => $payroll->employee_id,
                        'employee_name' => $payroll->employee->user->name ?? 'Unknown',
                        'period' => $payroll->period_start->format('M Y'),
                        'period_start' => $payroll->period_start->format('Y-m-d'),
                        'period_end' => $payroll->period_end->format('Y-m-d'),
                        'base_pay' => (float) $payroll->base_pay ?? 0, // Ensure field exists
                        'overtime_pay' => (float) $payroll->overtime_pay ?? 0, // Ensure field exists
                        'taxes' => (float) $payroll->taxes ?? 0, // Ensure field exists
                        'gross_pay' => (float) $payroll->gross_pay,
                        'bonuses' => (float) $payroll->bonuses,
                        'deductions' => (float) $payroll->deductions,
                        'net_pay' => (float) $payroll->net_pay,
                        'status' => $payroll->status,
                        'paid_at' => $payroll->paid_at?->format('Y-m-d'),
                    ];
                }),
                'pagination' => [
                    'total' => $payrolls->total(),
                    'per_page' => $payrolls->perPage(),
                    'current_page' => $payrolls->currentPage(),
                    'last_page' => $payrolls->lastPage(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve history',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get detailed payroll information
     */
    public function details(Payroll $payroll): JsonResponse
    {
        try {
            $earnings = $payroll->details()->earnings()->get();
            $deductions = $payroll->details()->deductions()->get();

            return response()->json([
                'payroll_id' => $payroll->id,
                'employee_id' => $payroll->employee_id,
                'employee_name' => $payroll->employee->user->name,
                'period_start' => $payroll->period_start->format('Y-m-d'),
                'period_end' => $payroll->period_end->format('Y-m-d'),
                'earnings' => $earnings->map(function ($detail) {
                    return [
                        'description' => $detail->description,
                        'amount' => $detail->amount,
                        'percentage' => $detail->percentage,
                    ];
                }),
                'deductions' => $deductions->map(function ($detail) {
                    return [
                        'description' => $detail->description,
                        'amount' => $detail->amount,
                        'percentage' => $detail->percentage,
                    ];
                }),
                'totals' => [
                    'gross_pay' => $payroll->gross_pay,
                    'total_deductions' => $payroll->deductions,
                    'total_bonuses' => $payroll->bonuses,
                    'net_pay' => $payroll->net_pay,
                ],
                'status' => $payroll->status,
                'paid_at' => $payroll->paid_at?->format('Y-m-d H:i:s'),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve payroll details',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Add or update deduction/earning
     */
    public function addDetail(Request $request, Payroll $payroll): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:earning,deduction',
            'description' => 'required|string|max:150',
            'amount' => 'required|numeric|min:0',
            'percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            if ($payroll->status !== 'draft') {
                return response()->json([
                    'message' => 'Can only add details to draft payrolls',
                ], 422);
            }

            DB::transaction(function () use ($payroll, $validated) {
                $detail = PayrollDetail::create([
                    'payroll_id' => $payroll->id,
                    'type' => $validated['type'],
                    'description' => $validated['description'],
                    'amount' => $validated['amount'],
                    'percentage' => $validated['percentage'] ?? null,
                ]);

                // Recalculate payroll totals
                $this->payrollService->recalculatePayroll($payroll);
            });

            return response()->json([
                'message' => 'Detail added successfully',
                'data' => $payroll->fresh(),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add detail',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove detail from payroll
     */
    public function removeDetail(PayrollDetail $detail): JsonResponse
    {
        try {
            $payroll = $detail->payroll;

            if ($payroll->status !== 'draft') {
                return response()->json([
                    'message' => 'Can only remove details from draft payrolls',
                ], 422);
            }

            DB::transaction(function () use ($detail, $payroll) {
                $detail->delete();
                $this->payrollService->recalculatePayroll($payroll);
            });

            return response()->json([
                'message' => 'Detail removed successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to remove detail',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export payroll data as CSV
     */
    public function exportCSV(Request $request)
    {
        $validated = $request->validate([
            'month' => 'nullable|date_format:Y-m',
        ]);

        $query = Payroll::with('employee.user');

        if ($request->filled('month')) {
            $date = Carbon::parse($validated['month']);
            $query->whereYear('period_start', $date->year)
                  ->whereMonth('period_start', $date->month);
        }

        $payrolls = $query->orderBy('period_start', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="payroll-report-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($payrolls, $validated) {
            $file = fopen('php://output', 'w');
            
            // Title & Period
            fputcsv($file, ['Payroll Report']);
            if (isset($validated['month'])) {
                fputcsv($file, ['Period:', Carbon::parse($validated['month'])->format('F Y')]);
            } else {
                fputcsv($file, ['Period:', 'All Records']);
            }
            fputcsv($file, []);

            // Summary Stats
            $totalNetPay = $payrolls->sum('net_pay');
            $totalGrossPay = $payrolls->sum('gross_pay');
            $employeeCount = $payrolls->count();

            fputcsv($file, ['SUMMARY']);
            fputcsv($file, ['Total Employees', $employeeCount]);
            fputcsv($file, ['Total Gross Pay', '$' . number_format($totalGrossPay, 2)]);
            fputcsv($file, ['Total Net Pay', '$' . number_format($totalNetPay, 2)]);
            fputcsv($file, []);

            // Payroll Details
            fputcsv($file, ['PAYROLL DETAILS']);
            fputcsv($file, ['Employee', 'Period', 'Base Pay', 'Overtime', 'Bonuses', 'Deductions', 'Net Pay', 'Status']);
            
            foreach ($payrolls as $payroll) {
                fputcsv($file, [
                    $payroll->employee->user->name ?? 'Unknown',
                    $payroll->period_start->format('M Y'),
                    number_format($payroll->base_pay ?? 0, 2),
                    number_format($payroll->overtime_pay ?? 0, 2),
                    number_format($payroll->bonuses ?? 0, 2),
                    number_format($payroll->deductions ?? 0, 2),
                    number_format($payroll->net_pay ?? 0, 2),
                    ucfirst($payroll->status),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export payroll data as PDF
     */
    public function exportPDF(Request $request)
    {
        $validated = $request->validate([
            'month' => 'nullable|date_format:Y-m',
        ]);

        $query = Payroll::with('employee.user');

        if ($request->filled('month')) {
            $date = Carbon::parse($validated['month']);
            $query->whereYear('period_start', $date->year)
                  ->whereMonth('period_start', $date->month);
        }

        $payrolls = $query->orderBy('period_start', 'desc')->get();

        // Calculate summary stats
        $totalNetPay = $payrolls->sum('net_pay');
        $totalGrossPay = $payrolls->sum('gross_pay');
        $totalDeductions = $payrolls->sum('deductions');
        $totalBonuses = $payrolls->sum('bonuses');
        $employeeCount = $payrolls->count();
        $avgNetPay = $employeeCount > 0 ? $totalNetPay / $employeeCount : 0;

        $data = [
            'payrolls' => $payrolls->map(function ($payroll) {
                return [
                    'employee_name' => $payroll->employee->user->name ?? 'Unknown',
                    'period' => $payroll->period_start->format('M Y'),
                    'base_pay' => $payroll->base_pay ?? 0,
                    'overtime_pay' => $payroll->overtime_pay ?? 0,
                    'bonuses' => $payroll->bonuses ?? 0,
                    'deductions' => $payroll->deductions ?? 0,
                    'gross_pay' => $payroll->gross_pay ?? 0,
                    'net_pay' => $payroll->net_pay ?? 0,
                    'status' => $payroll->status,
                ];
            }),
            'summary' => [
                'total_employees' => $employeeCount,
                'total_gross_pay' => $totalGrossPay,
                'total_net_pay' => $totalNetPay,
                'total_deductions' => $totalDeductions,
                'total_bonuses' => $totalBonuses,
                'avg_net_pay' => $avgNetPay,
            ],
            'period' => isset($validated['month']) 
                ? Carbon::parse($validated['month'])->format('F Y')
                : 'All Records',
            'generated_at' => now()->format('F d, Y \a\t H:i'),
        ];

        $pdf = Pdf::loadView('exports.payroll-report', $data);
        return $pdf->download('payroll-report-' . date('Y-m-d') . '.pdf');
    }
}
