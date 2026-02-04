@extends('admin.reports.layout')

@section('title', __('reports.sales.title'))

@section('content')
    <div class="clearfix">
        <div class="meta-info">
            <div class="meta-item">
                <strong>{{ __('reports.sales.period') }}</strong>
                {{ $startDate }} to {{ $endDate }}
            </div>
            <div class="meta-item">
                <strong>{{ __('reports.sales.total_orders') }}</strong>
                {{ $totalOrders }}
            </div>
        </div>
        
        <div class="summary-box">
            <div style="font-size: 10px; text-transform: uppercase; color: #666;">{{ __('reports.sales.total_revenue') }}</div>
            <div style="font-size: 18px; font-weight: bold; color: #16a34a;">
                ${{ number_format($totalRevenue, 2) }}
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>{{ __('reports.sales.table.order_id') }}</th>
                <th>{{ __('reports.sales.table.date') }}</th>
                <th>{{ __('reports.sales.table.customer') }}</th>
                <th>{{ __('reports.sales.table.items') }}</th>
                <th class="text-right">{{ __('reports.sales.table.amount') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orders as $order)
                <tr>
                    <td>#{{ $order->id }}</td>
                    <td>{{ $order->created_at->format('Y-m-d H:i') }}</td>
                    <td>
                        {{ $order->customer ? ($order->customer->user->name ?? __('reports.sales.customer.guest')) : __('reports.sales.customer.walk_in') }}
                    </td>
                    <td>{{ __('reports.sales.items_count', ['count' => $order->items->count()]) }}</td>
                    <td class="text-right">${{ number_format($order->total_amount, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
