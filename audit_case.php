<?php

$rootDir = __DIR__;

function getExactFiles($dir)
{
    $files = [];
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        $path = $file->getPathname();
        // Normalize slashes
        $path = str_replace('\\', '/', $path);
        // Make relative to root
        $relPath = str_replace(str_replace('\\', '/', __DIR__) . '/', '', $path);
        $files[$relPath] = true;
    }
    return $files;
}

echo "Building file map...\n";
$allFiles = getExactFiles($rootDir);
$allFilesLower = [];
foreach ($allFiles as $f => $v) {
    $allFilesLower[strtolower($f)] = $f;
}

$issues = [
    'backend_namespaces' => [],
    'backend_imports' => [],
    'backend_inertia' => [],
    'backend_models' => [],
    'frontend_imports' => [],
    'anomalous_directories' => []
];

// 1. Check Anomalous Directories
$anomalous = ['resourcesjsPagesAdminInventory', 'resourcesjsappcomponentsadminpayment-methods'];
foreach ($anomalous as $dir) {
    if (is_dir($rootDir . '/' . $dir)) {
        $issues['anomalous_directories'][] = $dir;
    }
}

// 2. Scan PHP files
function scanPhpFiles($dir, &$issues, $allFilesLower)
{
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if ($file->getExtension() !== 'php')
            continue;

        $path = $file->getPathname();
        $content = file_get_contents($path);
        $relPath = str_replace(str_replace('\\', '/', __DIR__) . '/', '', str_replace('\\', '/', $path));

        // Namespaces
        if (preg_match('/namespace\s+([^;]+);/', $content, $matches)) {
            $ns = trim($matches[1]);
            $expectedDir = str_replace('\\', '/', $ns);
            $expectedDir = preg_replace('/^App/', 'app', $expectedDir);
            $expectedDir = preg_replace('/^Tests/', 'tests', $expectedDir);

            $actualDir = dirname($relPath);
            // Database is mapped to database/ so ignore if it's Database
            if (!str_starts_with($ns, 'Database\\') && $expectedDir !== $actualDir && strtolower($expectedDir) === strtolower($actualDir)) {
                $issues['backend_namespaces'][] = "File: $relPath - Expected Namespace matching: $actualDir, Found: $ns";
            }
        }

        // Imports (use)
        if (preg_match_all('/use\s+([^;]+);/', $content, $matches)) {
            foreach ($matches[1] as $use) {
                // simple class import
                $usePath = explode(' as ', $use)[0];
                $usePath = trim($usePath);

                // Convert App\Models\User -> app/Models/User.php
                if (str_starts_with($usePath, 'App\\') || str_starts_with($usePath, 'Database\\')) {
                    $checkPath = str_replace('\\', '/', $usePath) . '.php';
                    $checkPath = preg_replace('/^App/', 'app', $checkPath);

                    if (!isset($allFilesLower[strtolower($checkPath)])) {
                        // might be missing entirely or trait
                        continue;
                    }
                    $actualExactCase = $allFilesLower[strtolower($checkPath)];

                    // Ignore Database/ checks for path matching as it's PSR-4 mapped
                    if (!str_starts_with($usePath, 'Database\\') && $actualExactCase !== $checkPath) {
                        $issues['backend_imports'][] = "File: $relPath - Incorrect case in import: $use (Should match $actualExactCase)";
                    }
                }
            }
        }

        // Inertia rendering
        if (preg_match_all('/Inertia::render\(\s*[\'"]([^\'"]+)[\'"]/', $content, $matches)) {
            foreach ($matches[1] as $component) {
                $componentPath = "resources/js/Pages/$component.tsx"; // Assuming tsx
                if (isset($allFilesLower[strtolower($componentPath)])) {
                    $exact = $allFilesLower[strtolower($componentPath)];
                    if ($exact !== $componentPath) {
                        $issues['backend_inertia'][] = "File: $relPath - Inertia::render('$component') should match case of $exact";
                    }
                }
            }
        }

        // Models table names
        if (str_starts_with($relPath, 'app/Models/')) {
            if (preg_match('/protected\s+\$table\s*=\s*[\'"]([^\'"]+)[\'"]/', $content, $matches)) {
                $tableName = $matches[1];
                if ($tableName !== strtolower($tableName)) {
                    $issues['backend_models'][] = "File: $relPath - Table name '$tableName' contains uppercase letters which may cause issues on Linux MySQL.";
                }
            }
        }
    }
}

// 3. Scan TSX/TS files
function scanTsxFiles($dir, &$issues, $allFilesLower)
{
    if (!is_dir($dir))
        return;
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if (!in_array($file->getExtension(), ['tsx', 'ts', 'jsx', 'js']))
            continue;

        $path = $file->getPathname();
        $content = file_get_contents($path);

        $relPath = str_replace(str_replace('\\', '/', __DIR__) . '/', '', str_replace('\\', '/', $path));
        $currentDir = dirname($relPath);

        if (preg_match_all('/from\s+[\'"]([^\'"]+)[\'"]/', $content, $matches)) {
            foreach ($matches[1] as $import) {
                if (str_starts_with($import, '.') || str_starts_with($import, '@/')) {
                    // Resolve path roughly
                    if (str_starts_with($import, '@/')) {
                        $resolved = str_replace('@/', 'resources/js/', $import);
                    } else {
                        // resolve relative
                        $parts = explode('/', $currentDir);
                        $importParts = explode('/', $import);
                        foreach ($importParts as $p) {
                            if ($p === '.')
                                continue;
                            if ($p === '..') {
                                array_pop($parts);
                            } else {
                                $parts[] = $p;
                            }
                        }
                        $resolved = implode('/', $parts);
                    }

                    // Check against map (might be .tsx, .ts, .jsx, .js, or index.tsx inside a dir)
                    $possibleExtensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];
                    $found = false;
                    foreach ($possibleExtensions as $ext) {
                        $check = $resolved . $ext;
                        if (isset($allFilesLower[strtolower($check)])) {
                            $exact = $allFilesLower[strtolower($check)];
                            if ($exact !== $check) {
                                $issues['frontend_imports'][] = "File: $relPath - Import '$import' mismatches actual file case: $exact";
                            }
                            $found = true;
                            break;
                        }
                    }
                }
            }
        }
    }
}

echo "Scanning PHP files...\n";
scanPhpFiles($rootDir . '/app', $issues, $allFilesLower);
scanPhpFiles($rootDir . '/routes', $issues, $allFilesLower);
scanPhpFiles($rootDir . '/database', $issues, $allFilesLower);

echo "Scanning Frontend files...\n";
scanTsxFiles($rootDir . '/resources/js', $issues, $allFilesLower);

file_put_contents('audit_results.json', json_encode($issues, JSON_PRETTY_PRINT));
echo "Audit complete. Results saved to audit_results.json\n";
