# install_skills.ps1
# Instala as 6 novas skills no diretório .claude/skills do usuário
# Execute com: powershell -ExecutionPolicy Bypass -File install_skills.ps1

$ErrorActionPreference = "Stop"

# Detecta o diretório home e destino
$skillsDir = Join-Path $env:USERPROFILE ".claude\skills"

Write-Host "Installing skills to: $skillsDir" -ForegroundColor Cyan

# Lista de skills a instalar
$skills = @(
    "carousel-writer",
    "hook-writer",
    "post-writer",
    "ui-ux-pro-max",
    "creative-copywriting",
    "web-scraping"
)

# Diretório de origem (pasta onde este script está)
$sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($skill in $skills) {
    $src = Join-Path $sourceDir $skill
    $dst = Join-Path $skillsDir $skill

    if (Test-Path $src) {
        if (-not (Test-Path $dst)) {
            New-Item -ItemType Directory -Path $dst -Force | Out-Null
        }
        Copy-Item -Path "$src\SKILL.md" -Destination "$dst\SKILL.md" -Force
        Write-Host "  [OK] $skill" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] $skill — source not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Done! Restart Claude Code / Cowork to activate the new skills." -ForegroundColor Cyan
