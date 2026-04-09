@echo off
cd /d "C:\Users\savio\Documents\Claude\Projects\CarrosselCreator"
echo Instalando dependencias...
call npm install
echo.
echo Iniciando servidor de desenvolvimento...
echo Acesse: http://localhost:3000
npm run dev
pause
