<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AuditLog;
use App\Models\User;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) return;

        $actions = [
            'login', 'logout', 'create:order', 'update:order', 'delete:order',
            'create:reservation', 'update:reservation', 'view:report', 'update:settings'
        ];

        $agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15',
            'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'
        ];

        for ($i = 0; $i < 120; $i++) {
            $user = $users->random();
            $action = $actions[array_rand($actions)];
            $ip = sprintf('192.168.%d.%d', rand(0, 255), rand(1, 254));
            $ua = $agents[array_rand($agents)];
            $ts = now()->subDays(rand(0, 30))->subMinutes(rand(0, 1440));

            AuditLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'ip_address' => $ip,
                'user_agent' => $ua,
                'metadata' => [
                    'request_id' => bin2hex(random_bytes(6)),
                    'path' => '/api/admin/'.explode(':', $action)[0],
                ],
                'created_at' => $ts,
                'updated_at' => $ts,
            ]);
        }
    }
}
