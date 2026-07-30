/**
 * Umbra Flow - Content Script
 * Sistema de automação com detecção de vídeos, elementos e tempos otimizados
 * CDP (Chrome Debugger Protocol) para cliques reais no React 18
 */

if (window.ffLabInitialized && window.ffLabAutomation) {
  console.log('[Umbra Flow] Já inicializado, ignorando...');
  throw new Error('[Umbra Flow] Script já carregado, abortando reinjeção.');
}

window.ffLabInitialized = true;
console.log('[Umbra Flow] v2.0 - Sistema de automação com CDP + auto-fix iniciado');

// ========== CONFIGURAÇÃO OTIMIZADA ==========
const CONFIG = {
  maxActive: 6,                              // Prompts simultâneos (aumentado de 4)
  delayBetweenPrompts: { min: 500, max: 1000 },   // 0.5-1s entre prompts (TURBO)
  checkInterval: { min: 300, max: 600 },          // Verificação a cada 0.3-0.6s (TURBO)
  downloadTimeout: 30000,                    // Timeout download 30s
  slotTimeout: 80000,                        // Timeout slot 80 segundos
  maxRetries: 2,                             // 2 retries automáticos por prompt
  batchPause: 0,                             // Pausa entre lotes (segundos)
  errorCheckDelay: 2000                      // Delay para verificar erros após envio (reduzido)
};

// ========== GROK LOG SYSTEM ==========
const grokLogEntries = [];

function grokLog(type, promptNum, message) {
  const icons = { call: '📤', success: '✅', fail: '❌', retry: '🔄', info: 'ℹ️' };
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const entry = { type, icon: icons[type] || '•', promptNum, message, time };
  grokLogEntries.push(entry);
  if (grokLogEntries.length > 20) grokLogEntries.shift();
  console.log(`[Umbra Flow] [Grok ${entry.icon}] P${promptNum}: ${message}`);
  updateGrokLogWidget();
}

function createGrokLogWidget() {
  if (document.getElementById('ff-grok-log-btn')) return;

  const btn = document.createElement('div');
  btn.id = 'ff-grok-log-btn';
  btn.style.cssText = `
    position: fixed; bottom: 20px; left: 20px; z-index: 99999;
    background: #1e1b4b; color: #c4b5fd; padding: 6px 14px; border-radius: 10px;
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
    box-shadow: 0 2px 12px rgba(99, 102, 241, 0.3);
    cursor: pointer; display: flex; align-items: center; gap: 6px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    transition: all 0.2s;
  `;
  btn.innerHTML = '🤖 Grok <span id="ff-grok-count" style="background:#4f46e5;color:white;padding:1px 6px;border-radius:6px;font-size:10px;">0</span>';
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'ff-grok-log-panel';
  panel.style.cssText = `
    position: fixed; bottom: 55px; left: 20px; z-index: 99999;
    background: #0f0a2e; color: #e0e0e0; border-radius: 12px;
    font-family: 'Consolas', 'Monaco', monospace; font-size: 11px;
    box-shadow: 0 6px 30px rgba(0, 0, 0, 0.5);
    max-height: 300px; width: 380px; overflow-y: auto; display: none;
    border: 1px solid rgba(139, 92, 246, 0.2);
  `;
  panel.innerHTML = '<div style="padding:10px 14px;color:#818cf8;font-weight:700;border-bottom:1px solid rgba(139,92,246,0.15);">🤖 Grok Activity Log</div><div id="ff-grok-entries" style="padding:4px 0;"><div style="padding:8px 14px;color:#6b7280;">Nenhuma atividade ainda...</div></div>';
  document.body.appendChild(panel);

  btn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
}

function updateGrokLogWidget() {
  createGrokLogWidget();
  const countEl = document.getElementById('ff-grok-count');
  if (countEl) countEl.textContent = grokLogEntries.length;

  const entriesEl = document.getElementById('ff-grok-entries');
  if (!entriesEl) return;

  const colors = { call: '#fbbf24', success: '#34d399', fail: '#f87171', retry: '#60a5fa', info: '#a78bfa' };
  entriesEl.innerHTML = grokLogEntries.map(e => {
    const c = colors[e.type] || '#9ca3af';
    return `<div style="padding:4px 14px;border-bottom:1px solid rgba(255,255,255,0.03);line-height:1.4;"><span style="color:#6b7280;">${e.time}</span> <span style="color:${c};">${e.icon} P${e.promptNum}</span> <span style="color:#d1d5db;">${e.message}</span></div>`;
  }).join('');

  entriesEl.scrollTop = entriesEl.scrollHeight;
}

// ========== ERROR DETECTION SYSTEM ==========

// Error types and their detection patterns
const ERROR_PATTERNS = {
  policy: [
    'violate our policies',
    'violates our policies',
    'policy violation',
    'violates Vertex AI',
    'usage guidelines',
    'Support codes:',
    'content policy',
    'inappropriate content',
    'harmful content',
    'prominent people',
    'real person',
    'third party',
    'third-party',
    'copyrighted'
  ],
  server: [
    'Something went wrong',
    'server error',
    'internal error',
    'try again later',
    'temporarily unavailable'
  ],
  rate_limit: [
    'Too many requests',
    'rate limit',
    'quota exceeded',
    'RESOURCE_EXHAUSTED',
    '429'
  ],
  generation_fail: [
    "can't generate",
    'cannot generate',
    'failed to generate',
    'generation failed',
    'try another prompt'
  ]
};

/**
 * Detect Flow errors in the DOM
 * Returns: { type: string, message: string } | null
 */
function detectFlowError() {
  // Selectors where Flow might show error messages
  const errorSelectors = [
    '[role="alert"]',
    '[role="status"]',
    '[class*="error"]',
    '[class*="Error"]',
    '[class*="warning"]',
    '[class*="Warning"]',
    '[class*="snackbar"]',
    '[class*="Snackbar"]',
    '[class*="toast"]',
    '[class*="Toast"]',
    '[class*="notification"]',
    '[class*="Notification"]',
    '[class*="message"]',
    'div[class*="alert"]',
    'div[class*="Alert"]'
  ];

  const allElements = [];
  for (const selector of errorSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      allElements.push(...elements);
    } catch (e) {
      // Invalid selector, skip
    }
  }

  // Also check any visible text that might contain error keywords
  const visibleTextElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');

  // Check error elements first (more specific)
  for (const el of allElements) {
    const text = (el.textContent || '').toLowerCase();
    const errorInfo = classifyErrorText(text);
    if (errorInfo) {
      console.log(`[Umbra Flow] Error detected in ${el.tagName}: ${errorInfo.type}`);
      return errorInfo;
    }
  }

  // Check visible text for error patterns (less specific, check recent/visible ones)
  for (const el of visibleTextElements) {
    const rect = el.getBoundingClientRect();
    // Only check visible elements
    if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight) {
      const text = (el.textContent || '').toLowerCase();
      // Only check if text is short enough to be an error message
      if (text.length < 500) {
        const errorInfo = classifyErrorText(text);
        if (errorInfo) {
          console.log(`[Umbra Flow] Error detected in visible text: ${errorInfo.type}`);
          return errorInfo;
        }
      }
    }
  }

  return null;
}

/**
 * Classify error text into error type
 */
function classifyErrorText(text) {
  const lowerText = text.toLowerCase();

  // Check policy errors first (most important to catch)
  for (const pattern of ERROR_PATTERNS.policy) {
    if (lowerText.includes(pattern.toLowerCase())) {
      return {
        type: 'policy',
        message: text.substring(0, 200).trim(),
        originalText: text
      };
    }
  }

  // Check rate limit errors
  for (const pattern of ERROR_PATTERNS.rate_limit) {
    if (lowerText.includes(pattern.toLowerCase())) {
      return {
        type: 'rate_limit',
        message: text.substring(0, 200).trim(),
        originalText: text
      };
    }
  }

  // Check server errors
  for (const pattern of ERROR_PATTERNS.server) {
    if (lowerText.includes(pattern.toLowerCase())) {
      return {
        type: 'server',
        message: text.substring(0, 200).trim(),
        originalText: text
      };
    }
  }

  // Check generation failures
  for (const pattern of ERROR_PATTERNS.generation_fail) {
    if (lowerText.includes(pattern.toLowerCase())) {
      return {
        type: 'generation_fail',
        message: text.substring(0, 200).trim(),
        originalText: text
      };
    }
  }

  return null;
}

/**
 * Check for errors after sending a prompt.
 * ONLY checks the SPECIFIC tile that was just created (newTileId).
 * This avoids false positives from old error tiles still visible on the page.
 */
async function checkForErrorAfterSend(promptNumber, maxWaitMs = 5000, newTileId = null) {
  const startTime = Date.now();
  const checkIntervalMs = 500;

  while (Date.now() - startTime < maxWaitMs) {
    let error = null;

    if (newTileId) {
      // ONLY check the specific tile that was just created
      const tile = document.querySelector(`[data-tile-id="${newTileId}"]`);
      if (tile) {
        const tileText = (tile.textContent || '').toLowerCase();
        error = classifyErrorText(tileText);
        if (error) {
          console.log(`[Umbra Flow] Error detected in tile ${newTileId.substring(0, 20)} for prompt ${promptNumber}: ${error.type}`);
        }
      }
    } else {
      // Fallback: check the FIRST (newest) tile only
      const tiles = document.querySelectorAll('[data-tile-id]');
      if (tiles.length > 0) {
        const newestTile = tiles[0]; // First tile = most recent
        const tileText = (newestTile.textContent || '').toLowerCase();
        error = classifyErrorText(tileText);
        if (error) {
          console.log(`[Umbra Flow] Error detected in newest tile for prompt ${promptNumber}: ${error.type}`);
        }
      }
    }

    if (error) {
      console.log(`[Umbra Flow] Error detected for prompt ${promptNumber}: ${error.type} - ${error.message}`);
      return error;
    }
    await sleep(checkIntervalMs);
  }

  return null; // No error detected
}

// ========== UTILIDADES ==========

function randomDelay(min, max) {
  return new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== INTERRUPTIBLE SLEEP ==========

class InterruptibleSleep {
  constructor() {
    this.aborted = false;
    this.resolveFunc = null;
    this.rejectFunc = null;
    this.timeoutId = null;
  }

  async sleep(ms) {
    if (this.aborted) {
      throw new Error('Sleep aborted');
    }

    return new Promise((resolve, reject) => {
      this.resolveFunc = resolve;
      this.rejectFunc = reject;

      this.timeoutId = setTimeout(() => {
        if (!this.aborted) {
          resolve();
        } else {
          reject(new Error('Sleep aborted'));
        }
      }, ms);
    });
  }

  abort() {
    this.aborted = true;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.rejectFunc) {
      this.rejectFunc(new Error('Sleep aborted'));
    }
  }

  reset() {
    this.aborted = false;
    this.resolveFunc = null;
    this.rejectFunc = null;
    this.timeoutId = null;
  }

  isAborted() {
    return this.aborted;
  }
}

// Global interruptible sleep instance
let interruptibleSleep = new InterruptibleSleep();

// Wrapper for interruptible delay
async function interruptibleDelay(ms) {
  try {
    await interruptibleSleep.sleep(ms);
    return true;
  } catch (e) {
    if (e.message === 'Sleep aborted') {
      console.log('[Umbra Flow] Sleep interrupted');
      return false;
    }
    throw e;
  }
}

// Wrapper for interruptible random delay
async function interruptibleRandomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return interruptibleDelay(ms);
}

function updateStatus(text, progress = null, done = false) {
  try {
    chrome.runtime.sendMessage({ type: 'STATUS', text, progress, done });
  } catch (e) {
    console.log('[Umbra Flow] Popup fechado');
  }
}

function getCurrentVideoUrls() {
  const urls = [];
  const videoElements = document.querySelectorAll('video');
  const sourceElements = document.querySelectorAll('source');

  videoElements.forEach(video => {
    if (video.src) urls.push(video.src);
    if (video.currentSrc && video.currentSrc !== video.src) urls.push(video.currentSrc);
  });

  sourceElements.forEach(source => {
    if (source.src) urls.push(source.src);
  });

  return [...new Set(urls)];
}

// Nova função: Retorna vídeos COM seus números de prompt
// Na UI atual, os tiles de video tem data-tile-id e um <video src="...">.
// Matching é feito via tileId capturado no momento do envio do prompt.
function getVideosWithPromptNumbers() {
  const videos = [];

  // Encontrar todos os tiles com vídeo no dashboard
  const tiles = document.querySelectorAll('[data-tile-id]');
  const seenIds = new Set();

  for (const tile of tiles) {
    const tileId = tile.getAttribute('data-tile-id');
    if (seenIds.has(tileId)) continue;
    seenIds.add(tileId);

    // Verificar se este tile tem um video com src
    const videoEl = tile.querySelector('video');
    if (!videoEl) continue;

    const url = videoEl.src || videoEl.currentSrc || '';
    if (!url || url.startsWith('blob:')) continue;

    videos.push({
      tileId: tileId,
      url: url
    });
  }

  if (videos.length === 0) return [];
  if (!window.ffLabAutomation) return [];

  const auto = window.ffLabAutomation;

  const result = [];
  for (const video of videos) {
    // Se já processado, pular
    if (auto.processedUrls?.has(video.url) || auto.knownUrls?.has(video.url)) continue;

    // Match por tileId — INDEPENDENTE do status do slot
    // Um slot com status 'error' pode ter o vídeo gerado mesmo assim
    // Um slot com status 'generating' é o caso normal
    // Um slot com status 'completed' já foi processado (pular)
    const matchedSlot = auto.slots.find(s =>
      s.tileId === video.tileId && s.status !== 'completed'
    );

    if (matchedSlot) {
      result.push({
        promptNumber: matchedSlot.number,
        url: video.url,
        text: matchedSlot.text
      });
    }
    // SEM FALLBACK: se não encontrou match por tileId, NÃO adivinhar.
    // Matching por ordem é unreliable e causa nomes errados nos downloads.
  }

  return result;
}

// ========== SELEÇÃO DE MODO (NOVO UI: POPUP COM ABAS) ==========

/**
 * Clica em um elemento Radix UI de forma confiável.
 * Radix UI usa onMouseDown para tabs e onClick/onPointerDown para buttons.
 * Esta função tenta todos os handlers na ordem correta.
 */
function reactClick(el) {
  const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps'));
  if (propsKey) {
    const props = el[propsKey];
    const fakeEvent = {
      preventDefault: () => { },
      stopPropagation: () => { },
      currentTarget: el,
      target: el,
      button: 0,
      pointerType: 'mouse',
      type: 'mousedown'
    };

    // Radix tabs use onMouseDown
    if (props.onMouseDown) {
      props.onMouseDown(fakeEvent);
      return true;
    }
    // Radix dropdowns may use onClick
    if (props.onClick) {
      props.onClick(fakeEvent);
      return true;
    }
    // Some use onPointerDown
    if (props.onPointerDown) {
      props.onPointerDown({ ...fakeEvent, pointerId: 1, pointerType: 'mouse' });
      return true;
    }
  }

  // Fallback: full mouse event simulation
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const eventOpts = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 };

  el.dispatchEvent(new PointerEvent('pointerdown', { ...eventOpts, pointerId: 1, pointerType: 'mouse' }));
  el.dispatchEvent(new MouseEvent('mousedown', eventOpts));
  el.dispatchEvent(new PointerEvent('pointerup', { ...eventOpts, pointerId: 1, pointerType: 'mouse' }));
  el.dispatchEvent(new MouseEvent('mouseup', eventOpts));
  el.dispatchEvent(new MouseEvent('click', eventOpts));
  return true;
}

/**
 * Encontra o botão do seletor de modelo na barra inferior de input.
 * No novo UI, é o botão que contém o nome do modelo (ex: "Video", "Veo 3.1", "Nano Banana")
 * e fica ao lado do botão arrow_forward Create.
 */
