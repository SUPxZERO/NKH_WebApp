<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Customer;
use App\Models\TelegramUser;
use App\Models\UserProfile;
use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class VerifyUnifiedIdentity extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'identity:verify';

    /**
     * The console command description.
     */
    protected $description = 'Verify data integrity after unified identity migration';

    protected array $issues = [];
    protected array $warnings = [];
    protected array $stats = [];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Verifying Unified Identity Migration');
        $this->info('======================================');
        
        $this->checkUserProfiles();
        $this->checkLoyaltyPoints();
        $this->checkOrders();
        $this->checkDuplicates();
        $this->checkOrphans();
        
        $this->displayResults();
        
        return empty($this->issues) ? 0 : 1;
    }

    /**
     * Check all users have profiles
     */
    protected function checkUserProfiles(): void
    {
        $this->info("\n✓ Checking user profiles...");
        
        $usersWithoutProfiles = User::where('role', 'customer')
            ->doesntHave('profile')
            ->count();
        
        $this->stats['total_users'] = User::where('role', 'customer')->count();
        $this->stats['users_with_profiles'] = UserProfile::count();
        
        if ($usersWithoutProfiles > 0) {
            $this->issues[] = "{$usersWithoutProfiles} customer users missing UserProfile";
        } else {
            $this->line("  ✓ All {$this->stats['total_users']} users have profiles");
        }
    }

    /**
     * Check loyalty points match
     */
    protected function checkLoyaltyPoints(): void
    {
        $this->info("\n✓ Checking loyalty points integrity...");
        
        // Compare old Customer points with new UserProfile points
        $mismatches = DB::table('customers')
            ->join('users', 'customers.user_id', '=', 'users.id')
            ->join('user_profiles', 'users.id', '=', 'user_profiles.user_id')
            ->whereColumn('customers.points_balance', '!=', 'user_profiles.points_balance')
            ->count();
        
        $this->stats['loyalty_mismatches'] = $mismatches;
        
        if ($mismatches > 0) {
            $this->warnings[] = "{$mismatches} users have mismatched loyalty points";
        } else {
            $this->line("  ✓ Loyalty points match for all users");
        }
    }

    /**
     * Check all orders are linked to users
     */
    protected function checkOrders(): void
    {
        $this->info("\n✓ Checking order associations...");
        
        $this->stats['total_orders'] = Order::count();
        
        // Check for orders without customer_id
        $orphanOrders = Order::whereNull('customer_id')->count();
        
        if ($orphanOrders > 0) {
            $this->issues[] = "{$orphanOrders} orders have no customer_id";
        } else {
            $this->line("  ✓ All {$this->stats['total_orders']} orders have customers");
        }
        
        // Check if all customer_ids point to valid users
        $invalidCustomerIds = Order::whereNotNull('customer_id')
            ->whereNotIn('customer_id', Customer::pluck('id'))
            ->count();
        
        if ($invalidCustomerIds > 0) {
            $this->warnings[] = "{$invalidCustomerIds} orders reference non-existent customers";
        }
    }

    /**
     * Check for duplicate identities
     */
    protected function checkDuplicates(): void
    {
        $this->info("\n✓ Checking for duplicates...");
        
        // Check duplicate emails
        $duplicateEmails = User::select('email')
            ->whereNotNull('email')
            ->groupBy('email')
            ->havingRaw('COUNT(*) > 1')
            ->count();
        
        if ($duplicateEmails > 0) {
            $this->issues[] = "{$duplicateEmails} duplicate email addresses found";
        } else {
            $this->line("  ✓ No duplicate emails");
        }
        
        // Check duplicate telegram_ids
        $duplicateTelegram = User::select('telegram_id')
            ->whereNotNull('telegram_id')
            ->groupBy('telegram_id')
            ->havingRaw('COUNT(*) > 1')
            ->count();
        
        if ($duplicateTelegram > 0) {
            $this->issues[] = "{$duplicateTelegram} duplicate Telegram IDs found";
        } else {
            $this->line("  ✓ No duplicate Telegram IDs");
        }
        
        // Check duplicate phones
        $duplicatePhones = User::select('phone')
            ->whereNotNull('phone')
            ->groupBy('phone')
            ->havingRaw('COUNT(*) > 1')
            ->count();
        
        if ($duplicatePhones > 0) {
            $this->warnings[] = "{$duplicatePhones} duplicate phone numbers found";
        } else {
            $this->line("  ✓ No duplicate phone numbers");
        }
    }

    /**
     * Check for orphaned records
     */
    protected function checkOrphans(): void
    {
        $this->info("\n✓ Checking for orphaned records...");
        
        // UserProfiles without users
        $orphanProfiles = UserProfile::whereNotIn('user_id', User::pluck('id'))->count();
        
        if ($orphanProfiles > 0) {
            $this->issues[] = "{$orphanProfiles} user profiles without users";
        } else {
            $this->line("  ✓ No orphaned user profiles");
        }
        
        // Customers without users (after migration, these should have users)
        $customersWithoutUsers = Customer::doesntHave('user')->count();
        
        $this->stats['customers_without_users'] = $customersWithoutUsers;
        
        if ($customersWithoutUsers > 0) {
            $this->warnings[] = "{$customersWithoutUsers} old customer records still exist (can be archived)";
        }
    }

    /**
     * Display verification results
     */
    protected function displayResults(): void
    {
        $this->newLine();
        $this->info('📊 Verification Results');
        $this->info('======================');
        
        // Display stats
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Users', $this->stats['total_users'] ?? 0],
                ['Users with Profiles', $this->stats['users_with_profiles'] ?? 0],
                ['Total Orders', $this->stats['total_orders'] ?? 0],
                ['Loyalty Mismatches', $this->stats['loyalty_mismatches'] ?? 0],
                ['Old Customers', $this->stats['customers_without_users'] ?? 0],
            ]
        );
        
        // Display issues
        if (!empty($this->issues)) {
            $this->newLine();
            $this->error('❌ Critical Issues Found:');
            foreach ($this->issues as $issue) {
                $this->error("  • {$issue}");
            }
        }
        
        // Display warnings
        if (!empty($this->warnings)) {
            $this->newLine();
            $this->warn('⚠️  Warnings:');
            foreach ($this->warnings as $warning) {
                $this->warn("  • {$warning}");
            }
        }
        
        // Final verdict
        $this->newLine();
        if (empty($this->issues) && empty($this->warnings)) {
            $this->info('✅ Migration verified successfully - no issues found!');
        } elseif (empty($this->issues)) {
            $this->warn('⚠️  Migration completed with warnings');
        } else {
            $this->error('❌ Migration has critical issues - review required');
        }
    }
}
