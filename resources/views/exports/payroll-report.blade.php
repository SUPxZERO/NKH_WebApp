<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payroll Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #3b82f6;
        }
        .header h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 28px;
        }
        .header .period {
            color: #666;
            font-size: 14px;
            margin-top: 10px;
        }
        .stats-grid {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .stat-card {
            display: table-cell;
            width: 16.66%;
            padding: 12px;
            background: #f8f9fa;
            border-left: 4px solid #3b82f6;
            text-align: center;
        }
        .stat-card:not(:last-child) {
            border-right: 1px solid #e5e7eb;
        }
        .stat-label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 16px;
            color: #3b82f6;
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
            background: #3b82f6;
            color: white;
            padding: 10px 6px;
            text-align: left;
            font-size: 11px;
        }
        table td {
            padding: 8px 6px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 11px;
        }
        table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .text-right {
            text-align: right;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
        }
        .status-draft {
            background: #fef3c7;
            color: #92400e;
        }
        .status-finalized, .status-paid {
            background: #d1fae5;
            color: #065f46;
        }
        .status-pending {
            background: #e0e7ff;
            color: #3730a3;
        }
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #999;
            font-size: 11px;
        }
        .totals-row {
            background: #3b82f6 !important;
            color: white;
            font-weight: bold;
        }
        .totals-row td {
            border-bottom: none;
            padding: 10px 6px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Payroll Report</h1>
        <div class="period">{{ $period }}</div>
    </div>

    <!-- Summary Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Employees</div>
            <div class="stat-value">{{ number_format($summary['total_employees']) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Gross Pay</div>
            <div class="stat-value">${{ number_format($summary['total_gross_pay'], 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Bonuses</div>
            <div class="stat-value">${{ number_format($summary['total_bonuses'], 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Deductions</div>
            <div class="stat-value">${{ number_format($summary['total_deductions'], 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Net Pay</div>
            <div class="stat-value">${{ number_format($summary['total_net_pay'], 2) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Avg Net Pay</div>
            <div class="stat-value">${{ number_format($summary['avg_net_pay'], 2) }}</div>
        </div>
    </div>

    <!-- Payroll Details -->
    <div class="section">
        <div class="section-title">📋 Payroll Details</div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Period</th>
                    <th class="text-right">Base Pay</th>
                    <th class="text-right">Overtime</th>
                    <th class="text-right">Bonuses</th>
                    <th class="text-right">Deductions</th>
                    <th class="text-right">Net Pay</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($payrolls as $index => $payroll)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $payroll['employee_name'] }}</td>
                    <td>{{ $payroll['period'] }}</td>
                    <td class="text-right">${{ number_format($payroll['base_pay'], 2) }}</td>
                    <td class="text-right">${{ number_format($payroll['overtime_pay'], 2) }}</td>
                    <td class="text-right">${{ number_format($payroll['bonuses'], 2) }}</td>
                    <td class="text-right">${{ number_format($payroll['deductions'], 2) }}</td>
                    <td class="text-right">${{ number_format($payroll['net_pay'], 2) }}</td>
                    <td>
                        <span class="status-badge status-{{ $payroll['status'] }}">
                            {{ ucfirst($payroll['status']) }}
                        </span>
                    </td>
                </tr>
                @endforeach
                <tr class="totals-row">
                    <td colspan="3"><strong>TOTALS</strong></td>
                    <td class="text-right">${{ number_format($payrolls->sum('base_pay'), 2) }}</td>
                    <td class="text-right">${{ number_format($payrolls->sum('overtime_pay'), 2) }}</td>
                    <td class="text-right">${{ number_format($summary['total_bonuses'], 2) }}</td>
                    <td class="text-right">${{ number_format($summary['total_deductions'], 2) }}</td>
                    <td class="text-right">${{ number_format($summary['total_net_pay'], 2) }}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="footer">
        Generated on {{ $generated_at }} | NKH Restaurant Management System
    </div>
</body>
</html>
