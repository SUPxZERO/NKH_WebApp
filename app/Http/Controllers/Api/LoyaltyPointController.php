<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyPoint;
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
            'type' => ['required', 'in:earn,redeem,adjust'],
            'points' => ['required', 'integer'],
            'occurred_at' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        // Calculate new balance_after (simple last known + points)
        $last = LoyaltyPoint::where('customer_id', $data['customer_id'])
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->first();
        $prev = $last?->balance_after ?? 0;

        $lp = LoyaltyPoint::create([
            'customer_id' => $data['customer_id'],
            'type' => $data['type'],
            'points' => $data['points'],
            'balance_after' => $prev + $data['points'],
            'occurred_at' => $data['occurred_at'],
            'notes' => $data['notes'] ?? null,
        ]);

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

        $loyaltyPoint->update($data);
        // Recompute balance_after for this record relative to previous record
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
        $loyaltyPoint->update(['balance_after' => $base + $loyaltyPoint->points]);

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
