<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramBotService;
use Illuminate\Console\Command;

class TelegramSetupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:setup
                            {action? : Action to perform (info, webhook, delete-webhook)}
                            {--url= : Webhook URL}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup and manage Telegram bot webhook';

    private TelegramBotService $botService;

    public function __construct(TelegramBotService $botService)
    {
        parent::__construct();
        $this->botService = $botService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $action = $this->argument('action') ?? 'info';

        return match ($action) {
            'info' => $this->showInfo(),
            'webhook' => $this->setWebhook(),
            'delete-webhook' => $this->deleteWebhook(),
            default => $this->error("Unknown action: {$action}"),
        };
    }

    /**
     * Show bot information
     */
    private function showInfo(): int
    {
        $this->info('Telegram Bot Information');
        $this->line('─' . str_repeat('─', 40));

        // Bot info
        $botInfo = $this->botService->getBotInfo();

        if ($botInfo) {
            $this->info("Bot Name: {$botInfo['first_name']}");
            $this->info("Bot Username: @{$botInfo['username']}");
            $this->info("Can Join Groups: " . ($botInfo['can_join_groups'] ? 'Yes' : 'No'));
            $this->info("Can Read Messages: " . ($botInfo['can_read_all_group_messages'] ? 'Yes' : 'No'));
        } else {
            $this->error('Could not retrieve bot information.');
        }

        $this->line('');
        $this->info('Configuration:');
        $this->line('─' . str_repeat('─', 40));
        $this->line("Token: " . (config('telegram.bot_token') ? '✅ Configured' : '❌ Not configured'));
        $this->line("Secret Token: " . (config('telegram.secret_token') ? '✅ Configured' : '❌ Not configured'));
        $this->line("Webhook URL: " . (config('telegram.webhook_url') ?: 'Not set'));

        // Webhook info
        $this->line('');
        $this->info('Webhook Status:');
        $this->line('─' . str_repeat('─', 40));
        $webhookInfo = $this->botService->getWebhookInfo();

        if ($webhookInfo) {
            $this->line("URL: {$webhookInfo['url']}");
            $this->line("Pending Updates: {$webhookInfo['pending_update_count']}");
            $this->line("Last Error: " . ($webhookInfo['last_error_message'] ?? 'None'));
        } else {
            $this->warn('Could not retrieve webhook information.');
        }

        $this->line('');
        $this->info('Commands:');
        $this->line('─' . str_repeat('─', 40));
        $this->line('php artisan telegram:setup webhook --url=https://yourdomain.com/api/telegram/webhook');
        $this->line('php artisan telegram:setup delete-webhook');
        $this->line('php artisan telegram:setup info');

        return Command::SUCCESS;
    }

    /**
     * Set webhook URL
     */
    private function setWebhook(): int
    {
        $url = $this->option('url') ?: config('telegram.webhook_url');

        if (!$url) {
            $this->error('Webhook URL is required. Use --url= option or set TELEGRAM_WEBHOOK_URL in .env');
            return Command::FAILURE;
        }

        $this->info("Setting webhook to: {$url}");

        $success = $this->botService->setWebhook($url);

        if ($success) {
            $this->info('✅ Webhook set successfully!');
            return Command::SUCCESS;
        }

        $this->error('Failed to set webhook.');
        return Command::FAILURE;
    }

    /**
     * Delete webhook
     */
    private function deleteWebhook(): int
    {
        $this->info('Deleting webhook...');

        $success = $this->botService->deleteWebhook();

        if ($success) {
            $this->info('✅ Webhook deleted successfully!');
            return Command::SUCCESS;
        }

        $this->error('Failed to delete webhook.');
        return Command::FAILURE;
    }
}
