#!/bin/bash

# Finpro macOS Start Script

echo "Starting Finpro on macOS..."

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ -n "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)..."
        kill -9 $pid
    fi
}

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure Java 17 or 21 is used (Local fallback)
if [ -d "$SCRIPT_DIR/tools/jdk-21.0.6+7/Contents/Home" ]; then
    export JAVA_HOME="$SCRIPT_DIR/tools/jdk-21.0.6+7/Contents/Home"
    echo "Using Local Java: $JAVA_HOME"
elif [ -d "/opt/homebrew/opt/openjdk@17" ]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
elif [ -d "/usr/local/opt/openjdk@17" ]; then
    export JAVA_HOME="/usr/local/opt/openjdk@17"
elif [ -n "$(/usr/libexec/java_home -v 17 2>/dev/null)" ]; then
    export JAVA_HOME=$(/usr/libexec/java_home -v 17)
elif [ -n "$(/usr/libexec/java_home -v 21 2>/dev/null)" ]; then
    export JAVA_HOME=$(/usr/libexec/java_home -v 21)
else
    echo "Error: Java 17 or 21 not found! Please check installation."
    exit 1
fi
export PATH=$JAVA_HOME/bin:$PATH

# Ensure Maven is in PATH (Local fallback)
if [ -d "$SCRIPT_DIR/tools/apache-maven-3.9.6/bin" ]; then
    export PATH="$SCRIPT_DIR/tools/apache-maven-3.9.6/bin:$PATH"
    echo "Using Local Maven: $SCRIPT_DIR/tools/apache-maven-3.9.6/bin"
elif [ -d "/opt/homebrew/opt/maven/bin" ]; then
    export PATH="/opt/homebrew/opt/maven/bin:$PATH"
elif [ -d "/usr/local/opt/maven/bin" ]; then
    export PATH="/usr/local/opt/maven/bin:$PATH"
fi

echo "Using Java: $(java -version 2>&1 | head -n 1)"
echo "Using Maven: $(mvn -version 2>&1 | head -n 1)"

# 1. Clean Ports
echo "Cleaning ports..."
kill_port 8080
kill_port 5173

# 2. Start Backend
echo "Starting Backend..."
cd backend
mvn spring-boot:run &
BACKEND_PID=$!
cd ..

# 3. Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Application started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop servers..."

# Wait for user input to exit
wait
