<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <title>{{ __('exports.sales_analytics.title') }}</title>
    <style>
        @font-face {
            font-family: 'Noto Sans Khmer';
            src: url('{{ str_replace("\\", "/", storage_path("fonts/NotoSansKhmer-Regular.ttf")) }}') format('truetype');
            font-weight: normal;
            font-style: normal;
        }

        @font-face {
            font-family: 'Noto Sans Khmer';
            src: url('{{ str_replace("\\", "/", storage_path("fonts/NotoSansKhmer-Bold.ttf")) }}') format('truetype');
            font-weight: bold;
            font-style: normal;
        }

        body {
            font-family: 'Noto Sans Khmer', Arial, sans-serif;
            margin: 20px;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #8b5cf6;
        }

        .header h1 {
            color: #8b5cf6;
            margin: 0;
            font-size: 28px;
        }

        .header .date-range {
            color: #666;
            font-size: 14px;
            margin-top: 10px;
        }

        .stats-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }

        .stat-card {
            flex: 1;
            padding: 15px;
            margin: 0 10px;
            background: #f8f9fa;
            border-left: 4px solid #8b5cf6;
            border-radius: 4px;
        }

        .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }

        .section {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 18px;
            color: #8b5cf6;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid #e5e7eb;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        table th {
            background: #8b5cf6;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 14px;
        }

        table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
        }

        table tr:nth-child(even) {
            background: #f8f9fa;
        }

        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #999;
            font-size: 12px;
        }

        .chart-placeholder {
            background: #f8f9fa;
            border: 2px dashed #d1d5db;
            padding: 40px;
            text-align: center;
            color: #999;
            margin: 20px 0;
            border-radius: 8px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>{{ __('exports.sales_analytics.heading') }}</h1>
        <div class="date-range">{{ $start_date }} - {{ $end_date }}</div>
    </div>

    <!-- Overview Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">{{ __('exports.sales_analytics.stats.total_revenue') }}</div>
            <div class="stat-value">${{ number_format($overview['total_revenue'] ?? 0, 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">{{ __('exports.sales_analytics.stats.total_orders') }}</div>
            <div class="stat-value">{{ number_format($overview['total_orders'] ?? 0) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">{{ __('exports.sales_analytics.stats.avg_order_value') }}</div>
            <div class="stat-value">${{ number_format($overview['avg_order_value'] ?? 0, 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">{{ __('exports.sales_analytics.stats.customers') }}</div>
            <div class="stat-value">{{ number_format($overview['unique_customers'] ?? 0) }}</div>
        </div>
    </div>

    <!-- Sales Trends -->
    <div class="section">
        <div class="section-title">{{ __('exports.sales_analytics.sections.revenue_trends') }}</div>
        <div class="chart-placeholder">
            {{ __('exports.sales_analytics.chart_placeholder') }}
        </div>
        <table>
            <thead>
                <tr>
                    <th>{{ __('exports.sales_analytics.table.date') }}</th>
                    <th>{{ __('exports.sales_analytics.table.orders') }}</th>
                    <th>{{ __('exports.sales_analytics.table.revenue') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($trends as $trend)
                    <tr>
                        <td>{{ $trend['date'] }}</td>
                        <td>{{ number_format($trend['orders']) }}</td>
                        <td>${{ number_format($trend['revenue'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Top Selling Items -->
    <div class="section">
        <div class="section-title">{{ __('exports.sales_analytics.sections.top_items') }}</div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ __('exports.sales_analytics.table.item_name') }}</th>
                    <th>{{ __('exports.sales_analytics.table.quantity_sold') }}</th>
                    <th>{{ __('exports.sales_analytics.table.revenue') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($topItems as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ data_get($item, 'name') }}</td>
                        <td>{{ number_format(data_get($item, 'quantity_sold')) }}</td>
                        <td>${{ number_format(data_get($item, 'revenue'), 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Sales by Category -->
    <div class="section">
        <div class="section-title">{{ __('exports.sales_analytics.sections.by_category') }}</div>
        <table>
            <thead>
                <tr>
                    <th>{{ __('exports.sales_analytics.table.category') }}</th>
                    <th>{{ __('exports.sales_analytics.table.revenue') }}</th>
                    <th>{{ __('exports.sales_analytics.table.percentage') }}</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $totalRevenue = collect($categories)->pluck('value')->sum();
                @endphp
                @foreach($categories as $category)
                    <tr>
                        <td>{{ data_get($category, 'name') }}</td>
                        <td>${{ number_format(data_get($category, 'value'), 2) }}</td>
                        <td>{{ $totalRevenue > 0 ? number_format((data_get($category, 'value') / $totalRevenue) * 100, 1) : 0 }}%
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        {{ __('exports.sales_analytics.generated_on', ['date' => date('F d, Y \\a\\t H:i')]) }} |
        {{ __('exports.sales_analytics.system_name') }}
    </div>
</body>

</html>