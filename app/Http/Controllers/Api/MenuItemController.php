<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\MenuItem\StoreMenuItemRequest;
use App\Http\Requests\Api\MenuItem\UpdateMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = MenuItem::query()
                ->withoutGlobalScope('active')
                ->with(['translations', 'category.translations']);

            // Filter by category if provided
            if ($request->filled('category')) {
                $query->where('category_id', $request->integer('category'));
            }

            // Filter active/inactive items
            if ($request->boolean('active_only', true)) {
                $query->where('is_active', true);
            }

            // Search functionality
            if ($request->filled('search')) {
                $searchTerm = $request->input('search');
                $query->where(function($q) use ($searchTerm) {
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
                    'per_page' => $menuItems->perPage()
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
    public function store(StoreMenuItemRequest $request): MenuItemResource
    {
        $data = $request->validated();

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('menu_images', 'public');
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
        ]);

        return new MenuItemResource($menuItem->load(['translations']));
    }

    // GET /api/menu-items/{item}
    public function show(MenuItem $menuItem): MenuItemResource
    {
        return new MenuItemResource($menuItem->load(['translations', 'category']));
    }

    // POST /api/menu-items/{item} with _method=PUT (role:admin,manager)
    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): MenuItemResource
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

        $menuItem->update($data);

        return new MenuItemResource($menuItem->fresh()->load(['translations']));
    }

    // DELETE /api/menu-items/{item} (role:admin,manager)
    public function destroy(MenuItem $menuItem)
    {
        if ($menuItem->image_path) {
            Storage::disk('public')->delete($menuItem->image_path);
        }
        $menuItem->delete();
        return response()->json(['message' => 'Menu item deleted.']);
    }
}
