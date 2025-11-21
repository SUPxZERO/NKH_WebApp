<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Resources\ExpenseResource;

class ExpenseController extends Controller
{
    // GET /api/admin/expenses
    public function index(Request $request)
    {
        $query = Expense::query()->with(['category', 'location', 'creator']);

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('vendor_name', 'like', "%{$s}%")
                  ->orWhere('reference', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status') && $request->string('status') !== 'all') {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('expense_category_id', (int) $request->category);
        }

        // Date filters
        if ($request->filled('date')) {
            $query->whereDate('expense_date', $request->date('date'));
        }
        if ($request->filled('start_date')) {
            $query->whereDate('expense_date', '>=', $request->date('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('expense_date', '<=', $request->date('end_date'));
        }

        $expenses = $query->orderByDesc('expense_date')
                          ->orderByDesc('id')
                          ->paginate($request->integer('per_page', 15));

        return ExpenseResource::collection($expenses);
    }

    public function show(Expense $expense)
    {
        $expense->loadMissing(['category', 'location', 'creator']);
        return new ExpenseResource($expense);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'expense_category_id' => ['required', 'exists:expense_categories,id'],
            'expense_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'vendor_name' => ['nullable', 'string', 'max:200'],
            'reference' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,approved,paid,voided'],
        ]);

        $expense = Expense::create([
            'location_id' => $data['location_id'] ?? null,
            'expense_category_id' => $data['expense_category_id'],
            'expense_date' => $data['expense_date'],
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'USD',
            'vendor_name' => $data['vendor_name'] ?? null,
            'reference' => $data['reference'] ?? null,
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? 'approved',
            'created_by' => optional($request->user())->id,
        ]);

        $expense->load(['category', 'location', 'creator']);
        return new ExpenseResource($expense);
    }

    public function update(Request $request, Expense $expense)
    {
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'expense_category_id' => ['sometimes', 'exists:expense_categories,id'],
            'expense_date' => ['sometimes', 'date'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'vendor_name' => ['nullable', 'string', 'max:200'],
            'reference' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,approved,paid,voided'],
        ]);

        $expense->update($data);
        $expense->load(['category', 'location', 'creator']);
        return new ExpenseResource($expense);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();
        return response()->json(['message' => 'Expense deleted successfully.']);
    }
}
