<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Payroll;
use App\Models\Shift;
use App\Models\TimeOffBalance;
use App\Models\UserNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeDashboardController extends Controller
{
    /**
     * Get dashboard statistics for the authenticated employee
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();
        
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();
        
        // Calculate hours this week
        $hoursThisWeek = 0;
        $hoursThisMonth = 0;
        
        if ($employee) {
            // Get attendance records for hours calculation
            $weeklyAttendance = Attendance::where('employee_id', $employee->id)
                ->whereBetween('clock_in_at', [$startOfWeek, $endOfWeek])
                ->get();
            
            foreach ($weeklyAttendance as $record) {
                if ($record->clock_out_at) {
                    $hoursThisWeek += Carbon::parse($record->clock_in_at)
                        ->diffInMinutes(Carbon::parse($record->clock_out_at)) / 60;
                }
            }
            
            $monthlyAttendance = Attendance::where('employee_id', $employee->id)
                ->whereBetween('clock_in_at', [$startOfMonth, $endOfMonth])
                ->get();
            
            foreach ($monthlyAttendance as $record) {
                if ($record->clock_out_at) {
                    $hoursThisMonth += Carbon::parse($record->clock_in_at)
                        ->diffInMinutes(Carbon::parse($record->clock_out_at)) / 60;
                }
            }
        }
        
        // Get time off balances
        $vacationBalance = 0;
        $sickBalance = 0;
        $personalBalance = 0;
        
        if ($employee) {
            $currentYear = Carbon::now()->year;
            $balance = TimeOffBalance::where('employee_id', $employee->id)
                ->where('year', $currentYear)
                ->first();
            
            if ($balance) {
                // Convert hours to days (assuming 8-hour workday)
                $vacationBalance = round(($balance->vacation_hours_available - $balance->vacation_hours_used) / 8, 1);
                $sickBalance = round(($balance->sick_hours_available - $balance->sick_hours_used) / 8, 1);
                $personalBalance = round(($balance->personal_hours_available - $balance->personal_hours_used) / 8, 1);
            }
        }
        
        // Get next shift
        $nextShift = null;
        if ($employee) {
            $shift = Shift::where('employee_id', $employee->id)
                ->where('date', '>=', $today->format('Y-m-d'))
                ->orderBy('date')
                ->orderBy('start_time')
                ->with('location')
                ->first();
            
            if ($shift) {
                $nextShift = [
                    'date' => $shift->date,
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                    'location_name' => $shift->location?->name ?? 'Main Location',
                ];
            }
        }
        
        // Recent earnings
        $recentEarnings = 0;
        if ($employee) {
            $recentPayroll = Payroll::where('employee_id', $employee->id)
                ->where('period_end', '>=', Carbon::now()->subDays(30))
                ->sum('gross_pay');
            $recentEarnings = $recentPayroll;
        }
        
        // Today's orders processed (for POS employees)
        $ordersToday = Order::whereDate('ordered_at', $today)->count();
        
        // Pending tasks count
        $pendingTasks = 0;
        
        // Unread notifications
        $unreadNotifications = UserNotification::where('user_id', $user->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'hours_this_week' => round($hoursThisWeek, 1),
                'hours_this_month' => round($hoursThisMonth, 1),
                'vacation_balance' => $vacationBalance,
                'sick_balance' => $sickBalance,
                'personal_balance' => $personalBalance,
                'next_shift' => $nextShift,
                'recent_earnings' => $recentEarnings,
                'orders_today' => $ordersToday,
                'pending_tasks' => $pendingTasks,
                'unread_notifications' => $unreadNotifications,
                'employee_code' => $employee?->employee_code ?? 'N/A',
                'position' => $employee?->position?->title ?? 'Employee',
            ],
        ]);
    }

    /**
     * Get upcoming shifts for the employee
     */
    public function upcomingShifts(Request $request): JsonResponse
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();
        $days = $request->input('days', 7);
        
        if (!$employee) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }
        
        $shifts = Shift::where('employee_id', $employee->id)
            ->where('date', '>=', Carbon::today()->format('Y-m-d'))
            ->where('date', '<=', Carbon::today()->addDays($days)->format('Y-m-d'))
            ->orderBy('date')
            ->orderBy('start_time')
            ->with('location')
            ->get()
            ->map(function ($shift) {
                return [
                    'id' => $shift->id,
                    'date' => $shift->date,
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                    'location_name' => $shift->location?->name ?? 'Main Location',
                    'status' => $shift->status ?? 'scheduled',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $shifts,
        ]);
    }

    /**
     * Get announcements for employees
     */
    public function announcements(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get system announcements from notifications
        $announcements = UserNotification::where('user_id', $user->id)
            ->where('type', 'system')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'read' => $notification->read,
                    'created_at' => $notification->created_at,
                    'action_url' => $notification->action_url,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }
}
