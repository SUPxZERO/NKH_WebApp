<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;

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
        return $query->orderBy('name')->get();
    }
}
