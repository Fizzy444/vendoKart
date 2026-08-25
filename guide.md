# VendoKart System Execution & Operations Guide

This guide provides step-by-step instructions to run, operate, and test the **VendoKart** AI-powered digital commerce platform for artisans and buyers.

---

## 1. Prerequisites & Environment Setup

### 1.1 Python Virtual Environment
- **Python**: 3.11.x (CPython 3.11)
- **Virtual Environment Location**: `.venv/`
- **Activation**:
  - **Windows (PowerShell)**:
    ```powershell
    .venv\Scripts\Activate.ps1
    ```
  - **Windows (Command Prompt)**:
    ```cmd
    .venv\Scripts\activate.bat
    ```
  - **Linux / macOS**:
    ```bash
    source .venv/bin/activate
    ```

### 1.2 Environment Variables (`.env`)
Ensure `.env` in the root directory contains your configurations:
```ini
APP_ENV=development
SECRET_KEY=dev-super-secret-key-change-in-production-1234567890
API_V1_STR=/api/v1

# Database (PostgreSQL with SQLite fallback)
DATABASE_URL=sqlite+aiosqlite:///artisan_commerce_dev.db
REDIS_URL=redis://localhost:6379/0

# Groq AI Keys
GROQ_API_KEY_20B=your-groq-api-key-20b-here
GROQ_API_KEY_120B=your-groq-api-key-120b-here
GROQ_API_KEY=your-groq-api-key-here

# Model Roles
MODEL_PRICING_EXPLANATION=openai/gpt-oss-20b
MODEL_NEGOTIATION_AGENT=openai/gpt-oss-120b
MODEL_SUSPICIOUS_DATA_REASONING=openai/gpt-oss-20b
MODEL_MARKET_INFO=groq/compound
```

---

## 2. Running System Components

### 2.1 Backend FastAPI Server
Starts the REST API service, PostgreSQL/SQLite ORM, and ChromaDB vector repository:
```powershell
.venv\Scripts\activate
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/v1/health`

---

### 2.2 Speech Module & Push-to-Talk Studio
Runs the CUDA GPU-accelerated `faster-whisper` speech transcription and translation service:
```powershell
.venv\Scripts\activate
python ai/speech/ui.py
```
- **Speech Web UI**: Open **`http://127.0.0.1:5000`**
- **How to Use**:
  1. Click **"Start Listening"**.
  2. Speak in Hindi, Tamil, Hinglish, or English.
  3. Click **"Stop & Transcribe"** to view real-time transcription and English translation.

---

### 2.3 Frontend Dashboard (Next.js)
Starts the unified artisan and buyer dashboard:
```powershell
cd frontend
npm run dev
```
- **Web App**: Open **`http://localhost:3000`**
- **Dashboard**: `http://localhost:3000/dashboard`

---

## 3. Automated Quick-Launch Scripts

### 3.1 Linux / macOS Bash Script (`run.sh`)
```bash
chmod +x run.sh
./run.sh backend    # Starts Backend API on port 8000
./run.sh frontend   # Starts Next.js frontend on port 3000
./run.sh speech     # Starts Speech Web UI on port 5000
./run.sh all        # Starts all services concurrently
```

### 3.2 Windows Batch Script (`run.bat`)
```cmd
run.bat backend     # Starts Backend API
run.bat frontend    # Starts Frontend
run.bat speech      # Starts Speech Studio
run.bat all         # Launches all in separate terminal windows
```

---

## 4. Key Architectural Principles

1. **Deterministic Financial Truth**: All labour, materials, overheads, and price floor calculations are executed exclusively by Python math (`DeterministicPricingEngine`). The LLM explains and negotiates, but never invents financial figures.
2. **Non-Negotiable Price Floor**: Seller's floor price (e.g. ₹500.00) is enforced by Python business rules. Any offer below the floor is strictly rejected or countered.
3. **Live Camera Constraint**: Artisan evidence capture uses `navigator.mediaDevices.getUserMedia` with real-time computer-vision lighting and sharpness scoring. No file/gallery uploads are permitted.
4. **BGE-M3 Semantic Search**: ChromaDB vector store indexes dense embeddings and applies deterministic capacity and delivery constraints.
5. **Speech Module Protection**: The `ai/speech/` module is consumed directly for translation into downstream AI workflows without modifying its internals.
