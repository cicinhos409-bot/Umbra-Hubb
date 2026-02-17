# 🌑 Umbra Hub - Arsenal Definitivo para Canais Dark

Plataforma completa de ferramentas para criadores de conteúdo dark, com integração Supabase para autenticação e gerenciamento de usuários.

## 🚀 Funcionalidades

- ✅ Autenticação via Magic Link (sem senha)
- ✅ Gerenciamento de sessão automático
- ✅ Banco de dados PostgreSQL com Row Level Security
- ✅ Sistema de planos (FREE, PRO, TURBO)
- ✅ Interface moderna com animações
- ✅ Design responsivo

## 🛠️ Tecnologias

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth)
- **Estilização:** CSS Vanilla + Tailwind CSS
- **Ícones:** Lucide React
- **Deploy:** Vercel

## 📦 Instalação Local

```bash
# Clone o repositório
git clone https://github.com/cicinhos409-bot/Umbra-Hubb.git
cd Umbra-Hubb

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

## 🌐 Deploy na Vercel

### 1. Via GitHub (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Add New Project"**
4. Selecione o repositório `Umbra-Hubb`
5. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL` - URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` - Chave pública do Supabase
   - `GEMINI_API_KEY` (opcional) - API Key do Google Gemini
6. Clique em **"Deploy"**

### 2. Via CLI da Vercel

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env.local` baseado no `.env.example`:

```env
# Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui

# Gemini AI (Opcional)
GEMINI_API_KEY=sua-api-key-gemini
```

### Onde encontrar as credenciais Supabase:

1. Acesse [supabase.com](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **Project URL** e a **anon/public key**

## 📁 Estrutura do Projeto

```
umbra-hub/
├── components/         # Componentes React
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── ...
├── services/          # Serviços e integrações
│   ├── supabaseClient.ts
│   └── authService.ts
├── constants.tsx      # Constantes e configurações
├── types.ts          # Tipos TypeScript
├── App.tsx           # Componente principal
├── index.tsx         # Ponto de entrada
└── index.html        # HTML base
```

## 🗄️ Banco de Dados

A tabela `users` é criada automaticamente com:

- `id` - UUID (referência para auth.users)
- `email` - Email do usuário
- `tier` - Plano: FREE, PRO ou TURBO
- `created_at` - Data de criação
- `updated_at` - Data de atualização

Row Level Security (RLS) está habilitado para garantir que usuários acessem apenas seus próprios dados.

## 🎨 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview
```

## 📝 Licença

© 2025 Umbra Hub - Todos os direitos reservados

## 🤝 Contribuição

Este é um projeto privado. Para mais informações, entre em contato.

---

**Desenvolvido com ❤️ para criadores de conteúdo dark**
