<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Log any customer_requests that have an order_id
        $requestsWithOrders = DB::table('customer_requests')
            ->whereNotNull('order_id')
            ->get();

        foreach ($requestsWithOrders as $request) {
            $order = DB::table('orders')->where('id', $request->order_id)->first();
            
            if ($order) {
                // Sync approval status from customer_request to order if needed
                $needsUpdate = false;
                $updateData = [];

                // Map customer_request status to order approval_status
                if ($request->status === 'resolved' && $order->approval_status === 'pending') {
                    $updateData['approval_status'] = 'approved';
                    $updateData['approved_at'] = $request->resolved_at ?? now();
                    $needsUpdate = true;
                } elseif ($request->status === 'closed' && $order->approval_status === 'pending') {
                    $updateData['approval_status'] = 'rejected';
                    $updateData['rejection_reason'] = $request->resolution ?? 'Request closed';
                    $needsUpdate = true;
                }

                // Add admin notes to rejection_reason if present
                if (!empty($request->admin_notes) && empty($order->rejection_reason)) {
                    $updateData['rejection_reason'] = $request->admin_notes;
                    $needsUpdate = true;
                }

                if ($needsUpdate) {
                    DB::table('orders')
                        ->where('id', $order->id)
                        ->update($updateData);
                }
            }
        }

        // Step 2: Log orphaned customer_requests (no order_id)
        $orphanedRequests = DB::table('customer_requests')
            ->whereNull('order_id')
            ->get();

        if ($orphanedRequests->count() > 0) {
            \Log::warning('Found ' . $orphanedRequests->count() . ' orphaned customer_requests without order_id. These will be deleted.');
            // Export to backup file before deletion
            $backupPath = storage_path('logs/orphaned_customer_requests_backup.json');
            file_put_contents(
                $backupPath,
                json_encode($orphanedRequests, JSON_PRETTY_PRINT)
            );
            \Log::info('Orphaned customer_requests backed up to: ' . $backupPath);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse this data migration
        throw new \Exception('This migration cannot be reversed. Restore from backup if needed.');
    }
};
