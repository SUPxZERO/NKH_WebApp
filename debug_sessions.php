<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$rows = DB::select('select id,user_id,payload,last_activity from sessions order by last_activity desc limit 10');
foreach ($rows as $s) {
    echo "ID: {$s->id} USER: " . ($s->user_id === null ? 'null' : $s->user_id) . "\n";
    $decoded = base64_decode($s->payload);
    echo "PAYLOAD (first 1000 chars):\n" . substr($decoded, 0, 1000) . "\n---\n";
}
