# 🎬 SEQUÊNCIA — ROTEIRO CINEMATOGRÁFICO + HUMANIZAÇÃO
### Pronto pra colar no Umbra Unified (Claude recomendado)

> **Variáveis que a extensão vai pedir:**
> - `{{tema}}` → Título/tema do vídeo (ex: A Aldeia Esquecida do Tibete)
> - `{{duracao_total}}` → Duração total do vídeo em minutos (ex: 10 minutos)
> - `{{duracao_clipe}}` → Duração de cada clipe em segundos (ex: 8 segundos)

---

## ⚙️ COMO USAR

1. Abra o painel Umbra Unified no **Claude** (recomendado para roteiros)
2. Copie **cada mensagem abaixo** separadamente e adicione na fila com o botão `+`
3. Intervalo recomendado: **8000ms** (8 segundos)
4. Salve com o nome **"Roteiro Cinematográfico"**

---

## 📋 AS 7 MENSAGENS DA SEQUÊNCIA

---

### MENSAGEM 1 — Papel e Diretrizes

```
Você assume agora o papel de Construtor de Narrativas Audiovisuais para YouTube, especializado em transformar histórias longas em sequências cinematográficas modulares otimizadas para retenção acelerada.

Toda a resposta deve ser escrita em português.
Evite listas com marcadores, números ou qualquer tipo de prefixo como "Cena 01", "Parte 1", "Bloco A".
Não inclua textos na tela, legendas, logotipos ou marcas d'água nos prompts de vídeo.
Não inclua falas dentro dos prompts de vídeo. A narração será adicionada separadamente.
Som ambiente é permitido apenas se for discreto e atmosférico.
Ao final deste comando, aguarde os dados de entrada antes de iniciar a construção da narrativa.

Utilize os seguintes dados:
TEMA/TÍTULO: {{tema}}
DURAÇÃO TOTAL DO VÍDEO: {{duracao_total}}
DURAÇÃO DE CADA CLIPE: {{duracao_clipe}}

A construção da narrativa deve respeitar rigorosamente essas durações.
```

---

### MENSAGEM 2 — Missão Inicial

```
Primeiro, crie um título final refinado, otimizado para curiosidade e retenção máxima no YouTube.

Em seguida, escreva uma orientação de performance para a narração em TTS em um único parágrafo, descrevendo ritmo, intensidade emocional, cadência e atmosfera geral do vídeo. Não mencione gênero de voz.
```

---

### MENSAGEM 3 — Construção da Narrativa Modular

```
Agora construa a narrativa completa dividida em blocos que respeitem exatamente a duração total solicitada.

Cada bloco deve corresponder aproximadamente ao tempo definido para cada clipe.

Cada bloco deve conter exatamente dois elementos, nessa ordem:

NARRAÇÃO
Uma frase natural, com duração aproximada ao tempo do clipe, clara e envolvente.

PROMPT VISUAL
Um comando cinematográfico detalhado para geração de vídeo por IA, descrevendo sujeito, ação, ambiente, iluminação, atmosfera e movimento de câmera (exemplos: aproximação lenta, travelling lateral, órbita suave, pan horizontal).
O prompt deve priorizar realismo cinematográfico, anatomia estável, movimento coerente e estética de "frame de filme em movimento".
Todo prompt visual deve incluir obrigatoriamente a instrução:
sem texto, sem logotipos, sem legendas, foco estável, movimento coerente

Construa agora todos os blocos.
```

---

### MENSAGEM 4 — Requisitos de Qualidade e Retenção

```
Revise toda a narrativa com os seguintes critérios de qualidade:

Visual sempre claro e específico: quem está em cena, o que está acontecendo, onde ocorre e como a câmera se move.
Iluminação forte e atmosfera marcante em cada clipe.
Detalhamento suficiente para evitar distorções visuais na geração por IA.

Em intervalos estratégicos ao longo da narrativa, introduza momentos de ruptura de padrão: revelações inesperadas, mudança de escala, virada conceitual ou detalhe surpreendente — mantendo coerência histórica e lógica.

Se algum bloco precisar de ajuste, refaça agora.
```

