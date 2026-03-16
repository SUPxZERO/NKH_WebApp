<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .container {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            background-color: #f9f9f9;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .header h1 {
            color: #4f46e5;
            margin: 0;
        }

        .content {
            background: #fff;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .action {
            text-align: center;
            margin-top: 20px;
        }

        .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #fff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
        }

        .footer {
            text-align: center;
            font-size: 0.8em;
            color: #777;
            margin-top: 20px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <!-- You can add a logo here if needed -->
            <h1>{{ config('app.name') }}</h1>
        </div>

        <div class="content">
            <h2>{{ $title }}</h2>
            <p>{!! nl2br(e($bodyMessage)) !!}</p>

            @if($actionUrl)
                <div class="action">
                    <a href="{{ url($actionUrl) }}" class="btn">View Details</a>
                </div>
            @endif
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            <p>You are receiving this email because you opted in to receive notifications.</p>
        </div>
    </div>
</body>

</html>