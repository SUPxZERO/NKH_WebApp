<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <title>{{ __('receipts.thermal.title') }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.3;
            width: 80mm;
            padding: 5mm;
            background: white;
        }
        
        .center {
            text-align: center;
        }
        
        .bold {
            font-weight: bold;
        }
        
        .line {
            border-top: 1px dashed #000;
            margin: 5px 0;
        }
        
        .double-line {
            border-top: 2px solid #000;
            margin: 5px 0;
        }
        
        .business-name {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .row {
            display: flex;
            justify-content: space-between;
        }
        
        .item-row {
            margin: 3px 0;
        }
        
        .item-name {
            display: block;
        }
        
        .item-details {
            display: flex;
            justify-content: space-between;
            padding-left: 10px;
            color: #444;
        }
        
        .total-row {
            font-weight: bold;
            font-size: 14px;
            margin-top: 5px;
        }
        
        .small {
            font-size: 10px;
        }
        
        .spacing {
            margin: 8px 0;
        }
        
        @media print {
            @page {
                size: 80mm auto;
                margin: 0;
            }
            body {
                width: 80mm;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="center spacing">
        <div class="business-name">{{ $business_name }}</div>
        @if($location_name)<div>{{ $location_name }}</div>@endif
        <div class="small">{{ $business_address }}</div>
        @if($business_phone)<div class="small">{{ __('receipts.thermal.tel') }} {{ $business_phone }}</div>@endif
    </div>
    
    <div class="double-line"></div>
    
    <!-- Receipt Info -->
    <div class="row">
        <span>{{ __('receipts.thermal.receipt') }}:</span>
        <span>{{ $receipt_number }}</span>
    </div>
    <div class="row">
        <span>{{ __('receipts.thermal.date') }}:</span>
        <span>{{ $receipt_date->format('d/m/Y H:i') }}</span>
    </div>
    @if($order_number)
    <div class="row">
        <span>{{ __('receipts.thermal.order') }}:</span>
        <span>#{{ $order_number }}</span>
    </div>
    @endif
    @if($table_number)
    <div class="row">
        <span>{{ __('receipts.thermal.table') }}:</span>
        <span>{{ $table_number }}</span>
    </div>
    @endif
    
    <div class="line"></div>
    
    <!-- Items -->
    @foreach($items as $item)
    <div class="item-row">
        <div class="item-name">{{ $item['name'] }}</div>
        <div class="item-details">
            <span>{{ $item['quantity'] }} x ${{ number_format($item['unit_price'], 2) }}</span>
            <span>${{ number_format($item['total'], 2) }}</span>
        </div>
    </div>
    @endforeach
    
    <div class="line"></div>
    
    <!-- Totals -->
    <div class="row">
        <span>{{ __('receipts.thermal.subtotal') }}:</span>
        <span>${{ number_format($subtotal, 2) }}</span>
    </div>
    @if($tax_amount > 0)
    <div class="row">
        <span>{{ __('receipts.thermal.tax', ['rate' => $tax_rate]) }}:</span>
        <span>${{ number_format($tax_amount, 2) }}</span>
    </div>
    @endif
    @if($service_charge > 0)
    <div class="row">
        <span>{{ __('receipts.thermal.service_charge') }}:</span>
        <span>${{ number_format($service_charge, 2) }}</span>
    </div>
    @endif
    @if($discount_amount > 0)
    <div class="row">
        <span>{{ __('receipts.thermal.discount') }}:</span>
        <span>-${{ number_format($discount_amount, 2) }}</span>
    </div>
    @endif
    
    <div class="double-line"></div>
    
    <div class="row total-row">
        <span>{{ __('receipts.thermal.total') }}:</span>
        <span>${{ number_format($total_amount, 2) }}</span>
    </div>
    
    <div class="line"></div>
    
    <!-- Payment -->
    <div class="row">
        <span>{{ __('receipts.thermal.payment') }}:</span>
        <span>{{ $payment_method }}</span>
    </div>
    <div class="row">
        <span>{{ __('receipts.thermal.paid') }}:</span>
        <span>${{ number_format($amount_paid, 2) }}</span>
    </div>
    @if($cash_received)
    <div class="row">
        <span>{{ __('receipts.thermal.cash') }}:</span>
        <span>${{ number_format($cash_received, 2) }}</span>
    </div>
    @endif
    @if($change_given)
    <div class="row bold">
        <span>{{ __('receipts.thermal.change') }}:</span>
        <span>${{ number_format($change_given, 2) }}</span>
    </div>
    @endif
    
    <div class="double-line"></div>
    
    <!-- Footer -->
    <div class="center spacing">
        <div class="bold">{{ $thank_you_message }}</div>
        <div class="small">{{ $footer_text }}</div>
        @if($transaction_id)
        <div class="small" style="margin-top: 5px;">{{ __('receipts.thermal.transaction_label') }} {{ $transaction_id }}</div>
        @endif
    </div>
    
    <div class="spacing"></div>
</body>
</html>
