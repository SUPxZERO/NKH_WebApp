#!/bin/bash

# NKH Restaurant Development Server Starter
# This script bypasses the problematic Artisan console

echo "🍽️  NKH Restaurant Management System"
echo "======================================"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Start Laravel backend
echo "🚀 Starting Laravel backend..."
if check_port 8000; then
    echo "⚠️  Port 8000 in use, using port 8001"
    php laravel-commands.php serve &
    LARAVEL_PID=$!
    LARAVEL_PORT=8001
else
    php -S 127.0.0.1:8000 -t public &
    LARAVEL_PID=$!
    LARAVEL_PORT=8000
fi

sleep 2

# Start React frontend
echo "🎨 Starting React frontend..."
npm run dev &
REACT_PID=$!

sleep 3

echo ""
echo "✅ Development servers started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://127.0.0.1:$LARAVEL_PORT"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $LARAVEL_PID 2>/dev/null
    kill $REACT_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
