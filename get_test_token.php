<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::where('email', 'demo@admin.com')->first();
if (!$user) {
    die("Admin user not found.\n");
}

// Assuming Sanctum
$token = $user->createToken('verification-token')->plainTextToken;
echo $token;
