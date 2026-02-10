<?php
$files = [
    'e:/promgramming/NKH_WebApp/lang/en.json',
    'e:/promgramming/NKH_WebApp/lang/km.json'
];

foreach ($files as $file) {
    if (!file_exists($file)) {
        echo "File not found: $file\n";
        continue;
    }

    $content = file_get_contents($file);
    if ($content === false) {
        echo "Could not read file: $file\n";
        continue;
    }

    $json = json_decode($content, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "Error in $file: " . json_last_error_msg() . "\n";
    } else {
        echo "Valid JSON: $file\n";
    }
}
