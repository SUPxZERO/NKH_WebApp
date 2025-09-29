<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Setting\UpdateSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locationId = $request->user()->default_location_id ?? $request->get('location_id');
        
        $settings = Setting::where('location_id', $locationId)
                          ->orWhereNull('location_id') // Global settings
                          ->get()
                          ->keyBy('key');
        
        // Return settings as key-value pairs
        $settingsArray = $settings->mapWithKeys(function ($setting) {
            return [$setting->key => $this->castValue($setting->value, $setting->type)];
        });
        
        return response()->json([
            'data' => $settingsArray,
            'location_id' => $locationId,
        ]);
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $data = $request->validated();
        $locationId = $request->user()->default_location_id ?? $data['location_id'] ?? null;
        
        foreach ($data['settings'] as $key => $value) {
            Setting::updateOrCreate(
                [
                    'key' => $key,
                    'location_id' => $locationId,
                ],
                [
                    'value' => is_array($value) ? json_encode($value) : $value,
                    'type' => $this->determineType($value),
                ]
            );
        }
        
        return response()->json([
            'message' => 'Settings updated successfully.',
            'data' => $data['settings'],
        ]);
    }
    
    private function castValue($value, $type)
    {
        return match ($type) {
            'boolean' => (bool) $value,
            'integer' => (int) $value,
            'float' => (float) $value,
            'array', 'json' => json_decode($value, true),
            default => $value,
        };
    }
    
    private function determineType($value): string
    {
        if (is_bool($value)) return 'boolean';
        if (is_int($value)) return 'integer';
        if (is_float($value)) return 'float';
        if (is_array($value)) return 'array';
        return 'string';
    }
}
