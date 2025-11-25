<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class AddKitchenApiRoutes extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:add-kitchen-api-routes';

    /**
     * The console command description.
     */
    protected $description = 'Add kitchen API routes to routes/api.php';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $apiPath = base_path('routes/api.php');
        if (!File::exists($apiPath)) {
            $this->error('routes/api.php not found');
            return 1;
        }
        $content = File::get($apiPath);

        // Ensure KitchenController import exists
        if (!str_contains($content, 'use App\\Http\\Controllers\\Api\\KitchenController;')) {
            // Insert after the opening <?php line
            $content = preg_replace('/^<\?php\s*/m', "<?php\n\nuse App\\Http\\Controllers\\Api\\KitchenController;\n", $content, 1);
        }

        // Add routes inside the employee group if it exists
        $groupPattern = '/(Route::prefix\(\'employee\'\)[\s\S]*?\{)([\s\S]*?)(\}\);)/m';
        if (preg_match($groupPattern, $content, $matches)) {
            $groupStart = $matches[1];
            $groupBody = $matches[2];
            $groupEnd = $matches[3];

            // Append kitchen routes if not already present
            if (!str_contains($groupBody, 'KitchenController')) {
                $newRoutes = "\n    // Kitchen Display System\n    Route::get('kitchen/orders', [KitchenController::class, 'orders']);\n    Route::put('kitchen/orders/{id}/status', [KitchenController::class, 'updateStatus']);\n";
                $groupBody .= $newRoutes;
            }
            $content = $groupStart . $groupBody . $groupEnd;
        } else {
            // Fallback: add a dedicated kitchen prefix group at the end of the file
            $fallback = "\n// Kitchen API routes\nRoute::prefix('kitchen')->middleware(['auth:sanctum'])->group(function () {\n    Route::get('orders', [KitchenController::class, 'orders']);\n    Route::put('orders/{id}/status', [KitchenController::class, 'updateStatus']);\n});\n";
            $content .= $fallback;
        }

        File::put($apiPath, $content);
        $this->info('Kitchen API routes added/updated in routes/api.php');
        return 0;
    }
}
