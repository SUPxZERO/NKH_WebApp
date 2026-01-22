<?php

namespace App\Services;

use App\Models\DiningTable;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class TableStatusService
{
    public function assertTableUsableForSeating(DiningTable $table): void
    {
        if ($table->status === DiningTable::STATUS_UNAVAILABLE) {
            abort(409, 'Table is unavailable.');
        }

        if ($table->status === DiningTable::STATUS_RESERVED) {
            abort(409, 'Table is reserved.');
        }

        if ($table->status === DiningTable::STATUS_OCCUPIED) {
            abort(409, 'Table is occupied.');
        }
    }

    public function occupyForStaff(DiningTable $table, ?int $actorUserId = null): void
    {
        if ($table->status === DiningTable::STATUS_UNAVAILABLE) {
            abort(409, 'Table is unavailable.');
        }

        if ($table->status === DiningTable::STATUS_RESERVED) {
            abort(409, 'Table is reserved.');
        }

        if ($table->status !== DiningTable::STATUS_AVAILABLE) {
            abort(409, 'Table is not available.');
        }

        $table->update(['status' => DiningTable::STATUS_OCCUPIED]);

        Log::info('Table marked occupied (staff)', [
            'table_id' => $table->id,
            'actor_user_id' => $actorUserId,
        ]);
    }

    public function occupyForOrder(DiningTable $table, Order $order, ?int $actorUserId = null): void
    {
        $this->occupyForStaff($table, $actorUserId);

        Log::info('Table marked occupied (order)', [
            'table_id' => $table->id,
            'order_id' => $order->id,
            'actor_user_id' => $actorUserId,
        ]);
    }

    public function occupyForQrScan(DiningTable $table, ?int $actorUserId = null): void
    {
        if ($table->status === DiningTable::STATUS_UNAVAILABLE) {
            abort(409, 'Table is unavailable.');
        }

        if ($table->status === DiningTable::STATUS_RESERVED) {
            abort(409, 'Table is reserved.');
        }

        if ($table->status === DiningTable::STATUS_AVAILABLE) {
            $table->update(['status' => DiningTable::STATUS_OCCUPIED]);

            Log::info('Table marked occupied (qr_scan)', [
                'table_id' => $table->id,
                'actor_user_id' => $actorUserId,
            ]);
        }
    }

    public function setStatusManually(DiningTable $table, string $status, ?int $actorUserId = null): void
    {
        if (!in_array($status, [
            DiningTable::STATUS_AVAILABLE,
            DiningTable::STATUS_RESERVED,
            DiningTable::STATUS_OCCUPIED,
            DiningTable::STATUS_UNAVAILABLE,
        ], true)) {
            abort(422, 'Invalid table status.');
        }

        $table->update(['status' => $status]);

        Log::info('Table status updated (manual)', [
            'table_id' => $table->id,
            'status' => $status,
            'actor_user_id' => $actorUserId,
        ]);
    }

    public function attemptResetStatus(DiningTable $table, ?int $actorUserId = null, array $context = []): bool
    {
        $fromStatus = $table->status;
        $released = $table->resetStatus();

        Log::info('Table resetStatus attempted', array_merge([
            'table_id' => $table->id,
            'actor_user_id' => $actorUserId,
            'from_status' => $fromStatus,
            'released' => $released,
        ], $context));

        return $released;
    }

    public function completeAndReleaseAfterPayment(Order $order, ?int $actorUserId = null): void
    {
        $order->load(['invoice', 'table']);

        if (!$order->table) {
            return;
        }

        if (!$order->invoice || (float) $order->invoice->amount_due > 0) {
            return;
        }

        if ($order->status !== 'completed') {
            $order->setStatus('completed');
            $order->completed_at = now();
            $order->save();
        }

        $this->attemptResetStatus($order->table, $actorUserId, [
            'order_id' => $order->id,
            'source' => 'payment_release',
        ]);
    }

    public function releaseTableAfterPayment(Order $order, ?int $actorUserId = null): void
    {
        $this->completeAndReleaseAfterPayment($order, $actorUserId);
    }
}
