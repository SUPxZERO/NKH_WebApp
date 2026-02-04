@extends('admin.reports.layout')

@section('title', __('reports.inventory.title'))

@section('content')
    <div class="clearfix">
        <div class="meta-info">
            <div class="meta-item">
                <strong>{{ __('reports.inventory.report_type') }}</strong>
                {{ $filter }}
            </div>
            <div class="meta-item">
                <strong>{{ __('reports.inventory.items_count') }}</strong>
                {{ $ingredients->count() }}
            </div>
        </div>
        
        <div class="summary-box">
            <div style="font-size: 10px; text-transform: uppercase; color: #666;">{{ __('reports.inventory.total_value') }}</div>
            <div style="font-size: 18px; font-weight: bold; color: #2563eb;">
                ${{ number_format($totalValue, 2) }}
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>{{ __('reports.inventory.table.item_name') }}</th>
                <th>{{ __('reports.inventory.table.supplier') }}</th>
                <th class="text-center">{{ __('reports.inventory.table.current_stock') }}</th>
                <th class="text-center">{{ __('reports.inventory.table.min_level') }}</th>
                <th class="text-right">{{ __('reports.inventory.table.unit_cost') }}</th>
                <th class="text-right">{{ __('reports.inventory.table.total_value') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($ingredients as $item)
                <tr>
                    <td>
                        {{ $item->name }}
                        @if($item->current_stock <= $item->min_stock_level)
                            <span style="color: red; font-size: 10px;">({{ __('reports.inventory.low') }})</span>
                        @endif
                    </td>
                    <td>{{ $item->supplier->name ?? __('reports.inventory.na') }}</td>
                    <td class="text-center {{ $item->current_stock <= $item->min_stock_level ? 'text-red' : '' }}">
                        {{ $item->current_stock }} {{ $item->unit->name ?? __('reports.inventory.units') }}
                    </td>
                    <td class="text-center">{{ $item->min_stock_level }}</td>
                    <td class="text-right">${{ number_format($item->cost_per_unit, 2) }}</td>
                    <td class="text-right">${{ number_format($item->current_stock * $item->cost_per_unit, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
