#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

echo "============================================="
echo "   Starting AI Restaurant Menu Scanner       "
echo "============================================="

# 1. Setup Backend
echo "Setting up FastAPI Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing/verifying backend dependencies (this might take a moment)..."
pip install -r requirements.txt
cd ..

# 2. Setup Frontend
echo "Setting up Next.js Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
cd ..

# 3. Launch everything in macOS Terminal tabs
echo "Launching applications in new Terminal tabs..."

# Tab 1: Run Ollama Model
osascript -e "tell application \"Terminal\" to do script \"ollama run qwen2.5:1.5b\""


# Tab 2: Run FastAPI Backend
osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)/backend' && source venv/bin/activate && uvicorn app.main:app --port 8000 --reload\""

# Tab 3: Run Next.js Frontend on port 3001
osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)/frontend' && PORT=3001 npm run dev\""

echo "============================================="
echo "   All services triggered! Check your tabs.   "
echo "   - Next.js: http://localhost:3001          "
echo "   - FastAPI: http://localhost:8000          "
echo "============================================="
