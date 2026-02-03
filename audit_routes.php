<?php

use Illuminate\Support\Facades\Route;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Starting Route Protection Audit...\n";
echo "--------------------------------------------------\n";

$routes = Route::getRoutes();
$issues = 0;

foreach ($routes as $route) {
    $uri = $route->uri();

    // Only check API Admin routes
    if (!str_starts_with($uri, 'api/admin') && !str_starts_with($uri, 'admin')) {
        continue;
    }

    $methods = implode('|', $route->methods());
    $middleware = $route->gatherMiddleware();

    $hasPermissionCheck = false;
    $hasRoleCheck = false;
    $isPublic = false;

    foreach ($middleware as $m) {
        if (is_string($m)) {
            if (str_starts_with($m, 'permission:'))
                $hasPermissionCheck = true;
            if (str_starts_with($m, 'role:'))
                $hasRoleCheck = true;
            if (str_starts_with($m, 'can:'))
                $hasPermissionCheck = true;
        }
    }

    // Skip login/logout/dashboard summary basic routes if they are intentionally open to authenticated users
    if (str_contains($uri, 'dashboard/summary'))
        continue; // Usually basic auth
    if (str_contains($uri, 'login'))
        continue;

    if (!$hasPermissionCheck && !$hasRoleCheck) {
        echo "[UNPROTECTED] {$methods} {$uri}\n";
        echo " - Middleware: " . implode(', ', $middleware) . "\n";
        $issues++;
    }
}

if ($issues === 0) {
    echo "SUCCESS: All Admin routes appear to be protected.\n";
} else {
    echo "\nFAILURE: Found {$issues} unprotected admin routes.\n";
}
