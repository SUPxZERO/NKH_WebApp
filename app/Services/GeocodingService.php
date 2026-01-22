<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class GeocodingService
{
    protected string $provider;
    protected array $config;

    public function __construct(?string $provider = null)
    {
        $this->provider = $provider ?? config('geocoding.default');
        $this->config = config('geocoding.providers.' . $this->provider, []);
    }

    /**
     * Geocode an address to coordinates
     *
     * @param string $address
     * @return array|null ['lat' => float, 'lng' => float, 'quality' => float, 'provider' => string]
     */
    public function geocode(string $address): ?array
    {
        if (empty(trim($address))) {
            return null;
        }

        // Check cache first
        $cacheKey = $this->getCacheKey($address);
        if (config('geocoding.cache.enabled') && Cache::has($cacheKey)) {
            Log::info('Geocoding cache hit', ['address' => $address]);
            return Cache::get($cacheKey);
        }

        // Try primary provider
        $result = $this->geocodeWithProvider($address, $this->provider);

        // Try fallback providers if primary fails
        if (!$result) {
            $fallbackProviders = explode(',', config('geocoding.fallback_providers', ''));
            foreach ($fallbackProviders as $fallbackProvider) {
                $fallbackProvider = trim($fallbackProvider);
                if ($fallbackProvider && $fallbackProvider !== $this->provider) {
                    Log::info("Trying fallback provider: {$fallbackProvider}");
                    $result = $this->geocodeWithProvider($address, $fallbackProvider);
                    if ($result) {
                        break;
                    }
                }
            }
        }

        // Store in cache if successful
        if ($result && config('geocoding.cache.enabled')) {
            $ttl = config('geocoding.cache.ttl', 2592000);
            Cache::put($cacheKey, $result, $ttl);

            // Also store in database cache table
            $this->storeCacheInDatabase($address, $result);
        }

        return $result;
    }

    /**
     * Geocode with a specific provider
     */
    protected function geocodeWithProvider(string $address, string $provider): ?array
    {
        try {
            return match ($provider) {
                'nominatim' => $this->geocodeWithNominatim($address),
                'google' => $this->geocodeWithGoogle($address),
                'mapbox' => $this->geocodeWithMapbox($address),
                default => null,
            };
        } catch (\Exception $e) {
            Log::error("Geocoding failed with {$provider}", [
                'address' => $address,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Geocode using Nominatim (OpenStreetMap)
     */
    protected function geocodeWithNominatim(string $address): ?array
    {
        $config = config('geocoding.providers.nominatim');
        
        // Rate limiting: max 1 request per second
        if ($config['rate_limit'] ?? 1) {
            usleep(1000000 / $config['rate_limit']); // Convert to microseconds
        }

        $response = Http::timeout($config['timeout'] ?? 10)
            ->withHeaders([
                'User-Agent' => $config['user_agent'] ?? 'NKH Restaurant App',
            ])
            ->get($config['url'] . '/search', [
                'q' => $address,
                'format' => 'json',
                'addressdetails' => 1,
                'limit' => 1,
                'accept-language' => $config['language'] ?? 'en',
            ]);

        if ($response->failed() || empty($response->json())) {
            return null;
        }

        $data = $response->json()[0] ?? null;
        if (!$data || !isset($data['lat'], $data['lon'])) {
            return null;
        }

        $quality = $this->calculateNominatimQuality($data);

        return [
            'lat' => (float) $data['lat'],
            'lng' => (float) $data['lon'],
            'quality' => $quality,
            'provider' => 'nominatim',
            'formatted_address' => $data['display_name'] ?? null,
        ];
    }

    /**
     * Geocode using Google Maps API
     */
    protected function geocodeWithGoogle(string $address): ?array
    {
        $config = config('geocoding.providers.google');
        
        if (empty($config['api_key'])) {
            Log::warning('Google Maps API key not configured');
            return null;
        }

        $response = Http::timeout($config['timeout'] ?? 10)
            ->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $address,
                'key' => $config['api_key'],
                'language' => $config['language'] ?? 'en',
                'region' => $config['region'] ?? null,
            ]);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();
        if ($data['status'] !== 'OK' || empty($data['results'])) {
            return null;
        }

        $result = $data['results'][0];
        $location = $result['geometry']['location'];

        $quality = $this->calculateGoogleQuality($result);

        return [
            'lat' => (float) $location['lat'],
            'lng' => (float) $location['lng'],
            'quality' => $quality,
            'provider' => 'google',
            'formatted_address' => $result['formatted_address'] ?? null,
        ];
    }

    /**
     * Geocode using Mapbox API
     */
    protected function geocodeWithMapbox(string $address): ?array
    {
        $config = config('geocoding.providers.mapbox');
        
        if (empty($config['api_key'])) {
            Log::warning('Mapbox API key not configured');
            return null;
        }

        $response = Http::timeout($config['timeout'] ?? 10)
            ->get("https://api.mapbox.com/geocoding/v5/mapbox.places/{$address}.json", [
                'access_token' => $config['api_key'],
                'language' => $config['language'] ?? 'en',
                'country' => $config['country'] ?? null,
                'limit' => 1,
            ]);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();
        if (empty($data['features'])) {
            return null;
        }

        $feature = $data['features'][0];
        $coordinates = $feature['geometry']['coordinates'];

        $quality = $feature['relevance'] ?? 0.5;

        return [
            'lat' => (float) $coordinates[1], // Mapbox uses [lng, lat]
            'lng' => (float) $coordinates[0],
            'quality' => $quality,
            'provider' => 'mapbox',
            'formatted_address' => $feature['place_name'] ?? null,
        ];
    }

    /**
     * Reverse geocode coordinates to address
     */
    public function reverseGeocode(float $lat, float $lng): ?string
    {
        try {
            return match ($this->provider) {
                'nominatim' => $this->reverseGeocodeNominatim($lat, $lng),
                'google' => $this->reverseGeocodeGoogle($lat, $lng),
                'mapbox' => $this->reverseGeocodeMapbox($lat, $lng),
                default => null,
            };
        } catch (\Exception $e) {
            Log::error('Reverse geocoding failed', [
                'lat' => $lat,
                'lng' => $lng,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Reverse geocode using Nominatim
     */
    protected function reverseGeocodeNominatim(float $lat, float $lng): ?string
    {
        $config = config('geocoding.providers.nominatim');
        
        if ($config['rate_limit'] ?? 1) {
            usleep(1000000 / $config['rate_limit']);
        }

        $response = Http::timeout($config['timeout'] ?? 10)
            ->withHeaders([
                'User-Agent' => $config['user_agent'] ?? 'NKH Restaurant App',
            ])
            ->get($config['url'] . '/reverse', [
                'lat' => $lat,
                'lon' => $lng,
                'format' => 'json',
                'addressdetails' => 1,
            ]);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();
        return $data['display_name'] ?? null;
    }

    /**
     * Reverse geocode using Google
     */
    protected function reverseGeocodeGoogle(float $lat, float $lng): ?string
    {
        $config = config('geocoding.providers.google');
        
        if (empty($config['api_key'])) {
            return null;
        }

        $response = Http::timeout($config['timeout'] ?? 10)
            ->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'latlng' => "{$lat},{$lng}",
                'key' => $config['api_key'],
            ]);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();
        return $data['results'][0]['formatted_address'] ?? null;
    }

    /**
     * Reverse geocode using Mapbox
     */
    protected function reverseGeocodeMapbox(float $lat, float $lng): ?string
    {
        $config = config('geocoding.providers.mapbox');
        
        if (empty($config['api_key'])) {
            return null;
        }

        $response = Http::timeout($config['timeout'] ?? 10)
            ->get("https://api.mapbox.com/geocoding/v5/mapbox.places/{$lng},{$lat}.json", [
                'access_token' => $config['api_key'],
            ]);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();
        return $data['features'][0]['place_name'] ?? null;
    }

    /**
     * Batch geocode multiple addresses
     */
    public function geocodeBatch(array $addresses): array
    {
        $results = [];
        foreach ($addresses as $key => $address) {
            $results[$key] = $this->geocode($address);
        }
        return $results;
    }

    /**
     * Calculate quality score for Nominatim results
     */
    protected function calculateNominatimQuality(array $data): float
    {
        // Nominatim uses importance (0-1)
        $importance = $data['importance'] ?? 0.5;
        
        // Adjust based on address type
        $type = $data['type'] ?? '';
        if (in_array($type, ['house', 'building', 'residential'])) {
            $importance *= 1.2; // Boost for specific addresses
        }

        return min(1.0, max(0.0, $importance));
    }

    /**
     * Calculate quality score for Google results
     */
    protected function calculateGoogleQuality(array $result): float
    {
        $locationType = $result['geometry']['location_type'] ?? '';
        
        return match ($locationType) {
            'ROOFTOP' => 1.0,
            'RANGE_INTERPOLATED' => 0.8,
            'GEOMETRIC_CENTER' => 0.6,
            'APPROXIMATE' => 0.4,
            default => 0.5,
        };
    }

    /**
     * Get cache key for address
     */
    protected function getCacheKey(string $address): string
    {
        $normalized = $this->normalizeAddress($address);
        $hash = hash('sha256', $normalized);
        $prefix = config('geocoding.cache.prefix', 'geocode:');
        return $prefix . $hash;
    }

    /**
     * Normalize address for consistent caching
     */
    protected function normalizeAddress(string $address): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $address)));
    }

    /**
     * Store geocoding result in database cache
     */
    protected function storeCacheInDatabase(string $address, array $result): void
    {
        try {
            $normalized = $this->normalizeAddress($address);
            $hash = hash('sha256', $normalized);

            DB::table('geocoding_cache')->updateOrInsert(
                ['address_hash' => $hash],
                [
                    'address_text' => $address,
                    'latitude' => $result['lat'],
                    'longitude' => $result['lng'],
                    'provider' => $result['provider'],
                    'quality_score' => $result['quality'] ?? null,
                    'geocoded_at' => now(),
                    'updated_at' => now(),
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to store geocoding cache in database', [
                'error' => $e->getMessage()
            ]);
        }
    }
}
