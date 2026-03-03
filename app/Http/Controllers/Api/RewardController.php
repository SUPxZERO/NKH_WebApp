<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\TelegramAwareAuth;
use App\Models\Customer;
use App\Models\LoyaltyPoint;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RewardController extends Controller
{
    use TelegramAwareAuth;

    /**
     * Get available rewards catalog
     */
    public function index(Request $request): JsonResponse
    {
        // Get customer from auth or Telegram session
        $customer = $this->getCurrentCustomer($request);
        $customerPoints = $customer ? $customer->points_balance : 0;

        // Define rewards catalog
        $rewards = [
            [
                'id' => 1,
                'title' => 'Free Appetizer',
                'description' => 'Get any appetizer for free with your next order',
                'points_required' => 100,
                'type' => 'free_item',
                'value' => '$8.99',
                'icon' => '🍟',
                'category' => 'food',
                'can_redeem' => $customerPoints >= 100,
            ],
            [
                'id' => 2,
                'title' => '20% Off',
                'description' => 'Get 20% off your entire order',
                'points_required' => 200,
                'type' => 'discount',
                'value' => '20%',
                'icon' => '🎫',
                'category' => 'discount',
                'can_redeem' => $customerPoints >= 200,
            ],
            [
                'id' => 3,
                'title' => 'Free Delivery',
                'description' => 'Free delivery on your next 3 orders',
                'points_required' => 150,
                'type' => 'upgrade',
                'value' => '$4.99',
                'icon' => '🚗',
                'category' => 'delivery',
                'can_redeem' => $customerPoints >= 150,
            ],
            [
                'id' => 4,
                'title' => 'Free Dessert',
                'description' => 'Complimentary dessert with your meal',
                'points_required' => 120,
                'type' => 'free_item',
                'value' => '$6.99',
                'icon' => '🍰',
                'category' => 'food',
                'can_redeem' => $customerPoints >= 120,
            ],
            [
                'id' => 5,
                'title' => 'Free Drink',
                'description' => 'Any beverage on the house',
                'points_required' => 50,
                'type' => 'free_item',
                'value' => '$3.99',
                'icon' => '🥤',
                'category' => 'food',
                'can_redeem' => $customerPoints >= 50,
            ],
            [
                'id' => 6,
                'title' => '10% Off Next 5 Orders',
                'description' => 'Save 10% on your next 5 orders',
                'points_required' => 300,
                'type' => 'discount',
                'value' => '10%',
                'icon' => '💳',
                'category' => 'discount',
                'can_redeem' => $customerPoints >= 300,
            ],
            [
                'id' => 7,
                'title' => 'VIP Table Reservation',
                'description' => 'Priority seating for your next visit',
                'points_required' => 250,
                'type' => 'upgrade',
                'value' => 'Premium',
                'icon' => '👑',
                'category' => 'vip',
                'can_redeem' => $customerPoints >= 250,
            ],
            [
                'id' => 8,
                'title' => 'Free Main Course',
                'description' => 'Choose any main course for free',
                'points_required' => 500,
                'type' => 'free_item',
                'value' => '$15.99',
                'icon' => '🍝',
                'category' => 'food',
                'can_redeem' => $customerPoints >= 500,
            ],
        ];

        return response()->json([
            'data' => $rewards,
            'customer_points' => $customerPoints,
        ]);
    }

    /**
     * Redeem a reward
     */
    public function redeem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reward_id' => 'required|integer',
            'points_required' => 'required|integer|min:1',
            'reward_title' => 'required|string',
        ]);

        // Get customer from auth or Telegram session
        $customer = $this->getCurrentCustomer($request);
        
        if (!$customer) {
            return response()->json([
                'message' => 'Customer profile not found. Please login or use Telegram.'
            ], 401);
        }

        // Check if customer has enough points
        if ($customer->points_balance < $validated['points_required']) {
            return response()->json([
                'message' => 'Insufficient points',
                'required' => $validated['points_required'],
                'available' => $customer->points_balance,
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Get last loyalty point record for balance tracking
            $lastPoint = LoyaltyPoint::where('customer_id', $customer->id)
                ->orderBy('occurred_at', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $previousBalance = $lastPoint ? $lastPoint->balance_after : $customer->points_balance;

            // Create redemption record (negative points)
            $redemption = LoyaltyPoint::create([
                'customer_id' => $customer->id,
                'location_id' => $customer->preferred_location_id ?? 1,
                'type' => 'redeem',
                'points' => -$validated['points_required'], // Negative for redemption
                'balance_after' => $previousBalance - $validated['points_required'],
                'occurred_at' => now(),
                'notes' => "Redeemed: {$validated['reward_title']}",
            ]);

            // Update customer's points balance
            $customer->points_balance -= $validated['points_required'];
            $customer->save();

            DB::commit();

            // Send notification about reward redemption (only if customer has linked User)
            if ($customer->user) {
                try {
                    $notificationService = app(NotificationService::class);
                    $notificationService->sendRewardNotification(
                        $customer->user,
                        -$validated['points_required'],
                        "You redeemed: {$validated['reward_title']}! Use code: " . strtoupper(substr(md5($redemption->id . time()), 0, 8)),
                        '/customer/loyalty'
                    );
                } catch (\Exception $e) {
                    \Log::warning('Failed to send reward redemption notification: ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Reward redeemed successfully!',
                'data' => [
                    'redemption_id' => $redemption->id,
                    'points_deducted' => $validated['points_required'],
                    'new_balance' => $customer->points_balance,
                    'reward_title' => $validated['reward_title'],
                    'redemption_code' => strtoupper(substr(md5($redemption->id . time()), 0, 8)),
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to redeem reward',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get customer's redemption history
     */
    public function history(Request $request): JsonResponse
    {
        // Get customer from auth or Telegram session
        $customer = $this->getCurrentCustomer($request);
        
        if (!$customer) {
            return response()->json([
                'message' => 'Customer profile not found. Please login or use Telegram.'
            ], 401);
        }

        $redemptions = LoyaltyPoint::where('customer_id', $customer->id)
            ->where('type', 'redeem')
            ->orderBy('occurred_at', 'desc')
            ->get()
            ->map(function ($redemption) {
                return [
                    'id' => $redemption->id,
                    'reward' => $redemption->notes,
                    'points_used' => abs($redemption->points),
                    'redeemed_at' => $redemption->occurred_at->toISOString(),
                    'balance_after' => $redemption->balance_after,
                ];
            });

        return response()->json([
            'data' => $redemptions,
        ]);
    }
}
