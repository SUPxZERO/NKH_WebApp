<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PromotionController extends Controller
{
    // GET /api/admin/promotions
    public function index(Request $request)
    {
        $query = Promotion::query();

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', (int) $request->is_active);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->boolean('expired', false)) {
            $query->whereNotNull('end_at')->where('end_at', '<', now());
        }

        $promotions = $query->orderBy('id', 'desc')->paginate($request->integer('per_page', 12));
        // Transform to expected frontend shape
        $promotions->getCollection()->transform(function (Promotion $p) {
            $arr = $p->toArray();
            $arr['discount_value'] = $p->value;
            $arr['start_date'] = optional($p->start_at)?->toISOString();
            $arr['end_date'] = optional($p->end_at)?->toISOString();
            return $arr;
        });
        return $promotions;
    }

    public function show(Promotion $promotion)
    {
        return [
            ...$promotion->toArray(),
            'discount_value' => $promotion->value,
            'start_date' => optional($promotion->start_at)?->toISOString(),
            'end_date' => optional($promotion->end_at)?->toISOString(),
        ];
    }

    public function store(Request $request): Promotion
    {
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'code' => ['nullable', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:percentage,fixed_amount,buy_x_get_y,free_item'],
            'discount_value' => ['required', 'numeric'],
            'min_order_amount' => ['nullable', 'numeric'],
            'max_discount_amount' => ['nullable', 'numeric'],
            'usage_limit' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active' => ['boolean'],
            'applicable_to' => ['nullable', 'in:all,categories,items'],
            'terms_conditions' => ['nullable', 'string'],
        ]);

        $promotion = Promotion::create([
            'location_id' => $data['location_id'] ?? null,
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'value' => $data['discount_value'],
            'min_order_amount' => $data['min_order_amount'] ?? null,
            'usage_limit' => $data['usage_limit'] ?? null,
            'start_at' => $data['start_date'] ?? null,
            'end_at' => $data['end_date'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return $promotion;
    }

    public function update(Request $request, Promotion $promotion): Promotion
    {
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'code' => ['nullable', 'string', 'max:100'],
            'name' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', 'in:percentage,fixed_amount,buy_x_get_y,free_item'],
            'discount_value' => ['nullable', 'numeric'],
            'min_order_amount' => ['nullable', 'numeric'],
            'max_discount_amount' => ['nullable', 'numeric'],
            'usage_limit' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active' => ['boolean'],
            'applicable_to' => ['nullable', 'in:all,categories,items'],
            'terms_conditions' => ['nullable', 'string'],
        ]);

        $promotion->update([
            'location_id' => $data['location_id'] ?? $promotion->location_id,
            'code' => $data['code'] ?? $promotion->code,
            'name' => $data['name'] ?? $promotion->name,
            'description' => $data['description'] ?? $promotion->description,
            'type' => $data['type'] ?? $promotion->type,
            'value' => $data['discount_value'] ?? $promotion->value,
            'min_order_amount' => $data['min_order_amount'] ?? $promotion->min_order_amount,
            'usage_limit' => $data['usage_limit'] ?? $promotion->usage_limit,
            'start_at' => $data['start_date'] ?? $promotion->start_at,
            'end_at' => $data['end_date'] ?? $promotion->end_at,
            'is_active' => $data['is_active'] ?? $promotion->is_active,
        ]);

        $promotion = $promotion->fresh();
        return [
            ...$promotion->toArray(),
            'discount_value' => $promotion->value,
            'start_date' => optional($promotion->start_at)?->toISOString(),
            'end_date' => optional($promotion->end_at)?->toISOString(),
        ];
    }

    public function destroy(Promotion $promotion): JsonResponse
    {
        $promotion->delete();
        return response()->json(['message' => 'Promotion deleted successfully.']);
    }

    // GET /api/admin/promotion-stats
    public function stats(): JsonResponse
    {
        // Minimal stats to satisfy the UI
        return response()->json([
            'total_usage' => 0,
            'total_savings' => 0,
        ]);
    }
}
