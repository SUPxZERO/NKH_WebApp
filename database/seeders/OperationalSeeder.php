<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
// Import our new seeders
use Database\Seeders\Ref\UnitSeeder;
use Database\Seeders\Ref\OrderStatusSeeder;
use Database\Seeders\Ref\OrderTypeSeeder;
use Database\Seeders\Ref\PaymentStatusSeeder;
use Database\Seeders\Ref\LoyaltyTierSeeder;
use Database\Seeders\Ref\RolePermissionSeeder;

use Database\Seeders\Prod\LocationSeeder;
use Database\Seeders\Prod\PaymentMethodSeeder;
use Database\Seeders\Prod\CategorySeeder;
use Database\Seeders\Prod\MenuItemSeeder;
use Database\Seeders\Prod\UserSeeder;
use Database\Seeders\Prod\SupplierSeeder;
use Database\Seeders\Prod\IngredientSeeder;
use Database\Seeders\Prod\InventorySeeder;

// Use Demo seeders (to be created implicitly here or separate files, 
// strictly speaking we should separate them but for "Day in Life" orchestration
// we can do it here or call a Demo/OperationalSeeder class)

class OperationalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This is the NEW MASTER SEEDER replacing the old DatabaseSeeder logic
     * with the organized Ref/Prod/Demo structure.
     */
    public function run(): void
    {
        // 1. Reference Data (Static, Idempotent)
        $this->command->info('📦 Seeding Reference Data (Ref)...');
        $this->call([
            UnitSeeder::class,
            OrderStatusSeeder::class,
            OrderTypeSeeder::class,
            PaymentStatusSeeder::class,
            LoyaltyTierSeeder::class,
            RolePermissionSeeder::class,
        ]);

        // 2. Production Data (Real-world Candidates)
        $this->command->info('🏢 Seeding Production Data (Prod)...');
        $this->call([
            LocationSeeder::class,
            PaymentMethodSeeder::class,
            SupplierSeeder::class,
            CategorySeeder::class,
            IngredientSeeder::class,
            InventorySeeder::class, // Initial stock
            MenuItemSeeder::class,
            UserSeeder::class,
        ]);

        // 3. Demo/Operational Simulation
        $this->command->info('🎬 Starting Operational Simulation (Demo)...');
        // We will execute the simulation logic directly here or call a dedicated class
        
        // Let's create a dedicated Demo Seeder for the transaction part to keep this clean
        $this->call(Demo\DayInLifeSeeder::class);
        
        $this->command->info('✅ Operational Seeding Complete!');
    }
}
