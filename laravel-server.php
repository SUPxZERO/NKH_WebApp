<?php
/**
 * Laravel Development Server Wrapper
 * Bypasses the problematic Artisan console kernel
 */

// Set up basic Laravel environment
$_ENV['APP_ENV'] = 'local';
$_ENV['APP_DEBUG'] = 'true';

// Start the PHP built-in server with Laravel's public directory
$host = '127.0.0.1';
$port = 8000;
$publicPath = __DIR__ . '/public';

echo "🚀 Starting NKH Restaurant Laravel Server...\n";
echo "📍 Server: http://{$host}:{$port}\n";
echo "📁 Document Root: {$publicPath}\n";
echo "🔥 Press Ctrl+C to stop\n\n";

// Check if port is available
$socket = @fsockopen($host, $port, $errno, $errstr, 1);
if ($socket) {
    fclose($socket);
    echo "❌ Port {$port} is already in use. Trying port 8001...\n";
    $port = 8001;
}

// Start the server
$command = "php -S {$host}:{$port} -t {$publicPath}";
echo "🎯 Running: {$command}\n\n";

// Execute the server command
passthru($command);