function findModelSelectorButton() {
  // O botão do modelo fica dentro de sc-c70e41ad-6 (container dos botões de ação)
  // e NÃO é o botão arrow_forward Create nem o add_2 Create
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = btn.textContent || '';
    // O botão do modelo contém crop_16_9 ou crop_9_16 (indicador de aspect ratio)
    // e NÃO contém arrow_forward nem add_2
    if ((text.includes('crop_16_9') || text.includes('crop_9_16')) &&
      !text.includes('arrow_forward') && !text.includes('add_2')) {
      return btn;
    }
  }
  // Fallback: procurar botão com nome de modelo conhecido
  for (const btn of allButtons) {
    const text = btn.textContent || '';
    if (text.includes('Video') || text.includes('Nano Banana') || text.includes('Veo') || text.includes('Imagen')) {
      if (!text.includes('arrow_forward') && !text.includes('add_2') &&
        !text.includes('Go Back') && !text.includes('Flow TV')) {
        return btn;
      }
    }
  }
  return null;
}

/**
 * Clica em um elemento usando PointerEvent completo (necessário para Radix UI tabs/dropdowns).
 * reactClick falha com a nova UI Radix — esta função usa sequência de eventos
 * que simula um click real do mouse.
 */
function forceClick(el) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0, view: window };

  el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, pointerId: 1, pointerType: 'mouse' }));
  el.dispatchEvent(new MouseEvent('mousedown', opts));
  el.dispatchEvent(new PointerEvent('pointerup', { ...opts, pointerId: 1, pointerType: 'mouse' }));
  el.dispatchEvent(new MouseEvent('mouseup', opts));
  el.dispatchEvent(new MouseEvent('click', opts));
}

/**
 * Verifica se o seletor de modelo atual indica modo Video.
 * @returns {boolean} true se está em modo Video
 */
function isInVideoMode() {
  const btn = findModelSelectorButton();
  if (!btn) return true; // Se não encontrou botão, assumir que está OK
  const text = btn.textContent || '';
  return text.includes('Video') || text.includes('Veo') || text.includes('videocam');
}

/**
 * Garante que estamos em modo Video antes de enviar um prompt.
 * Chama switchMode + verifica. Se falhar, tenta de novo.
 * @param {boolean} hasElements - se o prompt tem ingredientes
 * @returns {boolean} true se modo Video confirmado, false se falhou
 */
async function ensureVideoMode(hasElements) {
  // Primeira tentativa
  await switchMode(hasElements);

  if (isInVideoMode()) return true;

  // Segunda tentativa
  console.log('[Umbra Flow] ⚠️ Modo Video não confirmado, tentando novamente...');
  await switchMode(hasElements);

  if (isInVideoMode()) return true;

  console.error('[Umbra Flow] ❌ FALHA: Não conseguiu confirmar modo Video após 2 tentativas!');
  return false;
}

/**
 * Abre o popup do seletor de modelo e garante que está no modo Video + sub-tab correta.
 * No novo UI, o modo é controlado por abas dentro de um popup:
 *   - Tab 1: Image / Video
 *   - Tab 2 (Video): Ingredients / Frames
 *
 * Usa forceClick (PointerEvent completo) em vez de reactClick para compatibilidade com Radix UI.
 * Após trocar, VERIFICA se o modelo foi realmente mudado para Video.
 * Tenta até 3 vezes se a verificação falhar.
 *
 * @param {boolean} needsElements - true para modo Ingredients, false para Text-to-Video
 */
