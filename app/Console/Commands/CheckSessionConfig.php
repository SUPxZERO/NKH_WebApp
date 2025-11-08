<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class CheckSessionConfig extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'session:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check session configuration and database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Session Configuration Check ===');
        $this->newLine();

        // Check session config
        $this->info('Session Configuration:');
        $this->table(
            ['Setting', 'Value'],
            [
                ['Driver', config('session.driver')],
                ['Lifetime', config('session.lifetime') . ' minutes'],
                ['Cookie Name', config('session.cookie')],
                ['Cookie Path', config('session.path')],
                ['Cookie Domain', config('session.domain') ?: '(none - same domain)'],
                ['Secure Cookie', config('session.secure') ? 'Yes' : 'No'],
                ['HTTP Only', config('session.http_only') ? 'Yes' : 'No'],
                ['Same Site', config('session.same_site')],
                ['Encrypt', config('session.encrypt') ? 'Yes' : 'No'],
            ]
        );
        $this->newLine();

        // Check auth config
        $this->info('Auth Configuration:');
        $this->table(
            ['Setting', 'Value'],
            [
                ['Default Guard', config('auth.defaults.guard')],
                ['Web Guard Driver', config('auth.guards.web.driver')],
                ['Web Guard Provider', config('auth.guards.web.provider')],
                ['User Model', config('auth.providers.users.model')],
            ]
        );
        $this->newLine();

        // Check if sessions table exists
        try {
            $tableExists = DB::getSchemaBuilder()->hasTable('sessions');
            if ($tableExists) {
                $sessionCount = DB::table('sessions')->count();
                $activeSessionCount = DB::table('sessions')->whereNotNull('user_id')->count();

                $this->info('Database Status:');
                $this->table(
                    ['Item', 'Status'],
                    [
                        ['Sessions Table', '✓ Exists'],
                        ['Total Sessions', $sessionCount],
                        ['Active Sessions (logged in)', $activeSessionCount],
                    ]
                );

                if ($activeSessionCount > 0) {
                    $this->newLine();
                    $this->info('Recent Active Sessions:');
                    $sessions = DB::table('sessions')
                        ->whereNotNull('user_id')
                        ->orderBy('last_activity', 'desc')
                        ->limit(5)
                        ->get(['id', 'user_id', 'ip_address', 'last_activity']);

                    $this->table(
                        ['Session ID', 'User ID', 'IP Address', 'Last Activity'],
                        $sessions->map(function ($s) {
                            return [
                                substr($s->id, 0, 20) . '...',
                                $s->user_id,
                                $s->ip_address,
                                date('Y-m-d H:i:s', $s->last_activity),
                            ];
                        })
                    );
                }
            } else {
                $this->error('✗ Sessions table does not exist!');
                $this->info('Run: php artisan migrate');
            }
        } catch (\Exception $e) {
            $this->error('Database Error: ' . $e->getMessage());
        }

        $this->newLine();
        $this->info('=== Middleware Check ===');

        // Check if middleware files exist
        $middlewareFiles = [
            'Authenticate' => app_path('Http/Middleware/Authenticate.php'),
            'RedirectIfAuthenticated' => app_path('Http/Middleware/RedirectIfAuthenticated.php'),
            'EncryptCookies' => app_path('Http/Middleware/EncryptCookies.php'),
            'StartSession' => base_path('vendor/laravel/framework/src/Illuminate/Session/Middleware/StartSession.php'),
        ];

        foreach ($middlewareFiles as $name => $path) {
            $exists = file_exists($path);
            $status = $exists ? '✓' : '✗';
            $this->line("$status $name");
        }

        $this->newLine();
        $this->info('Configuration check complete!');

        return 0;
    }
}
