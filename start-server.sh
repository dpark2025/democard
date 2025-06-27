#!/bin/bash

# DemoCard Server Control Script
PID_FILE=".server.pid"
PORT=3000

show_usage() {
    echo "Usage: $0 {start|stop|status|restart}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the demo scene server"
    echo "  stop    - Stop the demo scene server"
    echo "  status  - Show server status"
    echo "  restart - Restart the server"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 stop"
}

start_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat $PID_FILE)
        if kill -0 $PID 2>/dev/null; then
            echo "🟡 Server is already running (PID: $PID)"
            echo "🌐 Available at: http://localhost:$PORT"
            return 0
        else
            echo "🧹 Cleaning up stale PID file..."
            rm -f $PID_FILE
        fi
    fi

    echo "🚀 Starting DemoCard Demo Scene Server..."
    echo "=================================="

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install npm first."
        exit 1
    fi

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found. Make sure you're in the correct directory."
        exit 1
    fi

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install dependencies."
            exit 1
        fi
    fi

    # Start the server in background
    echo "🎮 Starting demo scene server..."
    echo "🌐 Server will be available at: http://localhost:$PORT"
    echo "🛑 Use '$0 stop' to stop the server"
    echo ""

    nohup npm start > server.log 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > $PID_FILE
    
    # Wait a moment to check if server started successfully
    sleep 2
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "✅ Server started successfully (PID: $SERVER_PID)"
    else
        echo "❌ Failed to start server. Check server.log for details."
        rm -f $PID_FILE
        exit 1
    fi
}

stop_server() {
    if [ ! -f "$PID_FILE" ]; then
        echo "🟡 Server is not running (no PID file found)"
        return 0
    fi

    PID=$(cat $PID_FILE)
    if kill -0 $PID 2>/dev/null; then
        echo "🛑 Stopping server (PID: $PID)..."
        kill $PID
        
        # Wait for graceful shutdown
        for i in {1..10}; do
            if ! kill -0 $PID 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if kill -0 $PID 2>/dev/null; then
            echo "🔨 Force stopping server..."
            kill -9 $PID
        fi
        
        rm -f $PID_FILE
        echo "✅ Server stopped successfully"
    else
        echo "🟡 Server is not running (process not found)"
        rm -f $PID_FILE
    fi
}

status_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat $PID_FILE)
        if kill -0 $PID 2>/dev/null; then
            echo "🟢 Server is running (PID: $PID)"
            echo "🌐 Available at: http://localhost:$PORT"
        else
            echo "🔴 Server is not running (stale PID file)"
            rm -f $PID_FILE
        fi
    else
        echo "🔴 Server is not running"
    fi
}

restart_server() {
    echo "🔄 Restarting server..."
    stop_server
    sleep 2
    start_server
}

# Main script logic
case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    status)
        status_server
        ;;
    restart)
        restart_server
        ;;
    *)
        show_usage
        exit 1
        ;;
esac