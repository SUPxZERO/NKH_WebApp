<?php

echo "🔧 Setting up MySQL Database Configuration...\n";

// Check if .env file exists
if (!file_exists('.env')) {
    if (file_exists('.env.example')) {
        copy('.env.example', '.env');
        echo "✅ Created .env file from .env.example\n";
    } else {
        echo "❌ No .env.example file found\n";
        exit(1);
    }
}

// Read current .env content
$envContent = file_get_contents('.env');

// Update database configuration for MySQL
$envContent = preg_replace('/^DB_CONNECTION=.*/m', 'DB_CONNECTION=mysql', $envContent);
$envContent = preg_replace('/^# DB_HOST=.*/m', 'DB_HOST=127.0.0.1', $envContent);
$envContent = preg_replace('/^# DB_PORT=.*/m', 'DB_PORT=3306', $envContent);
$envContent = preg_replace('/^# DB_DATABASE=.*/m', 'DB_DATABASE=nkh_restaurant', $envContent);
$envContent = preg_replace('/^# DB_USERNAME=.*/m', 'DB_USERNAME=root', $envContent);
$envContent = preg_replace('/^# DB_PASSWORD=.*/m', 'DB_PASSWORD=', $envContent);

// If the lines don't exist, add them
if (!preg_match('/^DB_HOST=/m', $envContent)) {
    $envContent = preg_replace('/^DB_CONNECTION=mysql$/m', "DB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_DATABASE=nkh_restaurant\nDB_USERNAME=root\nDB_PASSWORD=", $envContent);
}

// Write back to .env
file_put_contents('.env', $envContent);

echo "✅ Updated .env file with MySQL configuration:\n";
echo "   - DB_CONNECTION=mysql\n";
echo "   - DB_HOST=127.0.0.1\n";
echo "   - DB_PORT=3306\n";
echo "   - DB_DATABASE=nkh_restaurant\n";
echo "   - DB_USERNAME=root\n";
echo "   - DB_PASSWORD=(empty)\n";

echo "\n🔧 Next steps:\n";
echo "1. Make sure MySQL is running\n";
echo "2. Create the 'nkh_restaurant' database if it doesn't exist\n";
echo "3. Run: php artisan migrate\n";
echo "4. Run: curl http://127.0.0.1:8000/seed-database\n";

?>
