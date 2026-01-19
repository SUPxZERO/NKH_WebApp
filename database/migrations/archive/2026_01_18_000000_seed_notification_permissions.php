<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permissions = [
            [
                'name' => 'View Notifications',
                'slug' => 'notifications.view',
                'description' => 'Can view admin notifications',
            ],
            [
                'name' => 'Send Notifications',
                'slug' => 'notifications.send',
                'description' => 'Can create and send broadcast notifications',
            ],
        ];

        $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');

        foreach ($permissions as $data) {
            // 1. Insert Permission
            $permissionId = DB::table('permissions')->where('slug', $data['slug'])->value('id');
            
            if (!$permissionId) {
                $permissionId = DB::table('permissions')->insertGetId([
                    'name' => $data['name'],
                    'slug' => $data['slug'],
                    'description' => $data['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 2. Assign to Admin Role
            if ($adminRoleId && $permissionId) {
                $exists = DB::table('role_permission')->where([
                    'role_id' => $adminRoleId,
                    'permission_id' => $permissionId,
                ])->exists();

                if (!$exists) {
                    DB::table('role_permission')->insert([
                        'role_id' => $adminRoleId,
                        'permission_id' => $permissionId,
                        // Pivot tables might not have timestamps, but checking just in case
                        // Usually role_permission is just IDs. If it throws error we can remove timestamps.
                        // Safest is just IDs for now unless we know schema.
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Data migration, usually no down script needed for simple adds
    }
};
