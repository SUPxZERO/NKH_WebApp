<?php

$tableFile = 'table_list.txt';
$baseDir = __DIR__;

$tables = [];
if (file_exists($tableFile)) {
    $lines = file($tableFile);
    foreach ($lines as $line) {
        if (preg_match("/CREATE TABLE `(.*)`/", $line, $matches)) {
            $tables[] = $matches[1];
        }
    }
}

$results = [];

// Basic singularizer
function singularize($word) {
    if (substr($word, -3) == 'ies') {
        return substr($word, 0, -3) . 'y';
    }
    if (substr($word, -1) == 's' && substr($word, -2) != 'ss') {
        return substr($word, 0, -1);
    }
    return $word;
}

function studly($value) {
    $value = ucwords(str_replace(['-', '_'], ' ', $value));
    return str_replace(' ', '', $value);
}

foreach ($tables as $table) {
    // System/Framework tables
    if (in_array($table, ['migrations', 'failed_jobs', 'jobs', 'job_batches', 'sessions', 'cache', 'cache_locks', 'password_reset_tokens', 'personal_access_tokens'])) {
        $results[$table] = [
            'type' => 'system', 
            'usage_count' => 999,
            'model_exists' => false
        ];
        continue;
    }

    $singular = singularize($table);
    $modelName = studly($singular);
    
    // Check standard locations
    $modelPath = "$baseDir/app/Models/$modelName.php";
    $modelExists = file_exists($modelPath);

    // Also check for Pivot tables (no model usually)
    // If table contains '_', it might be a pivot.
    
    // Search for usage
    // We assume grep is available
    $escapedTable = escapeshellarg($table);
    // Exclude the SQL dump, storage, and tests/
    $cmd = "grep -r $escapedTable app resources routes database/seeders config --exclude=*.sql --exclude=table_list.txt --exclude-dir=storage --exclude-dir=vendor | wc -l";
    $output = shell_exec($cmd);
    $usageCount = intval(trim($output));

    $results[$table] = [
        'type' => 'app',
        'table' => $table,
        'model' => $modelName,
        'model_exists' => $modelExists,
        'usage_count' => $usageCount
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT);
