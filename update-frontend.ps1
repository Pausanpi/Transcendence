# Script para actualizar frontend automáticamente
# Uso: .\update-frontend.ps1

Write-Host "🔨 Building frontend..." -ForegroundColor Cyan
Set-Location frontend
npm run rebuild

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Para actualizar el contenedor, ejecuta en Ubuntu:" -ForegroundColor Yellow
Write-Host "   cd /media/sf_transc" -ForegroundColor White
Write-Host "   docker compose build nginx" -ForegroundColor White
Write-Host "   docker compose up -d nginx --force-recreate" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Luego recarga el navegador: https://localhost:8443" -ForegroundColor Cyan
