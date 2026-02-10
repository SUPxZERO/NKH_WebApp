<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ __('finance.invoices.pdf.title', ['number' => $invoice_number]) }}</title>
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

        .invoice {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }

        .company-info h1 {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .company-info p {
            color: #7f8c8d;
            font-size: 12px;
        }

        .invoice-details {
            text-align: right;
        }

        .invoice-details h2 {
            font-size: 20px;
            color: #7f8c8d;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .invoice-meta-table {
            float: right;
        }

        .invoice-meta-table td {
            padding: 2px 10px;
            text-align: right;
        }

        .invoice-meta-label {
            color: #7f8c8d;
            font-weight: bold;
        }

        .bill-to {
            margin-bottom: 30px;
        }

        .bill-to h3 {
            font-size: 14px;
            color: #7f8c8d;
            text-transform: uppercase;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            width: 50%;
        }

        .customer-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .items-table th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            color: #2c3e50;
            text-transform: uppercase;
            font-size: 11px;
            border-bottom: 2px solid #ddd;
        }

        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .totals-section {
            display: flex;
            justify-content: flex-end;
        }

        .totals-table {
            width: 300px;
            border-collapse: collapse;
            float: right;
        }

        .totals-table td {
            padding: 8px;
            text-align: right;
        }

        .totals-label {
            color: #7f8c8d;
            font-weight: bold;
        }

        .totals-value {
            font-weight: bold;
            color: #2c3e50;
        }

        .grand-total {
            font-size: 16px;
            border-top: 2px solid #2c3e50;
            margin-top: 10px;
        }

        .payment-status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 15px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
            margin-top: 10px;
        }

        .status-paid {
            background: #d4edda;
            color: #155724;
        }

        .status-unpaid {
            background: #f8d7da;
            color: #721c24;
        }

        .status-partial {
            background: #fff3cd;
            color: #856404;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #95a5a6;
            font-size: 11px;
        }
    </style>
</head>

<body>
    <div class="invoice">
        <div class="header">
            <div class="company-info">
                <h1>{{ $company_name }}</h1>
                <p>{{ $company_address }}</p>
                @if($company_phone)
                <p>{{ __('finance.invoices.pdf.tel') }} {{ $company_phone }}</p>@endif
            </div>
            <div class="invoice-details">
                <h2>{{ __('finance.invoices.pdf.invoice') }}</h2>
                <table class="invoice-meta-table">
                    <tr>
                        <td class="invoice-meta-label">{{ __('finance.invoices.pdf.invoice_number') }}:</td>
                        <td>{{ $invoice_number }}</td>
                    </tr>
                    <tr>
                        <td class="invoice-meta-label">{{ __('finance.invoices.pdf.date') }}:</td>
                        <td>{{ $issued_date }}</td>
                    </tr>
                    @if($order_ref)
                        <tr>
                            <td class="invoice-meta-label">{{ __('finance.invoices.pdf.order_ref') }}:</td>
                            <td>#{{ $order_ref }}</td>
                        </tr>
                    @endif
                </table>
            </div>
        </div>

        <div class="bill-to">
            <h3>{{ __('finance.invoices.pdf.bill_to') }}</h3>
            <div class="customer-name">{{ $customer_name }}</div>
            @if($customer_email)
            <div>{{ $customer_email }}</div>@endif
            @if($customer_phone)
            <div>{{ $customer_phone }}</div>@endif
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%;">{{ __('finance.invoices.pdf.description') }}</th>
                    <th class="text-center">{{ __('finance.invoices.pdf.quantity') }}</th>
                    <th class="text-right">{{ __('finance.invoices.pdf.unit_price') }}</th>
                    <th class="text-right">{{ __('finance.invoices.pdf.total') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                    <tr>
                        <td>
                            <strong>{{ $item['name'] }}</strong>
                            @if($item['notes'])<br><span
                            style="color: #999; font-size: 11px;">{{ $item['notes'] }}</span>@endif
                        </td>
                        <td class="text-center">{{ $item['quantity'] }}</td>
                        <td class="text-right">{{ $currency }}{{ number_format($item['price'], 2) }}</td>
                        <td class="text-right">{{ $currency }}{{ number_format($item['total'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="totals-label">{{ __('finance.invoices.pdf.subtotal') }}:</td>
                    <td class="totals-value">{{ $currency }}{{ number_format($subtotal, 2) }}</td>
                </tr>
                @if($tax > 0)
                    <tr>
                        <td class="totals-label">{{ __('finance.invoices.pdf.tax') }}:</td>
                        <td class="totals-value">{{ $currency }}{{ number_format($tax, 2) }}</td>
                    </tr>
                @endif
                @if($discount > 0)
                    <tr>
                        <td class="totals-label">{{ __('finance.invoices.pdf.discount') }}:</td>
                        <td class="totals-value" style="color: #27ae60;">-{{ $currency }}{{ number_format($discount, 2) }}
                        </td>
                    </tr>
                @endif
                <tr class="grand-total">
                    <td class="totals-label">{{ __('finance.invoices.pdf.total') }}:</td>
                    <td class="totals-value">{{ $currency }}{{ number_format($total, 2) }}</td>
                </tr>
                <tr>
                    <td colspan="2" class="text-right">
                        <span class="payment-status-badge status-{{ $status }}">
                            {{ __('finance.invoices.pdf.status.' . $status) }}
                        </span>
                        @if($status !== 'paid')
                            <div style="margin-top: 5px; color: #e74c3c;">
                                {{ __('finance.invoices.pdf.due') }}: {{ $currency }}{{ number_format($amount_due, 2) }}
                            </div>
                        @endif
                    </td>
                </tr>
            </table>
            <div style="clear: both;"></div>
        </div>

        <div class="footer">
            <p>{{ __('finance.invoices.pdf.thank_you') }}</p>
            <p>{{ __('finance.invoices.pdf.generated_on', ['date' => date('Y-m-d H:i:s')]) }}</p>
        </div>
    </div>
</body>

</html>