<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use App\Http\Resources\ExpenseCategoryResource;

class ExpenseCategoryController extends Controller
{
    // GET /api/admin/expense-categories
    public function index(Request $request)
    {
        $query = ExpenseCategory::query();
        if ($request->has('is_active')) {
            $query->where('is_active', (int) $request->is_active);
        }
        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where('name', 'like', "%{$s}%");
        }
        $categories = $query->orderBy('name')->get();
        return ExpenseCategoryResource::collection($categories);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $locationId = $data['location_id']
            ?? $request->user()?->employee?->location_id
            ?? \App\Models\Location::first()?->id;

        $category = ExpenseCategory::create([
            'location_id' => $locationId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return new ExpenseCategoryResource($category);
    }

    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $expenseCategory->update($data);

        return new ExpenseCategoryResource($expenseCategory);
    }

    public function destroy(ExpenseCategory $expenseCategory)
    {
        $expenseCategory->delete();
        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
