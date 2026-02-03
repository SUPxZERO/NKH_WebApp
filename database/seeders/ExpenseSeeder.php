<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Expense;
use Carbon\Carbon;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $locationId = \App\Models\Location::first()?->id ?? 1;
        $userId = \App\Models\User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['admin', 'super-admin', 'manager']);
        })->first()?->id ?? \App\Models\User::first()?->id ?? 1;

        $categories = \App\Models\ExpenseCategory::all();
        if ($categories->isEmpty()) {
            $this->call(ExpenseCategorySeeder::class);
            $categories = \App\Models\ExpenseCategory::all();
        }

        $foodCat = $categories->where('name', 'Food Supplies')->first()?->id ?? $categories->first()?->id;
        $utilCat = $categories->where('name', 'Utilities')->first()?->id ?? $categories->first()?->id;
        $maintCat = $categories->where('name', 'Maintenance')->first()?->id ?? $categories->first()?->id;
        $salaryCat = $categories->where('name', 'Staff Salaries')->first()?->id ?? $categories->first()?->id;

        $baseDate = Carbon::now();

        $expenses = [
            [
                'location_id' => $locationId,
                'expense_category_id' => $foodCat,
                'created_by' => $userId,
                'expense_date' => $baseDate->copy()->subDays(28)->format('Y-m-d'),
                'amount' => 450.25,
                'currency' => 'USD',
                'vendor_name' => 'Wholesale Food Mart',
                'reference' => 'INV-FEB-001',
                'description' => 'Bulk dry goods and rice replenishment',
                'status' => 'paid',
            ],
            [
                'location_id' => $locationId,
                'expense_category_id' => $utilCat,
                'created_by' => $userId,
                'expense_date' => $baseDate->copy()->subDays(25)->format('Y-m-d'),
                'amount' => 85.00,
                'currency' => 'USD',
                'vendor_name' => 'City Internet Pro',
                'reference' => 'NET-2026-01',
                'description' => 'Monthly fiber optic internet service',
                'status' => 'paid',
            ],
            [
                'location_id' => $locationId,
                'expense_category_id' => $maintCat,
                'created_by' => $userId,
                'expense_date' => $baseDate->copy()->subDays(20)->format('Y-m-d'),
                'amount' => 120.00,
                'currency' => 'USD',
                'vendor_name' => 'CoolAir AC Services',
                'reference' => 'SERV-9921',
                'description' => 'Quarterly AC maintenance for dining area',
                'status' => 'approved',
            ],
            [
                'location_id' => $locationId,
                'expense_category_id' => $foodCat,
                'created_by' => $userId,
                'expense_date' => $baseDate->copy()->subDays(15)->format('Y-m-d'),
                'amount' => 310.50,
                'currency' => 'USD',
                'vendor_name' => 'Fresh Catch Seafood',
                'reference' => 'INV-SEA-442',
                'description' => 'Premium seafood delivery',
                'status' => 'paid',
            ],
            [
                'location_id' => $locationId,
                'expense_category_id' => $salaryCat,
                'created_by' => $userId,
                'expense_date' => $baseDate->copy()->subDays(10)->format('Y-m-d'),
                'amount' => 1250.00,
                'currency' => 'USD',
                'vendor_name' => 'Staff Payroll',
                'reference' => 'PAY-JAN-MID',
                'description' => 'Mid-month advance payments for kitchen staff',
                'status' => 'paid',
            ],
            [
                'location_id' => $locationId,
                'expense_category_id' => $foodCat,
                'created_by' => $userId,
                'expense_date' => $baseDate->copy()->subDays(5)->format('Y-m-d'),
                'amount' => 150.75,
                'currency' => 'USD',
                'vendor_name' => 'Fresh Market Supplier',
                'reference' => 'INV-1001',
                'description' => 'Weekly food ingredients purchase',
                'status' => 'approved',
            ],
            [
                'location_id' => $locationId,
                'expense_category_id' => $utilCat,
                'created_by' => $userId,
                'expense_date' => $baseDate->copy()->subDays(3)->format('Y-m-d'),
                'amount' => 320.00,
                'currency' => 'USD',
                'vendor_name' => 'Electricité du Cambodge',
                'reference' => 'BILL-2001',
                'description' => 'Monthly electricity bill',
                'status' => 'approved',
            ],
            [
                'location_id' => $locationId,
                'expense_category_id' => $maintCat,
                'created_by' => $userId,
                'expense_date' => $baseDate->copy()->subDays(1)->format('Y-m-d'),
                'amount' => 89.50,
                'currency' => 'USD',
                'vendor_name' => 'TechFix Services',
                'reference' => 'MT-412',
                'description' => 'Repairing freezer unit',
                'status' => 'approved',
            ],
            [
                'location_id' => $locationId,
                'expense_category_id' => $foodCat,
                'created_by' => $userId,
                'expense_date' => $baseDate->copy()->format('Y-m-d'),
                'amount' => 75.20,
                'currency' => 'USD',
                'vendor_name' => 'Local Bakery',
                'reference' => 'BAKE-554',
                'description' => 'Daily bread and pastry supply',
                'status' => 'approved',
            ],
        ];

        foreach ($expenses as $exp) {
            Expense::updateOrCreate(
                ['reference' => $exp['reference']],
                $exp
            );
        }
    }
}
