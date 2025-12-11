<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Receipt - {{ $receipt_number }}</title>
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
                @if($business_phone)<br>Tel: {{ $business_phone }}@endif
            </div>
        </div>
        
        <!-- Receipt Info -->
        <div class="receipt-info">
            <div class="receipt-info-item">
                <div class="receipt-info-label">Receipt #</div>
                <div class="receipt-info-value">{{ $receipt_number }}</div>
            </div>
            <div class="receipt-info-item">
                <div class="receipt-info-label">Date</div>
                <div class="receipt-info-value">{{ $receipt_date->format('M d, Y') }}</div>
            </div>
            <div class="receipt-info-item">
                <div class="receipt-info-label">Time</div>
                <div class="receipt-info-value">{{ $receipt_date->format('h:i A') }}</div>
            </div>
        </div>
        
        @if($order_number)
        <div style="margin-bottom: 15px;">
            <strong>Order:</strong> #{{ $order_number }}
            @if($table_number) | <strong>Table:</strong> {{ $table_number }}@endif
            @if($order_type) | <strong>Type:</strong> {{ ucfirst($order_type) }}@endif
        </div>
        @endif
        
        @if($customer_name)
        <div style="margin-bottom: 15px;">
            <strong>Customer:</strong> {{ $customer_name }}
            @if($customer_phone) ({{ $customer_phone }})@endif
        </div>
        @endif
        
        <!-- Items -->
        <div class="section-title">Order Items</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
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
                <span>Subtotal</span>
                <span>${{ number_format($subtotal, 2) }}</span>
            </div>
            
            @if($tax_amount > 0)
            <div class="totals-row subtotal">
                <span>Tax ({{ $tax_rate }}%)</span>
                <span>${{ number_format($tax_amount, 2) }}</span>
            </div>
            @endif
            
            @if($service_charge > 0)
            <div class="totals-row subtotal">
                <span>Service Charge</span>
                <span>${{ number_format($service_charge, 2) }}</span>
            </div>
            @endif
            
            @if($discount_amount > 0)
            <div class="totals-row discount">
                <span>Discount</span>
                <span>-${{ number_format($discount_amount, 2) }}</span>
            </div>
            @endif
            
            <div class="totals-row grand-total">
                <span>Total</span>
                <span>${{ number_format($total_amount, 2) }}</span>
            </div>
        </div>
        
        <!-- Payment Info -->
        <div class="payment-info">
            <div class="payment-method">
                <span class="payment-method-label">{{ $payment_method }}</span>
                <span class="payment-status {{ $payment_status }}">{{ ucfirst($payment_status) }}</span>
            </div>
            <div style="margin-top: 10px;">
                <strong>Amount Paid:</strong> ${{ number_format($amount_paid, 2) }} {{ $currency }}
            </div>
            
            @if($cash_received)
            <div class="cash-details">
                <div class="totals-row">
                    <span>Cash Received</span>
                    <span>${{ number_format($cash_received, 2) }}</span>
                </div>
                @if($change_given)
                <div class="totals-row">
                    <span>Change</span>
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
            <div class="transaction-id">TXN: {{ $transaction_id }}</div>
            @endif
        </div>
    </div>
</body>
</html>
