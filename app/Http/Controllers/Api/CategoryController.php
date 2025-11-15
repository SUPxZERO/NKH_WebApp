<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Category\StoreCategoryRequest;
use App\Http\Requests\Api\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    // GET /api/categories (public)
    public function index(): JsonResponse
    {
        $categories = Category::withoutGlobalScope('active')
            ->with([
                'translations',
                'children',
                'menuItems' => function($query) {
                    $query->withoutGlobalScope('active');
                }
            ])
            ->withCount([
                'menuItems' => function($query) {
                    $query->withoutGlobalScope('active');
                }
            ])
            ->orderBy('display_order')
            ->get();


        return response()->json([
            'status' => 'success',
            'message' => 'Categories retrieved successfully',
            'data' => CategoryResource::collection($categories)
        ]);
    }

    

    // GET /api/admin/category-stats (admin)
    public function stats(): JsonResponse
    {
        // Get counts including soft-deleted items
        $total = Category::withTrashed()->count();
        $active = Category::withTrashed()->where('is_active', true)->count();
        $parentCategories = Category::withTrashed()->parents()->count();
        $subCategories = Category::withTrashed()->whereNotNull('parent_id')->count();
        
        // Count all menu items including inactive ones
        $menuItemsCount = \App\Models\MenuItem::withoutGlobalScope('active')
            ->withTrashed()
            ->count();

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
        $category->load(['parent', 'children']);
        
        return new CategoryResource($category);
    }

    // GET /api/categories/{category}
    public function show(Category $category): CategoryResource
    {
        $category->load([
            'translations',
            'children.translations',
            'menuItems' => function($query) {
                $query->withoutGlobalScope('active');
            },
            'menuItems.translations',
            'children.menuItems' => function($query) {
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
        $category->load(['parent', 'children']);
        
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
        // Check if category has children
        if ($category->children()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with sub-categories. Please delete sub-categories first.'
            ], 422);
        }

        // Check if category has menu items
        if ($category->menuItems()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with menu items. Please move or delete menu items first.'
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

