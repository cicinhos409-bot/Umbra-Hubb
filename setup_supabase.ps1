$ErrorActionPreference = "Stop"

Write-Host "=== Configuração Automática do Supabase ===" -ForegroundColor Cyan

# 1. Instalação do CLI (via npx)
Write-Host "`n[1/6] Verificando Supabase CLI..."
try {
    npx supabase --version
} catch {
    Write-Host "Instalando dependências..."
}

# 2. Login
Write-Host "`n[2/6] Autenticação..."
Write-Host "Se uma janela do navegador abrir, faça login. Se pedir um token, gere em: https://supabase.com/dashboard/account/tokens" -ForegroundColor Yellow
npx supabase login

# 3. Inicialização e Link
Write-Host "`n[3/6] Vinculando ao projeto 'cvrdcupvqvkpwllwlkfw'..."
if (-not (Test-Path "supabase/config.toml")) {
    npx supabase init --no-git
}
# O link pode pedir a senha do banco de dados (database password)
Write-Host "IMPORTANTE: Você pode precisar digitar a SENHA do banco de dados (Database Password) que você definiu ao criar o projeto." -ForegroundColor Yellow
npx supabase link --project-ref cvrdcupvqvkpwllwlkfw

# 4. Migração do Banco de Dados
Write-Host "`n[4/6] Aplicando migrações no banco de dados..."
npx supabase db push

# 5. Configurar Segredos
Write-Host "`n[5/6] Configurando variáveis de ambiente..."
npx supabase secrets set CAKTO_WEBHOOK_SECRET=1886aaf3-6c96-4d54-a7cc-b273505bb321

# 6. Deploy da Edge Function
Write-Host "`n[6/6] Implantando Edge Function 'cakto-webhook'..."
# Deploy sem verificar JWT (pois validamos via secret localmente)
npx supabase functions deploy cakto-webhook --no-verify-jwt

Write-Host "`n=== Configuração Concluída! ===" -ForegroundColor Green
Write-Host "Agora vá ao painel da Cakto e configure o Webhook:"
Write-Host "URL: https://cvrdcupvqvkpwllwlkfw.functions.supabase.co/cakto-webhook"
Write-Host "Eventos: Compra aprovada (purchase.approved)"
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
