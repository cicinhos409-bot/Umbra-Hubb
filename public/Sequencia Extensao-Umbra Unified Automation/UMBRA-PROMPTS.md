# 🌑 UMBRA UNIFIED — Guia Completo de Prompts
### Automações prontas para ChatGPT e Claude

> Este documento contém sequências prontas para colar na extensão Umbra Unified.
> Use variáveis `{{nome}}` — a extensão vai pedir o valor antes de disparar a fila.

---

## 📌 Como usar este guia

1. Abra o painel Umbra Unified no ChatGPT ou Claude
2. Copie cada linha de uma sequência **separadamente** e adicione na fila (botão `+`)
3. Clique em **▶ Enviar Mensagens** — a extensão envia uma após a outra, aguardando a resposta
4. Use **💾 Salvar Sequência** pra reaproveitar em outros chats
5. Recomendo **intervalo de 3000–5000ms** nas configurações pra evitar rate limit

### ChatGPT vs Claude — qual usar?

| Tarefa                     | Melhor em       | Motivo                                    |
|----------------------------|-----------------|-------------------------------------------|
| Roteiros narrativos longos | **Claude**      | Naturalidade, menos repetitivo            |
| Títulos virais/ganchos     | **ChatGPT**     | Melhor calibrado pra algoritmos sociais   |
| Análise de imagem          | **ChatGPT**     | Visão mais precisa em detalhes            |
| SEO / descrições           | **ChatGPT**     | Mais direto ao ponto                      |
| Copywriting emocional      | **Claude**      | Texto mais humano, menos artificial       |
| Brainstorm de ideias       | **ChatGPT**     | Volume de sugestões                       |
| Revisão / polimento        | **Claude**      | Edita sem mudar o sentido                 |

---

# 🎬 PARTE 1 — ROTEIROS DE VÍDEO

## 1.1 Roteiro de YouTube Shorts (30–60s)
**Plataforma recomendada:** Claude
**Variáveis:** `{{tema}}`, `{{publico}}`

```
Você é um roteirista viral de Shorts. Vou pedir um roteiro sobre {{tema}} para o público {{publico}}. Antes de começar, me liste 5 ganchos possíveis de abertura (os primeiros 3 segundos) que param o scroll.
```
```
Ótimo. Agora use o gancho mais forte da sua lista e escreva o roteiro COMPLETO de 45 segundos sobre {{tema}}. Formato: bloco único de narração, sem indicações de câmera, linguagem falada, frases curtas. No máximo 110 palavras.
```
```
Agora pegue esse mesmo roteiro e reescreva em 3 versões diferentes: 1) mais emocional, 2) mais polêmica, 3) mais informativa. Mantenha o mesmo gancho inicial.
```
```
Finalize me dando 5 CTAs (chamadas para ação) diferentes que posso colar no final do vídeo — variando entre "siga", "comenta", "compartilha", "salva" e uma pergunta aberta.
```

---

## 1.2 Roteiro de TikTok com storytelling (POV / narrativa)
**Plataforma recomendada:** Claude
**Variáveis:** `{{nicho}}`, `{{personagem}}`

```
Vou criar um TikTok no formato POV/storytelling sobre o nicho {{nicho}}. O personagem principal é: {{personagem}}. Me dê 5 conflitos interessantes que funcionam como base narrativa.
```
```
Escolha o conflito 1 da sua lista e escreva um roteiro de 60 segundos em formato de narração primeira pessoa. O roteiro precisa ter: abertura-choque (0-3s), desenvolvimento (3-45s), reviravolta (45-55s), gancho pra parte 2 (55-60s).
```
```
Agora escreva as 3 primeiras partes de uma série virando esse conflito em uma novelinha de 5 episódios no TikTok. Cada episódio com gancho de continuação no final.
```
```
Me dê 10 títulos curtos (máximo 50 caracteres) pra essa série, usando palavras de alto engajamento como "ninguém", "quando", "descobri", "não acreditei".
```

---

## 1.3 Roteiro de vídeo longo YouTube (5–10 min)
**Plataforma recomendada:** Claude
**Variáveis:** `{{tema}}`, `{{duracao}}`

```
Vou fazer um vídeo de YouTube de {{duracao}} sobre {{tema}}. Primeiro, me entregue uma estrutura completa com: hook (30s), contexto (1min), desenvolvimento em 3 blocos, reviravolta, resolução e CTA final. Inclua a duração estimada de cada parte.
```
```
Agora escreva o hook de abertura em 3 versões diferentes: uma baseada em pergunta, uma em declaração controversa, uma em promessa de resultado. Cada uma com no máximo 60 palavras.
```
```
Escreva o primeiro bloco completo (o contexto, ~1 minuto de fala) em linguagem conversacional, sem citar "bloco 1", como se estivesse explicando pra um amigo.
```
```
Agora escreva os 3 blocos de desenvolvimento. Use transições naturais entre eles e mantenha o mesmo tom conversacional.
```
```
Finalize com a reviravolta, a resolução e um CTA forte pra inscrição + próximo vídeo. Quero o texto integralmente pronto pra gravação.
```

