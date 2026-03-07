<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the user_locations pivot table from existing data:
 * - Employee.location_id
 * - User.default_location_id
 */
class SeedUserLocationsFromExisting extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding user_locations from existing data...');

        $inserted = 0;
        $skipped = 0;

        // 1. From Employee records (most reliable source)
        $employees = Employee::whereNotNull('location_id')
            ->whereNotNull('user_id')
            ->select('user_id', 'location_id')
            ->get();

        foreach ($employees as $employee) {
            $exists = DB::table('user_locations')
                ->where('user_id', $employee->user_id)
                ->where('location_id', $employee->location_id)
                ->exists();

            if (!$exists) {
                DB::table('user_locations')->insert([
                    'user_id' => $employee->user_id,
                    'location_id' => $employee->location_id,
                    'is_primary' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $inserted++;
            } else {
                $skipped++;
            }
        }

        $this->command->info("  ✓ From employees: {$inserted} inserted, {$skipped} skipped");

        // 2. From User.default_location_id (fill gaps)
        $insertedDefault = 0;
        $users = User::whereNotNull('default_location_id')
            ->select('id', 'default_location_id')
            ->get();

        foreach ($users as $user) {
            $exists = DB::table('user_locations')
                ->where('user_id', $user->id)
                ->where('location_id', $user->default_location_id)
                ->exists();

            if (!$exists) {
                // Check if user already has a primary
                $hasPrimary = DB::table('user_locations')
                    ->where('user_id', $user->id)
                    ->where('is_primary', true)
                    ->exists();

                DB::table('user_locations')->insert([
                    'user_id' => $user->id,
                    'location_id' => $user->default_location_id,
                    'is_primary' => !$hasPrimary,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $insertedDefault++;
            }
        }

        $this->command->info("  ✓ From default_location_id: {$insertedDefault} inserted");

        $total = DB::table('user_locations')->count();
        $this->command->info("✓ user_locations seeded: {$total} total records");
    }
}
