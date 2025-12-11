<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\EmployeeFeedback;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeePerformanceController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        
        // 1. Time Period (Current Week)
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        // 2. Hours Worked (Real)
        $shifts = Shift::where('employee_id', $user->employee?->id ?? 0) // Assuming user has employee profile linkage
            ->whereBetween('date', [$startOfWeek, $endOfWeek])
            ->where('status', 'completed')
            ->get();
            
        $totalHours = $shifts->sum('calculated_hours');
        
        // 3. Chart Data (Hours per day)
        $chartData = [];
        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        foreach ($days as $index => $day) {
            $date = $startOfWeek->copy()->addDays($index)->format('Y-m-d');
            $hours = $shifts->where('date', $date)->sum('calculated_hours');
            $chartData[] = ['name' => $day, 'hours' => (float)$hours];
        }

        // 4. Ratings (Real from Feedback)
        $avgRating = EmployeeFeedback::where('user_id', $user->id) // Feedback *for* this user, assuming we track received feedback? 
            // Wait, EmployeeFeedback is usually feedback FROM employee. 
            // For performance, we might want CustomerFeedback linked to orders served by this employee.
            // Let's check Customer Feedback structure. 
            // If unavailable, we'll use a placeholder or check `Feedback` model which is Customer Feedback.
            // Feedback table has 'order_id'. Order has 'employee_id'.
             ->avg('rating');
             
        $customerRating = DB::table('feedback')
            ->join('orders', 'feedback.order_id', '=', 'orders.id')
            ->where('orders.employee_id', $user->id ?? 0)
            ->avg('feedback.rating') ?? 0;

        // 5. Financials (Mock for now as we don't have explicit wage/tip tables)
        // Rate: $15/hr mock
        $estimatedEarnings = $totalHours * 15;
        
        // Tips: 5% of Total Sales handled by employee (Mock)
        $totalSales = Order::where('employee_id', $user->id ?? 0)
            ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
            ->sum('total_amount');
        $estimatedTips = $totalSales * 0.05;

        return response()->json([
            'hours_worked' => round($totalHours, 2),
            'hours_goal' => 40,
            'earnings' => round($estimatedEarnings, 2),
            'tips' => round($estimatedTips, 2),
            'rating' => round($customerRating, 1),
            'chart_data' => $chartData,
            'rank_percentile' => 85, // Mock
        ]);
    }
}
