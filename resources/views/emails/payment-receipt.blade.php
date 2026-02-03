<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ __('emails.receipt.title') }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            margin: 0;
            padding: 20px;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            margin: 0 0 10px;
            font-size: 24px;
        }

        .header p {
            margin: 0;
            opacity: 0.9;
        }

        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
            margin-top: 15px;
        }

        .status-badge.completed {
            background: rgba(255, 255, 255, 0.2);
        }

        .content {
            padding: 30px;
        }

        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }

        .order-summary {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }

        .summary-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e9ecef;
        }

        .summary-title {
            font-weight: bold;
            color: #667eea;
        }

        .item-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }

        .item-name {
            flex: 1;
        }

        .item-quantity {
            color: #666;
            margin: 0 15px;
        }

        .item-price {
            font-weight: 500;
        }

        .totals-section {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }

        .total-row.grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #667eea;
        }

        .payment-details {
            background: #e8f4fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }

        .payment-method {
            font-weight: bold;
            font-size: 16px;
            color: #0066cc;
            margin-bottom: 10px;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 14px;
        }

        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #666;
        }

        .footer-logo {
            font-weight: bold;
            font-size: 18px;
            color: #667eea;
            margin-bottom: 10px;
        }

        .social-links {
            margin: 15px 0;
        }

        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #667eea;
            text-decoration: none;
        }

        .small-text {
            font-size: 12px;
            color: #999;
        }

        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
    </style>
</head>

<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>{{ $receipt['business_name'] }}</h1>
            <p>{{ __('emails.receipt.title') }}</p>
            <div class="status-badge {{ $receipt['payment_status'] }}">
                ✓ {{ __('emails.receipt.payment_status', ['status' => ucfirst($receipt['payment_status'])]) }}
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                @if($receipt['customer_name'])
                    {{ __('emails.receipt.hi', ['name' => $receipt['customer_name']]) }}
                @else
                    {{ __('emails.receipt.hello') }}
                @endif
                <br>
                {{ __('emails.receipt.thank_you') }}
            </div>

            <!-- Order Summary -->
            <div class="order-summary">
                <div class="summary-header">
                    <span
                        class="summary-title">{{ __('emails.receipt.order_number') }}{{ $receipt['order_number'] ?? $receipt['receipt_number'] }}</span>
                    <span>{{ $receipt['receipt_date']->format('M d, Y h:i A') }}</span>
                </div>

                <!-- Items -->
                @foreach($receipt['items'] as $item)
                    <div class="item-row">
                        <span class="item-name">{{ $item['name'] }}</span>
                        <span class="item-quantity">x{{ $item['quantity'] }}</span>
                        <span class="item-price">${{ number_format($item['total'], 2) }}</span>
                    </div>
                @endforeach

                <!-- Totals -->
                <div class="totals-section">
                    <div class="total-row">
                        <span>{{ __('emails.receipt.subtotal') }}</span>
                        <span>${{ number_format($receipt['subtotal'], 2) }}</span>
                    </div>

                    @if($receipt['tax_amount'] > 0)
                        <div class="total-row">
                            <span>{{ __('emails.receipt.tax') }} ({{ $receipt['tax_rate'] }}%)</span>
                            <span>${{ number_format($receipt['tax_amount'], 2) }}</span>
                        </div>
                    @endif

                    @if($receipt['discount_amount'] > 0)
                        <div class="total-row" style="color: #28a745;">
                            <span>{{ __('emails.receipt.discount') }}</span>
                            <span>-${{ number_format($receipt['discount_amount'], 2) }}</span>
                        </div>
                    @endif

                    <div class="total-row grand-total">
                        <span>{{ __('emails.receipt.total_paid') }}</span>
                        <span>${{ number_format($receipt['total_amount'], 2) }}</span>
                    </div>
                </div>
            </div>

            <!-- Payment Details -->
            <div class="payment-details">
                <div class="payment-method">
                    💳 {{ $receipt['payment_method'] }}
                </div>
                <div class="detail-row">
                    <span>{{ __('emails.receipt.receipt_number') }}</span>
                    <span>{{ $receipt['receipt_number'] }}</span>
                </div>
                @if($receipt['transaction_id'])
                    <div class="detail-row">
                        <span>{{ __('emails.receipt.transaction_id') }}</span>
                        <span style="font-family: monospace;">{{ $receipt['transaction_id'] }}</span>
                    </div>
                @endif
                <div class="detail-row">
                    <span>{{ __('emails.receipt.amount') }}</span>
                    <span>${{ number_format($receipt['amount_paid'], 2) }} {{ $receipt['currency'] }}</span>
                </div>
            </div>

            <p>{{ __('emails.receipt.pdf_copy') }}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-logo">{{ $receipt['business_name'] }}</div>
            <p>{{ $receipt['business_address'] }}</p>
            @if($receipt['business_phone'])
                <p>{{ __('emails.receipt.tel') }} {{ $receipt['business_phone'] }}</p>
            @endif

            <p style="margin-top: 20px;">{{ $receipt['thank_you_message'] }}</p>

            <p class="small-text" style="margin-top: 20px;">
                {{ __('emails.receipt.automated_message') }}
            </p>
        </div>
    </div>
</body>

</html>