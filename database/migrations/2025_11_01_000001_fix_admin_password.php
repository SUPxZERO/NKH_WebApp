<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class FixAdminPassword extends Migration
{
    public function up()
    {
        $user = User::where('email', 'demo@admin.com')->first();
        if ($user) {
            $user->forceFill([
                'password' => Hash::make('demo123')
            ])->save();
        }
    }

    public function down()
    {
        // Cannot revert password hashing
    }
}