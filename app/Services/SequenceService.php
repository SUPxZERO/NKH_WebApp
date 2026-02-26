<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * SequenceService
 *
 * AUDIT FIX: Replaces the random-retry number generation pattern found in
 * InvoiceService.generateInvoiceNumber() and OrderPlacementService, which had
 * a race condition and collision risk under concurrent traffic.
 *
 * This service uses an atomic counter table (sequences) with SELECT FOR UPDATE
 * to guarantee uniqueness under any level of concurrency, with zero retries
 * and zero collision risk.
 *
 * USAGE:
 *   $orderNumber  = SequenceService::next('orders', $locationId, 'ORD');
 *   $invoiceNum   = SequenceService::next('invoices', $locationId, 'INV');
 *
 * The generated format is:   PREFIX-YYYYMMDD-NNNNN
 * Example:                   ORD-20260223-00042
 */
class SequenceService
{
    /**
     * Generate the next unique sequence number for a given entity and location.
     *
     * Under the hood this does:
     *   BEGIN;
     *   SELECT value FROM sequences WHERE entity=? AND location_id=? FOR UPDATE;
     *   UPDATE sequences SET value = value + 1 ...;
     *   COMMIT;
     *
     * This is fully atomic — no two concurrent transactions can get the same value.
     *
     * @param  string   $entity     e.g. 'orders', 'invoices'
     * @param  int|null $locationId Branch ID (null = global sequence)
     * @param  string   $prefix     e.g. 'ORD', 'INV'
     * @return string               e.g. 'ORD-20260223-00042'
     */
    public static function next(string $entity, ?int $locationId, string $prefix = ''): string
    {
        $sequence = DB::transaction(function () use ($entity, $locationId) {
            // Lock the row for this entity+location combination
            $row = DB::table('sequences')
                ->where('entity', $entity)
                ->where('location_id', $locationId)
                ->lockForUpdate()
                ->first();

            if ($row) {
                $nextValue = $row->value + 1;
                DB::table('sequences')
                    ->where('id', $row->id)
                    ->update(['value' => $nextValue, 'updated_at' => now()]);
            } else {
                // First use for this entity+location: initialize at 1
                $nextValue = 1;
                DB::table('sequences')->insert([
                    'entity' => $entity,
                    'location_id' => $locationId,
                    'value' => $nextValue,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $nextValue;
        });

        // Format: PREFIX-YYYYMMDD-NNNNN (zero-padded to 5 digits, grows naturally)
        $date = now()->format('Ymd');
        $formatted = str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
        $parts = array_filter([$prefix, $date, $formatted]);

        return implode('-', $parts);
    }

    /**
     * Peek at the current sequence value without incrementing.
     * Useful for display/debugging — NOT for generating numbers.
     */
    public static function current(string $entity, ?int $locationId): int
    {
        $row = DB::table('sequences')
            ->where('entity', $entity)
            ->where('location_id', $locationId)
            ->first();

        return $row ? (int) $row->value : 0;
    }
}
