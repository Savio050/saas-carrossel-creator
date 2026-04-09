@echo off
cd /d "C:\Users\savio\Documents\Claude\Projects\CarrosselCreator"
echo.
echo ====================================
echo   Linkando ao projeto Vercel...
echo ====================================
echo.
echo Quando perguntado, responda:
echo   - Set up and deploy? Y
echo   - Which scope? Selecione sua conta/time
echo   - Link to existing project? Y
echo   - What is the name of your existing project? saas-carrossel-creator
echo.
pause
call npx vercel link
echo.
echo ====================================
echo   Fazendo deploy para producao...
echo ====================================
echo.
call npx vercel --prod --yes
echo.
echo Deploy concluido!
pause
