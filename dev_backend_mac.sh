#!/bin/bash

# dev_backend_mac.sh
# Script to start backend for npm run dev on macOS
# Sets up JAVA_HOME and Maven from local tools

# Get the absolute path of the script directory (project root)
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

# Kill process on port 8080 if running
echo "Checking port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Run Backend
echo "Starting Spring Boot Backend..."
cd backend
mvn spring-boot:run
