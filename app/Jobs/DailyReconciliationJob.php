<?php

namespace App\Jobs;

use App\Models\DailySettlement;
use App\Models\Invoice;
use App\Models\Location;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DailyReconciliationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 300;

    protected Carbon $date;
    protected ?int $locationId;

    /**
     * Create a new job instance.
     */
    public function __construct(?Carbon $date = null, ?int $locationId = null)
    {
        $this->date = $date ?? now()->subDay();
        $this->locationId = $locationId;
        $this->onQueue('settlements');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Starting daily reconciliation', [
            'date' => $this->date->toDateString(),
            'location_id' => $this->locationId,
        ]);

        $locations = $this->locationId 
            ? Location::where('id', $this->locationId)->get()
            : Location::where('is_active', true)->get();

        foreach ($locations as $location) {
            $this->reconcileLocation($location);
        }

        Log::info('Daily reconciliation completed', [
            'date' => $this->date->toDateString(),
            'locations_processed' => $locations->count(),
        ]);
    }

    /**
     * Reconcile a single location.
     */
    protected function reconcileLocation(Location $location): void
    {
        $dateString = $this->date->toDateString();

        // Check if already reconciled
        $existing = DailySettlement::where('location_id', $location->id)
            ->where('settlement_date', $dateString)
            ->first();

        if ($existing && $existing->status !== 'pending') {
            Log::info('Settlement already exists for location', [
                'location_id' => $location->id,
                'date' => $dateString,
                'status' => $existing->status,
            ]);
            return;
        }

        // Get all completed payments for this date and location
        $payments = Payment::query()
            ->whereHas('invoice', function ($q) use ($location) {
                $q->where('location_id', $location->id);
            })
            ->where('status', Payment::STATUS_COMPLETED)
            ->whereDate('processed_at', $this->date)
            ->with(['paymentMethod', 'refunds' => function ($q) {
                $q->where('status', 'completed');
            }])
            ->get();

        // Calculate totals
        $totals = $this->calculateTotals($payments);

        // Get order count
        $orderIds = $payments->map(fn($p) => $p->invoice?->order_id)->filter()->unique();

        // Create or update settlement
        $settlement = DailySettlement::updateOrCreate(
            [
                'location_id' => $location->id,
                'settlement_date' => $dateString,
            ],
            [
                'total_orders' => $orderIds->count(),
                'total_revenue' => $totals['total_revenue'],
                'total_refunds' => $totals['total_refunds'],
                'net_revenue' => $totals['net_revenue'],
                'cash_total' => $totals['cash_total'],
                'card_total' => $totals['card_total'],
                'qr_total' => $totals['qr_total'],
                'other_total' => $totals['other_total'],
                'usd_total' => $totals['usd_total'],
                'khr_total' => $totals['khr_total'],
                'status' => 'pending',
            ]
        );

        Log::info('Settlement created', [
            'settlement_id' => $settlement->id,
            'location_id' => $location->id,
            'net_revenue' => $totals['net_revenue'],
        ]);
    }

    /**
     * Calculate totals from payments.
     */
    protected function calculateTotals($payments): array
    {
        $totals = [
            'total_revenue' => 0,
            'total_refunds' => 0,
            'net_revenue' => 0,
            'cash_total' => 0,
            'card_total' => 0,
            'qr_total' => 0,
            'other_total' => 0,
            'usd_total' => 0,
            'khr_total' => 0,
        ];

        foreach ($payments as $payment) {
            $amount = (float) $payment->amount;
            $refunds = $payment->refunds->sum('amount');

            $totals['total_revenue'] += $amount;
            $totals['total_refunds'] += $refunds;

            // By payment method
            $methodCode = $payment->paymentMethod?->code ?? 'other';
            switch ($methodCode) {
                case 'cash':
                    $totals['cash_total'] += $amount;
                    break;
                case 'card':
                case 'credit_card':
                case 'debit_card':
                    $totals['card_total'] += $amount;
                    break;
                case 'qr':
                case 'qrkh':
                case 'aba':
                    $totals['qr_total'] += $amount;
                    break;
                default:
                    $totals['other_total'] += $amount;
            }

            // By currency
            if (strtoupper($payment->currency ?? 'USD') === 'KHR') {
                $totals['khr_total'] += $amount;
            } else {
                $totals['usd_total'] += $amount;
            }
        }

        $totals['net_revenue'] = $totals['total_revenue'] - $totals['total_refunds'];

        return $totals;
    }
}
