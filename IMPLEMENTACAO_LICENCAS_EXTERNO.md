
# Guia de Licenciamento Robusto (Umbra SDK)

O sistema foi atualizado para o modelo **"DottiFlow Style"**, que oferece muito mais segurança e controle.

---

## 🚀 Novas Funcionalidades
1.  **Kill Switch Remoto:** Você pode desativar qualquer extensão instantaneamente pelo banco de dados.
2.  **Sessões de 24h:** O usuário valida uma vez e fica "logado" por 24h, mesmo offline.
3.  **Heartbeat:** A extensão se revalida sozinha em segundo plano a cada 6 horas.
4.  **Device ID Fingerprint:** Controle rígido de quantos computadores usam a mesma chave.

---

## 🛠️ Onde encontrar os códigos?

Todos os novos modelos de `background.js` e `popup.js` estão no arquivo:
👉 [UMBRA_SDK_ROBUSTO.md](file:///c:/Users/Usuario/Downloads/umbra-hub---arsenal-definitivo-para-canais-dark/UMBRA_SDK_ROBUSTO.md)

---

## ⚙️ URL das Funções (Já implantadas no seu Supabase)

| Função | URL |
| :--- | :--- |
| **Webhook Cakto** | `https://cvrdcupvqvkpwllwlkfw.functions.supabase.co/cakto-webhook` |
| **API do SDK** | `https://cvrdcupvqvkpwllwlkfw.functions.supabase.co/validar-licenca` |

---

## 🔐 Como Gerenciar Bloqueios (Kill Switch)

Para desativar uma extensão remotamente (ex: em caso de bug grave ou manutenção):
1. No seu SQL Editor do Supabase, rode:
   ```sql
   UPDATE extensoes SET status = 'inactive' WHERE slug = 'slug-da-extensao';
   ```
2. Todas as extensões desse tipo serão bloqueadas no próximo batimento cardíaco (heartbeat).

---

## 4. Painel ADM (Seu HTML no Railway)

Como você já usa um HTML no Railway, você pode usar o **Supabase JS SDK** diretamente nele para gerenciar as licenças. Basta importar o script do Supabase:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const supabase = supabase.createClient('https://cvrdcupvqvkpwllwlkfw.supabase.co', 'SUA_ANON_KEY');

  // Exemplo de como listar licenças no seu painel
  async function listarLicencas() {
    const { data } = await supabase.from('licencas').select('*');
    console.log(data);
  }
</script>
```

---

## 5. Como fazer o Deploy das Funções

Para que as funções funcionem, você precisa rodar este comando no seu terminal (onde o código do app está):

```bash
npx supabase functions deploy cakto-webhook --no-verify-jwt
npx supabase functions deploy validar-licenca --no-verify-jwt
```
