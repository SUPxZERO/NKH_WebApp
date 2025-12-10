<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Expense;
use Carbon\Carbon;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        // Use dates from last week to now
        $baseDate = Carbon::now();
        
        $expenses = [
            [
                'location_id' => 1,
                'expense_category_id' => 1,
                'created_by' => 1,
                'expense_date' => $baseDate->copy()->subDays(5)->format('Y-m-d'),
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
                'expense_date' => $baseDate->copy()->subDays(3)->format('Y-m-d'),
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
                'expense_date' => $baseDate->copy()->subDays(1)->format('Y-m-d'),
                'amount' => 89.50,
                'currency' => 'USD',
                'vendor_name' => 'TechFix Services',
                'reference' => 'MT-412',
                'description' => 'Repairing freezer unit',
                'status' => 'approved',
            ],
            [
                'location_id' => 2,
                'expense_category_id' => 1,
                'created_by' => 1,
                'expense_date' => $baseDate->copy()->subDays(6)->format('Y-m-d'),
                'amount' => 245.00,
                'currency' => 'USD',
                'vendor_name' => 'Phnom Penh Produce Co.',
                'reference' => 'INV-1002',
                'description' => 'Fresh vegetables and fruits',
                'status' => 'approved',
            ],
            [
                'location_id' => 1,
                'expense_category_id' => 2,
                'created_by' => 1,
                'expense_date' => $baseDate->copy()->subDays(4)->format('Y-m-d'),
                'amount' => 180.00,
                'currency' => 'USD',
                'vendor_name' => 'Phnom Penh Water',
                'reference' => 'BILL-2002',
                'description' => 'Monthly water bill',
                'status' => 'approved',
            ],
            [
                'location_id' => 2,
                'expense_category_id' => 3,
                'created_by' => 1,
                'expense_date' => $baseDate->copy()->subDays(2)->format('Y-m-d'),
                'amount' => 125.00,
                'currency' => 'USD',
                'vendor_name' => 'Kitchen Equipment Co.',
                'reference' => 'MT-413',
                'description' => 'Kitchen equipment maintenance',
                'status' => 'approved',
            ],
        ];

        foreach ($expenses as $exp) {
            Expense::updateOrCreate(
                ['reference' => $exp['reference']], // Unique key
                $exp
            );
        }
    }
}
