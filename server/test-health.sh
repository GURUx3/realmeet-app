#!/bin/bash

# Backend Health Check Test Script
# This script tests the /api/health endpoint

echo "========================================="
echo "Backend Health Check Test"
echo "========================================="
echo ""

# Check if server is running
echo "Testing: GET http://localhost:3001/api/health"
echo ""

response=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/health 2>/dev/null)

if [ $? -eq 0 ]; then
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $http_code"
    echo "Response Body:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Health check PASSED"
    else
        echo "❌ Health check FAILED (expected 200, got $http_code)"
    fi
else
    echo "❌ Server is not running on http://localhost:3001"
    echo ""
    echo "Start the server with: npm run dev"
fi

echo ""
echo "========================================="
