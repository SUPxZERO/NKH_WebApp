<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * PublicSettingsController
 *
 * AUDIT FIX: Exposes a minimal, pre-approved set of pricing settings to
 * unauthenticated clients (guest cart, customer ordering flow). Only safe,
 * non-sensitive keys are whitelisted — never business credentials or secrets.
 */
class PublicSettingsController extends Controller
{
    /**
     * Keys that are safe to expose to unauthenticated requests.
     */
    private const ALLOWED_KEYS = [
        'tax_rate',
        'delivery_fee',
        'min_order_amount',
        'free_delivery_threshold',
        'currency',
    ];

    /**
     * GET /api/public/settings/pricing?location_id=1
     *
     * Returns pricing-relevant settings for the given location.
     * Falls back to global settings (location_id IS NULL) if no location-specific
     * setting is found, then falls back to safe hardcoded defaults.
     */
    public function pricing(Request $request): JsonResponse
    {
        $locationId = (int) $request->query('location_id', 0);

        // Fetch only the allowed keys for the requested location (or global)
        $settings = Setting::whereIn('key', self::ALLOWED_KEYS)
            ->where(function ($q) use ($locationId) {
                $q->where('location_id', $locationId)
                    ->orWhereNull('location_id');
            })
            ->orderByRaw('location_id IS NULL ASC') // location-specific first
            ->get()
            ->keyBy('key');

        // Build response with safe defaults
        $pricing = [
            'tax_rate' => (float) ($settings->get('tax_rate')?->value ?? 0.10),
            'delivery_fee' => (float) ($settings->get('delivery_fee')?->value ?? 2.50),
            'min_order_amount' => (float) ($settings->get('min_order_amount')?->value ?? 0),
            'free_delivery_threshold' => (float) ($settings->get('free_delivery_threshold')?->value ?? 0),
            'currency' => (string) ($settings->get('currency')?->value ?? 'USD'),
        ];

        return response()->json([
            'data' => $pricing,
            'location_id' => $locationId ?: null,
        ]);
    }
}
