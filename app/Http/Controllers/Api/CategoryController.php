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
        $query = Category::query()->with(['parent', 'children'])->where('is_active', true)->orderBy('display_order');
        return CategoryResource::collection($query->paginate());
    }

    // GET /api/admin/categories/hierarchy (admin)
    public function hierarchy(Request $request): JsonResponse
    {
        $query = Category::query()
            ->with(['children' => function($q) {
                $q->orderBy('display_order');
            }, 'parent', 'menu_items'])
            ->whereNull('parent_id') // Only get root categories
            ->orderBy('display_order');

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $categories = $query->get();

        return response()->json([
            'data' => CategoryResource::collection($categories)
        ]);
    }

    // GET /api/admin/category-stats (admin)
    public function stats(): JsonResponse
    {
        $total = Category::count();
        $active = Category::where('is_active', true)->count();
        $categories = Category::whereNull('parent_id')->count();
        $menuItems = Category::whereNotNull('parent_id')->count();

        return response()->json([
            'total' => $total,
            'active' => $active,
            'categories' => $categories,
            'menu_items' => $menuItems
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
        $category->load(['parent', 'children', 'menu_items']);
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
                'message' => 'Cannot delete category with menu items. Please delete menu items first.'
            ], 422);
        }

        // Check if category has menu items
        if ($category->menu_items()->exists()) {
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

