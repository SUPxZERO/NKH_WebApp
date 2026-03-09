<?php

namespace App\Services\Telegram;

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\TelegramUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TelegramCustomerService
{
    /**
     * Create or retrieve a Customer for a TelegramUser
     * 
     * @param TelegramUser $telegramUser
     * @param array $telegramData Raw data from Telegram update (optional)
     * @return Customer
     */
    public function createForTelegramUser(TelegramUser $telegramUser, array $telegramData = []): Customer
    {
        if ($telegramUser->customer_id) {
            return $telegramUser->customer;
        }

        return DB::transaction(function () use ($telegramUser, $telegramData) {
            // 1. Create Customer Record
            $firstName = $telegramData['first_name'] ?? $telegramUser->first_name ?? '';
            $lastName = $telegramData['last_name'] ?? $telegramUser->last_name ?? '';
            $displayName = trim("{$firstName} {$lastName}") ?: 'Telegram User';

            $customer = Customer::create([
                'user_id' => null, // No web login record yet
                'name' => $displayName,
                'phone' => $telegramUser->phone_number,
                'email' => null, // Telegram doesn't provide email by default
                'preferred_language' => $telegramData['language_code'] ?? $telegramUser->language_code ?? 'en',
                'customer_code' => Customer::generateCustomerCode('TG'),
                'customer_tier' => 'bronze',
                'points_balance' => 0,
                'total_spent' => 0,
                'visit_count' => 0,
                'marketing_consent' => true,
                'is_active' => true,
            ]);

            // 2. Link TelegramUser to Customer
            $telegramUser->update(['customer_id' => $customer->id]);

            // 3. Migrate any existing data (if this was a guest user previously)
            $this->migrateGuestData($telegramUser, $customer);

            Log::info("Created Customer #{$customer->id} for Telegram ID {$telegramUser->telegram_id}");

            return $customer;
        });
    }

    /**
     * Migrate guest data (orders, addresses) to the new Customer record
     */
    protected function migrateGuestData(TelegramUser $telegramUser, Customer $customer): void
    {
        // Migrate Orders
        Order::where('telegram_user_id', $telegramUser->id)
            ->whereNull('customer_id')
            ->update(['customer_id' => $customer->id]);

        // Migrate Addresses
        CustomerAddress::where('telegram_user_id', $telegramUser->id)
            ->whereNull('customer_id')
            ->update(['customer_id' => $customer->id]);

        // Migrate Cart (if stored in DB tables, though currently in conversation_data)
        // If we had a structural cart table, we'd migrate it here.
    }

    /**
     * Update Customer phone when Telegram User shares contact
     */
    public function updateCustomerPhone(TelegramUser $telegramUser, string $phoneNumber): void
    {
        if ($telegramUser->customer_id) {
            $customer = $telegramUser->customer;
            // Only update if customer phone is empty or different
            if (empty($customer->phone) || $customer->phone !== $phoneNumber) {
                $customer->update(['phone' => $phoneNumber]);
            }
        }

        $telegramUser->update(['phone_number' => $phoneNumber]);
    }
}
