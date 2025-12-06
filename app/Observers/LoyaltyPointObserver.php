<?php

namespace App\Observers;

use App\Models\LoyaltyPoint;
use App\Models\Customer;

class LoyaltyPointObserver
{
    /**
     * Handle the LoyaltyPoint "created" event.
     */
    public function created(LoyaltyPoint $loyaltyPoint): void
    {
        // Update customer's points_balance to the latest balance_after
        if ($loyaltyPoint->customer_id) {
            $customer = Customer::find($loyaltyPoint->customer_id);
            if ($customer) {
                // Get the latest loyalty point record for this customer
                $latestBalance = LoyaltyPoint::where('customer_id', $loyaltyPoint->customer_id)
                    ->latest('occurred_at')
                    ->first();
                
                if ($latestBalance) {
                    // Ensure balance never goes below 0
                    $customer->points_balance = max(0, $latestBalance->balance_after);
                    $customer->save();
                }
            }
        }
    }

    /**
     * Handle the LoyaltyPoint "updated" event.
     */
    public function updated(LoyaltyPoint $loyaltyPoint): void
    {
        // Update customer's points_balance when a loyalty point is updated
        if ($loyaltyPoint->customer_id) {
            $customer = Customer::find($loyaltyPoint->customer_id);
            if ($customer) {
                // Get the latest loyalty point record for this customer
                $latestBalance = LoyaltyPoint::where('customer_id', $loyaltyPoint->customer_id)
                    ->latest('occurred_at')
                    ->first();
                
                if ($latestBalance) {
                    // Ensure balance never goes below 0
                    $customer->points_balance = max(0, $latestBalance->balance_after);
                    $customer->save();
                }
            }
        }
    }

    /**
     * Handle the LoyaltyPoint "deleted" event.
     */
    public function deleted(LoyaltyPoint $loyaltyPoint): void
    {
        // Recalculate customer's points_balance after deletion
        if ($loyaltyPoint->customer_id) {
            $customer = Customer::find($loyaltyPoint->customer_id);
            if ($customer) {
                // Get the latest loyalty point record for this customer
                $latestBalance = LoyaltyPoint::where('customer_id', $loyaltyPoint->customer_id)
                    ->latest('occurred_at')
                    ->first();
                
                if ($latestBalance) {
                    // Ensure balance never goes below 0
                    $customer->points_balance = max(0, $latestBalance->balance_after);
                    $customer->save();
                } else {
                    // No more records, reset to 0
                    $customer->points_balance = 0;
                    $customer->save();
                }
            }
        }
    }
}
