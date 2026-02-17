
import React, { useState, useMemo } from 'react';
import { Search, Globe, Box, Eye, Mic, Image as ImageIcon, Camera, BarChart3, Brain, Cloud, ExternalLink, Key, Code } from 'lucide-react';

interface ApiCard {
  id: string;
  title: string;
  badge: string;
  badgeType: 'free' | 'credits' | 'trial';
  desc: string;
  tutorial: string[];
  link: string;
  docs: string;
  tags: string;
}

interface Category {
  id: string;
  title: string;
  icon: React.ReactNode;
  cards: ApiCard[];
}

const CATEGORIES: Category[] = [
  {
    id: 'llm',
    title: 'LLMs / IA Generativa',
    icon: <Brain className="w-8 h-8" />,
    cards: [
      {
        id: 'openai',
        title: 'OpenAI',
        badge: '$5 crédito',
        badgeType: 'credits',
        desc: 'GPT-4o, GPT-4, o1, DALL-E, Whisper. A plataforma mais popular de IA generativa.',
        tutorial: [
          'Crie conta em platform.openai.com',
          'Vá em API Keys no menu lateral',
          'Clique Create new secret key',
          'Copie a chave (só aparece 1x!)'
        ],
        link: 'https://platform.openai.com/api-keys',
        docs: 'https://platform.openai.com/docs',
        tags: 'llm gpt chatgpt'
      },
      {
        id: 'anthropic',
        title: 'Anthropic (Claude)',
        badge: '$5 crédito',
        badgeType: 'credits',
        desc: 'Claude Opus, Sonnet e Haiku. Conhecido pela segurança e contexto longo de 200k tokens.',
        tutorial: [
          'Acesse console.anthropic.com',
          'Crie sua conta',
          'Navegue até API Keys',
          'Clique Create Key e copie'
        ],
        link: 'https://console.anthropic.com/settings/keys',
        docs: 'https://docs.anthropic.com',
        tags: 'llm claude'
      },
      {
        id: 'google-gemini',
        title: 'Google Gemini',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Gemini 2.0, 1.5 Pro e Flash. Free tier muito generoso com 60 req/min.',
        tutorial: [
          'Acesse aistudio.google.com',
          'Faça login com Google',
          'Clique Get API Key no topo',
          'Crie um projeto e copie a key'
        ],
        link: 'https://aistudio.google.com/apikey',
        docs: 'https://ai.google.dev/docs',
        tags: 'llm gemini google'
      },
      {
        id: 'mistral',
        title: 'Mistral AI',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Mistral Large, Medium, Small. Modelos europeus de alta qualidade.',
        tutorial: [
          'Acesse console.mistral.ai',
          'Crie conta e faça login',
          'Vá em API Keys',
          'Clique Create new key'
        ],
        link: 'https://console.mistral.ai/api-keys',
        docs: 'https://docs.mistral.ai',
        tags: 'llm mistral'
      },
      {
        id: 'cohere',
        title: 'Cohere',
        badge: 'Trial',
        badgeType: 'trial',
        desc: 'Command R+, embeddings de alta qualidade. Focado em enterprise e RAG.',
        tutorial: [
          'Acesse dashboard.cohere.com',
          'Crie conta gratuita',
          'Vá em API Keys',
          'Copie a Trial key'
        ],
        link: 'https://dashboard.cohere.com/api-keys',
        docs: 'https://docs.cohere.com',
        tags: 'llm cohere embeddings'
      },
      {
        id: 'groq',
        title: 'Groq',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Inference ultra-rápido. Llama, Mistral, Mixtral com latência baixíssima.',
        tutorial: [
          'Acesse console.groq.com',
          'Faça login/cadastro',
          'Vá em API Keys',
          'Clique Create API Key'
        ],
        link: 'https://console.groq.com/keys',
        docs: 'https://console.groq.com/docs',
        tags: 'llm groq inference fast'
      },
      {
        id: 'deepseek',
        title: 'DeepSeek',
        badge: 'Muito Barato',
        badgeType: 'free',
        desc: 'Modelos chineses de alta qualidade. DeepSeek-V2, coder. Preços muito baixos.',
        tutorial: [
          'Acesse platform.deepseek.com',
          'Crie conta',
          'Vá em API Keys',
          'Gere uma nova chave'
        ],
        link: 'https://platform.deepseek.com/api_keys',
        docs: 'https://platform.deepseek.com/api-docs',
        tags: 'llm deepseek china'
      },
      {
        id: 'together-ai',
        title: 'Together AI',
        badge: '$5 crédito',
        badgeType: 'credits',
        desc: 'Llama, Mistral, Qwen e dezenas de modelos open source. Ótimo preço.',
        tutorial: [
          'Acesse api.together.xyz',
          'Crie conta',
          'Vá em Settings > API Keys',
          'Copie a chave padrão ou crie nova'
        ],
        link: 'https://api.together.xyz/settings/api-keys',
        docs: 'https://docs.together.ai',
        tags: 'llm together inference'
      },
      {
        id: 'perplexity',
        title: 'Perplexity',
        badge: 'Créditos',
        badgeType: 'credits',
        desc: 'LLM com busca web integrada. Sonar models para respostas atualizadas.',
        tutorial: [
          'Acesse perplexity.ai',
          'Faça login',
          'Vá em Settings > API',
          'Gere sua API key'
        ],
        link: 'https://www.perplexity.ai/settings/api',
        docs: 'https://docs.perplexity.ai',
        tags: 'llm perplexity search'
      },
      {
        id: 'openrouter',
        title: 'OpenRouter',
        badge: 'Pay as you go',
        badgeType: 'free',
        desc: 'Agregador de APIs. Acesse GPT-4, Claude, Llama, Mistral com uma única key.',
        tutorial: [
          'Acesse openrouter.ai',
          'Faça login com Google/GitHub',
          'Vá em Keys',
          'Clique Create Key'
        ],
        link: 'https://openrouter.ai/keys',
        docs: 'https://openrouter.ai/docs',
        tags: 'llm openrouter aggregator'
      },
      {
        id: 'ai21',
        title: 'AI21 Labs',
        badge: 'Trial',
        badgeType: 'trial',
        desc: 'Jamba e Jurassic models. Especializado em texto e linguagem natural.',
        tutorial: [
          'Acesse studio.ai21.com',
          'Crie conta gratuita',
          'Vá em API Key no dashboard',
          'Copie sua chave'
        ],
        link: 'https://studio.ai21.com/account/api-key',
        docs: 'https://docs.ai21.com',
        tags: 'llm ai21 jamba'
      },
      {
        id: 'cloudflare-workers-ai',
        title: 'Cloudflare Workers AI',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Llama, Mistral, Stable Diffusion no edge. Free tier generoso.',
        tutorial: [
          'Acesse dash.cloudflare.com',
          'Crie conta',
          'Vá em AI > Workers AI',
          'Pegue o Account ID e crie API token'
        ],
        link: 'https://dash.cloudflare.com/?to=/:account/ai/workers-ai',
        docs: 'https://developers.cloudflare.com/workers-ai',
        tags: 'llm cloudflare inference'
      }
    ]
  },
  {
    id: 'inference',
    title: 'Inference / Open Source',
    icon: <Box className="w-8 h-8" />,
    cards: [
      {
        id: 'huggingface',
        title: 'Hugging Face',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Milhares de modelos. Inference API gratuita com rate limits.',
        tutorial: [
          'Acesse huggingface.co',
          'Crie conta',
          'Vá em Settings > Access Tokens',
          'Clique New token'
        ],
        link: 'https://huggingface.co/settings/tokens',
        docs: 'https://huggingface.co/docs/api-inference',
        tags: 'inference huggingface models'
      },
      {
        id: 'replicate',
        title: 'Replicate',
        badge: 'Créditos',
        badgeType: 'credits',
        desc: 'Rode qualquer modelo open source. Llama, Stable Diffusion, etc.',
        tutorial: [
          'Acesse replicate.com',
          'Login com GitHub',
          'Vá em Account > API tokens',
          'Copie o token padrão'
        ],
        link: 'https://replicate.com/account/api-tokens',
        docs: 'https://replicate.com/docs',
        tags: 'inference replicate models'
      },
      {
        id: 'fireworks',
        title: 'Fireworks AI',
        badge: '$1 crédito',
        badgeType: 'credits',
        desc: 'Inference otimizado para velocidade. Llama, Mixtral e mais.',
        tutorial: [
          'Acesse fireworks.ai',
          'Crie conta',
          'Vá em API Keys',
          'Gere nova chave'
        ],
        link: 'https://fireworks.ai/api-keys',
        docs: 'https://docs.fireworks.ai',
        tags: 'inference fireworks fast'
      },
      {
        id: 'deepinfra',
        title: 'Deepinfra',
        badge: 'Pay as you go',
        badgeType: 'free',
        desc: 'Modelos open source com preços baixos. Fácil de usar.',
        tutorial: [
          'Acesse deepinfra.com',
          'Crie conta',
          'Vá em Dashboard > API Keys',
          'Crie nova chave'
        ],
        link: 'https://deepinfra.com/dash/api_keys',
        docs: 'https://deepinfra.com/docs',
        tags: 'inference deepinfra'
      },
      {
        id: 'octoai',
        title: 'OctoAI',
        badge: '$10 crédito',
        badgeType: 'credits',
        desc: 'Llama, Mistral e modelos de imagem otimizados.',
        tutorial: [
          'Acesse octo.ai',
          'Crie conta',
          'Vá em Settings > API Tokens',
          'Crie um token'
        ],
        link: 'https://octo.ai/docs/getting-started/how-to-create-an-octoai-access-token',
        docs: 'https://octo.ai/docs',
        tags: 'inference octoai'
      },
      {
        id: 'baseten',
        title: 'Baseten',
        badge: '$30 crédito',
        badgeType: 'credits',
        desc: 'Deploy de modelos customizados. Truss framework.',
        tutorial: [
          'Acesse baseten.co',
          'Crie conta',
          'Vá em Settings > API Keys',
          'Gere nova chave'
        ],
        link: 'https://app.baseten.co/settings/api_keys',
        docs: 'https://docs.baseten.co',
        tags: 'inference baseten'
      },
      {
        id: 'modal',
        title: 'Modal',
        badge: '$30/mês grátis',
        badgeType: 'credits',
        desc: 'Serverless para ML. Rode qualquer código Python com GPUs.',
        tutorial: [
          'Acesse modal.com',
          'Crie conta',
          'Instale pip install modal',
          'Rode modal token new'
        ],
        link: 'https://modal.com/signup',
        docs: 'https://modal.com/docs',
        tags: 'inference modal serverless'
      },
      {
        id: 'runpod',
        title: 'RunPod',
        badge: 'Pay as you go',
        badgeType: 'free',
        desc: 'GPUs on-demand baratas. Serverless endpoints e pods.',
        tutorial: [
          'Acesse runpod.io',
          'Crie conta',
          'Vá em Settings > API Keys',
          'Gere Read/Write key'
        ],
        link: 'https://www.runpod.io/console/user/settings',
        docs: 'https://docs.runpod.io',
        tags: 'inference runpod gpu'
      }
    ]
  },
  {
    id: 'vision',
    title: 'Visão Computacional',
    icon: <Eye className="w-8 h-8" />,
    cards: [
      {
        id: 'google-vision',
        title: 'Google Vision AI',
        badge: '1000 req/mês',
        badgeType: 'free',
        desc: 'OCR, detecção de objetos, faces, labels. Muito preciso.',
        tutorial: [
          'Acesse console.cloud.google.com',
          'Crie projeto e ative Vision API',
          'Vá em APIs & Services > Credentials',
          'Crie API Key'
        ],
        link: 'https://console.cloud.google.com/apis/credentials',
        docs: 'https://cloud.google.com/vision/docs',
        tags: 'vision google ocr'
      },
      {
        id: 'azure-vision',
        title: 'Azure Computer Vision',
        badge: '5000 req/mês',
        badgeType: 'free',
        desc: 'OCR, análise de imagem, detecção facial. Free tier generoso.',
        tutorial: [
          'Acesse portal.azure.com',
          'Crie recurso "Computer Vision"',
          'Vá em Keys and Endpoint',
          'Copie KEY 1 ou KEY 2'
        ],
        link: 'https://portal.azure.com/#create/Microsoft.CognitiveServicesComputerVision',
        docs: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision',
        tags: 'vision azure microsoft'
      },
      {
        id: 'clarifai',
        title: 'Clarifai',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Reconhecimento de imagem, vídeo e texto. Modelos pré-treinados.',
        tutorial: [
          'Acesse clarifai.com',
          'Crie conta',
          'Vá em Settings > Security',
          'Crie Personal Access Token'
        ],
        link: 'https://clarifai.com/settings/security',
        docs: 'https://docs.clarifai.com',
        tags: 'vision clarifai'
      },
      {
        id: 'roboflow',
        title: 'Roboflow',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Treine e deploy modelos de detecção. Anotação fácil.',
        tutorial: [
          'Acesse roboflow.com',
          'Crie conta',
          'Vá em Settings > Roboflow API',
          'Copie Private API Key'
        ],
        link: 'https://app.roboflow.com/settings/api',
        docs: 'https://docs.roboflow.com',
        tags: 'vision roboflow detection'
      },
      {
        id: 'deepai',
        title: 'DeepAI',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'APIs simples de visão. Colorização, super resolução, etc.',
        tutorial: [
          'Acesse deepai.org',
          'Crie conta',
          'Vá em Profile',
          'Copie sua API Key'
        ],
        link: 'https://deepai.org/dashboard/profile',
        docs: 'https://deepai.org/docs',
        tags: 'vision deepai'
      },
      {
        id: 'imagga',
        title: 'Imagga',
        badge: '1000 req/mês',
        badgeType: 'free',
        desc: 'Auto-tagging, categorização, cores, cropping inteligente.',
        tutorial: [
          'Acesse imagga.com',
          'Crie conta',
          'Vá no Dashboard',
          'Copie API Key e Secret'
        ],
        link: 'https://imagga.com/auth/signup',
        docs: 'https://docs.imagga.com',
        tags: 'vision imagga tagging'
      }
    ]
  },
  {
    id: 'audio',
    title: 'Áudio / Voz',
    icon: <Mic className="w-8 h-8" />,
    cards: [
      {
        id: 'assemblyai',
        title: 'AssemblyAI',
        badge: 'Créditos',
        badgeType: 'credits',
        desc: 'Transcrição de alta qualidade. Speaker diarization, sentiment.',
        tutorial: [
          'Acesse assemblyai.com',
          'Crie conta',
          'Vá no Dashboard',
          'Copie sua API Key'
        ],
        link: 'https://www.assemblyai.com/dashboard',
        docs: 'https://www.assemblyai.com/docs',
        tags: 'audio assemblyai transcription'
      },
      {
        id: 'deepgram',
        title: 'Deepgram',
        badge: '$200 crédito',
        badgeType: 'credits',
        desc: 'Speech-to-text rápido e preciso. Real-time e batch.',
        tutorial: [
          'Acesse deepgram.com',
          'Crie conta',
          'Vá em Dashboard > API Keys',
          'Crie nova chave'
        ],
        link: 'https://console.deepgram.com/api-keys',
        docs: 'https://developers.deepgram.com',
        tags: 'audio deepgram transcription'
      },
      {
        id: 'elevenlabs',
        title: 'ElevenLabs',
        badge: '10k chars/mês',
        badgeType: 'free',
        desc: 'Text-to-speech realista. Clonagem de voz. Multilíngue.',
        tutorial: [
          'Acesse elevenlabs.io',
          'Crie conta',
          'Vá em Profile > API Keys',
          'Copie ou crie nova key'
        ],
        link: 'https://elevenlabs.io/app/settings/api-keys',
        docs: 'https://docs.elevenlabs.io',
        tags: 'audio elevenlabs tts voice'
      },
      {
        id: 'playht',
        title: 'Play.ht',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Vozes AI realistas. 900+ vozes em 142 idiomas.',
        tutorial: [
          'Acesse play.ht',
          'Crie conta',
          'Vá em Settings > API Access',
          'Gere API Key e User ID'
        ],
        link: 'https://play.ht/studio/api-access',
        docs: 'https://docs.play.ht',
        tags: 'audio playht tts'
      },
      {
        id: 'speechmatics',
        title: 'Speechmatics',
        badge: 'Trial',
        badgeType: 'trial',
        desc: 'Speech recognition enterprise. 50+ idiomas.',
        tutorial: [
          'Acesse speechmatics.com',
          'Crie conta',
          'Vá em Manage > API Keys',
          'Crie nova chave'
        ],
        link: 'https://portal.speechmatics.com/api-keys',
        docs: 'https://docs.speechmatics.com',
        tags: 'audio speechmatics transcription'
      },
      {
        id: 'revai',
        title: 'Rev AI',
        badge: 'Créditos',
        badgeType: 'credits',
        desc: 'Transcrição por quem inventou o mercado. Alta precisão.',
        tutorial: [
          'Acesse rev.ai',
          'Crie conta',
          'Vá em Access Token',
          'Gere novo token'
        ],
        link: 'https://www.rev.ai/access-token',
        docs: 'https://docs.rev.ai',
        tags: 'audio revai transcription'
      }
    ]
  },
  {
    id: 'image',
    title: 'Imagem / Arte',
    icon: <ImageIcon className="w-8 h-8" />,
    cards: [
      {
        id: 'stabilityai',
        title: 'Stability AI',
        badge: 'Créditos',
        badgeType: 'credits',
        desc: 'Stable Diffusion oficial. SDXL, SD3, image-to-image.',
        tutorial: [
          'Acesse platform.stability.ai',
          'Crie conta',
          'Vá em API Keys',
          'Crie nova chave'
        ],
        link: 'https://platform.stability.ai/account/keys',
        docs: 'https://platform.stability.ai/docs',
        tags: 'image stability diffusion'
      },
      {
        id: 'leonardo',
        title: 'Leonardo AI',
        badge: '150 tokens/dia',
        badgeType: 'free',
        desc: 'Geração de imagens com modelos finos. Game assets, arte.',
        tutorial: [
          'Acesse leonardo.ai',
          'Crie conta',
          'Vá em Settings > API',
          'Gere sua API Key'
        ],
        link: 'https://app.leonardo.ai/settings',
        docs: 'https://docs.leonardo.ai',
        tags: 'image leonardo art'
      },
      {
        id: 'ideogram',
        title: 'Ideogram',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Excelente em texto em imagens. Posters, logos.',
        tutorial: [
          'Acesse ideogram.ai',
          'Crie conta',
          'Vá em Settings > API',
          'Gere sua chave'
        ],
        link: 'https://ideogram.ai/manage-api',
        docs: 'https://developer.ideogram.ai/docs',
        tags: 'image ideogram text'
      },
      {
        id: 'clipdrop',
        title: 'Clipdrop',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Remoção de fundo, cleanup, upscale. By Stability AI.',
        tutorial: [
          'Acesse clipdrop.co',
          'Crie conta',
          'Vá em API',
          'Gere sua chave'
        ],
        link: 'https://clipdrop.co/apis',
        docs: 'https://clipdrop.co/apis/docs',
        tags: 'image clipdrop edit'
      },
      {
        id: 'runway',
        title: 'Runway ML',
        badge: 'Créditos',
        badgeType: 'credits',
        desc: 'Gen-2 video generation. Image-to-video, text-to-video.',
        tutorial: [
          'Acesse runwayml.com',
          'Crie conta',
          'Vá em Settings > API Keys',
          'Crie nova chave'
        ],
        link: 'https://app.runwayml.com/settings/api-keys',
        docs: 'https://docs.runwayml.com',
        tags: 'image video runway gen'
      },
      {
        id: 'removebg',
        title: 'Remove.bg',
        badge: '1 img HD/mês',
        badgeType: 'free',
        desc: 'Remoção de fundo automática. Muito preciso.',
        tutorial: [
          'Acesse remove.bg',
          'Crie conta',
          'Vá em API > My API Keys',
          'Clique Show API Key'
        ],
        link: 'https://www.remove.bg/dashboard#api-key',
        docs: 'https://www.remove.bg/api',
        tags: 'image removebg background'
      }
    ]
  },
  {
    id: 'stock',
    title: 'Stock Media',
    icon: <Camera className="w-8 h-8" />,
    cards: [
      {
        id: 'pexels',
        title: 'Pexels',
        badge: 'Grátis',
        badgeType: 'free',
        desc: 'Imagens e vídeos gratuitos em alta qualidade. Sem atribuição necessária.',
        tutorial: [
          'Acesse pexels.com',
          'Crie conta',
          'Vá em Image & Video API',
          'Clique Your API Key'
        ],
        link: 'https://www.pexels.com/api/new/',
        docs: 'https://www.pexels.com/api/documentation/',
        tags: 'stock pexels images videos free'
      },
      {
        id: 'pixabay',
        title: 'Pixabay',
        badge: 'Grátis',
        badgeType: 'free',
        desc: '1.9M+ fotos, vídeos e vetores. Totalmente gratuito para uso comercial.',
        tutorial: [
          'Acesse pixabay.com',
          'Crie conta',
          'Vá em pixabay.com/api/docs',
          'Sua key aparece logado'
        ],
        link: 'https://pixabay.com/api/docs/',
        docs: 'https://pixabay.com/api/docs/',
        tags: 'stock pixabay images vectors'
      },
      {
        id: 'freepik',
        title: 'Freepik',
        badge: 'Grátis',
        badgeType: 'free',
        desc: 'Milhões de fotos, vetores e ilustrações de alta qualidade.',
        tutorial: [
          'Acesse freepik.com',
          'Crie conta',
          'Vá em Profile > API',
          'Solicite acesso à API'
        ],
        link: 'https://www.freepik.com/api',
        docs: 'https://docs.freepik.com/',
        tags: 'stock freepik vectors photos'
      },
      {
        id: 'serper',
        title: 'Google Images (Serper)',
        badge: '2500 grátis',
        badgeType: 'free',
        desc: 'Busca imagens do Google via Serper.dev. Rápido e fácil de usar.',
        tutorial: [
          'Acesse serper.dev',
          'Crie conta',
          'Vá em Dashboard > API Key',
          'Copie sua chave'
        ],
        link: 'https://serper.dev/api-key',
        docs: 'https://serper.dev/docs',
        tags: 'stock google images search serper'
      },
      {
        id: 'openverse',
        title: 'Openverse',
        badge: 'Sem API Key',
        badgeType: 'free',
        desc: 'Imagens Creative Commons do Flickr, Wikimedia e mais. Não precisa de API Key!',
        tutorial: [
          'Acesse api.openverse.org',
          'Não precisa de autenticação',
          'Use direto: /v1/images/',
          'Rate limit: 100 req/dia (anon)'
        ],
        link: 'https://api.openverse.org/v1/',
        docs: 'https://api.openverse.org/v1/',
        tags: 'stock openverse creative commons free'
      },
      {
        id: 'coverr',
        title: 'Coverr',
        badge: 'Grátis',
        badgeType: 'free',
        desc: 'Vídeos gratuitos para backgrounds e b-roll. Apenas vídeos, alta qualidade.',
        tutorial: [
          'Acesse coverr.co',
          'Vá em API no footer',
          'Preencha o formulário',
          'Receba a key por email'
        ],
        link: 'https://coverr.co/api',
        docs: 'https://coverr.co/api',
        tags: 'stock coverr videos backgrounds'
      }
    ]
  },
  {
    id: 'vector',
    title: 'Vector DB',
    icon: <BarChart3 className="w-8 h-8" />,
    cards: [
      {
        id: 'pinecone',
        title: 'Pinecone',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Vector database managed. Starter com 1 index gratuito.',
        tutorial: [
          'Acesse pinecone.io',
          'Crie conta',
          'Vá em API Keys',
          'Copie a chave padrão'
        ],
        link: 'https://app.pinecone.io/organizations/-/projects/-/keys',
        docs: 'https://docs.pinecone.io',
        tags: 'vector pinecone embeddings'
      },
      {
        id: 'weaviate',
        title: 'Weaviate',
        badge: 'Free Cloud',
        badgeType: 'free',
        desc: 'Vector DB open source. Cloud sandbox gratuito.',
        tutorial: [
          'Acesse console.weaviate.cloud',
          'Crie conta',
          'Crie um cluster sandbox',
          'Pegue a API Key nas configurações'
        ],
        link: 'https://console.weaviate.cloud',
        docs: 'https://weaviate.io/developers/weaviate',
        tags: 'vector weaviate'
      },
      {
        id: 'qdrant',
        title: 'Qdrant',
        badge: 'Free Cloud',
        badgeType: 'free',
        desc: 'Vector similarity search. Rust-based, muito rápido.',
        tutorial: [
          'Acesse cloud.qdrant.io',
          'Crie conta',
          'Crie cluster free',
          'Pegue API Key no cluster'
        ],
        link: 'https://cloud.qdrant.io',
        docs: 'https://qdrant.tech/documentation',
        tags: 'vector qdrant'
      },
      {
        id: 'chroma',
        title: 'Chroma',
        badge: 'Open Source',
        badgeType: 'free',
        desc: 'AI-native embeddings database. Roda local ou cloud.',
        tutorial: [
          'Instale pip install chromadb',
          'Ou acesse trychroma.com',
          'Use hosted cloud (beta)',
          'Pegue credenciais no dashboard'
        ],
        link: 'https://www.trychroma.com',
        docs: 'https://docs.trychroma.com',
        tags: 'vector chroma'
      },
      {
        id: 'voyage',
        title: 'Voyage AI',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Embeddings de alta qualidade. Especializado em código e legal.',
        tutorial: [
          'Acesse dash.voyageai.com',
          'Crie conta',
          'Vá em API Keys',
          'Crie nova chave'
        ],
        link: 'https://dash.voyageai.com/api-keys',
        docs: 'https://docs.voyageai.com',
        tags: 'vector voyage embeddings'
      }
    ]
  },
  {
    id: 'nlp',
    title: 'NLP',
    icon: <Code className="w-8 h-8" />,
    cards: [
      {
        id: 'meaningcloud',
        title: 'MeaningCloud',
        badge: '20k req/mês',
        badgeType: 'free',
        desc: 'Sentiment, classificação, extração de entidades.',
        tutorial: [
          'Acesse meaningcloud.com',
          'Crie conta',
          'Vá em My Subscriptions',
          'Copie sua License Key'
        ],
        link: 'https://www.meaningcloud.com/developer/account/subscriptions',
        docs: 'https://www.meaningcloud.com/developer/documentation',
        tags: 'nlp meaningcloud sentiment'
      },
      {
        id: 'monkeylearn',
        title: 'MonkeyLearn',
        badge: '300 req/mês',
        badgeType: 'free',
        desc: 'Classificação de texto, extração de keywords.',
        tutorial: [
          'Acesse monkeylearn.com',
          'Crie conta',
          'Vá em API Keys',
          'Copie sua chave'
        ],
        link: 'https://app.monkeylearn.com/main/api-keys',
        docs: 'https://monkeylearn.com/api',
        tags: 'nlp monkeylearn classification'
      },
      {
        id: 'textrazor',
        title: 'TextRazor',
        badge: '500 req/dia',
        badgeType: 'free',
        desc: 'Extração de entidades, tópicos, relações. Muito profundo.',
        tutorial: [
          'Acesse textrazor.com',
          'Clique Get Free API Key',
          'Preencha formulário',
          'Receba por email'
        ],
        link: 'https://www.textrazor.com/signup',
        docs: 'https://www.textrazor.com/docs',
        tags: 'nlp textrazor entities'
      },
      {
        id: 'deepl',
        title: 'DeepL',
        badge: '500k chars/mês',
        badgeType: 'free',
        desc: 'Tradução de alta qualidade. Melhor que Google Translate.',
        tutorial: [
          'Acesse deepl.com/pro-api',
          'Crie conta Free',
          'Vá em Account > API Keys',
          'Copie sua chave'
        ],
        link: 'https://www.deepl.com/account/summary',
        docs: 'https://www.deepl.com/docs-api',
        tags: 'nlp deepl translation'
      },
      {
        id: 'sapling',
        title: 'Sapling AI',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Grammar check, autocomplete. Para apps de escrita.',
        tutorial: [
          'Acesse sapling.ai',
          'Crie conta',
          'Vá em Dashboard > API Keys',
          'Crie nova chave'
        ],
        link: 'https://sapling.ai/settings/api',
        docs: 'https://sapling.ai/docs',
        tags: 'nlp sapling grammar'
      }
    ]
  },
  {
    id: 'cloud',
    title: 'Cloud',
    icon: <Cloud className="w-8 h-8" />,
    cards: [
      {
        id: 'vertex-ai',
        title: 'Google Vertex AI',
        badge: '$300 crédito',
        badgeType: 'credits',
        desc: 'Gemini, AutoML, pipelines. Plataforma completa.',
        tutorial: [
          'Acesse console.cloud.google.com',
          'Crie projeto',
          'Ative Vertex AI API',
          'Crie Service Account Key'
        ],
        link: 'https://console.cloud.google.com/vertex-ai',
        docs: 'https://cloud.google.com/vertex-ai/docs',
        tags: 'cloud google vertex'
      },
      {
        id: 'aws-bedrock',
        title: 'AWS Bedrock',
        badge: 'Free Tier',
        badgeType: 'trial',
        desc: 'Claude, Llama, Mistral, Titan. Tudo em um lugar.',
        tutorial: [
          'Acesse aws.amazon.com',
          'Crie conta AWS',
          'Vá em Bedrock',
          'Configure IAM credentials'
        ],
        link: 'https://console.aws.amazon.com/bedrock',
        docs: 'https://docs.aws.amazon.com/bedrock',
        tags: 'cloud aws bedrock'
      },
      {
        id: 'azure-openai',
        title: 'Azure OpenAI',
        badge: '$200 crédito',
        badgeType: 'credits',
        desc: 'GPT-4 via Microsoft. Enterprise ready.',
        tutorial: [
          'Acesse portal.azure.com',
          'Crie recurso Azure OpenAI',
          'Solicite acesso (se necessário)',
          'Pegue Keys no recurso'
        ],
        link: 'https://portal.azure.com/#create/Microsoft.CognitiveServicesOpenAI',
        docs: 'https://learn.microsoft.com/azure/ai-services/openai',
        tags: 'cloud azure openai'
      },
      {
        id: 'ibm-watson',
        title: 'IBM Watson',
        badge: 'Lite Plan',
        badgeType: 'free',
        desc: 'NLP, assistants, discovery. Enterprise focused.',
        tutorial: [
          'Acesse cloud.ibm.com',
          'Crie conta',
          'Crie serviço Watson',
          'Pegue API Key no serviço'
        ],
        link: 'https://cloud.ibm.com/catalog/services/watson-machine-learning',
        docs: 'https://cloud.ibm.com/docs/watson',
        tags: 'cloud ibm watson'
      },
      {
        id: 'eden-ai',
        title: 'Eden AI',
        badge: 'Free Tier',
        badgeType: 'free',
        desc: 'Agregador de APIs de IA. Uma key, múltiplos providers.',
        tutorial: [
          'Acesse edenai.co',
          'Crie conta',
          'Vá em API Keys',
          'Gere nova chave'
        ],
        link: 'https://app.edenai.run/admin/api-keys',
        docs: 'https://docs.edenai.co',
        tags: 'cloud eden aggregator'
      }
    ]
  }
];

