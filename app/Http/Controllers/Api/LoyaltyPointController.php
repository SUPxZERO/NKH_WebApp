<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\LoyaltyPoint;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LoyaltyPointController extends Controller
{
    // GET /api/admin/loyalty-points
    public function index(Request $request)
    {
        $query = LoyaltyPoint::query()->with(['customer.user', 'order']);

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->whereHas('customer.user', function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            });
        }

        // Date filters
        if ($request->filled('date')) {
            $query->whereDate('occurred_at', $request->date('date'));
        }
        if ($request->filled('start_date')) {
            $query->whereDate('occurred_at', '>=', $request->date('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('occurred_at', '<=', $request->date('end_date'));
        }

        return $query->orderBy('occurred_at', 'desc')
            ->paginate($request->integer('per_page', 12));
    }

    public function store(Request $request): LoyaltyPoint
    {
        $data = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'type' => ['required', 'in:earn,redeem,adjust'],
            'points' => ['required', 'integer'],
            'occurred_at' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        // Set default location_id if not provided
        $data['location_id'] = $data['location_id']
            ?? auth()->user()?->employee?->location_id
            ?? \App\Models\Location::first()?->id
            ?? 1;

        // Calculate new balance_after based on customer's current balance
        $customer = Customer::with('user')->findOrFail($data['customer_id']);
        $currentBalance = $customer->points_balance;
        $newBalance = $currentBalance + $data['points'];

        $lp = new LoyaltyPoint();
        $lp->customer_id = $data['customer_id'];
        $lp->location_id = $data['location_id'];
        $lp->type = $data['type'];
        $lp->notes = $data['notes'] ?? null;

        // Manually assign guarded fields with correct sign logic
        // Earn: Always positive
        // Redeem: Always negative
        // Adjust: Trust the input sign
        if ($data['type'] === 'earn') {
            $lp->points = abs($data['points']);
        } elseif ($data['type'] === 'redeem') {
            $lp->points = -abs($data['points']);
        } else {
            $lp->points = $data['points'];
        }

        $lp->occurred_at = $data['occurred_at'];
        $lp->balance_after = $newBalance;
        $lp->save();

        // Update customer's main balance
        $customer->points_balance = $newBalance;
        $customer->save();

        // Send notification to customer about points change
        try {
            if ($customer->user) {
                $notificationService = app(NotificationService::class);
                $points = abs($data['points']);
                $action = $data['type'] === 'earn' ? 'earned' : ($data['type'] === 'redeem' ? 'redeemed' : 'received');
                $emoji = $data['points'] > 0 ? '⭐' : '🔄';

                $notificationService->sendRewardNotification(
                    $customer->user,
                    $data['points'],
                    $data['notes'] ?? "You {$action} {$points} points! {$emoji}",
                    '/customer/loyalty'
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to send loyalty points notification: ' . $e->getMessage());
        }

        return $lp->fresh(['customer.user']);
    }

    public function update(Request $request, LoyaltyPoint $loyaltyPoint): LoyaltyPoint
    {
        $data = $request->validate([
            'type' => ['sometimes', 'in:earn,redeem,adjust'],
            'points' => ['sometimes', 'integer'],
            'occurred_at' => ['sometimes', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        // Manually update fields (including guarded ones)
        if (isset($data['type']))
            $loyaltyPoint->type = $data['type'];
        if (isset($data['notes']))
            $loyaltyPoint->notes = $data['notes'];
        if (isset($data['occurred_at']))
            $loyaltyPoint->occurred_at = $data['occurred_at'];

        // Handle Points Update with Sign Logic
        if (isset($data['points']) || isset($data['type'])) {
            $pointsVal = isset($data['points']) ? $data['points'] : $loyaltyPoint->points;
            $typeVal = isset($data['type']) ? $data['type'] : $loyaltyPoint->type;

            if ($typeVal === 'earn') {
                $loyaltyPoint->points = abs($pointsVal);
            } elseif ($typeVal === 'redeem') {
                $loyaltyPoint->points = -abs($pointsVal);
            } else {
                $loyaltyPoint->points = $pointsVal;
            }
        }

        // Note: Updating historical points is complex as it affects all subsequent balances.
        // For simple adjustments, we just save this record. Recalculating the entire chain 
        // would require a background job or more complex logic.
        // We will update the balance_after for THIS record relative to the one before it, 
        // but we won't cascade changes to future records to avoid timeouts on large datasets.

        if (isset($data['points']) || isset($data['occurred_at'])) {
            $prev = LoyaltyPoint::where('customer_id', $loyaltyPoint->customer_id)
                ->where(function ($q) use ($loyaltyPoint) {
                    $q->where('occurred_at', '<', $loyaltyPoint->occurred_at)
                        ->orWhere(function ($q2) use ($loyaltyPoint) {
                            $q2->where('occurred_at', $loyaltyPoint->occurred_at)
                                ->where('id', '<', $loyaltyPoint->id);
                        });
                })
                ->orderByDesc('occurred_at')
                ->orderByDesc('id')
                ->first();
            $base = $prev?->balance_after ?? 0;
            $loyaltyPoint->balance_after = $base + $loyaltyPoint->points;
        }

        $loyaltyPoint->save();

        return $loyaltyPoint->fresh(['customer.user']);
    }

    public function destroy(LoyaltyPoint $loyaltyPoint): JsonResponse
    {
        $loyaltyPoint->delete();
        return response()->json(['message' => 'Loyalty transaction deleted successfully.']);
    }

    // GET /api/admin/loyalty-stats
    public function stats(): JsonResponse
    {
        $earned = (int) LoyaltyPoint::where('points', '>', 0)->sum('points');
        $redeemed = (int) abs(LoyaltyPoint::where('points', '<', 0)->sum('points'));
        $activeCustomers = LoyaltyPoint::distinct('customer_id')->count('customer_id');

        return response()->json([
            'total_earned' => $earned,
            'total_redeemed' => $redeemed,
            'active_customers' => $activeCustomers,
        ]);
    }
}
