#!/bin/bash

# Finpro macOS Setup Script

echo "Starting Finpro macOS Setup..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Install Homebrew if not installed
if ! command_exists brew; then
    echo "Homebrew not found. Please install Homebrew first: https://brew.sh/"
    exit 1
fi

# 2. Install Java 21
if ! command_exists java || ! java -version 2>&1 | grep -q "21"; then
    echo "Installing OpenJDK 21..."
    brew install openjdk@21
    
    # Link Java
    sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk
    
    # Set JAVA_HOME for this session
    export JAVA_HOME=$(/usr/libexec/java_home -v 21)
    export PATH=$JAVA_HOME/bin:$PATH
    
    echo "Java 21 installed."
else
    echo "Java 21 is already installed."
fi

# 3. Install Maven
if ! command_exists mvn; then
    echo "Installing Maven..."
    brew install maven
    echo "Maven installed."
else
    echo "Maven is already installed."
fi

# 4. Install/Check PostgreSQL
if command_exists psql; then
    echo "PostgreSQL is already installed and in PATH."
    psql --version
else
    # Check common brew paths
    if [ -d "/opt/homebrew/opt/postgresql@16/bin" ]; then
        export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
        echo "Found postgresql@16 in Homebrew (ARM)."
    elif [ -d "/usr/local/opt/postgresql@16/bin" ]; then
         export PATH="/usr/local/opt/postgresql@16/bin:$PATH"
         echo "Found postgresql@16 in Homebrew (Intel)."
    elif [ -d "/Applications/Postgres.app/Contents/Versions/latest/bin" ]; then
        export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
        echo "Found Postgres.app."
    else
        echo "Installing PostgreSQL 16..."
        brew install postgresql@16
        export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
        export PATH="/usr/local/opt/postgresql@16/bin:$PATH"
    fi
fi

# 5. Start PostgreSQL Service
echo "Starting PostgreSQL service..."
if brew list --versions postgresql@16 >/dev/null; then
    brew services start postgresql@16
else
    echo "Skipping brew services start (assuming external install or non-brew postgres)."
fi
sleep 5

# 6. Create Database and User
echo "Configuring Database..."
# check if user 'postgres' exists, if not create it (brew install might use current user)
# On macOS brew install, the default user is the current system user with no password usually.
# However, the project expects 'postgres' with password '123'.

# Try to create user '12345' if it doesn't exist
createuser -s 12345 2>/dev/null || true

# Set password for '12345' user
psql -d postgres -c "ALTER USER \"12345\" WITH PASSWORD '123';"

# Create database 'fintech_saas'
createdb -U 12345 fintech_saas 2>/dev/null || echo "Database fintech_saas might already exist."

# 7. Install Project Dependencies
echo "Installing Backend Dependencies..."
cd backend
mvn clean install -DskipTests
cd ..

echo "Installing Frontend Dependencies..."
cd frontend
npm install
cd ..

echo "Setup Complete!"
echo "You can now run './start_mac.sh' to start the application."