async function switchMode(needsElements) {
  const modelBtn = findModelSelectorButton();
  if (!modelBtn) {
    console.log('[Umbra Flow] ⚠️ Botão do seletor de modelo não encontrado');
    return false;
  }

  const currentText = modelBtn.textContent || '';
  console.log(`[Umbra Flow] Seletor de modelo atual: "${currentText.trim()}"`);

  // Verificar se já está no modo correto sem abrir popup
  // Modelos de VÍDEO: texto contém "Video", "Veo", ou ícone "videocam"
  // Modelos de IMAGEM: "Nano Banana", "Nano Banana Pro", "Imagen" → NÃO são vídeo
  const isVideoMode = currentText.includes('Video') || currentText.includes('Veo') ||
    currentText.includes('videocam');

  if (isVideoMode) {
    console.log('[Umbra Flow] Já em modo Video, não precisa mudar');
    return false;
  }

  // Se está em modo Image (Nano Banana, Imagen, etc), precisa trocar para Video
  // Tentar até 3 vezes
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[Umbra Flow] ⚠️ Modo atual é Image, trocando para Video (tentativa ${attempt}/3)...`);

    // Fechar qualquer menu/popup aberto antes de tentar
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(200);

    // Abrir popup do seletor de modelo usando forceClick
    forceClick(modelBtn);

    // Poll for menu to appear
    let menu = null;
    for (let i = 0; i < 30; i++) {
      await sleep(100);
      menu = document.querySelector('[role="menu"]');
      if (menu) break;
    }
    if (!menu) {
      console.log('[Umbra Flow] ⚠️ Popup do seletor não abriu, tentando reactClick...');
      reactClick(modelBtn);
      for (let i = 0; i < 30; i++) {
        await sleep(100);
        menu = document.querySelector('[role="menu"]');
        if (menu) break;
      }
    }
    if (!menu) {
      console.log(`[Umbra Flow] ⚠️ Popup do seletor não abriu na tentativa ${attempt}`);
      continue;
    }

    // PASSO 1: Garantir que a aba "Video" está selecionada
    const tabs = menu.querySelectorAll('[role="tab"]');
    let videoTab = null;
    for (const tab of tabs) {
      const tabText = tab.textContent || '';
      if (tabText.includes('Video') && tabText.includes('videocam')) {
        videoTab = tab;
        break;
      }
    }

    if (!videoTab) {
      // Fallback: procurar tab que contém apenas "Video"
      for (const tab of tabs) {
        const tabText = tab.textContent || '';
        if (tabText.includes('Video') && !tabText.includes('Image')) {
          videoTab = tab;
          break;
        }
      }
    }

    if (videoTab) {
      const alreadySelected = videoTab.getAttribute('aria-selected') === 'true' ||
        videoTab.getAttribute('data-state') === 'active';

      if (!alreadySelected) {
        console.log('[Umbra Flow] Clicando aba Video com forceClick...');
        forceClick(videoTab);
        await sleep(800);

        // Verificar se o click funcionou
        const newState = videoTab.getAttribute('data-state');
        const newSelected = videoTab.getAttribute('aria-selected');
        console.log(`[Umbra Flow] Após click: data-state="${newState}", aria-selected="${newSelected}"`);

        if (newState !== 'active' && newSelected !== 'true') {
          // Tentar reactClick como fallback
          console.log('[Umbra Flow] forceClick não funcionou, tentando reactClick na aba Video...');
          reactClick(videoTab);
          await sleep(800);
        }
      } else {
        console.log('[Umbra Flow] Aba Video já está selecionada no popup');
      }
    } else {
      console.log('[Umbra Flow] ⚠️ Aba Video não encontrada no popup');
    }

    // PASSO 2: Selecionar sub-tab (Ingredients vs Frames) se necessário
    if (needsElements) {
      // Re-buscar menu pois pode ter sido recriado
      const currentMenu = document.querySelector('[role="menu"]');
      if (currentMenu) {
        const updatedTabs = currentMenu.querySelectorAll('[role="tab"]');
        for (const tab of updatedTabs) {
          const tabText = tab.textContent || '';
          if (tabText.includes('Ingredients') || tabText.includes('chrome_extension')) {
            const tabSelected = tab.getAttribute('aria-selected') === 'true' ||
              tab.getAttribute('data-state') === 'active';
            if (!tabSelected) {
              console.log('[Umbra Flow] Selecionando sub-aba Ingredients...');
              forceClick(tab);
              await sleep(400);
            }
            break;
          }
        }
      }
    }

    // Fechar popup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(300);
    // Fallback: clicar fora do popup para fechar
    const stillOpen = document.querySelector('[role="menu"]');
    if (stillOpen) {
      document.body.click();
      await sleep(300);
    }

    // VERIFICAÇÃO: Checar se o botão do modelo agora mostra "Video"
    const verifyBtn = findModelSelectorButton();
    if (verifyBtn) {
      const newText = verifyBtn.textContent || '';
      const nowVideoMode = newText.includes('Video') || newText.includes('Veo') ||
        newText.includes('videocam');

      if (nowVideoMode) {
        console.log(`[Umbra Flow] ✓ Modo Video confirmado! Botão agora mostra: "${newText.trim()}"`);
        return true;
      } else {
        console.log(`[Umbra Flow] ❌ Verificação falhou! Botão ainda mostra: "${newText.trim()}" (tentativa ${attempt}/3)`);
        // Continua para próxima tentativa
      }
    }
  }

  console.log('[Umbra Flow] ❌ FALHA CRÍTICA: Não conseguiu trocar para modo Video após 3 tentativas!');
  return false;
}

/**
 * Garante que o modelo de vídeo selecionado é "Veo 3.1 - Fast [Lower Priority]" (0 créditos).
 * Deve ser chamado antes de iniciar a automação.
 */
async function ensureVideoModelSelected() {
  const modelBtn = findModelSelectorButton();
  if (!modelBtn) {
    console.log('[Umbra Flow] ⚠️ Botão do seletor de modelo não encontrado');
    return false;
  }

  // Abrir popup
  forceClick(modelBtn);

  // Poll for menu to appear
  let menu = null;
  for (let i = 0; i < 20; i++) {
    await sleep(100);
    menu = document.querySelector('[role="menu"]');
    if (menu) break;
  }
  if (!menu) {
    console.log('[Umbra Flow] ⚠️ Popup do seletor não abriu');
    return false;
  }

  // Garantir aba Video selecionada
  const tabs = menu.querySelectorAll('[role="tab"]');
  for (const tab of tabs) {
    const tabText = tab.textContent || '';
    if (tabText.includes('Video') && tabText.includes('videocam')) {
      if (!tab.getAttribute('aria-selected')?.includes('true')) {
        forceClick(tab);
        await sleep(600);
      }
      break;
    }
  }

  // Verificar modelo atual
  const modelDropdownBtn = menu.querySelector('button[class*="arrow_drop_down"]') ||
    [...menu.querySelectorAll('button')].find(b => b.textContent?.includes('arrow_drop_down'));

  if (!modelDropdownBtn) {
    console.log('[Umbra Flow] ⚠️ Dropdown de modelo não encontrado no popup');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return false;
  }

  const modelText = modelDropdownBtn.textContent || '';
  if (modelText.includes('Lower Priority')) {
    console.log('[Umbra Flow] ✓ Modelo já é Lower Priority (0 créditos)');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(300);
    return true;
  }

  // Abrir dropdown de modelos
  forceClick(modelDropdownBtn);
  await sleep(600);

  // Procurar opção Lower Priority
  const modelMenuItems = document.querySelectorAll('[role="menuitem"] button, [role="menu"] [role="menuitem"]');
  for (const item of modelMenuItems) {
    const itemText = item.textContent || '';
    if (itemText.includes('Lower Priority')) {
      const clickTarget = item.querySelector('button') || item;
      clickTarget.click();
      console.log('[Umbra Flow] ✓ Modelo alterado para Lower Priority (0 créditos)');
      await sleep(600);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await sleep(300);
      return true;
    }
  }

  console.log('[Umbra Flow] ⚠️ Opção Lower Priority não encontrada');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(300);
  return false;
}

// ===== HELPERS DE INGREDIENTES (NOVO UI: ASSET PICKER DIALOG) =====
//
// No novo Flow, ingredientes são adicionados via o botão "add_2 Create"
// que abre um dialog de busca de assets. Os ingredientes aparecem
// como tags/chips na área de input do Slate.js editor.
//
// A seleção de ingredientes agora funciona assim:
// 1. Clicar em "add_2 Create" → abre dialog de assets
// 2. Buscar/selecionar imagem no dialog
// 3. A imagem aparece como referência no input

/**
 * Encontra o botão "add_2 Create" que abre o seletor de assets/ingredientes.
 */
function findAddCreateButton() {
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = btn.textContent || '';
    if (text.includes('add_2') && text.includes('Create')) {
      return btn;
    }
  }
  return null;
}

/**
 * Aguarda o dialog de assets abrir.
 */
async function waitForAssetDialog(maxWaitMs = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      console.log('[Umbra Flow] Dialog de assets aberto');
      return dialog;
    }
    await sleep(200);
  }
  console.log(`[Umbra Flow] Timeout esperando dialog de assets (${maxWaitMs}ms)`);
  return null;
}

/**
 * Fecha o dialog de assets se estiver aberto.
 */
async function closeAssetDialog() {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(400);
  // Se ainda aberto, clicar fora
  const stillOpen = document.querySelector('[role="dialog"]');
  if (stillOpen) {
    const editor = document.querySelector('[data-slate-editor="true"]');
    if (editor) {
      editor.focus();
      editor.click();
      await sleep(400);
    }
  }
}

// Conta quantos ingredientes estão selecionados (tags/chips no editor ou slot area)
function countSelectedIngredients() {
  // No novo UI, ingredientes podem aparecer como chips/tags no editor
  // ou como botões com ícone close no input area
  // Tentar vários seletores
  const chips = document.querySelectorAll('[data-slate-void="true"], [class*="ingredient"], [class*="chip"]');
  if (chips.length > 0) return chips.length;

  // Fallback: buscar botões com ícone close na área de input
  const inputArea = document.querySelector('[data-slate-editor="true"]')?.closest('[class*="sc-c70e41ad"]')?.parentElement;
  if (inputArea) {
    const closeButtons = [...inputArea.querySelectorAll('button')].filter(
      b => (b.querySelector('i, span')?.textContent || '').includes('close')
    );
    return closeButtons.length;
  }
  return 0;
}

/**
 * Seleciona um asset/ingrediente pelo número no dialog.
 * O dialog tem uma grade de imagens. elementNum é 1-based.
 * 
 * NOVO UI: Os itens são DIVs com cursor:pointer contendo <img>, NÃO são botões.
 * Classe típica: sc-5bf79b14-10
 */
async function selectAssetFromDialog(dialog, elementNum) {
  // PASSO 0: Scroll a lista para garantir que TODOS os items são renderizados
  // O dialog tem um container scrollável que pode esconder items abaixo do fold
  const scrollContainers = [...dialog.querySelectorAll('div')].filter(div => {
    const style = window.getComputedStyle(div);
    return style.overflowY === 'auto' || style.overflowY === 'scroll';
  });
  for (const container of scrollContainers) {
    container.scrollTop = 0;
    await sleep(200);
    container.scrollTop = container.scrollHeight;
    await sleep(300);
    container.scrollTop = 0;
    await sleep(200);
  }

  let gridItems = [];

  // MÉTODO 1 (NOVO UI): Buscar DIVs clicáveis com img dentro do dialog
  // Excluir o "Search preview" img e os botões de controle
  const allDivs = dialog.querySelectorAll('div');
  for (const div of allDivs) {
    // Verificar se este div tem exatamente 1 img filho direto
    const imgs = div.querySelectorAll(':scope > img');
    if (imgs.length !== 1) continue;

    // Verificar que NÃO é o "Search preview"
    const imgAlt = imgs[0].alt || '';
    if (imgAlt === 'Search preview') continue;

    // Verificar que tem cursor pointer (computado)
    const computedCursor = window.getComputedStyle(div).cursor;
    if (computedCursor === 'pointer') {
      gridItems.push(div);
    }
  }

  // MÉTODO 2 (LEGACY): Buscar .virtuoso-grid-item ou botões com imagem
  if (gridItems.length === 0) {
    gridItems = [...dialog.querySelectorAll('.virtuoso-grid-item')];
  }
  if (gridItems.length === 0) {
    gridItems = [...dialog.querySelectorAll('button')].filter(b => {
      const text = b.textContent || '';
      return !text.includes('Upload') && !text.includes('upload') &&
        !text.includes('Search') && !text.includes('arrow_drop_down') &&
        b.querySelector('img');
    });
  }

  console.log(`[Umbra Flow] Dialog: ${gridItems.length} itens encontrados`);

  if (gridItems.length === 0) {
    console.log('[Umbra Flow] ❌ Nenhum item de asset encontrado no dialog');
    return false;
  }

  // elementNum é 1-based (posição ajustada na lista atual do dialog)
  const targetIndex = elementNum - 1;
  if (targetIndex >= gridItems.length) {
    console.log(`[Umbra Flow] Elemento ${elementNum} fora do range (${gridItems.length} assets disponíveis)`);
    return false;
  }

  const targetItem = gridItems[targetIndex];
  targetItem.click();
  console.log(`[Umbra Flow] ✓ Click no asset posição ${elementNum} (index ${targetIndex}, img: ${targetItem.querySelector('img')?.alt || 'unknown'})`);
  await sleep(800);
  return true;
}

/**
 * Seleciona um único ingrediente: abre dialog → ordena por Oldest → seleciona imagem.
 */
async function selectSingleElement(elementNum) {
  console.log(`[Umbra Flow] Selecionando ingrediente ${elementNum}...`);

  // Encontrar botão add_2 Create
  const addBtn = findAddCreateButton();
  if (!addBtn) {
    console.log('[Umbra Flow] ❌ Botão add_2 Create não encontrado');
    return false;
  }

  // Abrir dialog
  addBtn.click();
  await sleep(300);

  let dialog = await waitForAssetDialog(5000);
  if (!dialog) {
    // Retry
    console.log('[Umbra Flow] Dialog não abriu, tentando novamente...');
    addBtn.click();
    await sleep(500);
    dialog = await waitForAssetDialog(5000);
  }

  if (!dialog) {
    console.log(`[Umbra Flow] ❌ Dialog de assets não abriu para elemento ${elementNum}`);
    return false;
  }

  // Garantir que a ordenação é "Oldest" para manter ordem sequencial dos uploads
  await ensureDialogSortedOldest(dialog);

  // Selecionar asset
  const success = await selectAssetFromDialog(dialog, elementNum);

  if (!success) {
    await closeAssetDialog();
  }

  return success;
}

/**
 * Garante que o dialog de assets está ordenado por "Oldest".
 * Isso faz com que [1] = primeiro asset uploadado, [2] = segundo, etc.
 */
async function ensureDialogSortedOldest(dialog) {
  // Encontrar o botão do dropdown de ordenação (contém "arrow_drop_down")
  // Na UI atualizada, o texto é "Recent" (antes era "Recently Used")
  const sortBtn = [...dialog.querySelectorAll('button')].find(b => {
    const text = b.textContent || '';
    return text.includes('arrow_drop_down') &&
      (text.includes('Recent') || text.includes('Most Used') ||
        text.includes('Newest') || text.includes('Oldest') || text.includes('Favorites'));
  });

  if (!sortBtn) {
    console.log('[Umbra Flow] Dropdown de ordenação não encontrado no dialog');
    return;
  }

  // Se já está em "Oldest", não precisa mudar
  if (sortBtn.textContent.includes('Oldest')) {
    console.log('[Umbra Flow] ✓ Dialog já ordenado por Oldest');
    return;
  }

  // Clicar no dropdown para abrir as opções
  // IMPORTANTE: Radix UI dropdowns precisam de PointerEvent completo (forceClick)
  console.log('[Umbra Flow] Trocando ordenação para Oldest...');
  forceClick(sortBtn);
  await sleep(600);

  // Encontrar e clicar na opção "Oldest"
  // As opções aparecem como menuitem no body (fora do dialog) via Radix UI portal
  const allClickables = document.querySelectorAll('[role="option"], [role="menuitem"], [role="menuitemradio"]');
  let clicked = false;

  // Tentar encontrar "Oldest" em options/menuitems
  for (const el of allClickables) {
    if (el.textContent.trim() === 'Oldest') {
      forceClick(el);
      clicked = true;
      console.log('[Umbra Flow] ✓ Selecionado "Oldest" via role option/menuitem');
      break;
    }
  }

  // Fallback: buscar qualquer elemento de texto que contenha exatamente "Oldest"
  if (!clicked) {
    const allElements = document.querySelectorAll('button, div, span, li, p');
    for (const el of allElements) {
      if (el.textContent.trim() === 'Oldest' && el.offsetParent !== null) {
        // Verificar se é um item clicável (não o botão do dropdown que já clicamos)
        if (el !== sortBtn && !sortBtn.contains(el)) {
          forceClick(el);
          clicked = true;
          console.log('[Umbra Flow] ✓ Selecionado "Oldest" via fallback');
          break;
        }
      }
    }
  }

  if (!clicked) {
    console.log('[Umbra Flow] ⚠️ Opção "Oldest" não encontrada no dropdown');
  }

  await sleep(400); // Esperar a lista reordenar
}

/**
 * Seleciona múltiplos ingredientes.
 * 
 * IMPORTANTE: O dialog remove itens já selecionados, mudando as posições.
 * Ex: [1, 2, 10] → Seleciona posição 1 (index 0), item é removido.
 *   Para posição 2: a lista agora tem N-1 itens, posição ajustada = 2 - 1 = 1 (index 0).
 *   Para posição 10: a lista tem N-2 itens, posição ajustada = 10 - 2 = 8 (index 7).
 * 
 * Fórmula: adjustedPos = originalPos - count(itens já selecionados com posição < originalPos)
 */
async function selectElements(elements) {
  const MAX_RETRIES_PER_ELEMENT = 2;

  // PASSO 0: Scroll para área de input
  const editor = document.querySelector('[data-slate-editor="true"]');
  if (editor) {
    editor.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(200);
  }

  // Fechar qualquer dialog aberto
  await closeAssetDialog();

  // Rastrear quais posições originais já foram selecionadas (para ajustar índices)
  const selectedOriginalPositions = [];

  // Para cada elemento, calcular posição ajustada, abrir dialog e selecionar
  for (let i = 0; i < elements.length; i++) {
    const originalPos = elements[i]; // Posição original (1-based) na lista completa

    // Calcular quantos itens já selecionados estão ANTES desta posição
    const itemsRemovedBefore = selectedOriginalPositions.filter(pos => pos < originalPos).length;

    // Posição ajustada = original - itens removidos antes
    const adjustedPos = originalPos - itemsRemovedBefore;

    console.log(`[Umbra Flow] Ingrediente ${originalPos}: posição original=${originalPos}, removidos antes=${itemsRemovedBefore}, posição ajustada=${adjustedPos}`);

    let success = false;

    for (let attempt = 0; attempt <= MAX_RETRIES_PER_ELEMENT; attempt++) {
      if (attempt > 0) {
        console.log(`[Umbra Flow] Retry ${attempt}/${MAX_RETRIES_PER_ELEMENT} para elemento ${originalPos}`);
        await closeAssetDialog();
        await sleep(500);
      }

      success = await selectSingleElement(adjustedPos);
      if (success) {
        selectedOriginalPositions.push(originalPos);
        console.log(`[Umbra Flow] ✓ Ingrediente ${originalPos} confirmado (${i + 1}/${elements.length})`);
        break;
      }
    }

    if (!success) {
      console.log(`[Umbra Flow] AVISO: Ingrediente ${originalPos} não selecionado após ${MAX_RETRIES_PER_ELEMENT + 1} tentativas`);
    }

    // Pausa entre elementos
    if (i < elements.length - 1) {
      await sleep(200);
    }
  }

  // Verificação final — usar contador local, não DOM (que falha em alguns accounts)
  const finalCount = selectedOriginalPositions.length;
  console.log(`[Umbra Flow] Seleção concluída: ${finalCount}/${elements.length} ingredientes`);
}

/**
 * Preenche o editor Slate.js com texto.
 * Estratégia: focar → selecionar tudo → deletar via beforeinput → inserir via beforeinput.
 * Fallbacks: textarea nativa, contenteditable genérico, execCommand.
 */
async function fillTextarea(text) {
  // 1. Slate.js editor (método principal)
  const editor = document.querySelector('[data-slate-editor="true"]');

  if (editor) {
    editor.focus();
    await sleep(100);

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
    await sleep(100);

    editor.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true, cancelable: true, inputType: 'deleteContentBackward',
    }));
    await sleep(150);

    editor.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true, cancelable: true, inputType: 'insertText', data: text,
    }));
    await sleep(350);

    const content = editor.textContent?.replace('What do you want to create?', '').trim() || '';
    if (content.length > 0) {
      console.log(`[Umbra Flow] Editor Slate preenchido com ${text.length} caracteres`);
      return true;
    }

    // Fallback: execCommand dentro do Slate
    editor.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, text);
    await sleep(300);
    if ((editor.textContent?.trim() || '').length > 0) {
      console.log(`[Umbra Flow] Editor Slate preenchido via execCommand`);
      return true;
    }
  }

  // 2. Textarea nativa visível
  const ta = [...document.querySelectorAll('textarea')].find(el => !el.disabled && el.offsetParent !== null);
  if (ta) {
    ta.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, text);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
    console.log(`[Umbra Flow] Textarea preenchida com ${text.length} caracteres`);
    return true;
  }

  // 3. Contenteditable genérico visível
  const ce = [...document.querySelectorAll('[contenteditable="true"]')].find(el => el.offsetParent !== null);
  if (ce) {
    ce.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, text);
    ce.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await sleep(300);
    console.log(`[Umbra Flow] Contenteditable preenchido com ${text.length} caracteres`);
    return true;
  }

  console.error('[Umbra Flow] Nenhum editor encontrado na página');
  return false;
}

// ========== CDP CLICK HELPER (clique real via Chrome Debugger Protocol) ==========

async function clickWithCDP(el) {
  const rect = el.getBoundingClientRect();
  const cx = Math.round(rect.left + rect.width / 2);
  const cy = Math.round(rect.top + rect.height / 2);
  const elAtPoint = document.elementFromPoint(cx, cy);
  const safe = elAtPoint && (elAtPoint === el || el.contains(elAtPoint));
  if (!safe) { el.click(); return false; }
  const r = await new Promise(res =>
    chrome.runtime.sendMessage({ action: 'realClick', x: cx, y: cy }, r => res(r || {}))
  );
  if (!r.success) { el.click(); return false; }
  return true;
}

// ========== BUSCA ROBUSTA DO BOTÃO CREATE ==========

function findCreateBtn() {
  const NEVER = ['add_2', 'arrow_back', 'go back', 'extend'];

  // P0: ícone google-symbols arrow_forward + span "Create" — estrutura exata do UI atual
  for (const btn of document.querySelectorAll('button:not([disabled])')) {
    const icon = btn.querySelector('i[class*="google-symbols"]');
    if (icon && icon.textContent.trim() === 'arrow_forward') {
      const hasCreate = [...btn.querySelectorAll('span')].some(
        s => s.textContent.trim().toLowerCase() === 'create'
      );
      if (hasCreate) return { btn, p: 0 };
    }
  }
  // P1: textContent combinado arrow_forward + Create, sem marcadores negativos
  for (const btn of document.querySelectorAll('button:not([disabled])')) {
    const t = btn.textContent || '';
    if (t.includes('arrow_forward') && t.includes('Create') &&
        NEVER.every(n => !t.toLowerCase().includes(n)))
      return { btn, p: 1 };
  }
  // P2: classes de implementação conhecidas (novo sc-e8425ea6 e legado sc-c70e41ad)
  for (const btn of document.querySelectorAll('button:not([disabled])')) {
    const cls = btn.className || '', t = btn.textContent || '';
    if ((cls.includes('sc-e8425ea6') || cls.includes('sc-c70e41ad')) &&
        (t.includes('arrow_forward') || t.includes('Create')) &&
        NEVER.every(n => !t.toLowerCase().includes(n)))
      return { btn, p: 2 };
  }
  // P3: fallback — arrow_forward na metade inferior da viewport
  const H = window.innerHeight;
  for (const btn of document.querySelectorAll('button:not([disabled])')) {
    const t = btn.textContent || '';
    if (!t.includes('arrow_forward')) continue;
    if (NEVER.some(n => t.toLowerCase().includes(n))) continue;
    const r = btn.getBoundingClientRect();
    if (r.top > H * 0.5 && r.width > 0 && r.height > 0) return { btn, p: 3 };
  }
  return null;
}

/**
 * Clica no botão Create para enviar o prompt.
 * Usa busca por estrutura (não por classes CSS que mudam a cada deploy)
 * e CDP para clique real (React 18 event delegation no root).
 */
async function clickCreateButton() {
  let found = null;
  for (let i = 0; i < 15; i++) {
    found = findCreateBtn();
    if (found) break;
    await sleep(200);
  }

  if (!found) {
    const all = [...document.querySelectorAll('button')].map(b =>
      `[${b.disabled ? 'dis' : 'ok'}] ${(b.textContent || '').trim().substring(0, 40)}`
    );
    console.warn('[Umbra Flow] Botão Create não encontrado. Botões na página:', all);
    return false;
  }

  const { btn, p } = found;
  console.log(`[Umbra Flow] Botão Create (P${p}) — usando CDP...`);
  await clickWithCDP(btn);
  return true;
}

// ========== DOWNLOAD ==========

async function downloadVideo(url, promptNumber, promptText, folder = null) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), CONFIG.downloadTimeout);

    chrome.runtime.sendMessage({
      action: 'downloadVideo',
      url: url,
      promptNumber: promptNumber,
      promptText: promptText,
      folder: folder || null
    }, (response) => {
      clearTimeout(timeout);
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response && response.success) {
        resolve(true);
      } else {
        reject(new Error('Download falhou'));
      }
    });
  });
}

// ========== AUTOMAÇÃO PRINCIPAL ==========

class FFLabAutomation {
  constructor() {
    this.isRunning = false;
    this.queue = [];
    this.slots = [];
    this.nextQueueIndex = 0;
    this.completedCount = 0;
    this.errorCount = 0;
    this.knownUrls = new Set();
    this.processedUrls = new Set();
    this.retryAttempts = new Map(); // promptNumber -> attempts
    this.retryQueue = []; // Fila de retries pendentes
    this.originalQueueLength = 0; // Tamanho original da fila (sem retries)
    this.downloadFolder = null; // Pasta de download da sessão
  }

  // ========== ASSET GENERATION (PHASE 1) ==========

  async generateAssets(assets, imageModel, videoPrompts, settings) {
    const BATCH_SIZE = 6;
    const DELAY_BETWEEN_ASSETS = 3000;  // 3 seconds
    const DELAY_BETWEEN_BATCHES = 9000; // 9 seconds

    console.log(`[Umbra Flow] === FASE 1: Disparando ${assets.length} assets com ${imageModel} ===`);
    console.log(`[Umbra Flow] Config: ${BATCH_SIZE} por lote, ${DELAY_BETWEEN_ASSETS / 1000}s entre assets, ${DELAY_BETWEEN_BATCHES / 1000}s entre lotes`);

    this.pendingVideoPrompts = videoPrompts;
    this.pendingVideoSettings = settings;
    // Guardar prompts de imagem para possível regeneração durante fase de vídeo
    // Indexado por número do asset (1-based: asset.number)
    this.imagePrompts = [];
    for (const asset of assets) {
      this.imagePrompts[asset.number - 1] = asset.text; // Store at 0-based index
    }

    // Step 1: Switch to Image mode + select model
    const switched = await this.switchToImageMode(imageModel);
    if (!switched) {
      this.notifyAssetError(0, 'Nao conseguiu mudar para modo Image. Verifique a pagina.');
      return;
    }

    // Capture dashboard count BEFORE dispatching any assets
    const preDispatchCount = this.countDashboardImages();
    console.log(`[Umbra Flow] Dashboard antes dos assets: ${preDispatchCount} items`);

    // Step 2: Fire assets in batches of 6, 3s apart, 9s pause between batches
    let errorOccurred = false;
    let sentCount = 0;
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const batchIndex = i % BATCH_SIZE; // 0-5 within current batch
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      console.log(`[Umbra Flow] Disparando Asset ${asset.number} (${i + 1}/${assets.length}) [Lote ${batchNumber}]...`);

      // Notify sidepanel
      chrome.runtime.sendMessage({
        type: 'ASSET_STATUS',
        text: `Fase 1: Disparando asset ${i + 1}/${assets.length} (Asset ${asset.number}) [Lote ${batchNumber}]`,
        progress: { current: i + 1, total: assets.length }
      });

      // Fill the Slate.js editor with asset text
      const typed = await fillTextarea(asset.text);
      if (!typed) {
        console.error(`[Umbra Flow] ❌ Falha ao digitar Asset ${asset.number}, pulando...`);
        errorOccurred = true;
        continue; // Skip this one, try the next
      }

      // Click Create button
      await sleep(500);
      const clicked = await clickCreateButton();
      if (!clicked) {
        console.error(`[Umbra Flow] ❌ Botao Create nao encontrado para Asset ${asset.number}, pulando...`);
        errorOccurred = true;
        continue;
      }
      sentCount++;
      console.log(`[Umbra Flow] ✅ Asset ${asset.number} enviado! (${sentCount} total)`);

      // Delay logic: if NOT the last asset
      if (i < assets.length - 1) {
        // Check if we just completed a batch of 6 (i.e., batchIndex == 5)
        if (batchIndex === BATCH_SIZE - 1) {
          console.log(`[Umbra Flow] 🔄 Lote ${batchNumber} completo (${BATCH_SIZE} assets). Pausa de ${DELAY_BETWEEN_BATCHES / 1000}s...`);
          chrome.runtime.sendMessage({
            type: 'ASSET_STATUS',
            text: `⏸️ Lote ${batchNumber} completo! Pausa de ${DELAY_BETWEEN_BATCHES / 1000}s antes do proximo lote...`,
            progress: { current: i + 1, total: assets.length }
          });
          await sleep(DELAY_BETWEEN_BATCHES);
        } else {
          // Normal 3s delay between assets within a batch
          await sleep(DELAY_BETWEEN_ASSETS);
        }
      }
    }

    // All assets dispatched!
    const totalBatches = Math.ceil(assets.length / BATCH_SIZE);
    console.log(`[Umbra Flow] ✅ ${sentCount}/${assets.length} assets disparados em ${totalBatches} lote(s). Aguardando geracao...`);

    // Step 3: Wait for ALL images to appear in dashboard
    // Target = preDispatchCount + sentCount (images that existed before + new ones we sent)
    const targetCount = preDispatchCount + sentCount;
    const WAIT_TIMEOUT = 300000; // 5 minutes max
    const POLL_INTERVAL = 5000; // Check every 5 seconds
    const waitStart = Date.now();
    let allGenerated = false;

    // Check immediately first
    let currentCount = this.countDashboardImages();
    if (currentCount >= targetCount) {
      allGenerated = true;
      console.log(`[Umbra Flow] ✅ Todas as ${sentCount} imagens ja estao no dashboard!`);
    }

    while (!allGenerated && Date.now() - waitStart < WAIT_TIMEOUT) {
      chrome.runtime.sendMessage({
        type: 'ASSET_STATUS',
        text: `⏳ Aguardando imagens: ${currentCount - preDispatchCount}/${sentCount} geradas...`,
        progress: { current: currentCount - preDispatchCount, total: sentCount }
      });

      await sleep(POLL_INTERVAL);
      currentCount = this.countDashboardImages();
      const generated = currentCount - preDispatchCount;
      const elapsed = Math.round((Date.now() - waitStart) / 1000);

      console.log(`[Umbra Flow] Aguardando imagens: ${generated}/${sentCount} (${elapsed}s) [dashboard: ${currentCount}, target: ${targetCount}]`);

      if (currentCount >= targetCount) {
        allGenerated = true;
        console.log(`[Umbra Flow] ✅ Todas as ${sentCount} imagens geradas!`);
      }
    }

    if (!allGenerated) {
      const finalGenerated = currentCount - preDispatchCount;
      console.error(`[Umbra Flow] ❌ Timeout: ${finalGenerated}/${sentCount} imagens apos 5 min`);
      this.notifyAssetError(0, `Timeout: ${finalGenerated}/${sentCount} imagens geradas apos 5 minutos. Verifique o dashboard.`);
      return;
    }

    // Notify sidepanel
    chrome.runtime.sendMessage({
      type: 'ASSET_STATUS',
      text: `✅ Todas as ${assets.length} imagens geradas! Mudando para modo video...`,
      progress: { current: assets.length, total: assets.length },
      assetsComplete: true
    });

    // Step 4: Switch to Video mode using existing proven functions
    await sleep(2000);

    // Use the existing switchMode(true) which handles Video + Ingredients tabs
    await switchMode(true);
    await sleep(500);

    // Use existing ensureVideoModelSelected to pick Veo 3.1 - Fast [Lower Priority]
    await ensureVideoModelSelected();
    await sleep(500);

    console.log('[Umbra Flow] ✅ Modo Video + Ingredients + Lower Priority ativado');

    // Start video prompts (Phase 2)
    if (this.pendingVideoPrompts && this.pendingVideoPrompts.length > 0) {
      console.log(`[Umbra Flow] === FASE 2: Iniciando ${this.pendingVideoPrompts.length} videos ===`);
      this.start(this.pendingVideoPrompts, this.pendingVideoSettings);
    } else {
      console.log('[Umbra Flow] Nenhum prompt de video pendente. Concluido!');
      chrome.runtime.sendMessage({
        type: 'STATUS',
        text: '✅ Assets gerados! Nenhum prompt de video para processar.',
        done: true
      });
    }
  }

  // Helper: Opens the settings popup (Radix UI dropdown) reliably
  async openSettingsPopup(btn) {
    for (let attempt = 0; attempt < 3; attempt++) {
      // Close any existing menu first
      const existingMenu = document.querySelector('[role="menu"]');
      if (existingMenu) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await sleep(300);
      }

      console.log(`[Umbra Flow] Abrindo popup via forceClick (tentativa ${attempt + 1})...`);
      forceClick(btn);

      // Poll for menu to appear (up to 2.5 seconds)
      let menu = null;
      for (let i = 0; i < 25; i++) {
        await sleep(100);
        menu = document.querySelector('[role="menu"]');
        if (menu) return menu;
      }

      console.log(`[Umbra Flow] Tentativa ${attempt + 1}/3: popup nao abriu, retentando...`);
      await sleep(300);
    }

    console.error('[Umbra Flow] Settings popup nao abriu apos 3 tentativas');
    return null;
  }

  async switchToImageMode(modelName) {
    console.log(`[Umbra Flow] Mudando para modo Image (${modelName})...`);

    // Use existing findModelSelectorButton
    const modelBtn = findModelSelectorButton();
    if (!modelBtn) {
      console.error('[Umbra Flow] Settings button nao encontrado');
      return false;
    }
    console.log(`[Umbra Flow] Settings button encontrado: "${modelBtn.textContent.trim().substring(0, 50)}"`);

    // Open the settings popup using the helper
    const menu = await this.openSettingsPopup(modelBtn);
    if (!menu) {
      return false;
    }
    console.log(`[Umbra Flow] Settings popup abriu!`);

    // Click on "Image" tab
    const tabs = menu.querySelectorAll('[role="tab"]');
    let imageTab = null;
    for (const tab of tabs) {
      const text = tab.textContent || '';
      if (text.includes('Image') && !text.includes('Imagen')) {
        imageTab = tab;
        break;
      }
    }

    if (!imageTab) {
      console.error('[Umbra Flow] Image tab nao encontrado');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return false;
    }
    forceClick(imageTab);
    await sleep(600);

    // Guarantee Landscape (crop_16_9) is selected
    const updatedTabs = menu.querySelectorAll('[role="tab"]');
    for (const tab of updatedTabs) {
      const text = tab.textContent || '';
      if (text.includes('crop_16_9') || text.includes('Landscape')) {
        if (!tab.getAttribute('aria-selected')?.includes('true')) {
          forceClick(tab);
          await sleep(300);
        }
        break;
      }
    }

    // Guarantee x1 is selected
    for (const tab of updatedTabs) {
      if (tab.textContent.trim() === 'x1') {
        if (!tab.getAttribute('aria-selected')?.includes('true')) {
          forceClick(tab);
          await sleep(300);
        }
        break;
      }
    }

    // Select the model (Nano Banana 2 or Nano Banana Pro) via the model dropdown inside the menu
    const menuButtons = menu.querySelectorAll('button');
    let modelDropdownBtn = null;
    for (const btn of menuButtons) {
      const text = btn.textContent || '';
      if (text.includes('Nano Banana') || text.includes('Imagen')) {
        modelDropdownBtn = btn;
        break;
      }
    }

    if (modelDropdownBtn) {
      // Check if already correct model
      const currentModelText = modelDropdownBtn.textContent || '';
      const needsChange = (modelName === 'Nano Banana Pro' && !currentModelText.includes('Pro')) ||
        (modelName === 'Nano Banana 2' && (currentModelText.includes('Pro') || currentModelText.includes('Imagen')));

      if (needsChange) {
        forceClick(modelDropdownBtn);
        await sleep(400);

        // Find and click the correct model option
        const menuItems = document.querySelectorAll('[role="menuitem"]');
        for (const item of menuItems) {
          const text = item.textContent || '';
          if (modelName === 'Nano Banana Pro' && text.includes('Nano Banana Pro')) {
            forceClick(item);
            await sleep(300);
            console.log(`[Umbra Flow] Modelo ${modelName} selecionado`);
            break;
          } else if (modelName === 'Nano Banana 2' && text.includes('Nano Banana 2') && !text.includes('Pro')) {
            forceClick(item);
            await sleep(300);
            console.log(`[Umbra Flow] Modelo ${modelName} selecionado`);
            break;
          }
        }
      } else {
        console.log(`[Umbra Flow] Modelo ${modelName} ja selecionado`);
      }
    }

    // Close the settings popup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(400);

    console.log('[Umbra Flow] ✅ Modo Image ativado');
    return true;
  }

  async switchToVideoMode() {
    console.log('[Umbra Flow] Mudando para modo Video + Ingredients + Lower Priority...');

    // Use existing findModelSelectorButton
    const modelBtn = findModelSelectorButton();
    if (!modelBtn) {
      console.error('[Umbra Flow] Settings button nao encontrado para mudar p/ Video');
      return false;
    }

    const menu = await this.openSettingsPopup(modelBtn);
    if (!menu) {
      return false;
    }

    // Click "Video" tab
    const tabs = menu.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
      const text = tab.textContent || '';
      if (text.includes('Video') && text.includes('videocam')) {
        if (!tab.getAttribute('aria-selected')?.includes('true')) {
          tab.click();
          await sleep(600);
        }
        break;
      }
    }

    // Click "Ingredients" sub-tab
    const updatedTabs = menu.querySelectorAll('[role="tab"]');
    for (const tab of updatedTabs) {
      const text = tab.textContent || '';
      if (text.includes('Ingredients') || text.includes('chrome_extension')) {
        if (!tab.getAttribute('aria-selected')?.includes('true')) {
          tab.click();
          await sleep(400);
        }
        break;
      }
    }

    // Guarantee x1
    for (const tab of updatedTabs) {
      if (tab.textContent.trim() === 'x1') {
        if (!tab.getAttribute('aria-selected')?.includes('true')) {
          tab.click();
          await sleep(200);
        }
        break;
      }
    }

    // Close settings popup first
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(400);

    // Now use existing ensureVideoModelSelected to pick Lower Priority
    await ensureVideoModelSelected();

    console.log('[Umbra Flow] ✅ Modo Video ativado (Ingredients + Lower Priority)');
    return true;
  }

  countDashboardImages() {
    // Count unique image/video tiles in the Flow dashboard
    // Each tile has a unique data-tile-id attribute
    const tiles = document.querySelectorAll('[data-tile-id]');

    // Deduplicate by tile ID (some tiles have nested [data-tile-id] elements)
    const uniqueIds = new Set(
      [...tiles]
        .filter(el => el.querySelector('img, video') || el.tagName === 'IMG')
        .map(el => el.getAttribute('data-tile-id'))
    );

    const count = uniqueIds.size;
    console.log(`[Umbra Flow] Dashboard tiles count: ${count} (unique data-tile-id)`);
    return count;
  }

  async waitForNewImage(previousCount, timeout = 180000) {
    const start = Date.now();
    const checkInterval = 3000; // Check every 3 seconds

    while (Date.now() - start < timeout) {
      await sleep(checkInterval);

      const currentCount = this.countDashboardImages();
      if (currentCount > previousCount) {
        console.log(`[Umbra Flow] Nova imagem detectada! (${previousCount} -> ${currentCount})`);
        return true;
      }

      // Check for error indicators in the page
      // Flow shows errors as snackbar notifications or inline
      const snackbars = document.querySelectorAll('[class*="snackbar"], [class*="toast"], [role="alert"]');
      for (const el of snackbars) {
        const text = (el.textContent || '').toLowerCase();
        if (text.includes('error') || text.includes('failed') || text.includes('policy')) {
          console.error(`[Umbra Flow] Erro detectado durante geracao de imagem: ${el.textContent}`);
          return false;
        }
      }
    }

    console.error(`[Umbra Flow] Timeout esperando imagem (${timeout / 1000}s)`);
    return false;
  }


  notifyAssetError(assetNumber, errorMsg) {
    console.error(`[Umbra Flow] ❌ ERRO Asset ${assetNumber}: ${errorMsg}`);
    chrome.runtime.sendMessage({
      type: 'ASSET_ERROR',
      assetNumber: assetNumber,
      error: errorMsg
    });
  }

  async start(promptsQueue, settings = {}) {
    if (this.isRunning) return;

    // Aplicar configurações
    if (settings.batchSize) {
      CONFIG.maxActive = settings.batchSize;
      console.log(`[Umbra Flow] ✓ Videos simultâneos configurado: ${CONFIG.maxActive} (recebido do painel: ${settings.batchSize})`);
    }
    if (settings.promptDelay) {
      const baseMs = settings.promptDelay * 1000;
      CONFIG.delayBetweenPrompts = { min: baseMs - 500, max: baseMs + 500 };
    }
    if (settings.batchPause !== undefined) CONFIG.batchPause = settings.batchPause;
    if (settings.downloadFolder) {
      this.downloadFolder = settings.downloadFolder;
      console.log(`[Umbra Flow] ✓ Pasta de download da sessão: ${this.downloadFolder}`);
    }

    this.isRunning = true;
    this.queue = promptsQueue;
    this.originalQueueLength = promptsQueue.length; // Guardar tamanho original
    this.slots = [];
    this.nextQueueIndex = 0;
    this.completedCount = 0;
    this.errorCount = 0;
    this.knownUrls = new Set(getCurrentVideoUrls());
    this.processedUrls = new Set();
    this.retryAttempts = new Map();
    this.retryQueue = [];
    // Shotgun retry: track multiple copies of same prompt
    this.shotgunMap = new Map();            // promptNumber → { tileIds: Set, completed: false }

    console.log(`[Umbra Flow] Iniciando ${this.queue.length} prompts`);
    console.log(`[Umbra Flow] Config: ${CONFIG.maxActive} simultâneos, delay ${CONFIG.delayBetweenPrompts.min}-${CONFIG.delayBetweenPrompts.max}ms`);

    updateStatus(`Iniciando... 0/${this.queue.length}`, { current: 0, total: this.queue.length });

    // Notificar background
    chrome.runtime.sendMessage({
      action: 'START_AUTOMATION',
      prompts: this.queue,
      settings: settings,
      tabId: null
    });

    // Garantir modelo de vídeo Lower Priority (0 créditos)
    await ensureVideoModelSelected();

    // Enviar prompts iniciais
    await this.sendInitialPrompts();

    // Loop principal
    console.log('[Umbra Flow] Iniciando mainLoop...');
    await this.mainLoop();
    console.log('[Umbra Flow] mainLoop finalizado');

    // LAST RESORT: Se ainda sobraram erros, tentar uma última vez com shotgun agressivo
    if (this.isRunning) {
      await this.lastResortPhase();
    }
  }

  // ====================================================================
  // LAST RESORT PHASE: Fase final para prompts que ainda falharam
  // Coleta todos os pontos com erro e faz shotgun 5x com Grok
  // ====================================================================
  async lastResortPhase() {
    const failedSlots = this.slots.filter(s => s.status === 'error');
    if (failedSlots.length === 0) {
      console.log('[Umbra Flow] ✅ Nenhum prompt com erro! Sem necessidade de Last Resort.');
      return;
    }

    // Deduplicar por número de prompt (pode ter múltiplos slots do mesmo prompt)
    const uniqueFailedNumbers = [...new Set(failedSlots.map(s => s.number))];

    console.log(`[Umbra Flow] 🚨 LAST RESORT: ${uniqueFailedNumbers.length} prompts ainda com erro. Tentando shotgun final 5x cada...`);
    grokLog('call', 0, `🚨 LAST RESORT: ${uniqueFailedNumbers.length} prompts restantes`);
    updateStatus(`🚨 Last Resort: ${uniqueFailedNumbers.length} prompts restantes...`, { current: this.completedCount, total: this.queue.length });

    for (const promptNum of uniqueFailedNumbers) {
      if (!this.isRunning) break;

      const slot = failedSlots.find(s => s.number === promptNum);
      if (!slot) continue;

      // Verificar se foi completado enquanto isso (por shotgun anterior)
      const shotgunEntry = this.shotgunMap.get(promptNum);
      if (shotgunEntry && shotgunEntry.completed) continue;

      console.log(`[Umbra Flow] 🚨 Last Resort: Prompt ${promptNum} — Grok + shotgun 5x`);

      // Grok corrige e shotgun 5x
      const error = { type: slot.errorType || 'unknown', message: slot.errorMessage || 'last resort retry' };
      slot.grokAttempts = slot.grokAttempts || 0;
      await this.sendGrokAndShotgun(slot, error, slot.grokAttempts, 5);

      await randomDelay(CONFIG.delayBetweenPrompts.min, CONFIG.delayBetweenPrompts.max);
    }

    // Esperar os últimos shotguns terminarem
    console.log('[Umbra Flow] 🚨 Last Resort: Aguardando gerações finais...');
    const lastResortTimeout = 120000; // 2 minutos max
    const lastResortStart = Date.now();

    while (Date.now() - lastResortStart < lastResortTimeout && this.isRunning) {
      await this.checkForNewVideos();

      const stillGenerating = this.slots.filter(s => s.status === 'generating').length;
      if (stillGenerating === 0) break;

      await randomDelay(CONFIG.checkInterval.min, CONFIG.checkInterval.max);
    }

    const finalErrors = this.slots.filter(s => s.status === 'error');
    const uniqueFinalErrors = [...new Set(finalErrors.map(s => s.number))];
    if (uniqueFinalErrors.length === 0) {
      console.log('[Umbra Flow] ✅ LAST RESORT SUCESSO! Todos os prompts geraram!');
      grokLog('success', 0, '✅ Last Resort: todos geraram!');
    } else {
      console.warn(`[Umbra Flow] ❌ LAST RESORT: ${uniqueFinalErrors.length} prompts não geraram: [${uniqueFinalErrors.join(', ')}]`);
      grokLog('fail', 0, `❌ Last Resort: ${uniqueFinalErrors.length} não geraram`);
    }
  }

  async sendInitialPrompts() {
    const initialCount = Math.min(CONFIG.maxActive, this.queue.length);

    for (let i = 0; i < initialCount; i++) {
      if (!this.isRunning) break;

      const sent = await this.sendNextPrompt();
      if (!sent) break;

      if (i < initialCount - 1) {
        await randomDelay(CONFIG.delayBetweenPrompts.min, CONFIG.delayBetweenPrompts.max);
      }
    }

    console.log(`[Umbra Flow] ${this.slots.length} prompts iniciais enviados`);
  }

  async sendNextPrompt() {
    if (this.nextQueueIndex >= this.queue.length) return false;

    const promptData = this.queue[this.nextQueueIndex];
    const hasElements = promptData.elements && promptData.elements.length > 0;

    console.log(`[Umbra Flow] Enviando prompt ${promptData.number}: "${promptData.text.substring(0, 40)}..."`);
    if (hasElements) {
      console.log(`[Umbra Flow] Com elementos: [${promptData.elements.join(', ')}]`);
    }

    // STEP 1: Trocar modo para Video se necessário + verificar
    const modeOk = await ensureVideoMode(hasElements);
    if (!modeOk) {
      console.error(`[Umbra Flow] ❌ BLOQUEADO: Modo Video não confirmado. Prompt ${promptData.number} NÃO enviado.`);
      chrome.runtime.sendMessage({
        action: 'PROMPT_ERROR',
        promptNumber: promptData.number,
        errorType: 'mode_switch_failed',
        errorMessage: 'Não foi possível trocar para modo Video',
        prompt: promptData
      });
      return false;
    }

    // STEP 2: Selecionar elementos se houver
    if (hasElements) {
      await selectElements(promptData.elements);
    }

    // STEP 3: Preencher textarea
    const filled = await fillTextarea(promptData.text);
    console.log(`[Umbra Flow] Textarea preenchida: ${filled}`);
    await sleep(500); // React processing

    // Snapshot tile IDs BEFORE clicking Create (for tile tracking)
    const tileIdsBefore = new Set(
      [...document.querySelectorAll('[data-tile-id]')].map(t => t.getAttribute('data-tile-id'))
    );

    // STEP 4: Clicar botão Criar
    console.log(`[Umbra Flow] Tentando clicar botão Criar...`);
    const clicked = await clickCreateButton();

    if (!clicked) {
      console.error(`[Umbra Flow] ❌ Erro ao clicar botão para prompt ${promptData.number}`);
      // Report element not found error
      chrome.runtime.sendMessage({
        action: 'PROMPT_ERROR',
        promptNumber: promptData.number,
        errorType: 'element_not_found',
        errorMessage: 'Botão Criar não encontrado',
        prompt: promptData
      });
    } else {
      console.log(`[Umbra Flow] ✓ Botão Criar clicado para prompt ${promptData.number}`);
    }

    await sleep(1000); // Wait for Flow to process

    // Detect the NEW tile ID that appeared after sending the prompt
    let newTileId = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const tilesNow = document.querySelectorAll('[data-tile-id]');
      for (const tile of tilesNow) {
        const id = tile.getAttribute('data-tile-id');
        if (!tileIdsBefore.has(id)) {
          newTileId = id;
          break;
        }
      }
      if (newTileId) break;
      await sleep(500);
    }
    if (newTileId) {
      console.log(`[Umbra Flow] ✓ Tile ID capturado para prompt ${promptData.number}: ${newTileId.substring(0, 30)}...`);
    } else {
      console.warn(`[Umbra Flow] ⚠️ Nenhum novo tile detectado para prompt ${promptData.number}`);
    }

    // Check for immediate errors ONLY on the new tile (not the entire page)
    const immediateError = await checkForErrorAfterSend(promptData.number, CONFIG.errorCheckDelay, newTileId);

    if (immediateError) {
      console.log(`[Umbra Flow] ⚡ Erro imediato detectado para prompt ${promptData.number}: ${immediateError.type}`);

      // Criar slot para o prompt com erro
      const errorSlot = {
        promptIndex: this.nextQueueIndex,
        number: promptData.number,
        status: 'generating', // handleSlotError vai mudar para 'error'
        sentAt: Date.now(),
        text: promptData.text,
        elements: promptData.elements,
        tileId: newTileId
      };
      this.slots.push(errorSlot);

      // Usar o routing centralizado (Grok, retry, ingredient tracking, etc.)
      await this.handleSlotError(errorSlot, immediateError);

      this.nextQueueIndex++;

      // Continue with next prompt
      if (this.nextQueueIndex < this.queue.length && this.isRunning) {
        await randomDelay(CONFIG.delayBetweenPrompts.min, CONFIG.delayBetweenPrompts.max);
      }

      return true;
    }

    // No immediate error - create slot as generating
    this.slots.push({
      promptIndex: this.nextQueueIndex,
      number: promptData.number,
      status: 'generating',
      sentAt: Date.now(),
      text: promptData.text,
      elements: promptData.elements,
      tileId: newTileId,
      timeoutResets: 0
    });

    this.nextQueueIndex++;

    updateStatus(
      `Enviando... ${this.nextQueueIndex}/${this.queue.length}`,
      { current: this.completedCount, total: this.queue.length }
    );

    return true;
  }

  async mainLoop() {
    let loopCount = 0;
    console.log(`[Umbra Flow] mainLoop iniciado. isRunning=${this.isRunning}, slots=${this.slots.length}, completedCount=${this.completedCount}, queue.length=${this.queue.length}`);

    while (this.isRunning) {
      loopCount++;

      if (loopCount % 10 === 0) {
        const activeSlots = this.slots.filter(s => s.status === 'generating').length;
        const errorSlots = this.slots.filter(s => s.status === 'error').length;
        const completedSlots = this.slots.filter(s => s.status === 'completed').length;
        const shotgunActive = [...this.shotgunMap.entries()].filter(([k, v]) => !v.completed).length;
        const shotgunDone = [...this.shotgunMap.entries()].filter(([k, v]) => v.completed).length;
        console.log(`[Umbra Flow] 📊 Loop ${loopCount} | Ativos: ${activeSlots} | Erros: ${errorSlots} | Completados: ${completedSlots} | Baixados: ${this.completedCount}/${this.queue.length} | errorCount=${this.errorCount} | totalSlots=${this.slots.length} | shotgunActive=${shotgunActive} shotgunDone=${shotgunDone} | retryQueue=${this.retryQueue.length}`);
      }

      // CORREÇÃO CRÍTICA: Contar quantos prompts únicos foram finalizados
      // Usar Set para evitar contar o mesmo prompt múltiplas vezes
      const uniqueCompletedPrompts = new Set();
      const uniqueErrorPrompts = new Set();

      for (const slot of this.slots) {
        if (slot.status === 'completed') {
          uniqueCompletedPrompts.add(slot.number);
        } else if (slot.status === 'error') {
          uniqueErrorPrompts.add(slot.number);
        }
      }

      const totalFinished = uniqueCompletedPrompts.size + uniqueErrorPrompts.size;

      // CORREÇÃO: Remover da contagem de erros os prompts que já foram completados
      // (ex: shotgun retry onde uma cópia falhou mas outra completou)
      for (const num of uniqueCompletedPrompts) {
        uniqueErrorPrompts.delete(num);
      }
      const realTotalFinished = uniqueCompletedPrompts.size + uniqueErrorPrompts.size;

      // Verificar se terminou - usar originalQueueLength menos prompts skipados
      // Prompts skipados serão processados na fase de regeneração
      const adjustedTotal = this.originalQueueLength;
      const allProcessed = realTotalFinished >= adjustedTotal && this.retryQueue.length === 0;

      if (allProcessed) {

        console.log(`[Umbra Flow] ✓ TODOS OS PROMPTS FINALIZADOS!`);
        console.log(`[Umbra Flow] - Completados: ${uniqueCompletedPrompts.size} prompts: [${Array.from(uniqueCompletedPrompts).sort((a, b) => a - b).join(', ')}]`);
        console.log(`[Umbra Flow] - Com erro: ${uniqueErrorPrompts.size} prompts: [${Array.from(uniqueErrorPrompts).sort((a, b) => a - b).join(', ')}]`);
        console.log(`[Umbra Flow] - Total: ${totalFinished}/${this.originalQueueLength}`);
        console.log(`[Umbra Flow] - Retries restantes: ${this.retryQueue.length}`);
        await this.finish();
        return;
      }

      // Verificar novos vídeos
      await this.checkForNewVideos();

      // Verificar slots travados a cada 20 loops
      if (loopCount % 20 === 0) {
        await this.checkStalledSlots();
      }

      // CORREÇÃO: Enviar novos prompts se ainda houver na fila
      // Contar slots que NÃO estão em estado final
      let nonFinalSlots = this.slots.filter(s =>
        s.status !== 'completed' && s.status !== 'error'
      ).length;

      // PRIORIDADE 1: Processar retries pendentes
      while (nonFinalSlots < CONFIG.maxActive && this.retryQueue.length > 0 && this.isRunning) {
        const retryPrompt = this.retryQueue.shift();
        console.log(`[Umbra Flow] 🔄 Processando retry do Prompt ${retryPrompt.number} (tentativa ${retryPrompt.retryAttempt})...`);

        await randomDelay(CONFIG.delayBetweenPrompts.min, CONFIG.delayBetweenPrompts.max);

        // Enviar prompt de retry manualmente
        const hasElements = retryPrompt.elements && retryPrompt.elements.length > 0;
        const modeOk = await ensureVideoMode(hasElements);
        if (!modeOk) {
          console.error(`[Umbra Flow] ❌ Retry ${retryPrompt.number}: modo Video falhou, pulando`);
          continue;
        }
        if (hasElements) await selectElements(retryPrompt.elements);
        const filled = await fillTextarea(retryPrompt.text);
        await sleep(1500);
        const clicked = await clickCreateButton();

        if (clicked && !detectFlowError()) {
          // Remover slots antigos com ERRO deste prompt (manter shotgun generating)
          this.slots = this.slots.filter(s => s.number !== retryPrompt.number || s.status === 'generating');

          // Criar novo slot para retry
          this.slots.push({
            promptIndex: -1,
            number: retryPrompt.number,
            status: 'generating',
            sentAt: Date.now(),
            text: retryPrompt.text,
            elements: retryPrompt.elements,
            isRetry: true,
            retryAttempt: retryPrompt.retryAttempt,
            grokAttempts: retryPrompt.grokAttempts || 0
          });
          console.log(`[Umbra Flow] ✓ Retry ${retryPrompt.retryAttempt} do Prompt ${retryPrompt.number} enviado com sucesso`);
        } else {
          console.error(`[Umbra Flow] ❌ Falha no retry do Prompt ${retryPrompt.number}`);
        }

        // Atualizar contador
        nonFinalSlots = this.slots.filter(s =>
          s.status !== 'completed' && s.status !== 'error'
        ).length;
      }

      // PRIORIDADE 2: Enviar prompts normais da fila
      while (nonFinalSlots < CONFIG.maxActive && this.nextQueueIndex < this.queue.length && this.isRunning) {
        await randomDelay(CONFIG.delayBetweenPrompts.min, CONFIG.delayBetweenPrompts.max);
        const sent = await this.sendNextPrompt();
        if (!sent) break;

        // Atualizar contador após enviar
        const updatedNonFinalSlots = this.slots.filter(s =>
          s.status !== 'completed' && s.status !== 'error'
        ).length;

        // Se atingiu o máximo, parar
        if (updatedNonFinalSlots >= CONFIG.maxActive) break;
      }

      // Atualizar status
      const activeSlots = this.slots.filter(s => s.status === 'generating').length;
      updateStatus(
        `Gerando... ${this.completedCount}/${this.queue.length} | ${activeSlots} ativos`,
        { current: this.completedCount, total: this.queue.length }
      );

      await randomDelay(CONFIG.checkInterval.min, CONFIG.checkInterval.max);
    }
  }

  // ====================================================================
  // SHOTGUN RETRY: Envia N cópias do mesmo prompt simultaneamente
  // Quando 1 gera com sucesso, baixa apenas essa e ignora as outras
  // ====================================================================
  async shotgunRetry(promptNumber, text, elements, copies, grokAttempts = 0) {
    console.log(`[Umbra Flow] 🔫 Shotgun retry Prompt ${promptNumber}: enviando ${copies} cópias (grokAttempts=${grokAttempts}, text=${text.substring(0, 60)}...)`);
    grokLog('call', promptNumber, `🔫 Shotgun: enviando ${copies} cópias simultâneas`);

    // Inicializar tracking
    if (!this.shotgunMap.has(promptNumber)) {
      this.shotgunMap.set(promptNumber, { tileIds: new Set(), completed: false });
    }
    const shotgunEntry = this.shotgunMap.get(promptNumber);

    // Remover slots antigos com erro deste prompt
    this.slots = this.slots.filter(s => s.number !== promptNumber || s.status !== 'error');

    const tileIdsBefore = new Set(
      [...document.querySelectorAll('[data-tile-id]')].map(t => t.getAttribute('data-tile-id'))
    );

    for (let i = 0; i < copies; i++) {
      if (!this.isRunning) break;

      const hasElements = elements && elements.length > 0;
      const modeOk = await ensureVideoMode(hasElements);
      if (!modeOk) {
        console.error(`[Umbra Flow] ❌ Shotgun ${promptNumber} cópia ${i+1}: modo Video falhou, pulando`);
        continue;
      }
      if (hasElements) await selectElements(elements);
      await fillTextarea(text);
      await sleep(400);
      await clickCreateButton();
      await sleep(1000);

      // Capturar novo tile ID
      let newTileId = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const tilesNow = document.querySelectorAll('[data-tile-id]');
        for (const tile of tilesNow) {
          const id = tile.getAttribute('data-tile-id');
          if (!tileIdsBefore.has(id) && !shotgunEntry.tileIds.has(id)) {
            newTileId = id;
            break;
          }
        }
        if (newTileId) break;
        await sleep(500);
      }

      if (newTileId) {
        tileIdsBefore.add(newTileId);
        shotgunEntry.tileIds.add(newTileId);

        // Criar slot para esta cópia (com grokAttempts do parâmetro)
        this.slots.push({
          promptIndex: -1,
          number: promptNumber,
          status: 'generating',
          sentAt: Date.now(),
          text: text,
          elements: elements,
          tileId: newTileId,
          isShotgunCopy: true,
          shotgunCopyIndex: i + 1,
          grokAttempts: grokAttempts
        });

        console.log(`[Umbra Flow] 🔫 Cópia ${i + 1}/${copies} do Prompt ${promptNumber} enviada. Tile: ${newTileId.substring(0, 20)}...`);
      }

      if (i < copies - 1) {
        await randomDelay(CONFIG.delayBetweenPrompts.min, CONFIG.delayBetweenPrompts.max);
      }
    }

    console.log(`[Umbra Flow] 🔫 Shotgun: ${shotgunEntry.tileIds.size} cópias ativas do Prompt ${promptNumber}`);
  }

  // ====================================================================
  // GROK + SHOTGUN: Corrige com Grok e envia N cópias
  // ====================================================================
  async sendGrokAndShotgun(slot, error, grokAttempts, copies) {
    const MAX_GROK_ATTEMPTS = 5;
    const errorType = error.type;
    const errorMessage = error.message;

    console.log(`[Umbra Flow] 🤖 Prompt ${slot.number}: ${errorType} error. Grok tentativa ${grokAttempts + 1}/${MAX_GROK_ATTEMPTS} + shotgun ${copies}x`);
    grokLog('call', slot.number, `Erro: ${errorType} — Grok (${grokAttempts + 1}/${MAX_GROK_ATTEMPTS}) + shotgun ${copies}x`);

    try {
      const fixResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'FIX_PROMPT_WITH_GROK',
          promptNumber: slot.number,
          originalPrompt: slot.text,
          errorMessage: errorMessage,
          attemptNumber: grokAttempts + 1,
          errorType: errorType === 'generation_fail' ? 'generation_fail' : 'policy'
        }, (response) => {
          resolve(response || { success: false, error: 'Sem resposta' });
        });
      });

      if (fixResult && fixResult.success && fixResult.fixedPrompt) {
        console.log(`[Umbra Flow] ✅ Grok corrigiu Prompt ${slot.number}. Shotgun ${copies}x...`);
        grokLog('success', slot.number, `Corrigido! Shotgun ${copies}x...`);

        slot.text = fixResult.fixedPrompt;
        slot.grokAttempts = grokAttempts + 1;
        slot.grokFixed = true;

        // Shotgun retry com o texto corrigido
        await this.shotgunRetry(slot.number, fixResult.fixedPrompt, slot.elements, copies, grokAttempts + 1);
        return true;
      } else {
        console.warn(`[Umbra Flow] ⚠️ Grok falhou: ${fixResult?.error || '?'}. Shotgun com texto original...`);
        grokLog('fail', slot.number, `Grok falhou: ${fixResult?.error || '?'}`);
        // Grok falhou, mas ainda faz shotgun com texto original
        await this.shotgunRetry(slot.number, slot.text, slot.elements, copies, grokAttempts);
        return false;
      }
    } catch (grokErr) {
      console.error(`[Umbra Flow] Grok error:`, grokErr);
      grokLog('fail', slot.number, `Erro: ${grokErr.message}`);
      // Mesmo com erro, faz shotgun com texto original
      await this.shotgunRetry(slot.number, slot.text, slot.elements, copies, grokAttempts);
      return false;
    }
  }

  // ====================================================================
  // ERRO ROUTING CENTRALIZADO
  // Chamado tanto por sendNextPrompt (erros imediatos) quanto
  // por checkForNewVideos (erros detectados no timeout).
  // Rotas: prominent people, generation fail (Grok+shotgun), policy (Grok+shotgun), retry shotgun
  // ====================================================================
  async handleSlotError(slot, error) {
    const errorType = error.type;
    const errorMessage = error.message;
    const fullErrorText = (error.originalText || errorMessage || '').toLowerCase();

    console.error(`[Umbra Flow] ❌ Prompt ${slot.number} failed: ${errorType} - ${errorMessage}`);

    // Marcar como erro
    slot.status = 'error';
    slot.errorType = errorType;
    slot.errorMessage = errorMessage;

    // Verificar se já está sendo tratado por shotgun
    const shotgunEntry = this.shotgunMap.get(slot.number);
    if (shotgunEntry && !shotgunEntry.completed) {
      // Verificar se TODAS as cópias shotgun falharam
      const activeShots = this.slots.filter(s =>
        s.number === slot.number && s.status === 'generating'
      );
      if (activeShots.length > 0) {
        console.log(`[Umbra Flow] 🔫 Prompt ${slot.number}: 1 cópia falhou, mas ${activeShots.length} ainda ativas. Aguardando...`);
        return; // Ainda tem cópias ativas, NÃO incrementar errorCount
      }
    }

    // Só incrementar errorCount UMA VEZ por prompt
    // Verificar se este prompt já está contabilizado como erro por outro slot
    const alreadyCounted = this.slots.some(s =>
      s.number === slot.number && s !== slot && s.status === 'error'
    );
    if (!alreadyCounted) {
      this.errorCount++;
    }

    console.log(`[Umbra Flow] errorCount=${this.errorCount} (prompt ${slot.number}, alreadyCounted=${alreadyCounted})`);

    // Variáveis de decisão
    const currentAttempts = this.retryAttempts.get(slot.number) || 0;
    const grokAttempts = slot.grokAttempts || 0;
    const MAX_GROK_ATTEMPTS = 5;
    const isProminentPeople = fullErrorText.includes('prominent people');
    const isGenerationFail = (errorType === 'generation_fail' || fullErrorText.includes('generation failed') || fullErrorText.includes('audio generation failed'));

    // Calcular cópias shotgun baseado na tentativa
    const totalAttempts = currentAttempts + grokAttempts;
    let shotgunCopies;
    if (totalAttempts <= 1) shotgunCopies = 2;
    else if (totalAttempts <= 2) shotgunCopies = 3;
    else shotgunCopies = 5;

    console.log(`[Umbra Flow] 📋 handleSlotError P${slot.number}: errorType=${errorType} | isProminentPeople=${isProminentPeople} | isGenerationFail=${isGenerationFail} | currentAttempts=${currentAttempts} | grokAttempts=${grokAttempts} | totalAttempts=${totalAttempts} | shotgunCopies=${shotgunCopies} | isShotgunCopy=${!!slot.isShotgunCopy}`);

    // ============================================================
    // ROTA 1: "prominent people" — Grok reescreve texto removendo nomes
    // O erro é causado pelo TEXTO (nomes de personagens), não pelas imagens.
    // Usar Grok para remover nomes + shotgun retry.
    // Tentativa 1-2: Grok reescreve removendo nomes
    // Tentativa 3+: sem ingredientes E sem nomes (cenário-only)
    // ============================================================
    if (isProminentPeople) {
      if (grokAttempts < MAX_GROK_ATTEMPTS) {
        if (grokAttempts >= 2) {
          // Após 2 falhas com Grok: enviar sem ingredientes E sem nomes
          console.log(`[Umbra Flow] 📋 → ROTA 1c: prominent people (tentativa ${grokAttempts + 1}). SEM ingredientes + SEM nomes.`);
          slot.elements = []; // Remover ingredientes
        } else {
          console.log(`[Umbra Flow] 📋 → ROTA 1: prominent people. Grok ${grokAttempts + 1}/${MAX_GROK_ATTEMPTS} + shotgun ${shotgunCopies}x`);
        }
        this.retryAttempts.set(slot.number, currentAttempts + 1);
        await this.sendGrokAndShotgun(slot, error, grokAttempts, shotgunCopies);
      } else {
        console.warn(`[Umbra Flow] ❌ Prompt ${slot.number}: prominent people após ${MAX_GROK_ATTEMPTS} Grok. Desistindo.`);
        grokLog('fail', slot.number, `❌ Desistiu após ${MAX_GROK_ATTEMPTS} tentativas (prominent people)`);
      }
    }
    // ============================================================
    // ROTA 2: "audio/generation failed" — Grok corrige áudio + shotgun
    // ============================================================
    else if (isGenerationFail) {
      if (grokAttempts < MAX_GROK_ATTEMPTS) {
        console.log(`[Umbra Flow] 📋 → ROTA 2: generation fail. Grok ${grokAttempts + 1}/${MAX_GROK_ATTEMPTS} + shotgun ${shotgunCopies}x`);
        this.retryAttempts.set(slot.number, currentAttempts + 1);
        await this.sendGrokAndShotgun(slot, error, grokAttempts, shotgunCopies);
      } else {
        console.warn(`[Umbra Flow] ❌ Prompt ${slot.number}: audio/generation fail após ${MAX_GROK_ATTEMPTS} Grok + shotgun. Desistindo.`);
        grokLog('fail', slot.number, `❌ Desistiu após ${MAX_GROK_ATTEMPTS} tentativas Grok`);
      }
    }
    // ============================================================
    // ROTA 3: Outros erros de política — Grok corrige texto + shotgun
    // ============================================================
    else if (errorType === 'policy' && grokAttempts < MAX_GROK_ATTEMPTS) {
      console.log(`[Umbra Flow] 📋 → ROTA 3: policy error. Grok ${grokAttempts + 1}/${MAX_GROK_ATTEMPTS} + shotgun ${shotgunCopies}x`);
      this.retryAttempts.set(slot.number, currentAttempts + 1);
      await this.sendGrokAndShotgun(slot, error, grokAttempts, shotgunCopies);
    }
    // ============================================================
    // ROTA 4: Timeout / server / rate_limit / outros — Shotgun retry
    // ============================================================
    else if (currentAttempts < 4) {
      console.log(`[Umbra Flow] 📋 → ROTA 4: timeout/other. Shotgun ${shotgunCopies}x (tentativa ${currentAttempts + 1}/4)`);
      console.log(`[Umbra Flow] 🔄 Shotgun retry Prompt ${slot.number} (tentativa ${currentAttempts + 1}/4, ${shotgunCopies} cópias)...`);
      this.retryAttempts.set(slot.number, currentAttempts + 1);
      await this.shotgunRetry(slot.number, slot.text, slot.elements, shotgunCopies, slot.grokAttempts || 0);
    } else {
      console.warn(`[Umbra Flow] 📋 → SEM ROTA: Prompt ${slot.number} falhou definitivamente. errorType=${errorType} currentAttempts=${currentAttempts} grokAttempts=${grokAttempts}`);
    }

    // Notificar background do progresso
    chrome.runtime.sendMessage({
      action: 'UPDATE_PROGRESS',
      completedCount: this.completedCount,
      errorCount: this.errorCount,
      promptStatus: { number: slot.number, status: 'error', errorType, errorMessage }
    });
  }

  async checkForNewVideos() {
    // Verificar erros nos tiles A CADA LOOP (não só no timeout!)
    const now = Date.now();
    const MIN_WAIT_FOR_ERROR = 10000; // Esperar pelo menos 10s antes de checar erros

    for (const slot of this.slots) {
      if (slot.status !== 'generating') continue;

      const elapsed = now - slot.sentAt;

      // Checar tile por erros SEMPRE (após mínimo de 10s para dar tempo de gerar)
      if (elapsed > MIN_WAIT_FOR_ERROR && slot.tileId) {
        const tile = document.querySelector(`[data-tile-id="${slot.tileId}"]`);
        if (tile) {
          const tileText = (tile.textContent || '').toLowerCase();
          const error = classifyErrorText(tileText);
          if (error) {
            console.log(`[Umbra Flow] ⚡ Erro detectado no tile do Prompt ${slot.number} após ${Math.round(elapsed / 1000)}s: ${error.type}`);
            await this.handleSlotError(slot, error);
            continue;
          }
        }
      }

      // Fallback: timeout sem erro visível → marcar como timeout
      if (elapsed > CONFIG.slotTimeout) {
        console.warn(`[Umbra Flow] ⏳ Prompt ${slot.number} atingiu timeout de ${CONFIG.slotTimeout / 1000}s sem erro visível.`);
        const error = {
          type: 'timeout',
          message: `video generation exceeded ${CONFIG.slotTimeout / 1000}s timeout`
        };
        await this.handleSlotError(slot, error);
      }
    }

    // NOVA LÓGICA: Pegar vídeos COM seus números de prompt
    const videosWithNumbers = getVideosWithPromptNumbers();

    if (videosWithNumbers.length === 0) return;

    // Filtrar apenas vídeos que ainda não foram processados/conhecidos
    const newVideos = videosWithNumbers.filter(v =>
      !this.processedUrls.has(v.url) && !this.knownUrls.has(v.url)
    );

    if (newVideos.length === 0) return;

    const pendingSlots = this.slots.filter(s => s.status === 'generating');
    if (pendingSlots.length === 0 && !this.slots.some(s => s.status === 'error')) return;

    console.log(`[Umbra Flow] ${newVideos.length} vídeo(s) NOVO(s) detectado(s)`);
    newVideos.forEach(v => {
      console.log(`[Umbra Flow] - Vídeo novo: Prompt ${v.promptNumber}`);
    });

    // Processar cada vídeo novo encontrado
    for (const video of newVideos) {

      // SHOTGUN DEDUP: Verificar se este prompt já foi completado por outra cópia shotgun
      const shotgunEntry = this.shotgunMap.get(video.promptNumber);
      if (shotgunEntry && shotgunEntry.completed) {
        console.log(`[Umbra Flow] 🔫 Prompt ${video.promptNumber}: já baixado por outra cópia shotgun. Ignorando.`);
        this.knownUrls.add(video.url);
        this.processedUrls.add(video.url);
        continue;
      }

      // Encontrar slot pelo número (priorizar 'generating' para shotgun)
      let slot = this.slots.find(s => s.number === video.promptNumber && s.status === 'generating');
      if (!slot) {
        slot = this.slots.find(s => s.number === video.promptNumber && s.status !== 'completed');
      }
      if (!slot) {
        slot = this.slots.find(s => s.number === video.promptNumber);
      }

      if (!slot) {
        console.warn(`[Umbra Flow] ⚠️ Vídeo do Prompt ${video.promptNumber} encontrado, mas slot não existe`);
        this.knownUrls.add(video.url);
        continue;
      }

      // Se slot estava como 'error' mas vídeo ficou pronto, cancelar retry pendente
      if (slot.status === 'error') {
        console.log(`[Umbra Flow] ✓ Vídeo do Prompt ${slot.number} ficou pronto APÓS erro/timeout!`);
        this.errorCount = Math.max(0, this.errorCount - 1);
        this.retryQueue = this.retryQueue.filter(r => r.number !== slot.number);
        this.retryAttempts.delete(slot.number);
        console.log(`[Umbra Flow] ✓ Retry cancelado para Prompt ${slot.number} (vídeo recuperado)`);
      }

      // Se já foi completado antes, pular
      if (slot.status === 'completed') {
        console.warn(`[Umbra Flow] ⚠️ Vídeo do Prompt ${slot.number} já foi baixado antes`);
        this.knownUrls.add(video.url);
        continue;
      }

      console.log(`[Umbra Flow] ✓ Vídeo do Prompt ${slot.number} identificado corretamente!`);
      console.log(`[Umbra Flow] Baixando prompt ${slot.number}: ${slot.text.substring(0, 50)}...`);

      try {
        await downloadVideo(video.url, slot.number, slot.text, this.downloadFolder);

        slot.status = 'completed';
        this.processedUrls.add(video.url);
        this.completedCount++;

        // SHOTGUN DEDUP: cancelar cópias extras e corrigir errorCount
        if (shotgunEntry) {
          shotgunEntry.completed = true;
          // Recuperar errorCount (foi incrementado quando o prompt original falhou)
          const oldErrorCount = this.errorCount;
          this.errorCount = Math.max(0, this.errorCount - 1);
          console.log(`[Umbra Flow] 🔫 DEDUP: Prompt ${slot.number} shotgun sucesso. errorCount: ${oldErrorCount} → ${this.errorCount}. Cancelando cópias extras...`);
          for (const otherSlot of this.slots) {
            if (otherSlot.number === slot.number && otherSlot !== slot && otherSlot.status === 'generating') {
              otherSlot.status = 'completed';
              console.log(`[Umbra Flow] 🔫 Cópia shotgun extra do Prompt ${slot.number} cancelada`);
            }
          }
          grokLog('success', slot.number, `🔫 Shotgun sucesso! 1 de ${shotgunEntry.tileIds.size} cópias gerou.`);
        }

        console.log(`[Umbra Flow] ✓ Prompt ${slot.number} OK! (${this.completedCount}/${this.queue.length})`);

        // Notificar background
        chrome.runtime.sendMessage({
          action: 'UPDATE_PROGRESS',
          completedCount: this.completedCount,
          errorCount: this.errorCount,
          promptStatus: { number: slot.number, status: 'completed' }
        });

        // Pausa entre lotes se configurado
        if (CONFIG.batchPause > 0 && this.completedCount % CONFIG.maxActive === 0) {
          if (this.nextQueueIndex < this.queue.length && this.isRunning) {
            const pauseMs = CONFIG.batchPause * 1000;
            console.log(`[Umbra Flow] Pausando por ${CONFIG.batchPause} segundo(s)...`);
            updateStatus(`Pausa entre lotes... ${CONFIG.batchPause}s`, { current: this.completedCount, total: this.queue.length });
            await sleep(pauseMs);
          }
        }

        // CORREÇÃO: Não enviar automaticamente próximo prompt aqui
        // A lógica de envio está centralizada no mainLoop

      } catch (error) {
        console.error(`[Umbra Flow] Erro no download do prompt ${slot.number}:`, error);
        slot.status = 'error';
        this.processedUrls.add(video.url);
        this.errorCount++;

        chrome.runtime.sendMessage({
          action: 'UPDATE_PROGRESS',
          completedCount: this.completedCount,
          errorCount: this.errorCount,
          promptStatus: { number: slot.number, status: 'error' }
        });

        // CORREÇÃO: Não enviar automaticamente próximo prompt aqui
        // A lógica de envio está centralizada no mainLoop
      }

      // Adicionar URL aos conhecidos
      this.knownUrls.add(video.url);
    }
  }

  async checkStalledSlots() {
    const now = Date.now();

    for (const slot of this.slots) {
      if (slot.status !== 'generating') continue;

      const elapsed = now - slot.sentAt;

      if (elapsed > CONFIG.slotTimeout) {
        const attempts = this.retryAttempts.get(slot.number) || 0;

        if (attempts < CONFIG.maxRetries) {
          console.log(`[Umbra Flow] ⚠️ Prompt ${slot.number} travado, retry ${attempts + 1}/${CONFIG.maxRetries}`);

          this.retryAttempts.set(slot.number, attempts + 1);

          // Reenviar prompt
          const hasElements = slot.elements && slot.elements.length > 0;
          const modeOk = await ensureVideoMode(hasElements);
          if (!modeOk) {
            console.error(`[Umbra Flow] ❌ StuckCheck ${slot.number}: modo Video falhou, pulando`);
            continue;
          }
          if (hasElements) await selectElements(slot.elements);
          await fillTextarea(slot.text);
          await sleep(800);
          await clickCreateButton();

          slot.sentAt = Date.now();
        } else {
          console.error(`[Umbra Flow] ❌ Prompt ${slot.number} falhou após ${CONFIG.maxRetries} tentativas`);
          slot.status = 'error';
          this.errorCount++;

          chrome.runtime.sendMessage({
            action: 'UPDATE_PROGRESS',
            errorCount: this.errorCount,
            promptStatus: { number: slot.number, status: 'error' }
          });
        }
      }
    }
  }

  stop() {
    this.isRunning = false;
    console.log(`[Umbra Flow] Parado. ${this.completedCount} baixados, ${this.errorCount} erros`);
    console.trace('[Umbra Flow] stop() foi chamado. Stack trace:');

    // Coletar prompts que não foram completados
    const failedPrompts = [];
    for (const slot of this.slots) {
      if (slot.status !== 'completed') {
        failedPrompts.push({
          number: slot.number,
          text: slot.text,
          elements: slot.elements || [],
          errorType: slot.status === 'error' ? (slot.errorType || 'error') : 'interrompido',
          errorMessage: slot.status === 'error' ? (slot.errorMessage || 'Erro') : 'Parado pelo usuário'
        });
      }
    }

    // Incluir prompts da fila que nunca foram enviados
    for (let i = this.nextQueueIndex; i < this.queue.length; i++) {
      const prompt = this.queue[i];
      // Evitar duplicatas
      if (!failedPrompts.some(fp => fp.number === prompt.number)) {
        failedPrompts.push({
          number: prompt.number,
          text: prompt.text,
          elements: prompt.elements || [],
          errorType: 'não enviado',
          errorMessage: 'Prompt não foi enviado (automação parada)'
        });
      }
    }

    // Salvar e mostrar botão
    if (failedPrompts.length > 0) {
      chrome.storage.local.set({ ff_failed_prompts: failedPrompts });
    }
    this.showFailedPromptsButton(failedPrompts);

    updateStatus('Interrompido pelo usuário', null, false);
    chrome.runtime.sendMessage({ action: 'STOP_AUTOMATION' });
  }

  // [REMOVIDO] regenerateProblematicAssets - substituído por ROTA 1 com Grok text rewrite

  async finish() {
    // DEBUG: Mostrar status final detalhado de todos os slots
    console.log(`[Umbra Flow] ========== STATUS FINAL DOS SLOTS ==========`);
    console.log(`[Umbra Flow] Total de slots: ${this.slots.length}`);

    const statusCounts = {
      completed: [],
      error: [],
      generating: [],
      other: []
    };

    // Coletar prompts que falharam (APENAS os que NÃO têm nenhum slot completed)
    // Primeiro: identificar prompts que TÊM pelo menos 1 slot completed
    const completedPromptNums = new Set(
      this.slots.filter(s => s.status === 'completed').map(s => s.number)
    );

    const failedPrompts = [];
    const seenFailedNums = new Set(); // dedup: um prompt pode ter N slots com erro

    for (const slot of this.slots) {
      if (slot.status === 'completed') {
        statusCounts.completed.push(slot.number);
      } else if (slot.status === 'error') {
        statusCounts.error.push(`${slot.number} (${slot.errorType || 'unknown'})`);
        // Só marcar como "falha" se NENHUM slot deste prompt completou
        if (!completedPromptNums.has(slot.number) && !seenFailedNums.has(slot.number)) {
          seenFailedNums.add(slot.number);
          failedPrompts.push({
            number: slot.number,
            text: slot.text,
            elements: slot.elements || [],
            errorType: slot.errorType || 'unknown',
            errorMessage: slot.errorMessage || 'Erro desconhecido'
          });
        }
      } else if (slot.status === 'generating') {
        statusCounts.generating.push(slot.number);
        if (!completedPromptNums.has(slot.number) && !seenFailedNums.has(slot.number)) {
          seenFailedNums.add(slot.number);
          failedPrompts.push({
            number: slot.number,
            text: slot.text,
            elements: slot.elements || [],
            errorType: 'timeout',
            errorMessage: 'Não completou a tempo'
          });
        }
      } else {
        statusCounts.other.push(`${slot.number} (${slot.status})`);
        if (!completedPromptNums.has(slot.number) && !seenFailedNums.has(slot.number)) {
          seenFailedNums.add(slot.number);
          failedPrompts.push({
            number: slot.number,
            text: slot.text,
            elements: slot.elements || [],
            errorType: slot.status || 'unknown',
            errorMessage: `Status: ${slot.status}`
          });
        }
      }
    }

    console.log(`[Umbra Flow] ✓ Completados: ${statusCounts.completed.length} prompts: [${statusCounts.completed.sort((a, b) => a - b).join(', ')}]`);
    console.log(`[Umbra Flow] ❌ Com erro: ${statusCounts.error.length} prompts: [${statusCounts.error.join(', ')}]`);
    console.log(`[Umbra Flow] ⏳ Ainda gerando: ${statusCounts.generating.length} prompts: [${statusCounts.generating.sort((a, b) => a - b).join(', ')}]`);
    if (statusCounts.other.length > 0) {
      console.log(`[Umbra Flow] ⚠️ Outro status: ${statusCounts.other.length} prompts: [${statusCounts.other.join(', ')}]`);
    }
    console.log(`[Umbra Flow] nextQueueIndex=${this.nextQueueIndex}, queue.length=${this.queue.length}`);
    console.log(`[Umbra Flow] completedCount=${this.completedCount}, errorCount=${this.errorCount}`);
    console.log(`[Umbra Flow] ============================================`);

    // Salvar prompts com falha no chrome.storage.local para acesso posterior
    if (failedPrompts.length > 0) {
      chrome.storage.local.set({ ff_failed_prompts: failedPrompts });
      console.log(`[Umbra Flow] 📋 ${failedPrompts.length} prompts com falha salvos para cópia`);
    } else {
      chrome.storage.local.remove('ff_failed_prompts');
    }

    // Injetar botão "Copiar prompts com erro" na página
    this.showFailedPromptsButton(failedPrompts);

    // ==========================================
    // VERIFICAÇÃO DE DOWNLOADS NO DISCO + AUTO-RECOVER
    // Loop: verificar → remover duplicados → re-gerar faltantes → repetir
    // ==========================================
    await this.verifyAndRecoverDownloads();
  }

  /**
   * Loop de verificação + recuperação automática de downloads.
   * 1. Verifica quais prompts existem na pasta via chrome.downloads.search()
   * 2. Remove duplicados automaticamente
   * 3. Re-gera prompts faltantes (com Grok fix se necessário)
   * 4. Repete até 100% ou 5 rounds sem progresso
   */
  async verifyAndRecoverDownloads() {
    const MAX_RECOVERY_ROUNDS = 5;


    // Track de tentativas por prompt neste recovery
    const recoveryAttempts = new Map(); // promptNumber -> {attempts, lastText, strippedCharacters}

    for (let round = 1; round <= MAX_RECOVERY_ROUNDS; round++) {
      console.log(`[Umbra Flow] 📊 ===== VERIFICAÇÃO DE DOWNLOADS (Round ${round}/${MAX_RECOVERY_ROUNDS}) =====`);
      updateStatus(`📊 Verificando downloads no disco (round ${round})...`, { current: this.completedCount, total: this.queue.length }, false);

      // Aguardar um pouco para downloads pendentes finalizarem
      await sleep(5000);

      // Pedir ao background para verificar no disco (com retry)
      let result = null;
      for (let checkAttempt = 0; checkAttempt < 3; checkAttempt++) {
        result = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn(`[Umbra Flow] ⚠️ CHECK_DOWNLOADS_ON_DISK timeout (tentativa ${checkAttempt + 1})`);
            resolve(null);
          }, 10000); // 10s timeout

          chrome.runtime.sendMessage({
            action: 'CHECK_DOWNLOADS_ON_DISK',
            folder: this.downloadFolder,
            expectedNumbers: this.queue.map(p => p.number)
          }, (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              console.warn(`[Umbra Flow] ⚠️ CHECK erro: ${chrome.runtime.lastError.message}`);
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });

        if (result && result.success) break;
        console.warn(`[Umbra Flow] ⚠️ Verificação falhou (tentativa ${checkAttempt + 1}/3), retentando em 3s...`);
        await sleep(3000);
      }

      if (!result || !result.success) {
        console.error('[Umbra Flow] ❌ Falha na verificação de downloads após 3 tentativas');
        // Fallback: usar status dos slots para determinar faltantes
        // IMPORTANTE: excluir prompts que TÊM pelo menos um slot completed
        // (ex: shotgun onde 1 cópia completou mas 11 falharam)
        const completedPromptNumbers = new Set(
          this.slots.filter(s => s.status === 'completed').map(s => s.number)
        );
        const slotMissing = [...new Set(
          this.slots
            .filter(s => s.status !== 'completed')
            .map(s => s.number)
        )].filter(num => !completedPromptNumbers.has(num));
        console.log(`[Umbra Flow] 📊 Fallback via slots: ${slotMissing.length} prompts não-completados: [${slotMissing.join(', ')}]`);
        
        if (slotMissing.length === 0) {
          // Todos os slots estão completed — podemos considerar OK
          break;
        }
        // Usar dados dos slots como resultado
        result = {
          success: true,
          missing: slotMissing,
          duplicates: [],
          downloadedCount: this.queue.length - slotMissing.length,
          totalExpected: this.queue.length
        };
      }

      const { missing, duplicates, downloadedCount, totalExpected } = result;

      console.log(`[Umbra Flow] 📊 Resultado: ${downloadedCount}/${totalExpected} baixados, ${missing.length} faltantes, ${duplicates.length} duplicados`);

      // Auto-remover duplicados
      if (duplicates.length > 0) {
        console.log(`[Umbra Flow] 🗑️ Removendo ${duplicates.length} duplicados...`);
        updateStatus(`🗑️ Removendo ${duplicates.length} duplicados...`, { current: downloadedCount, total: totalExpected }, false);

        await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'FIX_DUPLICATE_DOWNLOADS',
            folder: this.downloadFolder,
            expectedNumbers: this.queue.map(p => p.number)
          }, (response) => {
            if (response && response.success) {
              console.log(`[Umbra Flow] 🗑️ ${response.deleted} duplicados removidos`);
            }
            resolve();
          });
        });
      }

      // Se não falta nenhum, sucesso total!
      if (missing.length === 0) {
        const summary = `✅ Concluído! ${totalExpected}/${totalExpected} vídeos baixados com sucesso!`;
        console.log(`[Umbra Flow] ${summary}`);
        updateStatus(summary, { current: totalExpected, total: totalExpected }, true);
        this.isRunning = false;

        // Notificar background (sem re-verificar — evita loop)
        chrome.runtime.sendMessage({
          action: 'RECOVERY_COMPLETE',
          status: 'all_downloaded',
          missingCount: 0,
          totalCount: totalExpected
        });
        return;
      }

      // Há prompts faltantes — re-gerar
      console.log(`[Umbra Flow] ⚠️ Faltam ${missing.length} prompts: [${missing.join(', ')}]`);
      updateStatus(
        `⚠️ Faltam ${missing.length} prompts. Re-gerando (round ${round})...`,
        { current: downloadedCount, total: totalExpected },
        false
      );

      // Re-ativar a automação para re-gerar os faltantes
      this.isRunning = true;

      for (const promptNum of missing) {
        if (!this.isRunning) break;

        // Encontrar dados do prompt original
        const originalPrompt = this.queue.find(p => p.number === promptNum);
        if (!originalPrompt) {
          console.warn(`[Umbra Flow] ⚠️ Prompt ${promptNum} não encontrado na queue original`);
          continue;
        }

        // Track de tentativas
        if (!recoveryAttempts.has(promptNum)) {
          recoveryAttempts.set(promptNum, {
            attempts: 0,
            lastText: originalPrompt.text,
            strippedCharacters: false
          });
        }
        const tracker = recoveryAttempts.get(promptNum);
        tracker.attempts++;

        console.log(`[Umbra Flow] 🔄 Re-gerando Prompt ${promptNum} (tentativa recovery ${tracker.attempts})...`);

        let textToSend = tracker.lastText;
        const hasElements = originalPrompt.elements && originalPrompt.elements.length > 0;
        let useElements = hasElements;

        // ÚLTIMO RECURSO: Se já tentou muitas vezes, remover referências a personagens
        if (tracker.attempts >= 3 && !tracker.strippedCharacters) {
          console.log(`[Umbra Flow] 🚨 Prompt ${promptNum}: ${tracker.attempts} tentativas falhas. ÚLTIMO RECURSO: removendo personagens, enviando apenas cenário...`);
          grokLog('call', promptNum, `ÚLTIMO RECURSO: removendo personagens após ${tracker.attempts} falhas`);

          // Strip character references: remover [N] patterns e nomes de personagens comuns
          textToSend = textToSend
            .replace(/\[\d+(?:,\s*\d+)*\]/g, '')  // Remove [1], [1, 2], etc.
            .replace(/\s+/g, ' ')
            .trim();

          // Usar Grok para reescrever sem personagens
          try {
            const grokResult = await new Promise((resolve) => {
              chrome.runtime.sendMessage({
                action: 'FIX_PROMPT_WITH_GROK',
                promptNumber: promptNum,
                originalPrompt: textToSend,
                errorMessage: 'INSTRUÇÃO ESPECIAL: Reescreva este prompt removendo TODAS as referências a personagens específicos. Mantenha apenas a descrição do cenário, ambiente, atmosfera e ação genérica. Não mencione nomes de personagens.',
                attemptNumber: tracker.attempts,
                errorType: 'generation_fail'
              }, (response) => {
                resolve(response || { success: false });
              });
            });

            if (grokResult && grokResult.success && grokResult.fixedPrompt) {
              textToSend = grokResult.fixedPrompt;
              console.log(`[Umbra Flow] ✅ Grok reescreveu sem personagens: "${textToSend.substring(0, 80)}..."`);
            }
          } catch (e) {
            console.warn(`[Umbra Flow] Grok falhou no strip, usando texto limpo`);
          }

          tracker.strippedCharacters = true;
          useElements = false; // Sem ingredientes
        }
        // Se não é último recurso mas já falhou, usar Grok para corrigir
        else if (tracker.attempts >= 2) {
          try {
            const grokResult = await new Promise((resolve) => {
              chrome.runtime.sendMessage({
                action: 'FIX_PROMPT_WITH_GROK',
                promptNumber: promptNum,
                originalPrompt: textToSend,
                errorMessage: 'Este prompt falhou anteriormente. Reescreva sutilmente para evitar rejeição.',
                attemptNumber: tracker.attempts,
                errorType: 'generation_fail'
              }, (response) => {
                resolve(response || { success: false });
              });
            });

            if (grokResult && grokResult.success && grokResult.fixedPrompt) {
              textToSend = grokResult.fixedPrompt;
              tracker.lastText = textToSend;
              console.log(`[Umbra Flow] ✅ Grok corrigiu Prompt ${promptNum}: "${textToSend.substring(0, 60)}..."`);
            }
          } catch (e) {
            console.warn(`[Umbra Flow] Grok falhou, usando texto anterior`);
          }
        }

        // CRÍTICO: Criar/reactivar slot para que checkForNewVideos consiga
        // fazer match quando o vídeo ficar pronto e disparar o download.
        let recoverySlot = this.slots.find(s => s.number === promptNum);
        if (recoverySlot) {
          // Reactivar slot existente
          recoverySlot.status = 'generating';
          recoverySlot.sentAt = Date.now();
          recoverySlot.text = textToSend;
          recoverySlot.tileId = null; // será detectado automaticamente
          console.log(`[Umbra Flow] 🔄 Slot ${promptNum} reativado para recovery`);
        } else {
          // Criar novo slot (raro, mas possível)
          recoverySlot = {
            number: promptNum,
            text: textToSend,
            elements: useElements ? originalPrompt.elements : [],
            status: 'generating',
            sentAt: Date.now(),
            tileId: null
          };
          this.slots.push(recoverySlot);
          console.log(`[Umbra Flow] 🆕 Novo slot ${promptNum} criado para recovery`);
        }

        // Enviar o prompt
        const modeOk = await ensureVideoMode(useElements);
        if (!modeOk) {
          console.error(`[Umbra Flow] ❌ Recovery Prompt ${promptNum}: modo Video falhou`);
          recoverySlot.status = 'error';
          continue;
        }

        if (useElements) await selectElements(originalPrompt.elements);
        await fillTextarea(textToSend);
        await sleep(500);

        const clicked = await clickCreateButton();
        if (!clicked) {
          console.error(`[Umbra Flow] ❌ Recovery: botão Criar não clicou para Prompt ${promptNum}`);
          recoverySlot.status = 'error';
          continue;
        }

        console.log(`[Umbra Flow] ✅ Prompt ${promptNum} re-enviado!`);

        // Esperar a geração + download (até 180s por prompt)
        const downloadWaitStart = Date.now();
        const maxWait = 180000; // 3 min

        while (Date.now() - downloadWaitStart < maxWait && this.isRunning) {
          await this.checkForNewVideos();
          await sleep(5000);

          // Verificar se já foi baixado
          const quickCheck = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
              action: 'CHECK_DOWNLOADS_ON_DISK',
              folder: this.downloadFolder,
              expectedNumbers: [promptNum]
            }, (response) => {
              resolve(response || { missing: [promptNum] });
            });
          });

          if (quickCheck.missing && quickCheck.missing.length === 0) {
            console.log(`[Umbra Flow] ✅ Prompt ${promptNum} confirmado no disco!`);
            break;
          }

          // Verificar erro de flow
          const flowError = detectFlowError();
          if (flowError) {
            console.error(`[Umbra Flow] ❌ Erro Flow para Prompt ${promptNum}: ${flowError.message}`);
            // Tentar fechar qualquer dialog de erro
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            break;
          }
        }

        // Delay entre prompts
        await randomDelay(CONFIG.delayBetweenPrompts.min, CONFIG.delayBetweenPrompts.max);
      }

      // Verificar progresso: se não melhorou desde o round anterior, parar
      const recheckResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'CHECK_DOWNLOADS_ON_DISK',
          folder: this.downloadFolder,
          expectedNumbers: this.queue.map(p => p.number)
        }, (response) => {
          resolve(response || { missing: missing }); // fallback
        });
      });

      const stillMissing = recheckResult.missing || [];
      if (stillMissing.length >= missing.length) {
        console.log(`[Umbra Flow] ⚠️ Round ${round}: sem progresso (${stillMissing.length} ainda faltando). Tentando próximo round...`);
      } else {
        console.log(`[Umbra Flow] ✓ Round ${round}: progresso! ${missing.length} → ${stillMissing.length} faltantes`);
      }
    }

    // Verificação final (com fallback pessimista)
    let finalResult = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null);
      }, 10000);

      chrome.runtime.sendMessage({
        action: 'CHECK_DOWNLOADS_ON_DISK',
        folder: this.downloadFolder,
        expectedNumbers: this.queue.map(p => p.number)
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });

    // Se a verificação falhar, usar status dos slots
    if (!finalResult || !finalResult.success) {
      // IMPORTANTE: excluir prompts que TÊM pelo menos um slot completed
      const completedNums = new Set(
        this.slots.filter(s => s.status === 'completed').map(s => s.number)
      );
      const slotMissing = [...new Set(
        this.slots
          .filter(s => s.status !== 'completed')
          .map(s => s.number)
      )].filter(num => !completedNums.has(num));
      finalResult = {
        missing: slotMissing,
        downloadedCount: this.queue.length - slotMissing.length,
        totalExpected: this.queue.length
      };
      console.log(`[Umbra Flow] ⚠️ Verificação final falhou, usando status dos slots: ${slotMissing.length} faltantes`);
    }

    this.isRunning = false;

    const finalMissing = finalResult.missing || [];
    const finalDownloaded = finalResult.downloadedCount || (this.queue.length - finalMissing.length);

    if (finalMissing.length === 0) {
      const summary = `✅ Concluído! ${this.queue.length}/${this.queue.length} vídeos baixados com sucesso!`;
      console.log(`[Umbra Flow] ${summary}`);
      updateStatus(summary, { current: this.queue.length, total: this.queue.length }, true);
      // Limpar dados de erro (podem ter sido salvos antes do verify)
      chrome.storage.local.remove('ff_failed_prompts');
      this.showFailedPromptsButton([]); // Remove banner de erro
    } else {
      const summary = `⚠️ Concluído com ${finalMissing.length} faltantes: [${finalMissing.join(', ')}]. ${finalDownloaded}/${this.queue.length} baixados.`;
      console.log(`[Umbra Flow] ${summary}`);
      updateStatus(summary, { current: finalDownloaded, total: this.queue.length }, true);

      // Salvar faltantes finais
      const finalFailed = finalMissing.map(num => {
        const q = this.queue.find(p => p.number === num);
        return {
          number: num,
          text: q ? q.text : '',
          elements: q ? q.elements || [] : [],
          errorType: 'missing_download',
          errorMessage: 'Download não encontrado no disco'
        };
      });
      chrome.storage.local.set({ ff_failed_prompts: finalFailed });
      this.showFailedPromptsButton(finalFailed);
    }

    // Notificar background (sem re-verificar — evita loop)
    chrome.runtime.sendMessage({
      action: 'RECOVERY_COMPLETE',
      status: finalMissing.length === 0 ? 'all_downloaded' : 'partial',
      missingCount: finalMissing.length,
      missingPrompts: finalMissing,
      totalCount: this.queue.length
    });
  }

  /**
   * Mostra um botão flutuante na página para copiar prompts que falharam.
   * Aparece no canto inferior direito, estilizado e funcional.
   */
  showFailedPromptsButton(failedPrompts) {
    // Remover botão anterior se existir
    const existing = document.getElementById('ff-lab-failed-prompts-btn');
    if (existing) existing.remove();
    const existingPanel = document.getElementById('ff-lab-failed-panel');
    if (existingPanel) existingPanel.remove();

    if (failedPrompts.length === 0) {
      // Tudo completou com sucesso — mostrar mensagem de sucesso
      const successBanner = document.createElement('div');
      successBanner.id = 'ff-lab-failed-prompts-btn';
      successBanner.innerHTML = `
        <div style="
          position: fixed; bottom: 20px; right: 20px; z-index: 99999;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; padding: 12px 20px; border-radius: 12px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: all 0.3s ease;
        " onclick="this.parentElement.remove()">
          ✅ Todos os prompts gerados com sucesso!
          <span style="opacity: 0.7; font-size: 12px; margin-left: 8px;">✕</span>
        </div>`;
      document.body.appendChild(successBanner);
      setTimeout(() => successBanner.remove(), 10000);
      return;
    }

    // Criar botão flutuante
    const btn = document.createElement('div');
    btn.id = 'ff-lab-failed-prompts-btn';
    btn.innerHTML = `
      <div id="ff-lab-copy-trigger" style="
        position: fixed; bottom: 20px; right: 20px; z-index: 99999;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white; padding: 12px 20px; border-radius: 12px;
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
        cursor: pointer; display: flex; align-items: center; gap: 8px;
        transition: all 0.3s ease;
      ">
        📋 ${failedPrompts.length} prompt(s) com erro — Clique para copiar
      </div>`;
    document.body.appendChild(btn);

    // Criar painel expandido (oculto inicialmente)
    const panel = document.createElement('div');
    panel.id = 'ff-lab-failed-panel';
    panel.style.cssText = `
      position: fixed; bottom: 70px; right: 20px; z-index: 99999;
      background: #1a1a2e; color: #e0e0e0; border-radius: 16px;
      font-family: 'Inter', sans-serif; font-size: 13px;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
      max-height: 60vh; max-width: 500px; width: 90vw;
      overflow-y: auto; display: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    let panelHTML = `
      <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; font-size: 15px;">❌ Prompts com erro (${failedPrompts.length})</span>
        <div style="display: flex; gap: 8px;">
          <button id="ff-lab-copy-all-btn" style="
            background: #3b82f6; color: white; border: none; padding: 6px 14px;
            border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;
          ">📋 Copiar Todos</button>
          <button id="ff-lab-close-panel" style="
            background: #374151; color: white; border: none; padding: 6px 10px;
            border-radius: 8px; cursor: pointer; font-size: 12px;
          ">✕</button>
        </div>
      </div>`;

    for (const fp of failedPrompts) {
      const elementsStr = fp.elements.length > 0 ? `[${fp.elements.join(', ')}]` : 'Nenhum';
      const truncatedText = fp.text.length > 150 ? fp.text.substring(0, 150) + '...' : fp.text;

      panelHTML += `
        <div style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700; color: #f87171;">Prompt ${fp.number}</span>
            <span style="background: #7f1d1d; color: #fca5a5; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${fp.errorType}</span>
          </div>
          <div style="color: #9ca3af; font-size: 11px; margin-bottom: 4px;">Ingredientes: ${elementsStr}</div>
          <div style="color: #d1d5db; font-size: 12px; line-height: 1.4; background: #0f0f23; padding: 8px; border-radius: 6px; word-break: break-word;">${truncatedText}</div>
          <div style="color: #6b7280; font-size: 11px; margin-top: 4px;">Erro: ${fp.errorMessage}</div>
        </div>`;
    }

    panel.innerHTML = panelHTML;
    document.body.appendChild(panel);

    // Event listeners
    document.getElementById('ff-lab-copy-trigger').addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('ff-lab-close-panel').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    document.getElementById('ff-lab-copy-all-btn').addEventListener('click', () => {
      // Formatar prompts para clipboard
      let clipboardText = `=== PROMPTS COM ERRO (${failedPrompts.length}) ===\n\n`;

      for (const fp of failedPrompts) {
        const elementsStr = fp.elements.length > 0 ? `[${fp.elements.join(', ')}]` : '';
        clipboardText += `PROMPT ${fp.number} ${elementsStr}: ${fp.text}\n\n`;
      }

      navigator.clipboard.writeText(clipboardText).then(() => {
        const copyBtn = document.getElementById('ff-lab-copy-all-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copiado!';
        copyBtn.style.background = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = '#3b82f6';
        }, 2000);
      });
    });
  }
}

