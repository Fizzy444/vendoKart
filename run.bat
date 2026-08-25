@echo off
REM VendoKart Windows Service Launcher Script

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

set PYTHON=%ROOT_DIR%.venv\Scripts\python.exe
if not exist "%PYTHON%" (
    set PYTHON=python
)

set CMD=%1
if "%CMD%"=="" set CMD=all

if "%CMD%"=="backend" goto run_backend
if "%CMD%"=="frontend" goto run_frontend
if "%CMD%"=="speech" goto run_speech
if "%CMD%"=="all" goto run_all

:run_backend
echo ==========================================
echo Starting VendoKart Backend on port 8000
echo ==========================================
cd "%ROOT_DIR%backend"
"%PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
goto end

:run_frontend
echo ==========================================
echo Starting VendoKart Frontend on port 3000
echo ==========================================
cd "%ROOT_DIR%frontend"
call npm run dev
goto end

:run_speech
echo ==========================================
echo Starting VendoKart Speech Studio on port 5000
echo ==========================================
cd "%ROOT_DIR%"
"%PYTHON%" ai/speech/ui.py
goto end

:run_all
echo ==========================================
echo Launching All VendoKart Services
echo ==========================================
start "VendoKart Speech Studio (Port 5000)" cmd /k ""%PYTHON%" "%ROOT_DIR%ai\speech\ui.py""
start "VendoKart Backend API (Port 8000)" cmd /k "cd /d "%ROOT_DIR%backend" && "%PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "VendoKart Frontend Dashboard (Port 3000)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"
echo All services launched in separate windows!
goto end

:end
