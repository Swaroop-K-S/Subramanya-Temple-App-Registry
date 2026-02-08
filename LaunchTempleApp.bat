@echo off
title Temple Management Suite - Starting...
color 0A

echo.
echo ========================================
echo    SUBRAMANYA TEMPLE MANAGEMENT SUITE
echo ========================================
echo.
echo Starting services... Please wait.
echo.

:: Store the project root
set PROJECT_ROOT=%~dp0

:: Start Backend Server (hidden)
echo [1/3] Starting Backend Server...
start /B /MIN cmd /c "cd /d "%PROJECT_ROOT%star-backend" && python -m uvicorn main:app --reload"

:: Wait for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend Server (hidden)
echo [2/3] Starting Frontend Server...
start /B /MIN cmd /c "cd /d "%PROJECT_ROOT%star-frontend" && node node_modules/vite/bin/vite.js --host"

:: Wait for frontend to initialize
timeout /t 4 /nobreak > nul

:: Open in default browser
echo [3/3] Opening Application...
start "" http://localhost:5173

echo.
echo ========================================
echo    Application is running!
echo    Close this window when you're done.
echo ========================================
echo.
echo Press any key to stop all services and exit...
pause > nul

:: Kill the servers when user closes
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul

echo Services stopped. Goodbye!
