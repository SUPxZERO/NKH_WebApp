<?php

namespace App\Console\Commands;

use App\Models\TelegramUser;
use App\Services\Telegram\TelegramCustomerService;
use Illuminate\Console\Command;

class MigrateTelegramCustomers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:migrate-customers';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing Telegram guest users to full Customer accounts';

    /**
     * Execute the console command.
     */
    public function handle(TelegramCustomerService $service)
    {
        $this->info('Starting migration of Telegram users to Customer accounts...');

        $users = TelegramUser::whereNull('customer_id')->get();
        $count = $users->count();

        if ($count === 0) {
            $this->info('No Telegram users found needing migration.');
            return Command::SUCCESS;
        }

        $this->info("Found {$count} users to migrate.");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $success = 0;
        $errors = 0;

        foreach ($users as $user) {
            try {
                // Simulate "telegram data" from existing model fields
                $data = [
                    'id' => $user->telegram_id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'username' => $user->telegram_username,
                    'language_code' => $user->language_code ?? 'en',
                ];

                $service->createForTelegramUser($user, $data);
                $success++;
            } catch (\Exception $e) {
                $errors++;
                $this->error("\nFailed to migrate User ID {$user->id}: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("Migration completed.");
        $this->info("Successfully created: {$success}");
        
        if ($errors > 0) {
            $this->error("Failed: {$errors}");
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
