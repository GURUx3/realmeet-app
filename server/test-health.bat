@echo off
REM Backend Health Check Test Script for Windows
REM This script tests the /api/health endpoint

echo =========================================
echo Backend Health Check Test
echo =========================================
echo.

echo Testing: GET http://localhost:3001/api/health
echo.

curl -s http://localhost:3001/api/health

if %errorlevel% equ 0 (
    echo.
    echo ✅ Health check PASSED
) else (
    echo.
    echo ❌ Server is not running on http://localhost:3001
    echo.
    echo Start the server with: npm run dev
)

echo.
echo =========================================
