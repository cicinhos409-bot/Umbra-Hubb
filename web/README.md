# UmbraHub — Site Público (Astro)

Landing page + Blog estático do UmbraHub, construído com Astro 4 + MDX + Tailwind CSS.

## Estrutura

```
web/
├── src/
│   ├── components/
│   │   ├── Header.astro       ← Nav sticky com logo
│   │   ├── Footer.astro       ← 3 últimos posts + links
│   │   └── BlogCard.astro     ← Card de post
│   ├── layouts/
│   │   ├── BaseLayout.astro   ← HTML base + SEO meta tags
│   │   └── BlogLayout.astro   ← Layout de post individual
│   ├── pages/
│   │   ├── index.astro        ← / (homepage)
│   │   ├── pricing.astro      ← /pricing
│   │   ├── about.astro        ← /about
│   │   └── blog/
│   │       ├── index.astro    ← /blog (listagem)
│   │       └── [...slug].astro← /blog/[slug] (post)
│   └── content/
│       ├── config.ts          ← Schema da coleção blog
│       └── blog/              ← Posts MDX
└── vercel.json                ← Config deploy + redirects /app
```

## URLs

| URL | Descrição |
|-----|-----------|
| `/` | Homepage (landing) |
| `/blog` | Listagem de posts |
| `/blog/[slug]` | Post individual |
| `/pricing` | Tabela de preços |
| `/about` | Sobre |
| `/app` | Redireciona para o dashboard React |

## Setup local

```bash
cd web
npm install
npm run dev
```

## Deploy na Vercel

```bash
cd web
vercel
```

Ou conecte o repositório na Vercel e defina `Root Directory = web`.

## Adicionar posts

Crie um arquivo `.mdx` em `src/content/blog/` com o frontmatter:

```yaml
---
title: "Título do post"
description: "Descrição curta"
pubDate: 2026-01-01
image: "/images/blog/imagem.jpg"
tags: ["tag1", "tag2"]
author: "Time UmbraHub"
readTime: "5 min"
---
```

## Dashboard React

O dashboard React (`/app`) é um projeto separado em `../` (raiz do monorepo).
Os redirects em `vercel.json` apontam `/app/*` → `https://umbrahubb.vercel.app`.
