@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Instalando Skills no Claude / Cowork
echo ============================================
echo.

set "SKILLS_DIR=%USERPROFILE%\.claude\skills"
set "SOURCE_DIR=%~dp0"

echo Destino: %SKILLS_DIR%
echo Origem:  %SOURCE_DIR%
echo.

REM Cria o diretório de skills se não existir
if not exist "%SKILLS_DIR%" (
    mkdir "%SKILLS_DIR%"
    echo Criado: %SKILLS_DIR%
)

REM Instala cada skill
set "SKILLS=carousel-writer hook-writer post-writer ui-ux-pro-max creative-copywriting web-scraping"

for %%S in (%SKILLS%) do (
    if exist "%SOURCE_DIR%%%S\SKILL.md" (
        if not exist "%SKILLS_DIR%\%%S" mkdir "%SKILLS_DIR%\%%S"
        copy /Y "%SOURCE_DIR%%%S\SKILL.md" "%SKILLS_DIR%\%%S\SKILL.md" >nul
        echo [OK] %%S
    ) else (
        echo [SKIP] %%S - arquivo nao encontrado
    )
)

echo.
echo ============================================
echo   Instalacao concluida!
echo   Reinicie o Cowork para ativar as skills.
echo ============================================
echo.
pause
