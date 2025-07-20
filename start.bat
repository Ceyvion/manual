@echo off
REM Afropop Operations Manual - Windows Startup Script
REM This script sets up and starts the development environment

echo 🚀 Starting Afropop Operations Manual...
echo ===============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version
echo ✅ npm version: 
npm --version
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)

echo.

REM Check if database exists, if not create it
if not exist "afropop_storage.db" (
    echo 🗄️ Setting up database...
    node scripts/setup-test-db.js
    if errorlevel 1 (
        echo ❌ Failed to setup database
        pause
        exit /b 1
    )
    echo ✅ Database setup completed
) else (
    echo ✅ Database already exists
)

echo.

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️ .env file not found. Using default configuration.
    echo    You can create a .env file to customize settings.
)

echo ===============================================
echo 🎉 Setup complete!
echo.
echo 🌐 Starting server on http://localhost:3001
echo 🔐 Default login password: afropop123
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

REM Start the server
npm start