<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Financial Dashboard</title>
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
            border-bottom: 3px solid #ef4444;
        }
        .header h1 {
            color: #ef4444;
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
            border-left: 4px solid #ef4444;
            border-radius: 4px;
        }
        .stat-card.positive {
            border-left-color: #10b981;
        }
        .stat-card.negative {
            border-left-color: #ef4444;
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
        .stat-value.positive {
            color: #10b981;
        }
        .stat-value.negative {
            color: #ef4444;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            color: #ef4444;
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
            background: #ef4444;
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
        .pl-statement {
            background: #f8f9fa;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .pl-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #d1d5db;
        }
        .pl-row.total {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #374151;
            margin-top: 10px;
            padding-top: 10px;
        }
        .pl-row.total.positive {
            color: #10b981;
        }
        .pl-row.total.negative {
            color: #ef4444;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Financial Dashboard - P&L Statement</h1>
        <div class="date-range">{{ $start_date }} - {{ $end_date }}</div>
    </div>

    <!-- P&L Summary -->
    <div class="pl-statement">
        <div class="pl-row">
            <span>Total Revenue</span>
            <span>${{ number_format($profitLoss['total_revenue'] ?? 0, 2) }}</span>
        </div>
        <div class="pl-row">
            <span>Cost of Goods Sold (COGS)</span>
            <span>(${{ number_format($profitLoss['cogs'] ?? 0, 2) }})</span>
        </div>
        <div class="pl-row">
            <span>Operating Expenses</span>
            <span>(${{ number_format($profitLoss['total_expenses'] ?? 0, 2) }})</span>
        </div>
        <div class="pl-row total {{ ($profitLoss['net_profit'] ?? 0) >= 0 ? 'positive' : 'negative' }}">
            <span>Net Profit</span>
            <span>${{ number_format($profitLoss['net_profit'] ?? 0, 2) }}</span>
        </div>
        <div class="pl-row">
            <span>Profit Margin</span>
            <span>{{ number_format($profitLoss['profit_margin'] ?? 0, 1) }}%</span>
        </div>
    </div>

    <!-- Key Metrics -->
    <div class="stats-grid">
        <div class="stat-card {{ ($profitLoss['total_revenue'] ?? 0) > 0 ? 'positive' : '' }}">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value positive">${{ number_format($profitLoss['total_revenue'] ?? 0, 2) }}</div>
        </div>
        <div class="stat-card negative">
            <div class="stat-label">Total Expenses</div>
            <div class="stat-value negative">${{ number_format($profitLoss['total_expenses'] ?? 0, 2) }}</div>
        </div>
        <div class="stat-card {{ ($profitLoss['net_profit'] ?? 0) >= 0 ? 'positive' : 'negative' }}">
            <div class="stat-label">Net Profit</div>
            <div class="stat-value {{ ($profitLoss['net_profit'] ?? 0) >= 0 ? 'positive' : 'negative' }}">
                ${{ number_format($profitLoss['net_profit'] ?? 0, 2) }}
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Profit Margin</div>
            <div class="stat-value">{{ number_format($profitLoss['profit_margin'] ?? 0, 1) }}%</div>
        </div>
    </div>

    <!-- Expense Breakdown -->
    <div class="section">
        <div class="section-title">📊 Expense Breakdown</div>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Percentage</th>
                    <th>Change %</th>
                </tr>
            </thead>
            <tbody>
                @foreach($profitLoss['expense_categories'] ?? [] as $expense)
                <tr>
                    <td>{{ $expense['category'] }}</td>
                    <td>${{ number_format($expense['amount'], 2) }}</td>
                    <td>{{ number_format($expense['percentage'], 1) }}%</td>
                    <td class="{{ $expense['change'] >= 0 ? 'negative' : 'positive' }}">
                        {{ $expense['change'] >= 0 ? '↑' : '↓' }} {{ abs($expense['change']) }}%
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Profit Margins by Category -->
    <div class="section">
        <div class="section-title">🎯 Profit Margins by Category</div>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th>Margin %</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($margins['by_category'] ?? [] as $margin)
                <tr>
                    <td>{{ $margin['category'] }}</td>
                    <td>${{ number_format($margin['revenue'] ?? 0, 2) }}</td>
                    <td>${{ number_format($margin['cost'] ?? 0, 2) }}</td>
                    <td>{{ number_format($margin['margin'], 1) }}%</td>
                    <td>
                        @if($margin['margin'] > 30)
                            Excellent
                        @elseif($margin['margin'] > 15)
                            Good
                        @else
                            Needs Improvement
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- COGS Breakdown -->
    <div class="section">
        <div class="section-title">🛒 Cost of Goods Sold Breakdown</div>
        <table>
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Amount</th>
                    <th>% of Revenue</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $totalRevenue = $profitLoss['total_revenue'] ?? 1;
                @endphp
                @foreach($cogs['breakdown'] ?? [] as $item)
                <tr>
                    <td>{{ $item['name'] }}</td>
                    <td>${{ number_format($item['value'], 2) }}</td>
                    <td>{{ number_format(($item['value'] / $totalRevenue) * 100, 1) }}%</td>
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
