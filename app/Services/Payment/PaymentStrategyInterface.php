<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Payment;

interface PaymentStrategyInterface
{
    /**
     * Initiate the payment process.
     * Can perform external API calls or specific setup.
     */
    public function initiate(Order $order, Payment $payment): void;

    /**
     * Format the payment response for the frontend.
     */
    public function formatResponse(Payment $payment, Order $order): array;
    
    /**
     * Get the code for this strategy.
     */
    public function getCode(): string;
}
