#!/bin/bash

echo "🍽️  NKH Restaurant Development Environment"
echo "=========================================="
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all servers..."
    jobs -p | xargs -r kill
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Laravel backend
echo "🚀 Starting Laravel backend..."
php artisan serve &
LARAVEL_PID=$!

# Wait a moment for Laravel to start
sleep 2

# Start Vite frontend
echo "🎨 Starting Vite development server..."
npm run dev &
VITE_PID=$!

# Wait a moment for Vite to start
sleep 3

echo ""
echo "✅ Development environment ready!"
echo "🌐 Laravel Backend: http://127.0.0.1:8000"
echo "⚡ Vite Frontend: http://localhost:5173"
echo ""
echo "📱 Open http://127.0.0.1:8000 in your browser"
echo "🛑 Press Ctrl+C to stop all servers"
echo ""

# Wait for processes
wait
