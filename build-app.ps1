# ============================================================
#  build-app.ps1  —  Gera o instalador Umbra Hub (.exe)
#  Uso: .\build-app.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot

function Log($msg) { Write-Host "`n[BUILD] $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "[OK] $msg" -ForegroundColor Green }
function Err($msg) { Write-Host "[ERRO] $msg" -ForegroundColor Red; exit 1 }

# ── 0. Limpar processos antigos ───────────────────────────────────────────────
Log "Encerrando instâncias antigas do app e servidor..."
try {
    taskkill /F /IM "server.exe" /T 2>$null
    taskkill /F /IM "Umbra Hub.exe" /T 2>$null
    Start-Sleep -Seconds 1
} catch {}

# ── 1. Verificar dependências ────────────────────────────────────────────────
Log "Verificando dependências..."

if (-not (Get-Command python -ErrorAction SilentlyContinue)) { Err "Python não encontrado. Instale em https://python.org" }
if (-not (Get-Command npm    -ErrorAction SilentlyContinue)) { Err "Node.js/npm não encontrado. Instale em https://nodejs.org" }

Ok "Python e Node encontrados."

# ── 2. Instalar PyInstaller e dependências Python ────────────────────────────
Log "Instalando PyInstaller e dependências Python..."
Set-Location $ROOT
pip install pyinstaller -q
if ($LASTEXITCODE -ne 0) { Err "Falha ao instalar PyInstaller" }

if (Test-Path "requirements.txt") {
    pip install -r requirements.txt -q
    if ($LASTEXITCODE -ne 0) { Err "Falha ao instalar requirements.txt" }
}
Ok "Dependências Python instaladas."

# ── 3. Empacotar server.py com PyInstaller ───────────────────────────────────
Log "Empacotando server.py com PyInstaller..."
$distBackend = Join-Path $ROOT "dist-backend"
if (Test-Path $distBackend) { Remove-Item $distBackend -Recurse -Force }

pyinstaller server.py `
    --onefile `
    --distpath "$distBackend" `
    --workpath "$ROOT\build-py" `
    --specpath "$ROOT" `
    --name server `
    --hidden-import flask `
    --hidden-import flask_cors `
    --hidden-import requests `
    --noconfirm `
    --clean

if ($LASTEXITCODE -ne 0) { Err "PyInstaller falhou. Veja os logs acima." }
Ok "Backend empacotado em dist-backend/server.exe"

# ── 4. Build do frontend Vite ────────────────────────────────────────────────
Log "Compilando frontend React/Vite..."
npm run build
if ($LASTEXITCODE -ne 0) { Err "Build do Vite falhou. Veja os logs acima." }
Ok "Frontend compilado em dist/"

# ── 5. Instalar dependências Node (electron-builder) ────────────────────────
Log "Instalando dependências Node..."
npm install
if ($LASTEXITCODE -ne 0) { Err "npm install falhou." }

# ── 6. Gerar instalador com electron-builder ────────────────────────────────
Log "Gerando instalador .exe com electron-builder..."
npx electron-builder --win --config electron-builder.yml
if ($LASTEXITCODE -ne 0) { Err "electron-builder falhou. Veja os logs acima." }

# ── 7. Copiar .env de exemplo para a pasta release ──────────────────────────
Log "Copiando .env.example para release/..."
$releaseDir = Join-Path $ROOT "release"
if (Test-Path $releaseDir) {
    Copy-Item "$ROOT\.env.example" "$releaseDir\.env.example" -Force
    Write-Host @"

  ┌─────────────────────────────────────────────────────────┐
  │   IMPORTANTE: Configuração do .env                      │
  │                                                         │
  │   Na pasta release/, renomeie .env.example para .env    │
  │   e preencha suas chaves de API antes de distribuir.    │
  │                                                         │
  │   O app lê o .env da pasta onde o .exe está instalado.  │
  └─────────────────────────────────────────────────────────┘
"@ -ForegroundColor Yellow
}

Ok ""
Write-Host "`n✅ BUILD CONCLUÍDO!" -ForegroundColor Green
Write-Host "   Instalador gerado em: $releaseDir" -ForegroundColor White
Write-Host "   Procure por: 'Umbra Hub Setup *.exe'" -ForegroundColor White
