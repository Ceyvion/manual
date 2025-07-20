#!/bin/bash

# Afropop Operations Manual - Startup Script
# This script sets up and starts the development environment

echo "🚀 Starting Afropop Operations Manual..."
echo "==============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

echo ""

# Check if database exists, if not create it
if [ ! -f "afropop_storage.db" ]; then
    echo "🗄️  Setting up database..."
    node scripts/setup-test-db.js
    if [ $? -ne 0 ]; then
        echo "❌ Failed to setup database"
        exit 1
    fi
    echo "✅ Database setup completed"
else
    echo "✅ Database already exists"
fi

echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Using default configuration."
    echo "   You can create a .env file to customize settings."
fi

echo "==============================================="
echo "🎉 Setup complete!"
echo ""
echo "🌐 Starting server on http://localhost:3001"
echo "🔐 Default login password: afropop123"
echo ""
echo "Press Ctrl+C to stop the server"
echo "==============================================="
echo ""

# Start the server
npm start