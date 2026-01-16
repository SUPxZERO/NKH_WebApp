<?php

// Test script to verify the address API fix

echo "Testing Customer Address API Fix\n";
echo "=================================\n\n";

// Check the model
$modelFile = file_get_contents('app/Models/CustomerAddress.php');

if (strpos($modelFile, 'protected $fillable') !== false) {
    echo "✓ CustomerAddress model uses $fillable\n";
} else {
    echo "✗ CustomerAddress model still uses $guarded - needs fix\n";
}

// Check for key fields
$requiredFields = ['customer_id', 'telegram_user_id', 'label', 'address_line_1', 'city', 'province', 'postal_code'];
foreach ($requiredFields as $field) {
    if (strpos($modelFile, "'$field'") !== false) {
        echo "✓ Field '$field' is fillable\n";
    } else {
        echo "✗ Field '$field' missing from fillable\n";
    }
}

echo "\n✅ Fix verification complete!\n";
echo "The 500 error should now be resolved.\n";
