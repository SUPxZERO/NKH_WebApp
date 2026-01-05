<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\TelegramUser;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MigrateTelegramToCustomers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:migrate-to-customers 
                            {--dry-run : Show what would be migrated without making changes}
                            {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sprint P16: Migrate existing TelegramUsers to have auto-created Customer records';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $this->info('=================================================');
        $this->info('Sprint P16: Telegram to Customer Migration');
        $this->info('=================================================');
        $this->newLine();

        // Find TelegramUsers without customer_id
        $orphanedUsers = TelegramUser::whereNull('customer_id')->get();
        $this->info("Found {$orphanedUsers->count()} TelegramUser(s) without linked Customer.");

        if ($orphanedUsers->isEmpty()) {
            $this->info('✓ All TelegramUsers already have linked Customers. Nothing to migrate.');
            return Command::SUCCESS;
        }

        // Show preview
        $this->newLine();
        $this->table(
            ['ID', 'Telegram ID', 'Name', 'Phone', 'Created At'],
            $orphanedUsers->map(fn($u) => [
                $u->id,
                $u->telegram_id,
                $u->display_name,
                $u->phone_number ?? '-',
                $u->created_at->format('Y-m-d H:i'),
            ])
        );

        // Count orphaned data
        $orphanedAddresses = CustomerAddress::whereIn('telegram_user_id', $orphanedUsers->pluck('id'))
            ->whereNull('customer_id')
            ->count();
        $orphanedOrders = Order::whereIn('telegram_user_id', $orphanedUsers->pluck('id'))
            ->whereNull('customer_id')
            ->count();

        $this->newLine();
        $this->info("Related data to migrate:");
        $this->info("  - Addresses without customer_id: {$orphanedAddresses}");
        $this->info("  - Orders without customer_id: {$orphanedOrders}");

        if ($dryRun) {
            $this->newLine();
            $this->warn('DRY RUN - No changes will be made.');
            return Command::SUCCESS;
        }

        // Confirm
        if (!$this->option('force') && !$this->confirm('Proceed with migration?', true)) {
            $this->info('Migration cancelled.');
            return Command::SUCCESS;
        }

        // Execute migration
        $this->newLine();
        $this->info('Starting migration...');
        $bar = $this->output->createProgressBar($orphanedUsers->count());
        $bar->start();

        $migrated = 0;
        $errors = 0;

        foreach ($orphanedUsers as $telegramUser) {
            try {
                DB::transaction(function () use ($telegramUser) {
                    // Create Customer
                    $name = trim("{$telegramUser->first_name} {$telegramUser->last_name}") ?: 'Telegram User';
                    
                    $customer = Customer::create([
                        'user_id' => null,
                        'name' => $name,
                        'phone' => $telegramUser->phone_number,
                        'preferred_language' => $telegramUser->language_code ?? 'en',
                        'customer_code' => Customer::generateCustomerCode('TG'),
                        'customer_tier' => 'bronze',
                        'points_balance' => 0,
                        'loyalty_points' => 0,
                        'total_spent' => 0,
                        'visit_count' => 0,
                        'marketing_consent' => true,
                    ]);

                    // Link TelegramUser to Customer
                    $telegramUser->update(['customer_id' => $customer->id]);

                    // Migrate addresses
                    CustomerAddress::where('telegram_user_id', $telegramUser->id)
                        ->whereNull('customer_id')
                        ->update(['customer_id' => $customer->id]);

                    // Migrate orders
                    Order::where('telegram_user_id', $telegramUser->id)
                        ->whereNull('customer_id')
                        ->update(['customer_id' => $customer->id]);

                    Log::info('Migrated TelegramUser to Customer', [
                        'telegram_user_id' => $telegramUser->id,
                        'telegram_id' => $telegramUser->telegram_id,
                        'customer_id' => $customer->id,
                    ]);
                });

                $migrated++;
            } catch (\Exception $e) {
                $errors++;
                Log::error('Failed to migrate TelegramUser', [
                    'telegram_user_id' => $telegramUser->id,
                    'error' => $e->getMessage(),
                ]);
                $this->newLine();
                $this->error("Error migrating user {$telegramUser->id}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Summary
        $this->info('=================================================');
        $this->info('Migration Complete');
        $this->info('=================================================');
        $this->info("✓ Migrated: {$migrated}");
        if ($errors > 0) {
            $this->error("✗ Errors: {$errors}");
        }

        // Verify final state
        $remainingOrphans = TelegramUser::whereNull('customer_id')->count();
        if ($remainingOrphans > 0) {
            $this->warn("⚠ {$remainingOrphans} TelegramUser(s) still without Customer (check errors above)");
        } else {
            $this->info('✓ All TelegramUsers now have linked Customers!');
        }

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
