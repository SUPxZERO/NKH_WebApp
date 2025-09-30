<?php

echo "🔧 Updating MySQL Database Configuration with password...\n";

// Read current .env content
$envContent = file_get_contents('.env');

// Update database configuration for MySQL with password
$envContent = preg_replace('/^DB_CONNECTION=.*/m', 'DB_CONNECTION=mysql', $envContent);
$envContent = preg_replace('/^DB_HOST=.*/m', 'DB_HOST=127.0.0.1', $envContent);
$envContent = preg_replace('/^DB_PORT=.*/m', 'DB_PORT=3306', $envContent);
$envContent = preg_replace('/^DB_DATABASE=.*/m', 'DB_DATABASE=nkh_restaurant', $envContent);
$envContent = preg_replace('/^DB_USERNAME=.*/m', 'DB_USERNAME=root', $envContent);
$envContent = preg_replace('/^DB_PASSWORD=.*/m', 'DB_PASSWORD=root', $envContent);

// Write back to .env
file_put_contents('.env', $envContent);

echo "✅ Updated .env file with MySQL configuration:\n";
echo "   - DB_CONNECTION=mysql\n";
echo "   - DB_HOST=127.0.0.1\n";
echo "   - DB_PORT=3306\n";
echo "   - DB_DATABASE=nkh_restaurant\n";
echo "   - DB_USERNAME=root\n";
echo "   - DB_PASSWORD=root\n";

echo "\n🔧 Configuration complete!\n";

?>
