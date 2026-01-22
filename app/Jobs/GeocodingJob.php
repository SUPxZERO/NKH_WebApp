<?php

namespace App\Jobs;

use App\Models\CustomerAddress;
use App\Services\GeocodingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GeocodingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;
    public int $backoff = 5; // seconds

    protected CustomerAddress $address;

    /**
     * Create a new job instance
     */
    public function __construct(CustomerAddress $address)
    {
        $this->address = $address;
    }

    /**
     * Execute the job - geocode the customer address
     */
    public function handle(GeocodingService $geocodingService): void
    {
        // Skip if address already has coordinates and hasn't changed
        if ($this->address->latitude && $this->address->longitude && !$this->address->isDirty(['address_line_1', 'address_line_2', 'city', 'province'])) {
            Log::info('Address already geocoded, skipping', ['address_id' => $this->address->id]);
            return;
        }

        // Build full address string
        $fullAddress = $this->buildFullAddress();

        if (empty($fullAddress)) {
            Log::warning('Cannot geocode empty address', ['address_id' => $this->address->id]);
            $this->markGeocodingFailed();
            return;
        }

        Log::info('Geocoding address', [
            'address_id' => $this->address->id,
            'address' => $fullAddress
        ]);

        // Mark attempt
        $this->address->geocoding_attempted_at = now();
        $this->address->saveQuietly(); // Save without triggering observer again

        // Attempt geocoding
        $result = $geocodingService->geocode($fullAddress);

        if ($result) {
            // Check quality threshold
            $minQuality = config('geocoding.min_quality_score', 0.5);
            if ($result['quality'] < $minQuality) {
                Log::warning('Geocoding quality below threshold', [
                    'address_id' => $this->address->id,
                    'quality' => $result['quality'],
                    'min_quality' => $minQuality
                ]);
            }

            // Update address with coordinates
            $this->address->updateCoordinates(
                $result['lat'],
                $result['lng'],
                $result['provider'],
                $result['quality']
            );

            Log::info('Address geocoded successfully', [
                'address_id' => $this->address->id,
                'lat' => $result['lat'],
                'lng' => $result['lng'],
                'provider' => $result['provider'],
                'quality' => $result['quality']
            ]);
        } else {
            Log::error('Geocoding failed', [
                'address_id' => $this->address->id,
                'address' => $fullAddress,
                'attempts' => $this->attempts()
            ]);

            $this->markGeocodingFailed();
        }
    }

    /**
     * Build full address string from address components
     */
    protected function buildFullAddress(): string
    {
        $parts = array_filter([
            $this->address->address_line_1,
            $this->address->address_line_2,
            $this->address->city,
            $this->address->province,
            $this->address->postal_code,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Mark geocoding as failed
     */
    protected function markGeocodingFailed(): void
    {
        $this->address->geocoding_failed = true;
        $this->address->geocoding_attempted_at = now();
        $this->address->saveQuietly();
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('GeocodingJob failed permanently', [
            'address_id' => $this->address->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        $this->markGeocodingFailed();
    }
}