---

# 📰 PARTE 2 — TÍTULOS VIRAIS

## 2.1 Títulos para YouTube (CTR máximo)
**Plataforma recomendada:** ChatGPT
**Variáveis:** `{{tema}}`

```
Vou te dar um tema e você vai gerar 30 títulos de YouTube de alto CTR. Tema: {{tema}}. Regras: máximo 60 caracteres, use gatilhos de curiosidade, números, promessas, e evite clickbait vazio.
```
```
Dos 30 títulos, me diga quais 5 têm maior potencial de CTR e por quê. Analise como se fosse um especialista em algoritmo do YouTube.
```
```
Agora pegue o melhor e crie 10 variações dele, mantendo a mesma estrutura mas mudando as palavras. Quero testar A/B.
```
```
Por fim, me dê a descrição otimizada (primeiros 150 caracteres importam) que combina com o título vencedor.
```

---

## 2.2 Títulos para Shorts / TikTok / Reels
**Plataforma recomendada:** ChatGPT
**Variáveis:** `{{assunto}}`

```
Gere 20 títulos curtos (máximo 50 caracteres) para um Short sobre {{assunto}}. Use linguagem coloquial, primeira pessoa quando fizer sentido, e palavras de alto engajamento como: ninguém, descobri, impossível, segredo, verdade, não, errado.
```
```
Desses 20, elimine os que são genéricos demais e refine os 8 melhores pra ficarem mais específicos.
```
```
Agora transforme os 8 finalistas em legendas curtas de 1-2 linhas, pra colar junto ao vídeo no TikTok/Reels.
```

---

## 2.3 Títulos para blog / SEO
**Plataforma recomendada:** ChatGPT
**Variáveis:** `{{palavra_chave}}`

```
Preciso de 15 títulos de blog otimizados para SEO usando a palavra-chave "{{palavra_chave}}". Todos devem: ter entre 50-60 caracteres, incluir a palavra-chave, e despertar vontade de clicar.
```
```
Me diga qual desses títulos tem maior intenção de busca comercial vs informacional, e classifique cada um.
```
```
Para os 3 melhores, escreva uma meta description de 150-160 caracteres cada, também otimizada pra Google.
```

---

# 🎨 PARTE 3 — IDEIAS DE CONTEÚDO

## 3.1 Brainstorm de 30 dias de conteúdo
**Plataforma recomendada:** ChatGPT
**Variáveis:** `{{nicho}}`, `{{plataforma}}`

```
Sou criador de conteúdo no nicho {{nicho}} para {{plataforma}}. Me dê 30 ideias de vídeos para postar um por dia durante um mês. Cada ideia precisa: ter um ângulo específico, não repetir formato com a anterior, e ser realista de produzir.
```
```
Agora organize essas 30 ideias em 4 categorias (ex: educativo, entretenimento, trend, pessoal) e me diga qual porcentagem ideal de cada.
```
```
Das 30 ideias, quais 5 têm maior potencial viral? Justifique.
```
```
Escreva o roteiro completo da ideia #1 no formato de Short de 45 segundos.
```

---

## 3.2 Encontrar trends no seu nicho
**Plataforma recomendada:** ChatGPT
**Variáveis:** `{{nicho}}`

```
Liste as 10 tendências mais quentes do momento no nicho {{nicho}} nas redes sociais. Inclua o nome da trend, em qual plataforma está bombando, e por que está viralizando.
```
```
Para cada trend, me dê uma forma criativa de adaptar pro meu conteúdo sem parecer forçado.
```
```
Agora me dê 3 trends "evergreen" (que sempre funcionam) que eu posso usar mesmo sem estar na moda.
```

---

# ✍️ PARTE 4 — COPYWRITING & DESCRIÇÕES

## 4.1 Descrição de produto / e-commerce
**Plataforma recomendada:** Claude
**Variáveis:** `{{produto}}`, `{{publico_alvo}}`

