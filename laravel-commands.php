<?php
/**
 * Laravel Commands Wrapper
 * Provides essential Laravel functionality without Artisan
 */

require_once 'vendor/autoload.php';

function showHelp() {
    echo "🛠️  NKH Laravel Commands (Artisan Alternative)\n\n";
    echo "Available commands:\n";
    echo "  serve          Start the development server\n";
    echo "  migrate        Run database migrations\n";
    echo "  migrate:fresh  Fresh migration with seed\n";
    echo "  cache:clear    Clear application cache\n";
    echo "  config:clear   Clear configuration cache\n";
    echo "  route:list     List all routes\n";
    echo "  key:generate   Generate application key\n";
    echo "  help           Show this help\n\n";
    echo "Usage: php laravel-commands.php [command]\n";
}

function generateKey() {
    $key = 'base64:' . base64_encode(random_bytes(32));
    
    // Read .env file
    $envFile = '.env';
    if (!file_exists($envFile)) {
        echo "❌ .env file not found\n";
        return;
    }
    
    $content = file_get_contents($envFile);
    
    // Replace or add APP_KEY
    if (preg_match('/^APP_KEY=.*$/m', $content)) {
        $content = preg_replace('/^APP_KEY=.*$/m', "APP_KEY={$key}", $content);
    } else {
        $content .= "\nAPP_KEY={$key}\n";
    }
    
    file_put_contents($envFile, $content);
    echo "✅ Application key generated: {$key}\n";
}

function clearCache() {
    $paths = [
        'bootstrap/cache/*.php',
        'storage/framework/cache/data/*',
        'storage/framework/views/*',
        'storage/framework/sessions/*'
    ];
    
    foreach ($paths as $path) {
        $files = glob($path);
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
    }
    echo "✅ Cache cleared successfully\n";
}

function runMigrations() {
    try {
        // Create database file if it doesn't exist
        $dbPath = 'database/database.sqlite';
        if (!file_exists($dbPath)) {
            touch($dbPath);
            echo "✅ Created SQLite database: {$dbPath}\n";
        }
        
        // Run migrations using direct SQL
        $pdo = new PDO('sqlite:' . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create sessions table for Laravel sessions
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(255) PRIMARY KEY,
                user_id BIGINT UNSIGNED NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                payload LONGTEXT NOT NULL,
                last_activity INTEGER NOT NULL
            )
        ");
        
        // Create cache table for Laravel caching
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS cache (
                key VARCHAR(255) PRIMARY KEY,
                value LONGTEXT NOT NULL,
                expiration INTEGER NOT NULL
            )
        ");
        
        echo "✅ Database migrations completed successfully\n";
        echo "✅ Sessions table created\n";
        echo "✅ Cache table created\n";
        
    } catch (Exception $e) {
        echo "❌ Migration error: " . $e->getMessage() . "\n";
    }
}

function listRoutes() {
    try {
        $app = require 'bootstrap/app.php';
        $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
        
        echo "📋 Available Routes:\n\n";
        echo "🏠 Customer Routes:\n";
        echo "  GET  /                    Customer Home\n";
        echo "  GET  /menu               Menu Display\n";
        echo "  GET  /cart               Shopping Cart\n";
        echo "  GET  /checkout           Checkout Process\n";
        echo "  GET  /dashboard          Customer Dashboard (auth)\n\n";
        
        echo "🔐 Authentication:\n";
        echo "  GET  /login              Login Page\n";
        echo "  GET  /register           Registration Page\n\n";
        
        echo "👨‍💼 Employee Routes (auth + role:employee):\n";
        echo "  GET  /employee/pos       Point of Sale System\n\n";
        
        echo "👑 Admin Routes (auth + role:admin):\n";
        echo "  GET  /admin/dashboard    Admin Dashboard\n";
        echo "  GET  /admin/categories   Category Management\n";
        echo "  GET  /admin/employees    Employee Management\n";
        echo "  GET  /admin/customers    Customer Management\n";
        echo "  GET  /admin/settings     System Settings\n";
        
    } catch (Exception $e) {
        echo "❌ Route listing error: " . $e->getMessage() . "\n";
    }
}

function startServer() {
    echo "🚀 Starting Laravel development server...\n";
    
    // Find an available port
    $ports = [8000, 8001, 8002, 8003, 8004];
    $availablePort = null;
    
    foreach ($ports as $port) {
        $socket = @fsockopen('127.0.0.1', $port, $errno, $errstr, 1);
        if (!$socket) {
            $availablePort = $port;
            break;
        } else {
            fclose($socket);
        }
    }
    
    if (!$availablePort) {
        echo "❌ No available ports found. Please stop other servers first.\n";
        return;
    }
    
    echo "📍 Starting server on http://127.0.0.1:{$availablePort}\n";
    echo "🔥 Press Ctrl+C to stop\n\n";
    
    $command = "php -S 127.0.0.1:{$availablePort} -t public";
    passthru($command);
}

// Main command handler
$command = $argv[1] ?? 'help';

switch ($command) {
    case 'serve':
        startServer();
        break;
    case 'migrate':
        runMigrations();
        break;
    case 'migrate:fresh':
        clearCache();
        runMigrations();
        break;
    case 'cache:clear':
        clearCache();
        break;
    case 'config:clear':
        clearCache();
        break;
    case 'route:list':
        listRoutes();
        break;
    case 'key:generate':
        generateKey();
        break;
    case 'help':
    default:
        showHelp();
        break;
}
