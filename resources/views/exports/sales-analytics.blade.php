<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Analytics Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
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
        <h1>📊 Sales Analytics Report</h1>
        <div class="date-range">{{ $start_date }} - {{ $end_date }}</div>
    </div>

    <!-- Overview Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">${{ number_format($overview['total_revenue'] ?? 0, 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">{{ number_format($overview['total_orders'] ?? 0) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Avg Order Value</div>
            <div class="stat-value">${{ number_format($overview['avg_order_value'] ?? 0, 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Customers</div>
            <div class="stat-value">{{ number_format($overview['unique_customers'] ?? 0) }}</div>
        </div>
    </div>

    <!-- Sales Trends -->
    <div class="section">
        <div class="section-title">📈 Revenue Trends</div>
        <div class="chart-placeholder">
            Chart visualization available in interactive dashboard
        </div>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Revenue</th>
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
        <div class="section-title">🏆 Top Selling Items</div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Item Name</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                @foreach($topItems as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item['name'] }}</td>
                    <td>{{ number_format($item['quantity_sold']) }}</td>
                    <td>${{ number_format($item['revenue'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Sales by Category -->
    <div class="section">
        <div class="section-title">📦 Sales by Category</div>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Revenue</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $totalRevenue = array_sum(array_column($categories, 'value'));
                @endphp
                @foreach($categories as $category)
                <tr>
                    <td>{{ $category['name'] }}</td>
                    <td>${{ number_format($category['value'], 2) }}</td>
                    <td>{{ $totalRevenue > 0 ? number_format(($category['value'] / $totalRevenue) * 100, 1) : 0 }}%</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        Generated on {{ date('F d, Y \a\t H:i') }} | NKH Restaurant Management System
    </div>
</body>
</html>
