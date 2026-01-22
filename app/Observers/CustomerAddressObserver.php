<?php

namespace App\Observers;

use App\Jobs\GeocodingJob;
use App\Models\CustomerAddress;
use Illuminate\Support\Facades\Log;

class CustomerAddressObserver
{
    /**
     * Handle the CustomerAddress "created" event.
     */
    public function created(CustomerAddress $address): void
    {
        // Dispatch geocoding job for new addresses
        if ($address->needsGeocoding()) {
            Log::info('Dispatching geocoding job for new address', ['address_id' => $address->id]);
            GeocodingJob::dispatch($address)->onQueue('geocoding');
        }
    }

    /**
     * Handle the CustomerAddress "updated" event.
     */
    public function updated(CustomerAddress $address): void
    {
        // Check if address fields changed
        $addressFieldsChanged = $address->isDirty([
            'address_line_1',
            'address_line_2',
            'city',
            'province',
            'postal_code'
        ]);

        // Dispatch geocoding job if address changed and needs geocoding
        if ($addressFieldsChanged && $address->needsGeocoding()) {
            Log::info('Dispatching geocoding job for updated address', ['address_id' => $address->id]);
            GeocodingJob::dispatch($address)->onQueue('geocoding');
        }
    }
}
