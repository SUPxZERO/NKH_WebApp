<?php

namespace App\Http\Controllers\Api\Telegram;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Location;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;

class TelegramMenuController extends Controller
{
    /**
     * Get categories for Telegram bot
     */
    public function categories(): JsonResponse
    {
        $categories = Category::active()
            ->with('translations')
            ->orderBy('display_order')
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'image' => $category->image,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get menu items for a category
     */
    public function items(int $categoryId): JsonResponse
    {
        $items = MenuItem::active()
            ->where('category_id', $categoryId)
            ->with('translations')
            ->orderBy('name')
            ->get()
            ->map(function ($item) {
                return $this->formatItem($item);
            });

        return response()->json([
            'success' => true,
            'data' => $items,
            'category_id' => $categoryId,
        ]);
    }

    /**
     * Get paginated menu items
     */
    public function itemsPaginated(int $categoryId, int $page = 1, int $perPage = 10): JsonResponse
    {
        $query = MenuItem::active()
            ->where('category_id', $categoryId)
            ->with('translations')
            ->orderBy('name');

        $total = $query->count();
        $items = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->map(function ($item) {
                return $this->formatItem($item);
            });

        return response()->json([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'has_more' => ($page * $perPage) < $total,
            ],
            'category_id' => $categoryId,
        ]);
    }

    /**
     * Get single item detail
     */
    public function itemDetail(int $itemId): JsonResponse
    {
        $item = MenuItem::active()
            ->with(['category', 'translations'])
            ->find($itemId);

        if (!$item) {
            return response()->json([
                'success' => false,
                'error' => 'Item not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatItem($item, true),
        ]);
    }

    /**
     * Get locations
     */
    public function locations(): JsonResponse
    {
        $locations = Location::active()->get()
            ->map(function ($location) {
                return [
                    'id' => $location->id,
                    'name' => $location->name,
                    'address' => trim(($location->address_line1 ?? '') . ($location->address_line2 ? ', ' . $location->address_line2 : '')),
                    'phone' => $location->phone,
                    'latitude' => $location->latitude,
                    'longitude' => $location->longitude,
                    'is_open' => $location->is_active,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $locations,
        ]);
    }

    /**
     * Format item for Telegram response
     */
    private function formatItem(MenuItem $item, bool $includeDetails = false): array
    {
        $data = [
            'id' => $item->id,
            'name' => $item->name,
            'slug' => $item->slug,
            'price' => (float) $item->price,
            'image' => $item->image_path ? asset(ltrim(str_replace('\\', '/', $item->image_path), '/')) : null,
            'is_available' => $item->is_active,
        ];

        if ($includeDetails) {
            $data['description'] = $item->description;
            $data['calories'] = $item->calories;
            $data['prep_time'] = $item->prep_time;
            $data['cook_time'] = $item->cook_time;
            $data['dietary_tags'] = $item->dietary_tags ?? [];
            $data['allergens'] = $item->allergens ?? [];
        }

        return $data;
    }
}
