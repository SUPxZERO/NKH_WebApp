<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <title>{{ __('exports.inventory.title') }}</title>
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
            border-bottom: 3px solid #10b981;
        }

        .header h1 {
            color: #10b981;
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
            border-left: 4px solid #10b981;
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
            color: #10b981;
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
            background: #10b981;
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
    </style>
</head>

<body>
    <div class="header">
        <h1>{{ __('exports.inventory.heading') }}</h1>
        <div class="date-range">{{ $start_date }} - {{ $end_date }}</div>
    </div>

    <!-- Overview Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">{{ __('exports.inventory.stats.total_inventory_value') }}</div>
            <div class="stat-value">${{ number_format($valuation['total_value'] ?? 0, 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">{{ __('exports.inventory.stats.items_in_stock') }}</div>
            <div class="stat-value">{{ number_format($valuation['items_count'] ?? 0) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">{{ __('exports.inventory.stats.waste_value') }}</div>
            <div class="stat-value">${{ number_format($wasteData['total_waste_value'] ?? 0, 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">{{ __('exports.inventory.stats.avg_turnover_rate') }}</div>
            <div class="stat-value">{{ number_format($turnover['avg_turnover'] ?? 0, 1) }}x</div>
        </div>
    </div>

    <!-- Cost Analysis -->
    <div class="section">
        <div class="section-title">{{ __('exports.inventory.sections.cost_analysis') }}</div>
        <table>
            <thead>
                <tr>
                    <th>{{ __('exports.inventory.table.category') }}</th>
                    <th>{{ __('exports.inventory.table.total_cost') }}</th>
                    <th>{{ __('exports.inventory.table.percentage') }}</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $totalCost = array_sum(array_column($costAnalysis['categories'] ?? [], 'value'));
                @endphp
                @foreach($costAnalysis['categories'] ?? [] as $category)
                    <tr>
                        <td>{{ $category['name'] }}</td>
                        <td>${{ number_format($category['value'], 2) }}</td>
                        <td>{{ $totalCost > 0 ? number_format(($category['value'] / $totalCost) * 100, 1) : 0 }}%</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Highest Cost Items -->
    <div class="section">
        <div class="section-title">{{ __('exports.inventory.sections.highest_cost_items') }}</div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ __('exports.inventory.table.item_name') }}</th>
                    <th>{{ __('exports.inventory.table.quantity') }}</th>
                    <th>{{ __('exports.inventory.table.cost_per_unit') }}</th>
                    <th>{{ __('exports.inventory.table.total_cost') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($costAnalysis['top_items'] ?? [] as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $item['name'] }}</td>
                        <td>{{ number_format($item['quantity']) }} {{ $item['unit'] }}</td>
                        <td>${{ number_format($item['cost_per_unit'], 2) }}</td>
                        <td>${{ number_format($item['total_cost'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Turnover Analysis -->
    <div class="section">
        <div class="section-title">{{ __('exports.inventory.sections.turnover_by_category') }}</div>
        <table>
            <thead>
                <tr>
                    <th>{{ __('exports.inventory.table.category') }}</th>
                    <th>{{ __('exports.inventory.table.turnover_rate') }}</th>
                    <th>{{ __('exports.inventory.table.status') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($turnover['by_category'] ?? [] as $cat)
                    <tr>
                        <td>{{ $cat['category'] }}</td>
                        <td>{{ number_format($cat['turnover_rate'], 1) }}x</td>
                        <td>
                            @if($cat['turnover_rate'] > 10)
                                {{ __('exports.inventory.turnover_status.excellent') }}
                            @elseif($cat['turnover_rate'] > 5)
                                {{ __('exports.inventory.turnover_status.good') }}
                            @else
                                {{ __('exports.inventory.turnover_status.needs_attention') }}
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        {{ __('exports.inventory.generated_on', ['date' => date('F d, Y \\a\\t H:i')]) }} |
        {{ __('exports.inventory.system_name') }}
    </div>
</body>

</html>