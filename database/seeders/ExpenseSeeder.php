<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Expense;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $expenses = [
            [
                'location_id' => 1,
                'expense_category_id' => 1,
                'created_by' => 1,
                'expense_date' => '2025-01-05',
                'amount' => 150.75,
                'currency' => 'USD',
                'vendor_name' => 'Fresh Market Supplier',
                'reference' => 'INV-1001',
                'description' => 'Weekly food ingredients purchase',
                'status' => 'approved',
            ],
            [
                'location_id' => 1,
                'expense_category_id' => 2,
                'created_by' => 1,
                'expense_date' => '2025-01-10',
                'amount' => 320.00,
                'currency' => 'USD',
                'vendor_name' => 'Electricité du Cambodge',
                'reference' => 'BILL-2001',
                'description' => 'Monthly electricity bill',
                'status' => 'approved',
            ],
            [
                'location_id' => 1,
                'expense_category_id' => 3,
                'created_by' => 1,
                'expense_date' => '2025-01-14',
                'amount' => 89.50,
                'currency' => 'USD',
                'vendor_name' => 'TechFix Services',
                'reference' => 'MT-412',
                'description' => 'Repairing freezer unit',
                'status' => 'approved',
            ],
        ];

        foreach ($expenses as $exp) {
            Expense::create($exp);
        }
    }
}
