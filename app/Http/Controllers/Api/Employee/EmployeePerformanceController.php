<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Order;
use App\Models\EmployeeAchievement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeePerformanceController extends Controller
{
    /**
     * Get performance statistics for the authenticated employee.
     * 
     * Supports time period filtering via `period` query param:
     * - day: Current day
     * - week: Current week (default)
     * - month: Current month
     * - year: Current year
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        $employeeId = $user->employee?->id;
        
        // Early return if user has no employee profile
        if (!$employeeId) {
            return response()->json([
                'error' => 'No employee profile found',
                'hours_worked' => 0,
                'hours_goal' => 40,
                'earnings' => 0,
                'tips' => 0,
                'rating' => 0,
                'chart_data' => [],
                'rank_percentile' => 0,
                'achievements' => [],
                'comparison' => null,
            ], 200);
        }
        
        // 1. Time Period - Support dynamic filtering
        $period = $request->input('period', 'week');
        [$startDate, $endDate, $prevStartDate, $prevEndDate] = $this->getDateRange($period);
        
        // 2. Hours Worked (From completed shifts)
        $shifts = Shift::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('status', 'completed')
            ->get();
            
        $totalHours = $shifts->sum('calculated_hours');
        
        // Previous period hours for comparison
        $prevShifts = Shift::where('employee_id', $employeeId)
            ->whereBetween('date', [$prevStartDate, $prevEndDate])
            ->where('status', 'completed')
            ->get();
        $prevHours = $prevShifts->sum('calculated_hours');
        
        // 3. Chart Data (Hours per day - only for week view)
        $chartData = $this->buildChartData($shifts, $startDate, $period);

        // 4. Customer Rating (From feedback on orders served by this employee)
        $customerRating = DB::table('feedback')
            ->join('orders', 'feedback.order_id', '=', 'orders.id')
            ->where('orders.employee_id', $employeeId)
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->avg('feedback.rating') ?? 0;
            
        // Previous period rating for comparison
        $prevRating = DB::table('feedback')
            ->join('orders', 'feedback.order_id', '=', 'orders.id')
            ->where('orders.employee_id', $employeeId)
            ->whereBetween('orders.created_at', [$prevStartDate, $prevEndDate])
            ->avg('feedback.rating') ?? 0;

        // 5. Financials - Use actual employee hourly rate
        $hourlyRate = $user->employee?->hourly_rate ?? 15;
        $estimatedEarnings = $totalHours * $hourlyRate;
        $prevEarnings = $prevHours * $hourlyRate;
        
        // Tips: 5% of Total Sales handled by employee
        $totalSales = Order::where('employee_id', $employeeId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');
        $estimatedTips = $totalSales * 0.05;
        
        // 6. Rank Percentile - Calculate actual position among employees
        $rankPercentile = $this->calculateRankPercentile($employeeId);
        
        // 7. Hours Goal - From employee record
        $hoursGoal = $user->employee?->max_hours_per_week ?? 40;
        
        // 8. Achievements
        $achievements = $this->getAchievements($employeeId);
        
        // 9. Comparison data
        $comparison = [
            'hours_change' => round($totalHours - $prevHours, 2),
            'hours_change_percent' => $prevHours > 0 ? round((($totalHours - $prevHours) / $prevHours) * 100, 1) : 0,
            'earnings_change' => round($estimatedEarnings - $prevEarnings, 2),
            'earnings_change_percent' => $prevEarnings > 0 ? round((($estimatedEarnings - $prevEarnings) / $prevEarnings) * 100, 1) : 0,
            'rating_change' => round($customerRating - $prevRating, 1),
        ];

        return response()->json([
            'hours_worked' => round($totalHours, 2),
            'hours_goal' => $hoursGoal,
            'earnings' => round($estimatedEarnings, 2),
            'tips' => round($estimatedTips, 2),
            'rating' => round($customerRating, 1),
            'chart_data' => $chartData,
            'rank_percentile' => $rankPercentile,
            'achievements' => $achievements,
            'comparison' => $comparison,
            'period' => $period,
            'period_label' => $this->getPeriodLabel($period, $startDate, $endDate),
        ]);
    }
    
    /**
     * Get date range based on period selection.
     * Returns [startDate, endDate, prevStartDate, prevEndDate]
     */
    private function getDateRange(string $period): array
    {
        switch ($period) {
            case 'day':
                $startDate = Carbon::today();
                $endDate = Carbon::today()->endOfDay();
                $prevStartDate = Carbon::yesterday();
                $prevEndDate = Carbon::yesterday()->endOfDay();
                break;
            case 'month':
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
                $prevStartDate = Carbon::now()->subMonth()->startOfMonth();
                $prevEndDate = Carbon::now()->subMonth()->endOfMonth();
                break;
            case 'year':
                $startDate = Carbon::now()->startOfYear();
                $endDate = Carbon::now()->endOfYear();
                $prevStartDate = Carbon::now()->subYear()->startOfYear();
                $prevEndDate = Carbon::now()->subYear()->endOfYear();
                break;
            default: // week
                $startDate = Carbon::now()->startOfWeek();
                $endDate = Carbon::now()->endOfWeek();
                $prevStartDate = Carbon::now()->subWeek()->startOfWeek();
                $prevEndDate = Carbon::now()->subWeek()->endOfWeek();
        }
        
        return [$startDate, $endDate, $prevStartDate, $prevEndDate];
    }
    
    /**
     * Build chart data based on the period.
     */
    private function buildChartData($shifts, Carbon $startDate, string $period): array
    {
        if ($period === 'week') {
            // Daily breakdown for week
            $chartData = [];
            $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            foreach ($days as $index => $day) {
                $date = $startDate->copy()->addDays($index)->format('Y-m-d');
                $hours = $shifts->filter(fn($s) => $s->date->format('Y-m-d') === $date)->sum('calculated_hours');
                $chartData[] = ['name' => $day, 'hours' => (float)$hours];
            }
            return $chartData;
        }
        
        if ($period === 'month') {
            // Weekly breakdown for month
            $chartData = [];
            $currentDate = $startDate->copy();
            $weekNum = 1;
            while ($currentDate <= $startDate->copy()->endOfMonth()) {
                $weekStart = $currentDate->copy();
                $weekEnd = $currentDate->copy()->endOfWeek();
                if ($weekEnd > $startDate->copy()->endOfMonth()) {
                    $weekEnd = $startDate->copy()->endOfMonth();
                }
                $hours = $shifts->filter(fn($s) => $s->date >= $weekStart && $s->date <= $weekEnd)->sum('calculated_hours');
                $chartData[] = ['name' => 'W' . $weekNum, 'hours' => (float)$hours];
                $currentDate = $currentDate->copy()->addWeek()->startOfWeek();
                $weekNum++;
            }
            return $chartData;
        }
        
        if ($period === 'year') {
            // Monthly breakdown for year
            $chartData = [];
            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            foreach ($months as $index => $month) {
                $monthStart = Carbon::now()->startOfYear()->addMonths($index);
                $monthEnd = $monthStart->copy()->endOfMonth();
                $hours = $shifts->filter(fn($s) => $s->date >= $monthStart && $s->date <= $monthEnd)->sum('calculated_hours');
                $chartData[] = ['name' => $month, 'hours' => (float)$hours];
            }
            return $chartData;
        }
        
        // Day: hourly breakdown (simplified - just return the total)
        return [['name' => 'Today', 'hours' => (float)$shifts->sum('calculated_hours')]];
    }
    
    /**
     * Calculate employee's rank percentile based on average ratings.
     */
    private function calculateRankPercentile(int $employeeId): int
    {
        // Get all employees with their average ratings
        $allEmployeeRatings = DB::table('feedback')
            ->join('orders', 'feedback.order_id', '=', 'orders.id')
            ->select('orders.employee_id', DB::raw('AVG(feedback.rating) as avg_rating'))
            ->whereNotNull('orders.employee_id')
            ->groupBy('orders.employee_id')
            ->orderBy('avg_rating', 'asc')
            ->pluck('avg_rating', 'orders.employee_id');
        
        $totalEmployees = $allEmployeeRatings->count();
        
        if ($totalEmployees === 0) {
            return 50; // No data, assume middle
        }
        
        // Find this employee's position
        $rankedEmployees = $allEmployeeRatings->keys()->values();
        $currentRank = $rankedEmployees->search($employeeId);
        
        if ($currentRank === false) {
            return 50; // Employee has no ratings yet
        }
        
        // Percentile: what percent of employees are below this one
        return round((($currentRank + 1) / $totalEmployees) * 100);
    }
    
    /**
     * Get employee achievements.
     * Returns achievements from database if the table exists, otherwise empty array.
     */
    private function getAchievements(int $employeeId): array
    {
        // Check if achievements table exists (graceful fallback)
        if (!\Illuminate\Support\Facades\Schema::hasTable('employee_achievements')) {
            return [];
        }
        
        return EmployeeAchievement::where('employee_id', $employeeId)
            ->orderBy('earned_at', 'desc')
            ->get()
            ->map(fn($a) => [
                'code' => $a->achievement_code,
                'title' => $a->title,
                'description' => $a->description,
                'icon' => $a->icon,
                'earned_at' => $a->earned_at->toDateTimeString(),
            ])
            ->toArray();
    }
    
    /**
     * Get a human-readable label for the selected period.
     */
    private function getPeriodLabel(string $period, Carbon $startDate, Carbon $endDate): string
    {
        switch ($period) {
            case 'day':
                return $startDate->format('M j, Y');
            case 'month':
                return $startDate->format('F Y');
            case 'year':
                return $startDate->format('Y');
            default:
                return $startDate->format('M j') . ' - ' . $endDate->format('M j, Y');
        }
    }
}
