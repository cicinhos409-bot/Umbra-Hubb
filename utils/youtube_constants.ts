
export const YT_CATEGORIES = [
  { id: '', label: 'Tudo' },
  { id: '1', label: 'Filmes & Animação' },
  { id: '2', label: 'Automóveis & Veículos' },
  { id: '10', label: 'Música' },
  { id: '15', label: 'Animais' },
  { id: '17', label: 'Esportes' },
  { id: '19', label: 'Viagens & Eventos' },
  { id: '20', label: 'Jogos (Gaming)' },
  { id: '22', label: 'Lifestyle' },
  { id: '23', label: 'Comédia' },
  { id: '24', label: 'Entretenimento' },
  { id: '25', label: 'Notícias & Política' },
  { id: '26', label: 'Instruções & Estilo' },
  { id: '27', label: 'Educação' },
  { id: '28', label: 'Ciência & Tecnologia' }
];

export const YT_COUNTRIES = [
  { id: 'BR', label: 'Brasil', flag: '🇧🇷' },
  { id: 'US', label: 'EUA', flag: '🇺🇸' },
  { id: 'PT', label: 'Portugal', flag: '🇵🇹' },
  { id: 'ES', label: 'Espanha', flag: '🇪🇸' },
  { id: 'GB', label: 'Reino Unido', flag: '🇬🇧' },
  { id: 'CA', label: 'Canadá', flag: '🇨🇦' },
  { id: 'AU', label: 'Austrália', flag: '🇦🇺' },
  { id: 'DE', label: 'Alemanha', flag: '🇩🇪' },
  { id: 'FR', label: 'França', flag: '🇫🇷' },
  { id: 'JP', label: 'Japão', flag: '🇯🇵' }
];

export const YT_LANGUAGES = [
  { id: '', label: 'Qualquer' },
  { id: 'pt', label: 'Português' },
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'it', label: 'Italiano' },
  { id: 'jp', label: 'Japones' },
  { id: 'ko', label: 'Coreano' }
];

export type NicheMap = {
  [key: string]: string[];
};

export const YT_NICHES: NicheMap = {
  'Finanças & Investimentos': [
    'Investimentos para Iniciantes',
    'Criptomoedas & Bitcoin',
    'Mercado Financeiro (Day Trade)',
    'Economia Doméstica & Poupança',
    'Cartões de Crédito & Milhas',
    'Imóveis & FIIs',
    'Aposentadoria & Independência Financeira',
    'Empreendedorismo Digital'
  ],
  'Tecnologia & IA': [
    'Inteligência Artificial (Notícias)',
    'Tutoriais de IA (Midjourney, Sora)',
    'Reviews de Hardware & PC Gamer',
    'Gadgets & iPhones',
    'Programação & Desenvolvimento',
    'Cibersegurança',
    'Softwares & Produtividade',
    'Automação Residencial'
  ],
  'Saúde & Bem-estar': [
    'Fitness & Musculação',
    'Yoga & Meditação',
    'Saúde Mental & Psicologia',
    'Biohacking',
    'Longevidade & Nutrição',
    'Dietas (Low Carb, Vegana)',
    'Rotina de Sono',
    'Perda de Peso'
  ],
  'Educação & Curiosidades': [
    'Fatos Curiosos (Dark Mode)',
    'História Geral',
    'Ciência & Espaço',
    'Geopolítica',
    'Filosofia Aplicada',
    'Aprendizado de Idiomas',
    'Documentários Curtos',
    'Mistérios do Mundo'
  ],
  'Estilo de Vida (Lifestyle)': [
    'Minimalismo',
    'Produtividade & Organização',
    'Moda Masculina/Feminina',
    'Skincare & Beleza',
    'Decoração de Interiores',
    'Jardinagem Urban',
    'Parentalidade (Maternidade/Paternidade)',
    'Minimal Forest Living'
  ],
  'Entretenimento & Pop Culture': [
    'Review de Filmes & Séries',
    'Anime & Mangá',
    'Notícias de Celebridades',
    'Vídeo Ensaios sobre Cultura',
    'Análise de Música (Teoria)',
    'Fofocas de Influenciadores',
    'Recap de Reality Shows',
    'Curiosidades sobre Famosos'
  ],
  'Gaming': [
    'Gameplay Comentada',
    'Speedruns & Recordes',
    'Lore de Jogos (História)',
    'Notícias do Mundo Gamer',
    'E-sports & Competições',
    'Roblox & Minecraft (Kids)',
    'Jogos Mobile',
    'Retrogaming'
  ],
  'Viagem & Aventura': [
    'Guia de Cidades',
    'Viagem de Luxo',
    'Mochilão Barato',
    'Nomadismo Digital',
    'Hotéis & Resorts',
    'Dicas de Companhias Aéreas',
    'Sobrevivência na Selva',
    'Expedições pelo Brasil'
  ],
  'Culinária & Gastronomia': [
    'Receitas em 15 Minutos',
    'Confeitaria Profissional',
    'Churrasco & Carnes',
    'Culinária Internacional',
    'Receitas Saudáveis',
    'Reviews de Restaurantes',
    'Street Food (Comida de Rua)',
    'Bebidas & Coquetelaria'
  ],
  'Pets & Animais': [
    'Adestramento de Cães',
    'Cuidados com Gatos',
    'Aquarismo',
    'Animais Selvagens (Documentário)',
    'Pets Exóticos',
    'Resgate Animal',
    'Saúde Veterinária',
    'Reviews de Produtos Pet'
  ],
  'Marketing & Vendas': [
    'Tráfego Pago (Ads)',
    'Marketing de Afiliados',
    'Copywriting',
    'Ecommerce (Dropshipping)',
    'Social Media Strategy',
    'Vendas B2B',
    'Funis de Vendas',
    'Youtube Growth'
  ]
};
