@echo off
echo Starting ROS Web Server in Production Mode...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

REM Check if server directory exists
if not exist "server" (
    echo Error: Server directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if client directory exists
if not exist "client" (
    echo Error: Client directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Build client for production
echo Building client for production...
cd client
npm run build
if %errorlevel% neq 0 (
    echo Error: Failed to build client
    pause
    exit /b 1
)
echo Client build completed successfully!
echo.

REM Go back to root directory
cd ..

REM Navigate to server directory
cd server

REM Check if package.json exists
if not exist "package.json" (
    echo Error: package.json not found in server directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing server dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install server dependencies
        pause
        exit /b 1
    )
    echo.
)

echo Starting ROS Web Server in Production Mode...
echo Server will be available at: http://localhost:3000
echo WebSocket server will be available at: ws://localhost:8081
echo Static files will be served from: ..\client\build
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
node server.js

REM If we get here, the server has stopped
echo.
echo Server stopped.
pause
