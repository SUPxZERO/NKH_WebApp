<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Process\Process;

class TunnelStart extends Command
{
    protected $signature = 'tunnel:start';
    protected $description = 'Start Cloudflare tunnel and update .env with the generated URL';

    public function handle()
    {
        $this->info('Starting Cloudflare Tunnel...');

        // Start cloudflared in the background
        $process = new Process(['cloudflared', 'tunnel', '--url', 'http://127.0.0.1:8000']);
        $process->setTimeout(null);
        $process->start();

        $url = null;
        $maxAttempts = 20;
        $attempt = 0;

        $this->info('Waiting for URL generation...');

        while ($attempt < $maxAttempts && !$url) {
            $output = $process->getIncrementalErrorOutput();
            if (preg_match('/https:\/\/.*\.trycloudflare\.com/', $output, $matches)) {
                $url = trim($matches[0]);
                break;
            }
            sleep(1);
            $attempt++;
        }

        if (!$url) {
            $this->error('Failed to get Cloudflare URL. Make sure cloudflared is installed.');
            $process->stop();
            return 1;
        }

        $this->info("Generated URL: $url");

        // Wait for DNS propagation
        $this->info('Waiting 5 seconds for DNS propagation...');
        sleep(5);

        // Update .env
        $this->updateEnv($url);

        // Update Telegram Webhook
        $this->updateTelegramWebhook($url);

        $this->info('Tunnel is running. Press Ctrl+C to stop.');

        // Keep the process running
        while ($process->isRunning()) {
            echo $process->getIncrementalOutput();
            echo $process->getIncrementalErrorOutput();
            usleep(500000);
        }

        return 0;
    }

    private function updateEnv($url)
    {
        $path = base_path('.env');
        if (!File::exists($path)) {
            return;
        }

        $content = File::get($path);

        // Update APP_URL
        $content = preg_replace('/^APP_URL=.*$/m', "APP_URL=$url", $content);
        // Update VITE_APP_URL
        $content = preg_replace('/^VITE_APP_URL=.*$/m', "VITE_APP_URL=$url", $content);
        // Update TELEGRAM_WEBHOOK_URL
        $content = preg_replace('/^TELEGRAM_WEBHOOK_URL=.*$/m', "TELEGRAM_WEBHOOK_URL=$url/api/telegram/webhook", $content);

        // Update SANCTUM_STATEFUL_DOMAINS if needed
        $domain = parse_url($url, PHP_URL_HOST);
        if (preg_match('/SANCTUM_STATEFUL_DOMAINS=(.*)/', $content, $matches)) {
            $domains = explode(',', $matches[1]);
            // Filter out old cloudflare domains
            $domains = array_filter($domains, fn($d) => !str_contains($d, '.trycloudflare.com'));
            $domains[] = $domain;
            $content = preg_replace('/^SANCTUM_STATEFUL_DOMAINS=.*$/m', "SANCTUM_STATEFUL_DOMAINS=" . implode(',', array_unique($domains)), $content);
        }

        File::put($path, $content);
        $this->info('.env updated successfully.');
    }

    private function updateTelegramWebhook($url)
    {
        $webhookUrl = "$url/api/telegram/webhook";
        $this->info("Setting Telegram Webhook to: $webhookUrl");

        $this->call('telegram:setup', [
            'action' => 'webhook',
            '--url' => $webhookUrl
        ]);
    }
}
