<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ __('receipts.payment.title', ['number' => $receipt_number]) }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            background: #fff;
        }
        
        .receipt {
            max-width: 400px;
            margin: 0 auto;
            padding: 30px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
        }
        
        .business-name {
            font-size: 24px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 5px;
        }
        
        .business-info {
            font-size: 11px;
            color: #666;
        }
        
        .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .receipt-info-item {
            text-align: center;
        }
        
        .receipt-info-label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
        }
        
        .receipt-info-value {
            font-size: 12px;
            font-weight: bold;
        }
        
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            margin: 15px 0 10px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #ddd;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .items-table th {
            text-align: left;
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
        }
        
        .items-table th:last-child,
        .items-table td:last-child {
            text-align: right;
        }
        
        .items-table td {
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .item-name {
            font-weight: 500;
        }
        
        .item-quantity {
            color: #666;
            font-size: 11px;
        }
        
        .totals {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #333;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        
        .totals-row.subtotal {
            color: #666;
        }
        
        .totals-row.discount {
            color: #28a745;
        }
        
        .totals-row.grand-total {
            font-size: 16px;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #ddd;
        }
        
        .payment-info {
            margin-top: 20px;
            padding: 15px;
            background: #f0f7ff;
            border-radius: 5px;
        }
        
        .payment-method {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .payment-method-label {
            font-weight: bold;
        }
        
        .payment-status {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .payment-status.completed {
            background: #d4edda;
            color: #155724;
        }
        
        .payment-status.pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .cash-details {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #cce5ff;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            padding-top: 20px;
            border-top: 2px solid #333;
        }
        
        .thank-you {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .footer-text {
            font-size: 11px;
            color: #666;
        }
        
        .transaction-id {
            margin-top: 10px;
            font-size: 9px;
            color: #999;
            font-family: monospace;
        }
        
        @media print {
            body {
                background: white;
            }
            .receipt {
                max-width: 100%;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <!-- Header -->
        <div class="header">
            <div class="business-name">{{ $business_name }}</div>
            <div class="business-info">
                @if($location_name){{ $location_name }}<br>@endif
                {{ $business_address }}
                @if($business_phone)<br>{{ __('receipts.payment.tel') }} {{ $business_phone }}@endif
            </div>
        </div>
        
        <!-- Receipt Info -->
        <div class="receipt-info">
            <div class="receipt-info-item">
                <div class="receipt-info-label">{{ __('receipts.payment.receipt_number') }}</div>
                <div class="receipt-info-value">{{ $receipt_number }}</div>
            </div>
            <div class="receipt-info-item">
                <div class="receipt-info-label">{{ __('receipts.payment.date') }}</div>
                <div class="receipt-info-value">{{ $receipt_date->format('M d, Y') }}</div>
            </div>
            <div class="receipt-info-item">
                <div class="receipt-info-label">{{ __('receipts.payment.time') }}</div>
                <div class="receipt-info-value">{{ $receipt_date->format('h:i A') }}</div>
            </div>
        </div>
        
        @if($order_number)
        <div style="margin-bottom: 15px;">
            <strong>{{ __('receipts.payment.order') }}:</strong> #{{ $order_number }}
            @if($table_number) | <strong>{{ __('receipts.payment.table') }}:</strong> {{ $table_number }}@endif
            @if($order_type)
                @php
                    $orderTypeKey = 'order_type.' . $order_type;
                    $orderTypeLabel = __($orderTypeKey);
                    if ($orderTypeLabel === $orderTypeKey) {
                        $orderTypeLabel = ucfirst($order_type);
                    }
                @endphp
                | <strong>{{ __('receipts.payment.type') }}:</strong> {{ $orderTypeLabel }}
            @endif
        </div>
        @endif
        
        @if($customer_name)
        <div style="margin-bottom: 15px;">
            <strong>{{ __('receipts.payment.customer') }}:</strong> {{ $customer_name }}
            @if($customer_phone) ({{ $customer_phone }})@endif
        </div>
        @endif
        
        <!-- Items -->
        <div class="section-title">{{ __('receipts.payment.order_items') }}</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>{{ __('receipts.payment.item') }}</th>
                    <th>{{ __('receipts.payment.qty') }}</th>
                    <th>{{ __('receipts.payment.price') }}</th>
                    <th>{{ __('receipts.payment.total') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                <tr>
                    <td>
                        <div class="item-name">{{ $item['name'] }}</div>
                        @if($item['notes'])<div class="item-quantity">{{ $item['notes'] }}</div>@endif
                    </td>
                    <td>{{ $item['quantity'] }}</td>
                    <td>${{ number_format($item['unit_price'], 2) }}</td>
                    <td>${{ number_format($item['total'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        
        <!-- Totals -->
        <div class="totals">
            <div class="totals-row subtotal">
                <span>{{ __('receipts.payment.subtotal') }}</span>
                <span>${{ number_format($subtotal, 2) }}</span>
            </div>
            
            @if($tax_amount > 0)
            <div class="totals-row subtotal">
                <span>{{ __('receipts.payment.tax', ['rate' => $tax_rate]) }}</span>
                <span>${{ number_format($tax_amount, 2) }}</span>
            </div>
            @endif
            
            @if($service_charge > 0)
            <div class="totals-row subtotal">
                <span>{{ __('receipts.payment.service_charge') }}</span>
                <span>${{ number_format($service_charge, 2) }}</span>
            </div>
            @endif
            
            @if($discount_amount > 0)
            <div class="totals-row discount">
                <span>{{ __('receipts.payment.discount') }}</span>
                <span>-${{ number_format($discount_amount, 2) }}</span>
            </div>
            @endif
            
            <div class="totals-row grand-total">
                <span>{{ __('receipts.payment.total') }}</span>
                <span>${{ number_format($total_amount, 2) }}</span>
            </div>
        </div>
        
        <!-- Payment Info -->
        <div class="payment-info">
            <div class="payment-method">
                <span class="payment-method-label">{{ $payment_method }}</span>
                @php
                    $paymentStatusKey = 'receipts.payment.status.' . $payment_status;
                    $paymentStatusLabel = __($paymentStatusKey);
                    if ($paymentStatusLabel === $paymentStatusKey) {
                        $paymentStatusLabel = ucfirst($payment_status);
                    }
                @endphp
                <span class="payment-status {{ $payment_status }}">{{ $paymentStatusLabel }}</span>
            </div>
            <div style="margin-top: 10px;">
                <strong>{{ __('receipts.payment.amount_paid') }}:</strong> ${{ number_format($amount_paid, 2) }} {{ $currency }}
            </div>
            
            @if($cash_received)
            <div class="cash-details">
                <div class="totals-row">
                    <span>{{ __('receipts.payment.cash_received') }}</span>
                    <span>${{ number_format($cash_received, 2) }}</span>
                </div>
                @if($change_given)
                <div class="totals-row">
                    <span>{{ __('receipts.payment.change') }}</span>
                    <span>${{ number_format($change_given, 2) }}</span>
                </div>
                @endif
            </div>
            @endif
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="thank-you">{{ $thank_you_message }}</div>
            <div class="footer-text">{{ $footer_text }}</div>
            @if($transaction_id)
            <div class="transaction-id">{{ __('receipts.payment.transaction_label') }} {{ $transaction_id }}</div>
            @endif
        </div>
    </div>
</body>
</html>
