<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    /**
     * Get all settings grouped by category (extracted from key prefix)
     */
    public function index(Request $request): JsonResponse
    {
        $locationId = $request->get('location_id');
        
        $query = Setting::query();
        
        if ($locationId) {
            $query->where(function($q) use ($locationId) {
                $q->where('location_id', $locationId)
                  ->orWhereNull('location_id');
            });
        } else {
            $query->whereNull('location_id');
        }
        
        $settings = $query->get()->map(function($setting) {
            // Extract category from key (e.g., "general.site_name" -> "general")
            $parts = explode('.', $setting->key, 2);
            return [
                'id' => $setting->id,
                'category' => $parts[0] ?? 'general',
                'key' => $setting->key,
                'label' => $parts[1] ?? $setting->key,
                'value' => $setting->value,
                'location_id' => $setting->location_id,
            ];
        })->groupBy('category');
        
        return response()->json(['data' => $settings]);
    }

    /**
     * Get setting by key
     */
    public function getByKey(string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->first();
        
        if (!$setting) {
            return response()->json(['message' => 'Setting not found'], 404);
        }
        
        return response()->json(['data' => $setting]);
    }

    /**
     * Update a setting
     */
    public function update(Request $request, Setting $setting): JsonResponse
    {
        $request->validate([
            'value' => 'required',
        ]);

        $setting->update([
            'value' => $request->value,
        ]);

        // Clear cache
        Cache::forget("setting.{$setting->key}");
        
        return response()->json([
            'message' => 'Setting updated successfully',
            'data' => $setting
        ]);
    }

    /**
     * Bulk update multiple settings
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        foreach ($request->settings as $settingData) {
            $setting = Setting::where('key', $settingData['key'])
                ->where(function($q) use ($request) {
                    if ($request->location_id) {
                        $q->where('location_id', $request->location_id);
                    } else {
                        $q->whereNull('location_id');
                    }
                })
                ->first();
            
            if ($setting) {
                $setting->update(['value' => $settingData['value']]);
                Cache::forget("setting.{$setting->key}");
            }
        }

        return response()->json([
            'message' => 'Settings updated successfully'
        ]);
    }

    /**
     * Create a new setting
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string|max:150',
            'value' => 'required',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        // Check for existing setting
        $exists = Setting::where('key', $request->key)
            ->where(function($q) use ($request) {
                if ($request->location_id) {
                    $q->where('location_id', $request->location_id);
                } else {
                    $q->whereNull('location_id');
                }
            })
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Setting already exists'
            ], 422);
        }

        $setting = Setting::create($request->all());
        
        return response()->json([
            'message' => 'Setting created successfully',
            'data' => $setting
        ], 201);
    }

    /**
     * Delete a setting
     */
    public function destroy(Setting $setting): JsonResponse
    {
        Cache::forget("setting.{$setting->key}");
        $setting->delete();
        
        return response()->json([
            'message' => 'Setting deleted successfully'
        ]);
    }
}
