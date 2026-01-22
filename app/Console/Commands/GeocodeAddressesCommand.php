<?php

namespace App\Console\Commands;

use App\Models\CustomerAddress;
use App\Jobs\GeocodingJob;
use Illuminate\Console\Command;

class GeocodeAddressesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'addresses:geocode 
                            {--force : Re-geocode addresses that already have coordinates}
                            {--limit= : Limit number of addresses to geocode}
                            {--failed : Only retry addresses that previously failed}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Geocode customer addresses that are missing coordinates';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $query = CustomerAddress::query();

        // Filter based on options
        if ($this->option('failed')) {
            $query->where('geocoding_failed', true);
            $this->info('Retrying failed geocoding attempts...');
        } elseif (!$this->option('force')) {
            $query->where(function ($q) {
                $q->whereNull('latitude')
                  ->orWhereNull('longitude');
            });
            $this->info('Geocoding addresses without coordinates...');
        } else {
            $this->info('Force geocoding all addresses...');
        }

        // Apply limit if specified
        if ($limit = $this->option('limit')) {
            $query->limit((int) $limit);
        }

        $addresses = $query->get();

        if ($addresses->isEmpty()) {
            $this->info('No addresses found to geocode.');
            return self::SUCCESS;
        }

        $this->info("Found {$addresses->count()} addresses to geocode.");
        
        $bar = $this->output->createProgressBar($addresses->count());
        $bar->start();

        $dispatched = 0;
        foreach ($addresses as $address) {
            // If force option, reset geocoding status
            if ($this->option('force')) {
                $address->geocoding_failed = false;
                $address->geocoding_attempted_at = null;
                $address->saveQuietly();
            }

            // Dispatch job
            GeocodingJob::dispatch($address)->onQueue('geocoding');
            $dispatched++;
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✓ Dispatched {$dispatched} geocoding jobs to queue.");
        $this->comment("Run 'php artisan queue:work --queue=geocoding' to process them.");

        return self::SUCCESS;
    }
}
