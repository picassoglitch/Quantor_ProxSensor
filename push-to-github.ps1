# Script para hacer push a GitHub
# Reemplaza TU-USUARIO con tu nombre de usuario de GitHub

$username = Read-Host "Ingresa tu nombre de usuario de GitHub"
$repoUrl = "https://github.com/$username/Quantor_Prox.git"

Write-Host "Agregando remote origin..." -ForegroundColor Yellow
git remote add origin $repoUrl

Write-Host "Haciendo push a GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "¡Listo! Tu código está en GitHub." -ForegroundColor Green
Write-Host "Repositorio: $repoUrl" -ForegroundColor Cyan

