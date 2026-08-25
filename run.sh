#!/usr/bin/env bash
# VendoKart Service Launcher Script

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Detect Python interpreter
if [ -f "$DIR/.venv/Scripts/python.exe" ]; then
    PYTHON="$DIR/.venv/Scripts/python.exe"
elif [ -f "$DIR/.venv/bin/python" ]; then
    PYTHON="$DIR/.venv/bin/python"
else
    PYTHON="python"
fi

COMMAND=${1:-all}

case "$COMMAND" in
    backend)
        echo "=========================================="
        echo "🚀 Starting VendoKart Backend on port 8000"
        echo "=========================================="
        cd backend
        "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
        ;;
    frontend)
        echo "=========================================="
        echo "🎨 Starting VendoKart Frontend on port 3000"
        echo "=========================================="
        cd frontend
        npm run dev
        ;;
    speech)
        echo "=========================================="
        echo "🎙️ Starting VendoKart Speech Studio on port 5000"
        echo "=========================================="
        "$PYTHON" ai/speech/ui.py
        ;;
    all)
        echo "=========================================="
        echo "🌟 Launching All VendoKart Services"
        echo "=========================================="
        echo "1. Backend:  http://127.0.0.1:8000 (Docs: /docs)"
        echo "2. Frontend: http://localhost:3000"
        echo "3. Speech:   http://127.0.0.1:5000"
        echo "=========================================="
        
        # Start speech in background
        "$PYTHON" ai/speech/ui.py &
        SPEECH_PID=$!
        
        # Start backend in background
        (cd backend && "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
        BACKEND_PID=$!
        
        # Start frontend in foreground
        (cd frontend && npm run dev)
        
        # Cleanup on exit
        trap "kill $SPEECH_PID $BACKEND_PID" EXIT
        ;;
    *)
        echo "Usage: ./run.sh [backend|frontend|speech|all]"
        exit 1
        ;;
esac
