<?php

namespace App\Http\Controllers\Api\Telegram;

use App\Http\Controllers\Controller;
use App\Models\CustomerFavorite;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Sprint P16: Favorites Controller for Telegram Users
 * 
 * Allows Telegram users to manage their favorite menu items,
 * using their auto-created Customer record.
 */
class TelegramFavoritesController extends Controller
{
    /**
     * Get user's favorite menu items
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('telegram');
        
        if (!$user->customer_id) {
            return response()->json([
                'success' => false,
                'error' => 'Customer not found',
            ], 404);
        }

        $favorites = CustomerFavorite::where('customer_id', $user->customer_id)
            ->with(['menuItem' => function($query) {
                $query->with('translations', 'category');
            }])
            ->get()
            ->map(function ($favorite) {
                $item = $favorite->menuItem;
                if (!$item) return null;
                
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'description' => $item->description,
                    'price' => (float) $item->price,
                    'image_url' => $item->image_url,
                    'category' => $item->category?->name,
                    'is_available' => $item->isAvailable(),
                    'favorited_at' => $favorite->created_at->toISOString(),
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'success' => true,
            'data' => $favorites,
            'count' => $favorites->count(),
        ]);
    }

    /**
     * Add a menu item to favorites
     */
    public function store(Request $request, int $menuItemId): JsonResponse
    {
        $user = $request->user('telegram');
        
        if (!$user->customer_id) {
            return response()->json([
                'success' => false,
                'error' => 'Customer not found',
            ], 404);
        }

        // Verify menu item exists
        $menuItem = MenuItem::find($menuItemId);
        if (!$menuItem) {
            return response()->json([
                'success' => false,
                'error' => 'Menu item not found',
            ], 404);
        }

        // Check if already favorited
        $existing = CustomerFavorite::where('customer_id', $user->customer_id)
            ->where('menu_item_id', $menuItemId)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'Item already in favorites',
                'already_exists' => true,
            ]);
        }

        // Add to favorites
        CustomerFavorite::create([
            'customer_id' => $user->customer_id,
            'menu_item_id' => $menuItemId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Added to favorites',
            'data' => [
                'menu_item_id' => $menuItemId,
                'name' => $menuItem->name,
            ],
        ]);
    }

    /**
     * Remove a menu item from favorites
     */
    public function destroy(Request $request, int $menuItemId): JsonResponse
    {
        $user = $request->user('telegram');
        
        if (!$user->customer_id) {
            return response()->json([
                'success' => false,
                'error' => 'Customer not found',
            ], 404);
        }

        $deleted = CustomerFavorite::where('customer_id', $user->customer_id)
            ->where('menu_item_id', $menuItemId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'error' => 'Favorite not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Removed from favorites',
        ]);
    }

    /**
     * Check if a menu item is favorited
     */
    public function check(Request $request, int $menuItemId): JsonResponse
    {
        $user = $request->user('telegram');
        
        if (!$user->customer_id) {
            return response()->json([
                'success' => true,
                'is_favorite' => false,
            ]);
        }

        $isFavorite = CustomerFavorite::where('customer_id', $user->customer_id)
            ->where('menu_item_id', $menuItemId)
            ->exists();

        return response()->json([
            'success' => true,
            'is_favorite' => $isFavorite,
        ]);
    }

    /**
     * Toggle favorite status
     */
    public function toggle(Request $request, int $menuItemId): JsonResponse
    {
        $user = $request->user('telegram');
        
        if (!$user->customer_id) {
            return response()->json([
                'success' => false,
                'error' => 'Customer not found',
            ], 404);
        }

        $existing = CustomerFavorite::where('customer_id', $user->customer_id)
            ->where('menu_item_id', $menuItemId)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json([
                'success' => true,
                'is_favorite' => false,
                'message' => 'Removed from favorites',
            ]);
        }

        // Verify menu item exists before adding
        $menuItem = MenuItem::find($menuItemId);
        if (!$menuItem) {
            return response()->json([
                'success' => false,
                'error' => 'Menu item not found',
            ], 404);
        }

        CustomerFavorite::create([
            'customer_id' => $user->customer_id,
            'menu_item_id' => $menuItemId,
        ]);

        return response()->json([
            'success' => true,
            'is_favorite' => true,
            'message' => 'Added to favorites',
        ]);
    }
}
