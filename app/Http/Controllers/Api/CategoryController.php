<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Category\StoreCategoryRequest;
use App\Http\Requests\Api\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Responses\ApiResponse; // Sprint 2A
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    use ApiResponse; // Sprint 2A
    // GET /api/categories (public) and /api/admin/categories
    public function index(Request $request): JsonResponse
    {
        $search = $request->get('search', '');
        $status = $request->get('status', 'all');

        // CRITICAL FIX: Filter by location
        $locationId = $request->input('location_id');
        if (!$locationId) {
            $defaultLocation = \App\Models\Location::where('is_active', true)->first();
            $locationId = $defaultLocation ? $defaultLocation->id : 1;
        }

        // For customer menu: show only sub-categories (parent_id IS NOT NULL)
        $showSubCategoriesOnly = $request->boolean('sub_categories_only', false);

        // Flattened list for admin dropdowns (shows both parents and children)
        $flatList = $request->boolean('flat_list', false);

        $query = Category::query()
            ->where('location_id', $locationId)
            ->with(['translations'])
            ->withCount([
                'menuItems' => function ($query) use ($locationId) {
                    $query->withoutGlobalScope('active')
                        ->where('location_id', $locationId);
                }
            ])
            ->orderBy('display_order');

        // Show only sub-categories if requested (for customer menu filter)
        if ($showSubCategoriesOnly) {
            $query->whereNotNull('parent_id');
        } elseif ($flatList) {
            // Return ALL categories (Root + Children) flattened
            // Useful for dropdowns where you want to pick any category
            $query->with('parent.translations'); // Load parent for context if needed
        } else {
            // Only root categories for tree view (admin)
            $query->whereNull('parent_id')
                ->with([
                    'children',
                    'menuItems' => function ($query) use ($locationId) {
                        $query->withoutGlobalScope('active')
                            ->where('location_id', $locationId);
                    }
                ]);
        }

        // Status filter
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        // Search by slug or translated name
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('slug', 'like', "%{$search}%")
                    ->orWhereHas('translations', function ($t) use ($search) {
                        $t->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $categories = $query->get();

        return response()->json([
            'status' => 'success',
            'message' => 'Categories retrieved successfully',
            'data' => CategoryResource::collection($categories)
        ]);
    }



    // GET /api/admin/categories/hierarchy (admin)
    public function hierarchy(Request $request): JsonResponse
    {
        $search = $request->get('search', '');
        $status = $request->get('status', 'all');

        $query = Category::withoutGlobalScope('active')
            ->with([
                'translations',
                'children.translations',
                'children.children.translations',
                'children.children.children.translations',
                'children.children.children.children.translations',
                'menuItems' => function ($query) {
                    $query->withoutGlobalScope('active');
                }
            ])
            ->withCount([
                'menuItems' => function ($query) {
                    $query->withoutGlobalScope('active');
                }
            ])
            ->whereNull('parent_id') // Only root categories
            ->orderBy('display_order');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('slug', 'like', "%{$search}%")
                    ->orWhereHas('translations', function ($t) use ($search) {
                        $t->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Status filter
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $categories = $query->get();

        return response()->json([
            'status' => 'success',
            'message' => 'Category hierarchy retrieved successfully',
            'data' => CategoryResource::collection($categories)
        ]);
    }

    // GET /api/admin/category-stats (admin)
    public function stats(): JsonResponse
    {
        // Aggregate counts (no SoftDeletes used on these models/tables)
        $total = Category::query()->count();
        $active = Category::query()->where('is_active', true)->count();
        $parentCategories = Category::query()->whereNull('parent_id')->count();
        $subCategories = Category::query()->whereNotNull('parent_id')->count();

        // Count all menu items including inactive ones (ignore any non-existent global scopes)
        $menuItemsQuery = MenuItem::query();
        try {
            $menuItemsQuery = $menuItemsQuery->withoutGlobalScope('active');
        } catch (\Throwable $e) {
            // no-op if scope doesn't exist
        }
        $menuItemsCount = $menuItemsQuery->count();

        return response()->json([
            'total' => $total,
            'active' => $active,
            'parent_categories' => $parentCategories,
            'sub_categories' => $subCategories,
            'menu_items_total' => $menuItemsCount
        ]);
    }

    // POST /api/categories (role:admin,manager)
    public function store(StoreCategoryRequest $request): CategoryResource
    {
        $data = $request->validated();

        // Handle image upload if present
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('categories', 'public');
            $data['image'] = $imagePath;
        }

        $category = Category::create($data);

        // Save translation with explicit locale
        $category->translations()->create([
            'locale' => app()->getLocale(),
            'name' => $request->input('name'),
            'description' => $request->input('description') ?? '',
        ]);

        $category->load(['translations', 'parent', 'children']);

        return new CategoryResource($category);
    }

    // GET /api/categories/{category}
    public function show(Category $category): CategoryResource
    {
        $category->load([
            'translations',
            'children.translations',
            'menuItems' => function ($query) {
                $query->withoutGlobalScope('active');
            },
            'menuItems.translations',
            'children.menuItems' => function ($query) {
                $query->withoutGlobalScope('active');
            },
            'children.menuItems.translations'
        ]);

        return new CategoryResource($category);
    }

    // PUT /api/categories/{category} (role:admin,manager)
    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $data = $request->validated();

        // Handle image upload if present
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($category->image) {
                \Storage::disk('public')->delete($category->image);
            }
            $imagePath = $request->file('image')->store('categories', 'public');
            $data['image'] = $imagePath;
        }

        $category->update($data);

        // Update translation
        $translationData = [];
        if ($request->has('name'))
            $translationData['name'] = $request->input('name');
        if ($request->has('description'))
            $translationData['description'] = $request->input('description');

        if (!empty($translationData)) {
            $category->translations()->updateOrCreate(
                ['locale' => app()->getLocale()],
                $translationData
            );
        }

        $category->load(['translations', 'parent', 'children']);

        return new CategoryResource($category);
    }

    // PUT /api/admin/categories/{category}/toggle-status (admin)
    public function toggleStatus(Request $request, Category $category): JsonResponse
    {
        $category->update([
            'is_active' => $request->boolean('is_active')
        ]);

        return response()->json([
            'message' => 'Category status updated successfully',
            'is_active' => $category->is_active
        ]);
    }

    // DELETE /api/categories/{category} (role:admin,manager)
    public function destroy(Category $category): JsonResponse
    {
        // Check if category has children FIRST (before any deletion)
        if ($category->children()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with sub-categories. Please delete sub-categories first.'
            ], 422);
        }

        // Check if category has menu items (including soft-deleted ones)
        if ($category->menuItems()->withTrashed()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with menu items (including archived ones). Please permanently delete or move them first.'
            ], 422);
        }

        // Delete image if exists
        if ($category->image) {
            \Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}