---

### MENSAGEM 5 — Formato Final

```
Releia toda a narrativa e garanta que o formato de cada bloco esteja exatamente assim, com uma linha em branco separando os blocos:

NARRAÇÃO
[texto da narração]

PROMPT VISUAL
[prompt visual]

Corrija qualquer bloco que esteja fora desse padrão.

No final de tudo, escreva exatamente esta frase isolada:

Deseja que eu organize tudo em dois blocos limpos (todas as narrações juntas + todos os prompts visuais juntos) para geração em massa?
Responda COMPILAR.
```

---

### MENSAGEM 6 — Humanização do Roteiro

```
Agora vamos humanizar toda a narração.

Releia cada frase de narração e reescreva com as seguintes diretrizes:
- Linguagem natural e conversacional, como se uma pessoa estivesse contando pra outra
- Sem construções artificiais ou pomposas
- Frases que fluem bem quando lidas em voz alta
- Manter o mesmo impacto emocional, mas soar mais humano e menos robótico
- Nenhuma frase pode começar com "Imagine", "Descubra" ou "Neste vídeo"
- Mantenha os PROMPTS VISUAIS intactos, altere apenas as NARRAÇÕES

Retorne a narrativa completa no mesmo formato de blocos.
```

---

### MENSAGEM 7 — COMPILAR

```
COMPILAR
```

---

## 📦 RESULTADO ESPERADO APÓS COMPILAR

O Claude vai retornar em dois blocos separados:

**NARRAÇÕES**
```
[linha 1]
[linha 2]
[linha 3]
...
```

**PROMPTS VISUAIS**
```
[prompt 1]

[prompt 2]

[prompt 3]
...
```

Pronto pra colar direto em:
- **ElevenLabs / TTS** (narrações)
- **Runway / Kling / Pika / Luma** (prompts visuais)

---

## 🚀 VERSÃO RÁPIDA — Só copiar e colar no Umbra

> Use quando quiser rodar rápido. Cole cada mensagem na fila com `+`:

**Fila completa (7 mensagens em ordem):**

```
1. [Papel e Diretrizes — bloco completo acima]
2. [Missão Inicial]
3. [Construção da Narrativa Modular]
4. [Requisitos de Qualidade]
5. [Formato Final]
6. [Humanização do Roteiro]
7. COMPILAR
```

---

## 💡 DICAS DE USO

| Configuração         | Valor recomendado |
|----------------------|-------------------|
| Plataforma           | **Claude**        |
| Intervalo            | **8000ms**        |
| Repetir a fila       | 1                 |
| Imagem               | Opcional (moodboard do tema) |

**Variações do `{{tema}}` já testadas:**
- `🏔️ A Aldeia Esquecida do Tibete — O Lugar Onde o Tempo Parou Há 1000 Anos`
- `🌊 O Oceano Mais Profundo da Terra — O Que Existe Lá Embaixo?`
- `🏛️ A Cidade Perdida de Petra — Segredos Enterrados no Deserto`
- `🌌 O Buraco Negro Mais Próximo da Terra — O Que Aconteceria Se?`
- `🐍 A Ilha Proibida do Brasil — O Lugar Mais Perigoso do Mundo`

**Durações populares:**
- Shorts/Reels: `{{duracao_total}}` = `1 minuto` | `{{duracao_clipe}}` = `5 segundos`
- Vídeo médio: `{{duracao_total}}` = `8 minutos` | `{{duracao_clipe}}` = `8 segundos`
- Vídeo longo: `{{duracao_total}}` = `15 minutos` | `{{duracao_clipe}}` = `10 segundos`

---

**Criado pra Umbra Unified v2.0.8** · umbrahubb.vercel.app
