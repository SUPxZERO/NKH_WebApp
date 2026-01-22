<?php

namespace App\Console\Commands;

use App\Services\GeocodingService;
use Illuminate\Console\Command;

class TestGeocodingCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'geocoding:test 
                            {address : The address to geocode}
                            {--provider= : Specific provider to use (nominatim, google, mapbox)}
                            {--reverse : Perform reverse geocoding instead}
                            {--lat= : Latitude for reverse geocoding}
                            {--lng= : Longitude for reverse geocoding}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test geocoding service with a sample address';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $provider = $this->option('provider') ?: config('geocoding.default');
        $geocodingService = new GeocodingService($provider);

        $this->info("Testing geocoding with provider: {$provider}");
        $this->newLine();

        // Reverse geocoding
        if ($this->option('reverse')) {
            $lat = $this->option('lat');
            $lng = $this->option('lng');

            if (!$lat || !$lng) {
                $this->error('Both --lat and --lng options are required for reverse geocoding');
                return self::FAILURE;
            }

            $this->info("Reverse geocoding coordinates: {$lat}, {$lng}");
            
            $startTime = microtime(true);
            $address = $geocodingService->reverseGeocode((float) $lat, (float) $lng);
            $elapsed = round(( microtime(true) - $startTime) * 1000, 2);

            if ($address) {
                $this->newLine();
                $this->info('✓ Reverse geocoding successful');
                $this->table(
                    ['Property', 'Value'],
                    [
                        ['Latitude', $lat],
                        ['Longitude', $lng],
                        ['Address', $address],
                        ['Provider', $provider],
                        ['Response Time', "{$elapsed}ms"],
                    ]
                );
                return self::SUCCESS;
            } else {
                $this->error('✗ Reverse geocoding failed');
                $this->comment('Check logs for details or try a different provider.');
                return self::FAILURE;
            }
        }

        // Forward geocoding
        $address = $this->argument('address');
        $this->info("Geocoding address: {$address}");
        
        $startTime = microtime(true);
        $result = $geocodingService->geocode($address);
        $elapsed = round((microtime(true) - $startTime) * 1000, 2);

        if ($result) {
            $this->newLine();
            $this->info('✓ Geocoding successful');
            
            $qualityColor = $result['quality'] >= 0.8 ? 'green' : ($result['quality'] >= 0.5 ? 'yellow' : 'red');
            
            $this->table(
                ['Property', 'Value'],
                [
                    ['Address', $address],
                    ['Latitude', $result['lat']],
                    ['Longitude', $result['lng']],
                    ['Provider', $result['provider']],
                    ['Quality Score', "<fg={$qualityColor}>{$result['quality']}</>"],
                    ['Formatted Address', $result['formatted_address'] ?? 'N/A'],
                    ['Response Time', "{$elapsed}ms"],
                ]
            );

            // Show map link
            $this->newLine();
            $this->comment("View on map: https://www.openstreetmap.org/?mlat={$result['lat']}&mlon={$result['lng']}&zoom=15");

            // Quality warnings
            if ($result['quality'] < config('geocoding.min_quality_score', 0.5)) {
                $this->newLine();
                $this->warn('⚠ Quality score is below the configured minimum threshold');
            }

            return self::SUCCESS;
        } else {
            $this->error('✗ Geocoding failed');
            $this->comment('Possible reasons:');
            $this->line('  - Invalid or ambiguous address');
            $this->line('  - API key not configured (for Google/Mapbox)');
            $this->line('  - Rate limit exceeded');
            $this->line('  - Network connectivity issues');
            $this->newLine();
            $this->comment('Check application logs for detailed error messages.');
            
            return self::FAILURE;
        }
    }
}
