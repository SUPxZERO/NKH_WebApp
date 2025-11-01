<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class FixUserPasswordHashing extends Migration
{
    public function up()
    {
        $users = User::all();

        foreach ($users as $user) {
            // Check if the password is not already Bcrypt hashed
            if ($user->password && !str_starts_with($user->password, '$2y$')) {
                $user->password = Hash::make($user->password);
                $user->save();
            }
        }
    }

    public function down()
    {
        // Cannot revert password hashing
    }
}