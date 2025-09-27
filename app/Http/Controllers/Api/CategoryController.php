<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Category\StoreCategoryRequest;
use App\Http\Requests\Api\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    // GET /api/categories (public)
    public function index(): AnonymousResourceCollection
    {
        $query = Category::query()->with([])->where('is_active', true)->orderBy('display_order');
        return CategoryResource::collection($query->paginate());
    }

    // POST /api/categories (role:admin,manager)
    public function store(StoreCategoryRequest $request): CategoryResource
    {
        $data = $request->validated();
        $category = Category::create($data);
        return new CategoryResource($category);
    }

    // GET /api/categories/{category}
    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category);
    }

    // PUT /api/categories/{category} (role:admin,manager)
    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $category->update($request->validated());
        return new CategoryResource($category);
    }

    // DELETE /api/categories/{category} (role:admin,manager)
    public function destroy(Category $category)
    {
        // Hard delete as per spec
        $category->forceDelete();
        return response()->json(['message' => 'Category deleted.']);
    }
}

