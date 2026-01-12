@extends('admin.reports.layout')

@section('title', 'Sales Report')

@section('content')
    <div class="clearfix">
        <div class="meta-info">
            <div class="meta-item">
                <strong>Period</strong>
                {{ $startDate }} to {{ $endDate }}
            </div>
            <div class="meta-item">
                <strong>Total Orders</strong>
                {{ $totalOrders }}
            </div>
        </div>
        
        <div class="summary-box">
            <div style="font-size: 10px; text-transform: uppercase; color: #666;">Total Revenue</div>
            <div style="font-size: 18px; font-weight: bold; color: #16a34a;">
                ${{ number_format($totalRevenue, 2) }}
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orders as $order)
                <tr>
                    <td>#{{ $order->id }}</td>
                    <td>{{ $order->created_at->format('Y-m-d H:i') }}</td>
                    <td>
                        {{ $order->customer ? ($order->customer->user->name ?? 'Guest') : 'Walk-in' }}
                    </td>
                    <td>{{ $order->items->count() }} items</td>
                    <td class="text-right">${{ number_format($order->total_amount, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
