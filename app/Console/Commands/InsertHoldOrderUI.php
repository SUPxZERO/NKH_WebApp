<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class InsertHoldOrderUI extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:insert-hold-order-ui';

    /**
     * The console command description.
     */
    protected $description = 'Insert Hold Order UI and logic into POS page';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $posPath = base_path('resources/js/Pages/Employee/POS.tsx');
        if (!File::exists($posPath)) {
            $this->error('POS.tsx not found');
            return 1;
        }

        $content = File::get($posPath);

        // Insert Hold button next to Charge button (if not already present)
        if (!str_contains($content, '>Hold<')) {
            $content = preg_replace(
                '/(<Button[^>]*>\s*💳 Charge\s*<\/Button>)/',
                "$1\n          <Button variant=\"secondary\" className=\"h-12 text-base\">Hold</Button>",
                $content,
                1
            );
        }

        // Insert Held Orders panel above the right sidebar (if not already present)
        $panel = <<<'EOT'

          {/* HELD ORDERS PANEL */}
          <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-600/30">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Held Orders</h3>
            </CardHeader>
            <CardContent>
              {/* Placeholder – real UI will read from localStorage */}
              <div className="text-sm text-gray-400">No held orders</div>
            </CardContent>
          </Card>
EOT;
        if (!str_contains($content, 'Held Orders')) {
            $content = preg_replace(
                '/(<div className="lg:col-span-4 space-y-4">)/',
                "$1\n$panel",
                $content,
                1
            );
        }

        File::put($posPath, $content);
        $this->info('Hold Order UI inserted into POS.tsx');
        return 0;
    }
}
