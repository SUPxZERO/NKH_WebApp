<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Customer;
use App\Models\TelegramUser;
use App\Models\UserProfile;
use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateToUnifiedIdentity extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'identity:migrate 
                            {--dry-run : Run migration without committing changes}
                            {--force : Skip confirmation prompts}';

    /**
     * The console command description.
     */
    protected $description = 'Migrate Customer and TelegramUser data to unified User/UserProfile structure';

    protected int $usersCreated = 0;
    protected int $profilesCreated = 0;
    protected int $ordersUpdated = 0;
    protected int $errors = 0;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Phase 3: Unified Identity Migration');
        $this->info('=====================================');
        
        if (!$this->option('dry-run') && !$this->option('force')) {
            if (!$this->confirm('This will migrate all Customer and TelegramUser data. Continue?')) {
                $this->info('Migration cancelled.');
                return 0;
            }
        }

        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->warn('🔍 DRY RUN MODE - No changes will be committed');
        }

        DB::beginTransaction();

        try {
            // Step 1: Migrate existing Users with Customers
            $this->info("\n📋 Step 1: Migrating Users with Customer profiles...");
            $this->migrateUsersWithCustomers();

            // Step 2: Migrate Telegram-only users
            $this->info("\n📋 Step 2: Migrating Telegram-only users...");
            $this->migrateTelegramOnlyUsers();

            // Step 3: Migrate orphan Customers (QR/guest orders)
            $this->info("\n📋 Step 3: Migrating guest/QR customers...");
            $this->migrateOrphanCustomers();

            // Step 4: Display summary
            $this->displaySummary();

            if ($isDryRun) {
                DB::rollBack();
                $this->warn("\n✅ Dry run complete - no changes committed");
            } else {
                DB::commit();
                $this->info("\n✅ Migration complete - all changes committed");
            }

            return 0;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("\n❌ Migration failed: " . $e->getMessage());
            $this->error("Stack trace: " . $e->getTraceAsString());
            return 1;
        }
    }

    /**
     * Migrate existing Users who have Customer records
     */
    protected function migrateUsersWithCustomers(): void
    {
        $users = User::with('customer.telegramUser')->whereHas('customer')->get();
        
        $this->info("Found {$users->count()} users with customer profiles");
        
        $progressBar = $this->output->createProgressBar($users->count());
        $progressBar->start();

        foreach ($users as $user) {
            try {
                $customer = $user->customer;
                
                // Add telegram_id if customer has Telegram account
                if ($customer->telegramUser) {
                    $user->telegram_id = $customer->telegramUser->telegram_id;
                    $user->phone = $user->phone ?? $customer->telegramUser->phone_number;
                    $user->avatar_url = $user->avatar_url ?? $customer->telegramUser->photo_url;
                }
                
                // Ensure phone is set
                if (!$user->phone && $customer->phone) {
                    $user->phone = $customer->phone;
                }
                
                $user->save();

                // Create UserProfile from Customer data
                if (!$user->profile) {
                    UserProfile::create([
                        'user_id' => $user->id,
                        'customer_code' => $customer->customer_code,
                        'birth_date' => $customer->birth_date,
                        'gender' => $customer->gender,
                        'preferred_language' => $customer->preferred_language ?? 'en',
                        'marketing_consent' => $customer->marketing_consent ?? false,
                        'points_balance' => $customer->points_balance ?? 0,
                        'customer_tier' => $customer->customer_tier ?? 'bronze',
                        'preferred_location_id' => $customer->preferred_location_id,
                        'dietary_restrictions' => $customer->dietary_restrictions,
                        'last_order_at' => $customer->updated_at,
                    ]);
                    
                    $this->profilesCreated++;
                }

                $progressBar->advance();

            } catch (\Exception $e) {
                $this->errors++;
                $this->newLine();
                $this->error("Error migrating user {$user->id}: " . $e->getMessage());
            }
        }

        $progressBar->finish();
        $this->newLine();
    }

    /**
     * Migrate TelegramUser records that don't have a User account
     */
    protected function migrateTelegramOnlyUsers(): void
    {
        // Find TelegramUsers without a User account
        $telegramUsers = TelegramUser::whereDoesntHave('customer.user')->get();
        
        $this->info("Found {$telegramUsers->count()} Telegram-only users");
        
        if ($telegramUsers->isEmpty()) {
            return;
        }
        
        $progressBar = $this->output->createProgressBar($telegramUsers->count());
        $progressBar->start();

        foreach ($telegramUsers as $tgUser) {
            try {
                // Create new User from TelegramUser
                $user = User::create([
                    'telegram_id' => $tgUser->telegram_id,
                    'name' => trim($tgUser->first_name . ' ' . ($tgUser->last_name ?? '')),
                    'phone' => $tgUser->phone_number,
                    'avatar_url' => $tgUser->photo_url,
                    'role' => 'customer',
                    'password' => null, // Telegram auth only
                    'email_verified_at' => null,
                ]);
                
                $this->usersCreated++;

                // Create UserProfile
                $pointsBalance = 0;
                if ($tgUser->customer) {
                    $pointsBalance = $tgUser->customer->points_balance ?? 0;
                }

                UserProfile::create([
                    'user_id' => $user->id,
                    'customer_code' => UserProfile::generateCustomerCode(),
                    'preferred_language' => $tgUser->language_code ?? 'en',
                    'points_balance' => $pointsBalance,
                    'customer_tier' => 'bronze',
                ]);
                
                $this->profilesCreated++;

                // Update orders from TelegramUser to new User
                if ($tgUser->customer) {
                    $ordersUpdated = Order::where('customer_id', $tgUser->customer->id)
                        ->update(['customer_id' => $user->id]); // Will need to add user_id column
                    
                    $this->ordersUpdated += $ordersUpdated;
                }

                $progressBar->advance();

            } catch (\Exception $e) {
                $this->errors++;
                $this->newLine();
                $this->error("Error migrating Telegram user {$tgUser->telegram_id}: " . $e->getMessage());
            }
        }

        $progressBar->finish();
        $this->newLine();
    }

    /**
     * Migrate Customer records without a User (guest/QR orders)
     */
    protected function migrateOrphanCustomers(): void
    {
        $orphanCustomers = Customer::whereDoesntHave('user')
            ->whereDoesntHave('telegramUser')
            ->get();
        
        $this->info("Found {$orphanCustomers->count()} guest/QR customers");
        
        if ($orphanCustomers->isEmpty()) {
            return;
        }
        
        $progressBar = $this->output->createProgressBar($orphanCustomers->count());
        $progressBar->start();

        foreach ($orphanCustomers as $customer) {
            try {
                // Create User for guest customer
                $user = User::create([
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'name' => $customer->name ?? 'Guest',
                    'role' => 'customer',
                    'password' => null, // Guest account
                ]);
                
                $this->usersCreated++;

                // Create UserProfile
                UserProfile::create([
                    'user_id' => $user->id,
                    'customer_code' => $customer->customer_code,
                    'birth_date' => $customer->birth_date,
                    'gender' => $customer->gender,
                    'preferred_language' => $customer->preferred_language ?? 'en',
                    'marketing_consent' => $customer->marketing_consent ?? false,
                    'points_balance' => $customer->points_balance ?? 0,
                    'customer_tier' => $customer->customer_tier ?? 'bronze',
                    'preferred_location_id' => $customer->preferred_location_id,
                ]);
                
                $this->profilesCreated++;

                // Update orders to point to new user
                $ordersUpdated = Order::where('customer_id', $customer->id)
                    ->update(['customer_id' => $user->id]); // Will need user_id column
                
                $this->ordersUpdated += $ordersUpdated;

                $progressBar->advance();

            } catch (\Exception $e) {
                $this->errors++;
                $this->newLine();
                $this->error("Error migrating customer {$customer->id}: " . $e->getMessage());
            }
        }

        $progressBar->finish();
        $this->newLine();
    }

    /**
     * Display migration summary
     */
    protected function displaySummary(): void
    {
        $this->newLine();
        $this->info('📊 Migration Summary');
        $this->info('===================');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Users created', $this->usersCreated],
                ['Profiles created', $this->profilesCreated],
                ['Orders updated', $this->ordersUpdated],
                ['Errors', $this->errors],
            ]
        );
    }
}
