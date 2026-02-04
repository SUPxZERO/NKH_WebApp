<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>@yield('title') - {{ __('reports.layout.brand') }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            color: #1a1a1a;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0;
            color: #666;
        }
        .meta-info {
            margin-bottom: 20px;
            clear: both;
        }
        .meta-item {
            float: left;
            margin-right: 20px;
        }
        .meta-item strong {
            display: block;
            color: #666;
            font-size: 10px;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #444;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-red { color: #dc2626; }
        .text-green { color: #16a34a; }
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
        .page-break {
            page-break-after: always;
        }
        .summary-box {
            background: #f8f9fa;
            padding: 15px;
            border: 1px solid #ddd;
            width: 200px;
            float: right;
            margin-bottom: 20px;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ __('reports.layout.system_name') }}</h1>
        <p>@yield('title')</p>
    </div>

    @yield('content')

    <div class="footer">
        {{ __('reports.layout.generated_on', ['date' => date('Y-m-d H:i:s')]) }}
    </div>
</body>
</html>
