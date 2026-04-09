@echo off
cd /d "C:\Users\savio\Documents\Claude\Projects\CarrosselCreator"
echo Clonando repositorio via npx degit...
npx --yes degit Savio050/saas-carrossel-creator . --force
if %errorlevel% == 0 (
    echo.
    echo Clone concluido com sucesso!
    del clone_repo.bat 2>nul
) else (
    echo ERRO - tentando via curl...
    curl -L -o repo.zip "https://github.com/Savio050/saas-carrossel-creator/archive/refs/heads/main.zip"
    tar -xf repo.zip --strip-components=1
    del repo.zip
    del clone_repo.bat 2>nul
    echo Extracao concluida!
)
pause
