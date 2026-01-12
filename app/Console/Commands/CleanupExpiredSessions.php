<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Cleanup Expired Sessions Command
 * 
 * Sprint 1: Scalability Foundation
 * Automatically removes expired session records from database
 */
class CleanupExpiredSessions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'sessions:cleanup 
                            {--hours=24 : Delete sessions older than this many hours}
                            {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     */
    protected $description = 'Clean up expired sessions from the database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $dryRun = $this->option('dry-run');
        $cutoffTime = now()->subHours($hours)->timestamp;

        $this->info("Cleaning up sessions older than {$hours} hours...");

        $query = DB::table('sessions')
            ->where('last_activity', '<', $cutoffTime);

        $count = $query->count();

        if ($count === 0) {
            $this->info('No expired sessions to clean up.');
            return Command::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("[DRY RUN] Would delete {$count} expired sessions");
            return Command::SUCCESS;
        }

        $deleted = $query->delete();

        $this->info("✓ Deleted {$deleted} expired sessions");
        
        // Also clean up cache locks if they exist
        try {
            $lockCount = DB::table('cache_locks')
                ->where('expiration', '<', now()->timestamp)
                ->delete();
                
            if ($lockCount > 0) {
                $this->info("✓ Deleted {$lockCount} expired cache locks");
            }
        } catch (\Exception $e) {
            // Table might not exist, ignore
        }

        return Command::SUCCESS;
    }
}
