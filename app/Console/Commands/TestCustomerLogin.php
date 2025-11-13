<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestCustomerLogin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'customer:test-login {email} {password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test customer login credentials';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');
        $password = $this->argument('password');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        $this->info("Found user: {$user->name}");
        $this->info("Password hash: {$user->password}");
        $this->info("Hash algorithm: " . substr($user->password, 0, 4));

        // Test password verification
        try {
            $matches = Hash::check($password, $user->password);
            if ($matches) {
                $this->info("✓ Password verification PASSED");
                return 0;
            } else {
                $this->error("✗ Password verification FAILED - password doesn't match");
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("✗ Password verification ERROR: " . $e->getMessage());
            return 1;
        }
    }
}
