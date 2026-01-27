<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\MenuItem\StoreMenuItemRequest;
use App\Http\Requests\Api\MenuItem\UpdateMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Http\Responses\ApiResponse;
use App\Models\MenuItem;
use App\Services\CacheService; // Sprint 1: Caching
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    use ApiResponse;
    public function index(Request $request): JsonResponse
    {
        try {
            // Explicitly check for authenticated user (admin/staff)
            // This is needed because this route might be accessed publicly (no auth middleware)
            $user = auth('sanctum')->user();

            // Sprint 1: Use caching for simple menu list without filters
            // Admins ($user) always bypass cache to see inactive/draft items
            $hasFilters = $request->filled(['category', 'search']) || $request->boolean('active_only', false);

            if (!$hasFilters && !$user) {
                // Default to the first active location if not provided
                $locationId = $request->input('location_id');
                if (!$locationId) {
                    $defaultLocation = \App\Models\Location::where('is_active', true)->first();
                    $locationId = $defaultLocation ? $defaultLocation->id : 1;
                }

                // Use cached menu for better performance
                $allMenuItems = app(CacheService::class)->getMenu($locationId);

                // Manual pagination for cached collection
                $page = max((int) $request->input('page', 1), 1);
                $perPage = min(max((int) $request->input('per_page', 16), 1), 100);

                $paginatedItems = $allMenuItems->forPage($page, $perPage)->values();

                return response()->json([
                    'status' => 'success',
                    'data' => MenuItemResource::collection($paginatedItems),
                    'meta' => [
                        'current_page' => $page,
                        'last_page' => ceil($allMenuItems->count() / $perPage),
                        'total' => $allMenuItems->count(),
                        'per_page' => $perPage,
                        'cached' => true
                    ]
                ]);
            }

            // Fallback: Query with filters (non-cached)
            $query = MenuItem::query()
                ->withoutGlobalScope('active')
                ->with(['translations', 'category.translations']);

            // CRITICAL FIX: Filter by location
            $locationId = $request->input('location_id');
            if (!$locationId) {
                $defaultLocation = \App\Models\Location::where('is_active', true)->first();
                $locationId = $defaultLocation ? $defaultLocation->id : 1;
            }

            $query->where('location_id', $locationId);

            // Filter by category if provided
            if ($request->filled('category')) {
                $query->where('category_id', $request->integer('category'));
            }

            // Filter active/inactive items
            if ($request->boolean('active_only', false)) {
                $query->where('is_active', true);
            }

            // Search functionality
            if ($request->filled('search')) {
                $searchTerm = $request->input('search');
                $query->where(function ($q) use ($searchTerm) {
                    $q->whereHas('translations', function ($trans) use ($searchTerm) {
                        $trans->where('name', 'like', "%{$searchTerm}%")
                            ->orWhere('description', 'like', "%{$searchTerm}%");
                    })->orWhere('sku', 'like', "%{$searchTerm}%");
                });
            }

            // Sort by display order
            $query->orderBy('display_order');

            // Get pagination parameters with validation
            $perPage = min(max((int) $request->input('per_page', default: 16), 1), 100);

            $menuItems = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => MenuItemResource::collection($menuItems),
                'meta' => [
                    'current_page' => $menuItems->currentPage(),
                    'last_page' => $menuItems->lastPage(),
                    'total' => $menuItems->total(),
                    'per_page' => $menuItems->perPage(),
                    'cached' => false // Filtered query, not cached
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch menu items',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    // POST /api/menu-items (role:admin,manager)
    public function store(StoreMenuItemRequest $request): MenuItemResource|JsonResponse
    {
        $data = $request->validated();

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('menu_images', 'public');
        }

        // Check featured limit (max 4 items)
        $isFeatured = $data['is_featured'] ?? false;
        if ($isFeatured) {
            $featuredCount = MenuItem::where('location_id', $data['location_id'])
                ->where('is_featured', true)
                ->count();

            if ($featuredCount >= 4) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Maximum 4 featured items allowed. Please unfeature another item first.',
                    'featured_items' => MenuItem::where('location_id', $data['location_id'])
                        ->where('is_featured', true)
                        ->with('translations')
                        ->get(['id', 'slug', 'image_path', 'is_featured', 'featured_order', 'badge'])
                ], 422);
            }
        }

        $menuItem = MenuItem::create([
            'location_id' => $data['location_id'],
            'category_id' => $data['category_id'] ?? null,
            'sku' => $data['sku'] ?? null,
            'slug' => $data['slug'],
            'price' => $data['price'],
            'cost' => $data['cost'] ?? null,
            'image_path' => $imagePath,
            'is_popular' => $data['is_popular'] ?? false,
            'is_active' => $data['is_active'] ?? true,
            'display_order' => $data['display_order'] ?? 0,
            'is_featured' => $isFeatured,
            'badge' => $data['badge'] ?? null,
            // New comprehensive fields
            'prep_time' => $data['prep_time'] ?? null,
            'cook_time' => $data['cook_time'] ?? null,
            'serving_size' => $data['serving_size'] ?? null,
            'spice_level' => $data['spice_level'] ?? 0,
            'calories' => $data['calories'] ?? null,
            'nutrition' => $data['nutrition'] ?? null,
            'ingredients' => $data['ingredients'] ?? null,
            'allergens' => $data['allergens'] ?? null,
            'dietary_tags' => $data['dietary_tags'] ?? null,
            'availability_status' => $data['availability_status'] ?? 'available',
            'availability_note' => $data['availability_note'] ?? null,
        ]);

        // Save translation
        $menuItem->translations()->create([
            'locale' => app()->getLocale(),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
        ]);

        // Invalidate cache
        app(CacheService::class)->invalidateMenu($menuItem->location_id);

        return new MenuItemResource($menuItem->load(['translations']));
    }

    // GET /api/menu-items/{item}
    public function show(MenuItem $menuItem): MenuItemResource
    {
        // Load all related data for the detail view
        $menuItem->load(['translations', 'category.translations', 'recipe']);

        return new MenuItemResource($menuItem);
    }

    // POST /api/menu-items/{item} with _method=PUT (role:admin,manager)
    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): MenuItemResource|JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($menuItem->image_path) {
                Storage::disk('public')->delete($menuItem->image_path);
            }
            $data['image_path'] = $request->file('image')->store('menu_images', 'public');
        }

        // Map image file input to image_path column
        unset($data['image']);

        // Separate translation fields
        $translationFields = ['name', 'description'];
        $modelData = array_diff_key($data, array_flip($translationFields));

        // Explicitly handle is_active if present (for toggle status)
        if ($request->has('is_active')) {
            $modelData['is_active'] = $request->boolean('is_active');
        }

        // Handle is_featured with limit check
        if ($request->has('is_featured')) {
            $isFeatured = $request->boolean('is_featured');

            // Only check limit when setting to featured (not when unfeaturing)
            if ($isFeatured && !$menuItem->is_featured) {
                $featuredCount = MenuItem::where('location_id', $menuItem->location_id)
                    ->where('is_featured', true)
                    ->where('id', '!=', $menuItem->id)
                    ->count();

                if ($featuredCount >= 4) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Maximum 4 featured items allowed. Please unfeature another item first.',
                        'featured_items' => MenuItem::where('location_id', $menuItem->location_id)
                            ->where('is_featured', true)
                            ->with('translations')
                            ->get(['id', 'slug', 'image_path', 'is_featured', 'featured_order', 'badge'])
                    ], 422);
                }
            }

            $modelData['is_featured'] = $isFeatured;
        }

        // Handle badge
        if ($request->has('badge')) {
            $modelData['badge'] = $request->input('badge');
        }

        $menuItem->update($modelData);

        // Update translation
        $translationData = [];
        if ($request->has('name'))
            $translationData['name'] = $request->input('name');
        if ($request->has('description'))
            $translationData['description'] = $request->input('description');

        if (!empty($translationData)) {
            $menuItem->translations()->updateOrCreate(
                ['locale' => app()->getLocale()],
                $translationData
            );
        }

        // Invalidate cache
        app(CacheService::class)->invalidateMenu($menuItem->location_id);

        return new MenuItemResource($menuItem->fresh()->load(['translations']));
    }

    // DELETE /api/menu-items/{item} (role:admin,manager)
    public function destroy(MenuItem $menuItem)
    {
        // Check if item has existing orders - inform user but still soft delete
        $orderCount = $menuItem->orderItems()->count();

        if ($menuItem->image_path) {
            Storage::disk('public')->delete($menuItem->image_path);
        }

        // Soft delete the item (SoftDeletes trait is used)
        $menuItem->delete();

        // Invalidate cache
        app(CacheService::class)->invalidateMenu($menuItem->location_id);

        $message = 'Menu item deleted.';
        if ($orderCount > 0) {
            $message = "Menu item archived (has {$orderCount} historical orders).";
        }

        return response()->json(['message' => $message]);
    }
}