```
Vou vender o produto: {{produto}}. Público-alvo: {{publico_alvo}}. Me ajude a criar a copy. Primeiro: liste as 5 principais dores desse público que o produto resolve.
```
```
Agora escreva uma descrição de produto em 3 parágrafos: 1) dor + identificação, 2) solução + diferenciais, 3) chamada pra ação emocional.
```
```
Reescreva a mesma descrição em versão CURTA (máximo 280 caracteres, pra Instagram) e em versão LONGA (para landing page, 400-600 palavras com subtítulos).
```
```
Me dê 5 headlines alternativas pra testar como primeira linha do anúncio.
```

---

## 4.2 Bio pra Instagram / TikTok
**Plataforma recomendada:** ChatGPT
**Variáveis:** `{{nicho}}`, `{{proposta_valor}}`

```
Preciso de uma bio matadora. Nicho: {{nicho}}. Minha proposta de valor é: {{proposta_valor}}. Me dê 10 versões de bio pra Instagram, cada uma com no máximo 150 caracteres, usando emojis estratégicos.
```
```
Das 10, refine as 3 melhores pra ficarem mais persuasivas e com call-to-action claro no final.
```

---

## 4.3 E-mail marketing / Newsletter
**Plataforma recomendada:** Claude
**Variáveis:** `{{tema}}`, `{{oferta}}`

```
Escreva um e-mail de newsletter sobre {{tema}} que termina com a oferta {{oferta}}. Tom conversacional, sem parecer venda agressiva. Estrutura: assunto chamativo, abertura pessoal, história curta, transição natural pra oferta, CTA, PS.
```
```
Me dê 5 variações do assunto do e-mail, todas com máximo 50 caracteres, sem cair em spam.
```
```
Reescreva o mesmo e-mail em versão mais curta (máximo 150 palavras) pra uma segunda sequência de disparo.
```

---

# 🖼️ PARTE 5 — AUTOMAÇÕES COM IMAGEM

> Lembrete: use o botão **📎 Imagem** da extensão pra anexar antes de adicionar à fila.

## 5.1 Análise de thumbnail / print de concorrente
**Plataforma recomendada:** ChatGPT
**Anexo:** screenshot do vídeo/post

```
Anexei o print de um conteúdo que viralizou. Analise e me diga: 1) qual o gancho visual, 2) qual emoção transmite, 3) o que faz o olho parar nela, 4) como eu replicaria o estilo sem copiar.
```
```
Agora me dê 5 ideias de thumbnail pra MEU canal usando os princípios que você identificou na imagem.
```

---

## 5.2 Transformar print em roteiro
**Plataforma recomendada:** ChatGPT
**Anexo:** screenshot/meme/frase

```
Anexei uma imagem/frase que viralizou. Use ela como base e escreva um roteiro de Short de 30 segundos que referencie o conceito da imagem, mas aplicado ao meu nicho de {{nicho}}.
```
```
Me dê 3 versões alternativas desse mesmo roteiro, variando o tom.
```

---

## 5.3 Descrever produto pra vender
**Plataforma recomendada:** Claude
**Anexo:** foto do produto

```
Anexei a foto do meu produto. Olhe os detalhes e escreva uma descrição de vendas de 200 palavras que destaca o que a imagem mostra (cores, formato, diferenciais visíveis).
```
```
Agora escreva 3 legendas curtas (até 150 caracteres) pra postar essa foto no Instagram focando em desejo de compra.
```

---

# 🔧 PARTE 6 — AUTOMAÇÕES AVANÇADAS

## 6.1 Pipeline completo: da ideia ao roteiro publicável
**Plataforma recomendada:** Claude
**Variáveis:** `{{nicho}}`

```
Você vai me ajudar a criar um vídeo do zero. Meu nicho é {{nicho}}. Etapa 1: me dê 5 ideias de vídeo de alto potencial nessa área.
```
```
Escolha a ideia número 1 e desenvolva ela em: título, gancho, 3 tópicos principais, e uma reviravolta no final.
```
```
Agora transforme essa estrutura em um roteiro completo de 60 segundos, linguagem falada, pronto pra gravar.
```
```
Me dê a descrição do vídeo (3 linhas + hashtags) e o nome do arquivo otimizado pra SEO.
```
```
Por fim, gere 3 ideias de Shorts "filhotes" que eu posso fazer aproveitando o mesmo conteúdo.
```

---

## 6.2 Análise de performance e próximos passos
**Plataforma recomendada:** ChatGPT
**Variáveis:** `{{dados}}`

```
Vou te dar dados de performance dos meus últimos vídeos. Dados: {{dados}}. Analise e me diga: o que está funcionando, o que não está, e quais padrões você identifica.
```
```
Baseado nisso, me dê 10 ideias de vídeos alinhados com o que já está funcionando.
```
```
Agora me diga 5 coisas que eu devo PARAR de fazer com base nesses dados.
```

