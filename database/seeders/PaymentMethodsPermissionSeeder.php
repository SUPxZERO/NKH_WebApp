<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PaymentMethodsPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create the permission
        $permission = Permission::updateOrCreate(
            ['slug' => 'manage_payment_methods'],
            ['name' => 'Manage Payment Methods']
        );

        $this->command->info('Created/Updated permission: manage_payment_methods');

        // 2. Assign to Admin (and Super Admin if exists)
        $adminRoles = Role::whereIn('slug', ['admin', 'super-admin'])->get();
        foreach ($adminRoles as $role) {
            if (!$role->permissions->contains($permission->id)) {
                $role->permissions()->attach($permission->id);
                $this->command->info("Assigned permission to role: {$role->name}");
            }
        }

        // 3. Assign to Manager
        $managerRole = Role::where('slug', 'manager')->first();
        if ($managerRole && !$managerRole->permissions->contains($permission->id)) {
            $managerRole->permissions()->attach($permission->id);
            $this->command->info("Assigned permission to role: {$managerRole->name}");
        }
    }
}
