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
            'period_start' => 'required|date_format:Y-m-d',
            'period_end' => 'required|date_format:Y-m-d|after:period_start',
            'include_overtime' => 'nullable|boolean',
        ]);

        try {
            $payrolls = [];

            DB::transaction(function () use ($validated, &$payrolls) {
                foreach ($validated['employee_ids'] as $employeeId) {
                    // Check if payroll already exists for this period
                    $existing = Payroll::where('employee_id', $employeeId)
                        ->where('period_start', $validated['period_start'])
                        ->where('period_end', $validated['period_end'])
                        ->first();

                    if ($existing) {
                        $payrolls[] = $existing;
                        continue;
                    }

                    $employee = Employee::findOrFail($employeeId);

                    // Calculate payroll
                    $payroll = $this->payrollService->generatePayroll(
                        $employee,
                        Carbon::parse($validated['period_start']),
                        Carbon::parse($validated['period_end']),
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
            'employee_id' => 'required|exists:employees,id',
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        try {
            $query = Payroll::where('employee_id', $validated['employee_id']);

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
                        'period' => $payroll->period_start->format('M Y'),
                        'period_start' => $payroll->period_start->format('Y-m-d'),
                        'period_end' => $payroll->period_end->format('Y-m-d'),
                        'gross_pay' => $payroll->gross_pay,
                        'bonuses' => $payroll->bonuses,
                        'deductions' => $payroll->deductions,
                        'net_pay' => $payroll->net_pay,
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
}
