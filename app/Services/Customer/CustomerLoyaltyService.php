<?php

declare(strict_types=1);

namespace App\Services\Customer;

use App\Models\Customer;
use App\Models\MenuItem;
use Illuminate\Support\Facades\DB;

class CustomerLoyaltyService
{
    /**
     * Get loyalty stats
     */
    public function getLoyaltyStats(Customer $customer): array
    {
        // Calculate points expiry (example logic)
        $expiringPoints = 0; // Implement actual expiring points logic if exists

        return [
            'balance' => $customer->points_balance,
            'lifetime_points' => $customer->loyaltyPoints()->where('points_awarded', '>', 0)->sum('points_awarded'),
            'tier' => $customer->customer_tier,
            'next_tier_progress' => $this->calculateNextTierProgress($customer),
            'expiring_points' => $expiringPoints,
        ];
    }

    /**
     * Get loyalty transaction history
     */
    public function getHistory(Customer $customer, int $limit = 50)
    {
        return $customer->loyaltyPoints()
            ->latest('occurred_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Calculate progress to next tier
     */
    private function calculateNextTierProgress(Customer $customer): array
    {
        $tiers = [
            'bronze' => 0,
            'silver' => 1000,
            'gold' => 5000,
            'platinum' => 10000,
        ];

        $currentPoints = $customer->points_balance;
        $currentTier = $customer->customer_tier;
        $nextTier = null;
        $targetInPoints = 0;

        // Find next tier
        $found = false;
        foreach ($tiers as $tier => $threshold) {
            if ($found) {
                $nextTier = $tier;
                $targetInPoints = $threshold;
                break;
            }
            if ($tier === $currentTier) {
                $found = true;
            }
        }

        if (!$nextTier) {
            return [
                'current_tier' => $currentTier,
                'next_tier' => null,
                'percentage' => 100,
            ];
        }

        $needed = max(0, $targetInPoints - $currentPoints);
        $progress = 100 - ($needed > 0 ? ($needed / $targetInPoints) * 100 : 0);

        return [
            'current_tier' => $currentTier,
            'next_tier' => $nextTier,
            'points_needed' => $needed,
            'percentage' => round($progress, 1),
        ];
    }

    /**
     * Get explicit user favorites (manual toggle)
     */
    public function getFavorites(Customer $customer)
    {
        // Assuming there's a favorites relationship or table
        // Implementation depends on how favorites are stored
        // Based on CustomerDashboardController logic inspection needed
        // For now, returning top ordered as favorites fallback if no explicit table

        return $customer->favoriteItems()
            ->with(['translations'])
            ->get();
    }
}