// ========== INSTÂNCIA GLOBAL ==========
const automation = new FFLabAutomation();
window.ffLabAutomation = automation;

// ========== LISTENER DE MENSAGENS ==========
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (chrome.runtime.lastError) {
    console.error('[Umbra Flow] Erro:', chrome.runtime.lastError);
    return true;
  }

  if (message.action === 'startAssetGeneration') {
    console.log(`[Umbra Flow] Recebida mensagem: startAssetGeneration (${message.assets.length} assets)`);
    automation.generateAssets(message.assets, message.imageModel, message.prompts, message.settings);
    sendResponse({ success: true });
  } else if (message.action === 'startAutomation') {
    console.log('[Umbra Flow] Recebida mensagem: startAutomation');
    automation.start(message.prompts, message.settings);
    sendResponse({ success: true });
  } else if (message.action === 'stopAutomation') {
    console.log('[Umbra Flow] Recebida mensagem: stopAutomation');
    automation.stop();
    sendResponse({ success: true });
  } else if (message.action === 'retryPrompts') {
    console.log(`[Umbra Flow] Recebida mensagem: retryPrompts (${message.prompts.length} prompts)`);
    automation.start(message.prompts, message.settings);
    sendResponse({ success: true });
  } else if (message.action === 'UPDATE_SPEED_CONFIG') {
    console.log('[Umbra Flow] Recebida mensagem: UPDATE_SPEED_CONFIG');
    // Atualizar CONFIG em tempo real
    if (message.config.delayBetweenPrompts) {
      CONFIG.delayBetweenPrompts = message.config.delayBetweenPrompts;
      console.log(`[Umbra Flow] ✓ Delay entre prompts atualizado: ${CONFIG.delayBetweenPrompts.min}-${CONFIG.delayBetweenPrompts.max}ms`);
    }
    if (message.config.checkInterval) {
      CONFIG.checkInterval = message.config.checkInterval;
      console.log(`[Umbra Flow] ✓ Check interval atualizado: ${CONFIG.checkInterval.min}-${CONFIG.checkInterval.max}ms`);
    }
    if (message.config.slotTimeout !== undefined) {
      CONFIG.slotTimeout = message.config.slotTimeout;
      console.log(`[Umbra Flow] ✓ Slot timeout atualizado: ${CONFIG.slotTimeout / 1000}s`);
    }
    if (message.config.maxRetries !== undefined) {
      CONFIG.maxRetries = message.config.maxRetries;
      console.log(`[Umbra Flow] ✓ Max retries atualizado: ${CONFIG.maxRetries}x`);
    }
    sendResponse({ success: true });
  }

  return true;
});
