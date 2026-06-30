#!/bin/bash

# Stellarama - Development Start Script (with cache clear)

echo "🚀 Stellarama Development Server"
echo "=============================="
echo ""

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd frontend && npm install && cd ..
    echo ""
fi

# Clear Vite cache
echo "🧹 Clearing Vite cache..."
rm -rf frontend/.vite frontend/node_modules/.vite
echo ""

echo "✅ Starting development server..."
echo "📍 URL: http://localhost:5173"
echo "📖 Documentation: http://localhost:5173/docs"
echo ""
echo "💡 Tip: Hard refresh browser (Ctrl+Shift+R) if you see module errors"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd frontend && npm run dev
