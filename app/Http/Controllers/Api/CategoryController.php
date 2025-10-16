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
    public function index(): AnonymousResourceCollection
    {
        \Log::info('Fetching categories');
        
        $categories = Category::query()
            ->with(['translations'])
            ->get();
            
        \Log::info('Categories found: ' . $categories->count());
        
        return CategoryResource::collection($categories);
    }

    // GET /api/admin/categories/hierarchy (admin)
    public function hierarchy(Request $request): JsonResponse
    {
        $query = Category::query()
            ->with(['translations', 'children', 'parent'])
            ->withCount('menuItems');

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->whereHas('translations', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Get root categories first
        $rootCategories = $query->whereNull('parent_id')
            ->orderBy('display_order')
            ->get();

        // Transform using CategoryResource
        $data = CategoryResource::collection($rootCategories);

        return response()->json([
            'data' => $data
        ]);
    }

    // GET /api/admin/category-stats (admin)
    public function stats(): JsonResponse
    {
        // Get counts without the 'active' global scope
        $total = Category::withoutGlobalScope('active')->count();
        $active = Category::count(); // This will use the active scope
        $parentCategories = Category::parents()->count();
        $subCategories = Category::whereNotNull('parent_id')->count();
        
        // Count all active menu items
        $menuItemsCount = \App\Models\MenuItem::where('is_active', true)
            ->whereHas('category', function($query) {
                $query->where('is_active', true);
            })
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
            'menuItems.translations',
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

