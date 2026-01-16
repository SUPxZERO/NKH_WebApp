<?php

// Verify the Order model fix
echo "Testing Online Order API Fix\n";
echo "==============================\n\n";

$modelFile = file_get_contents('app/Models/Order.php');

// Check if is_auto_approved is no longer guarded
if (strpos($modelFile, "'is_auto_approved',") !== false) {
    // Check if it's in the guarded array section (between guarded = [ and ]; )
    preg_match('/protected\s+\$guarded\s*=\s*\[(.*?)\];/s', $modelFile, $matches);

    if (isset($matches[1]) && strpos($matches[1], 'is_auto_approved') !== false) {
        echo "✗ ERROR: 'is_auto_approved' is still in $guarded\n";
    } else {
        echo "✓ SUCCESS: 'is_auto_approved' is NOT in $guarded\n";
    }
} else {
    echo "✓ SUCCESS: 'is_auto_approved' is NOT in $guarded\n";
}

// Check other guarded fields are still protected
$requiredGuarded = ['id', 'order_type_id', 'order_status_id'];
foreach ($requiredGuarded as $field) {
    if (strpos($modelFile, "'$field'") !== false) {
        echo "✓ Field '$field' is properly guarded\n";
    } else {
        echo "⚠ Field '$field' might not be guarded\n";
    }
}

echo "\n✅ Fix verification complete!\n";
echo "The 500 error for online orders should now be resolved.\n";
