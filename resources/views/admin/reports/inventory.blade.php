@extends('admin.reports.layout')

@section('title', 'Inventory Report')

@section('content')
    <div class="clearfix">
        <div class="meta-info">
            <div class="meta-item">
                <strong>Report Type</strong>
                {{ $filter }}
            </div>
            <div class="meta-item">
                <strong>Items Count</strong>
                {{ $ingredients->count() }}
            </div>
        </div>
        
        <div class="summary-box">
            <div style="font-size: 10px; text-transform: uppercase; color: #666;">Total Inventory Value</div>
            <div style="font-size: 18px; font-weight: bold; color: #2563eb;">
                ${{ number_format($totalValue, 2) }}
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item Name</th>
                <th>Supplier</th>
                <th class="text-center">Current Stock</th>
                <th class="text-center">Min Level</th>
                <th class="text-right">Unit Cost</th>
                <th class="text-right">Total Value</th>
            </tr>
        </thead>
        <tbody>
            @foreach($ingredients as $item)
                <tr>
                    <td>
                        {{ $item->name }}
                        @if($item->current_stock <= $item->min_stock_level)
                            <span style="color: red; font-size: 10px;">(LOW)</span>
                        @endif
                    </td>
                    <td>{{ $item->supplier->name ?? 'N/A' }}</td>
                    <td class="text-center {{ $item->current_stock <= $item->min_stock_level ? 'text-red' : '' }}">
                        {{ $item->current_stock }} {{ $item->unit->name ?? 'units' }}
                    </td>
                    <td class="text-center">{{ $item->min_stock_level }}</td>
                    <td class="text-right">${{ number_format($item->cost_per_unit, 2) }}</td>
                    <td class="text-right">${{ number_format($item->current_stock * $item->cost_per_unit, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
