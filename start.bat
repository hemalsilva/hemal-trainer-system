@echo off
echo ===================================================
echo   Starting Hotel Training Management System...
echo ===================================================

echo.
echo [1/3] Installing Backend Dependencies...
cd backend
call npm install

echo.
echo [2/3] Installing Frontend Dependencies...
cd ../frontend
call npm install

echo.
echo [3/3] Launching Servers...
echo Starting Node.js Backend Server on Port 5000...
start cmd /k "title Backend Server && cd ../backend && npm run dev"

echo Starting React (Vite) Frontend Server...
start cmd /k "title Frontend Server && npm run dev"

echo.
echo ===================================================
echo   System is now starting in separate windows!
echo   Once loaded, open your browser to the local URL 
echo   shown in the Frontend Server window (usually 
echo   http://localhost:5173).
echo ===================================================
pause
