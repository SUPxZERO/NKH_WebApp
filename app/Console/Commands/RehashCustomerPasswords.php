<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RehashCustomerPasswords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'customer:rehash-passwords {--force}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rehash customer passwords that are not using Bcrypt algorithm';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (!$this->option('force')) {
            if (!$this->confirm('This will rehash all customer passwords. Continue?')) {
                return 0;
            }
        }

        // Find all customer users with plain text passwords
        $customers = User::whereHas('roles', function($query) {
            $query->where('slug', 'customer');
        })
            ->get()
            ->filter(function ($user) {
                // Check if password doesn't start with $2y$ (bcrypt hash prefix)
                return !str_starts_with($user->password, '$2y$') && 
                       !str_starts_with($user->password, '$2a$') && 
                       !str_starts_with($user->password, '$2x$') &&
                       !str_starts_with($user->password, '$2b$');
            });

        if ($customers->isEmpty()) {
            $this->info('No customer passwords need rehashing.');
            return 0;
        }

        $this->info("Found {$customers->count()} customer(s) with non-Bcrypt passwords.");
        $bar = $this->output->createProgressBar($customers->count());

        foreach ($customers as $user) {
            // Store the plain password temporarily for hashing
            $plainPassword = $user->password;
            $user->password = Hash::make($plainPassword);
            $user->save();
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$customers->count()} customer password(s) have been rehashed successfully!");

        return 0;
    }
}