const ApiKeysTool: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    let cats = CATEGORIES;
    
    // Filter by category btn
    if (filter !== 'all') {
      cats = cats.filter(c => c.id === filter);
    }

    // Filter by search query
    if (search.trim()) {
      const query = search.toLowerCase();
      return cats.map(cat => ({
        ...cat,
        cards: cat.cards.filter(card => 
          card.title.toLowerCase().includes(query) || 
          card.desc.toLowerCase().includes(query) || 
          card.tags.toLowerCase().includes(query)
        )
      })).filter(cat => cat.cards.length > 0);
    }

    return cats;
  }, [filter, search]);

  return (
    <div className="min-h-screen bg-background-deep text-white font-rajdhani relative overflow-x-hidden pb-20">
      <style>{`
        .bg-grid-tool {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 0;
        }
        .bg-glow-key {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.1;
          pointer-events: none;
        }
        .custom-card-hover:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 245, 255, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
      `}</style>

      <div className="bg-grid-tool" />
      <div className="bg-glow-key bg-brand-purple top-[-200px] left-[-200px]" />
      <div className="bg-glow-key bg-brand-cyan bottom-[-200px] right-[-200px]" />

      <div className="relative z-10">
        {/* Header Stats */}
        <header className="px-8 py-16 text-center border-b border-white/5 bg-background-mid/30 backdrop-blur-md">
          <div className="text-6xl mb-6 animate-bounce">🔑</div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent">
            Api Keys de IA
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            Guia completo para obter chaves de API das principais plataformas de Inteligência Artificial. Todas com tier gratuito ou créditos iniciais.
          </p>
          
          <div className="flex justify-center gap-12 flex-wrap">
            {[
              { num: '54+', label: 'Plataformas' },
              { num: '100%', label: 'Gratuitas' },
              { num: '9', label: 'Categorias' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-black text-brand-cyan tracking-tighter drop-shadow-[0_0_15px_rgba(0,245,255,0.4)]">{stat.num}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Sticky Nav */}
        <nav className="sticky top-0 z-50 bg-background-mid/90 backdrop-blur-xl border-b border-white/5 p-4 flex justify-center">
          <div className="flex gap-2 overflow-x-auto max-w-full pb-2 no-scrollbar px-4">
            {[
              { id: 'all', name: 'Todas', icon: <Globe className="w-4 h-4" /> },
              { id: 'llm', name: 'LLMs', icon: <Brain className="w-4 h-4" /> },
              { id: 'inference', name: 'Inference', icon: <Box className="w-4 h-4" /> },
              { id: 'vision', name: 'Visão', icon: <Eye className="w-4 h-4" /> },
              { id: 'audio', name: 'Áudio', icon: <Mic className="w-4 h-4" /> },
              { id: 'image', name: 'Imagem', icon: <ImageIcon className="w-4 h-4" /> },
              { id: 'stock', name: 'Stock', icon: <Camera className="w-4 h-4" /> },
              { id: 'vector', name: 'Vector', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'nlp', name: 'NLP', icon: <Code className="w-4 h-4" /> },
              { id: 'cloud', name: 'Cloud', icon: <Cloud className="w-4 h-4" /> },
            ].map(btn => (
              <button 
                key={btn.id}
                onClick={() => { setFilter(btn.id); setSearch(''); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  filter === btn.id 
                  ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-[0_0_20px_rgba(0,245,255,0.2)]' 
                  : 'bg-background-light border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'
                }`}
              >
                {btn.icon} {btn.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Search */}
        <div className="max-w-xl mx-auto px-8 mt-12 mb-16 relative">
          <Search className="absolute left-14 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar plataforma, tag ou funcionalidade..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setFilter('all'); }}
            className="w-full bg-background-light/50 border border-white/10 rounded-full py-5 pl-14 pr-8 text-white focus:border-brand-purple focus:outline-none focus:ring-4 focus:ring-brand-purple/10 transition-all text-lg"
          />
        </div>

        {/* Grid Content */}
        <main className="max-w-7xl mx-auto px-8 space-y-24">
          {filteredCategories.map(category => (
            <section key={category.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-10 pb-4 border-b border-white/5">
                <div className="text-brand-purple">{category.icon}</div>
                <h2 className="text-3xl font-black tracking-tight">{category.title}</h2>
                <div className="ml-auto bg-background-light px-4 py-1 rounded-full text-[10px] font-black text-gray-500 border border-white/5">
                  {category.cards.length} APIs
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.cards.map(card => (
                  <div key={card.id} className="group custom-card-hover bg-background-mid border border-white/5 rounded-3xl p-8 transition-all relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan to-brand-purple opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-xl font-black tracking-tight">{card.title}</h3>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                        card.badgeType === 'free' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' :
                        card.badgeType === 'credits' ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' :
                        'bg-brand-pink/10 border-brand-pink/30 text-brand-pink'
                      }`}>
                        {card.badge}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-8 leading-relaxed line-clamp-2">
                      {card.desc}
                    </p>

                    <div className="bg-background-deep/50 rounded-2xl p-5 mb-8 flex-1">
                      <div className="text-[10px] font-black text-brand-cyan uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Key className="w-3 h-3" /> Como obter
                      </div>
                      <ol className="space-y-3">
                        {card.tutorial.map((step, idx) => (
                          <li key={idx} className="text-xs text-gray-500 flex gap-3 leading-tight">
                            <span className="text-brand-purple font-black">{idx + 1}.</span>
                            <span>{step.split(' ').map((word, wIdx) => 
                              word.includes('.') || word.includes('/') || word.includes('>') 
                              ? <code key={wIdx} className="bg-white/5 px-1 rounded text-brand-cyan">{word}</code> 
                              : word + ' '
                            )}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex gap-3">
                      <a 
                        href={card.link} 
                        target="_blank" 
                        className="flex-1 bg-gradient-to-r from-brand-cyan to-brand-purple text-background-deep font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest text-center hover:shadow-[0_10px_30px_rgba(0,245,255,0.3)] transition-all flex items-center justify-center gap-2"
                      >
                        <Key className="w-3 h-3" /> Obter Key
                      </a>
                      <a 
                        href={card.docs} 
                        target="_blank" 
                        className="px-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                        title="Documentação"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>

        <footer className="mt-40 py-20 text-center border-t border-white/5 bg-background-mid/50">
          <p className="text-gray-500 font-bold mb-4">Feito com 💜 para a comunidade Umbra Hub</p>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">
            Última atualização: Fevereiro 2026 • <span className="text-brand-cyan cursor-pointer hover:underline">Contribuir</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ApiKeysTool;
