<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class FixPermissionsSeeder extends Seeder
{
    public function run()
    {
        $superAdmin = Role::where('slug', 'super-admin')->first();
        
        if (!$superAdmin) {
            $superAdmin = Role::create([
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Super Administrator with full access',
                'is_system' => true
            ]);
            $this->command->info('Created super-admin role.');
        }

        $allPermissions = Permission::all();
        $superAdmin->permissions()->sync($allPermissions->pluck('id'));
        
        $this->command->info('Synced ' . $allPermissions->count() . ' permissions to super-admin role.');
        
        // Also ensure user 1 has super-admin role
        $user = \App\Models\User::find(1);
        if ($user && !$user->roles->contains('slug', 'super-admin')) {
             $user->roles()->attach($superAdmin->id);
             $this->command->info('Attached super-admin role to User 1.');
        }
    }
}
