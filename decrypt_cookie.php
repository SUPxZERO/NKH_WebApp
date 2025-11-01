<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Crypt;

$cookieFile = __DIR__ . '/cj';
if (!file_exists($cookieFile)) {
    echo "cookie jar not found\n";
    exit(1);
}
$contents = file($cookieFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$cookieValue = null;
foreach ($contents as $line) {
    if (strpos($line, 'laravel-session') !== false) {
        $parts = preg_split('/\s+/', $line);
        // last column is value
        $cookieValue = $parts[count($parts)-1];
        break;
    }
}
if (!$cookieValue) {
    echo "laravel-session cookie not found in cj\n";
    exit(1);
}
// try urldecode
$cookieValue = urldecode($cookieValue);
try {
    $decrypted = Crypt::decryptString($cookieValue);
    echo "Decrypted laravel-session cookie: \n";
    var_export($decrypted);
    echo "\n";
} catch (Exception $e) {
    echo "Failed to decrypt cookie: " . $e->getMessage() . "\n";
}