---

## 6.3 Reescrever conteúdo existente
**Plataforma recomendada:** Claude
**Variáveis:** `{{texto_original}}`

```
Tenho o seguinte texto: {{texto_original}}. Reescreva ele em tom mais humano e conversacional, mantendo a mesma mensagem.
```
```
Agora adapte esse mesmo texto pra 3 formatos diferentes: 1) Short de 30s, 2) thread no X/Twitter, 3) e-mail pra newsletter.
```
```
Por fim, resuma tudo em uma única frase de impacto que eu posso usar como gancho principal.
```

---

# 🎯 PARTE 7 — SEQUÊNCIAS PRONTAS PRA SALVAR

> Essas são sequências testadas que vale a pena salvar com **💾 Salvar Sequência** pra reutilizar sempre.

## Sequência: "Shorts Machine" (Claude)
1. `Me dê 5 ideias de Shorts virais sobre {{tema}}.`
2. `Escolha a ideia 1 e escreva o roteiro completo de 45 segundos.`
3. `Me dê 10 títulos pra esse Short, máximo 50 caracteres cada.`
4. `Descreva a thumbnail ideal pra esse vídeo.`
5. `Me dê 15 hashtags relevantes (5 grandes, 5 médias, 5 pequenas).`

## Sequência: "Título Virador" (ChatGPT)
1. `Gere 30 títulos pra um vídeo sobre {{tema}}, máximo 60 caracteres, alto CTR.`
2. `Dos 30, selecione os 10 melhores e justifique.`
3. `Dos 10, escolha o melhor e crie 5 variações pra teste A/B.`
4. `Agora me dê a thumbnail text (3-5 palavras) pra combinar com o título vencedor.`

## Sequência: "Conteúdo Semanal" (ChatGPT)
1. `Me dê 7 ideias de conteúdo pra postar uma por dia sobre {{nicho}}, uma por dia da semana.`
2. `Pra cada ideia, me dê o título e o gancho de abertura.`
3. `Organize tudo em um calendário editorial (segunda a domingo) com o formato ideal de cada dia.`
4. `Me dê 3 ideias extras "coringa" caso alguma dessas não funcione.`

## Sequência: "Copy Matadora" (Claude)
1. `Vou vender {{produto}}. Liste 5 dores profundas do meu cliente ideal.`
2. `Escreva uma headline emocional pra cada dor.`
3. `Escolha a headline mais forte e desenvolva um texto de vendas de 200 palavras.`
4. `Agora reescreva em versão curta (tweet/story) e longa (landing page).`
5. `Me dê 5 CTAs diferentes pra testar no final.`

## Sequência: "Análise Visual" (ChatGPT com imagem)
> Anexe a imagem antes de adicionar à fila.
1. `Analise a imagem em detalhes: objetos, cores, composição, emoção.`
2. `Me diga por que essa imagem prende atenção (se prender).`
3. `Gere 5 roteiros de Short inspirados no conceito dessa imagem pro nicho {{nicho}}.`
4. `Me dê 10 legendas pra usar com uma imagem similar.`

---

# 💡 DICAS FINAIS

### Configurações ideais da extensão
- **Intervalo entre mensagens:** 3000–5000ms (Claude free precisa de mais, use 8000ms)
- **Repetir a fila:** deixe em 1 na maioria dos casos; use 2-3 quando quiser variações
- **Imagem:** PNG ou JPG até 5MB funciona bem nos dois
- **Links:** a extensão concatena automaticamente no final do prompt

### Evitando rate limit
- No Claude free: máximo 3-5 mensagens por sequência, intervalo de 8-10s
- No ChatGPT free: mais tolerante, mas ainda evite rodar 20+ prompts seguidos
- Se der erro "busy", espera 10 minutos e tenta de novo

### Salvando tudo
- Use **Salvar Sequência** pra guardar todas as sequências desse documento
- Use **Exportar** pra fazer backup em JSON
- Use **Importar** pra levar pra outro computador

### Variáveis úteis pra memorizar
| Variável         | Uso típico                           |
|------------------|--------------------------------------|
| `{{tema}}`       | Assunto do vídeo/post                |
| `{{nicho}}`      | Área de atuação                      |
| `{{publico}}`    | Audiência alvo                       |
| `{{duracao}}`    | Duração do vídeo                     |
| `{{produto}}`    | Produto a vender                     |
| `{{plataforma}}` | TikTok, Instagram, YouTube, etc.     |
| `{{tom}}`        | Sério, divertido, polêmico, etc.     |

---

**Criado pra Umbra Unified v2.0.8** · umbrahubb.vercel.app
