/**
 * Umbra Flow - Background Service Worker v2.0
 * Sistema de download automatico com persistencia de estado
 * Integracao com Grok AI para auto-fix de prompts com erro de politica
 * CDP (Chrome Debugger Protocol) para cliques reais
 * Side Panel support
 */

// ========== SIDE PANEL SETUP ==========

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Set side panel options
chrome.sidePanel.setOptions({
  enabled: true
});

// Set panel behavior to open on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[Umbra Flow] Error setting panel behavior:', error));

const STORAGE_KEY = 'ff_lab_state';
const DEFAULT_DOWNLOAD_FOLDER = 'Umbra Flow Videos';
const MAX_HISTORY_SIZE = 500;

// Pasta de download atual (pode ser alterada pelo popup)
let currentDownloadFolder = DEFAULT_DOWNLOAD_FOLDER;

// Grok AI Configuration
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-4-1-fast-reasoning';

let grokConfig = {
  apiKey: '',
  autoFixEnabled: true
};

// ========== UMBRA LICENSE SDK v2.0 ==========
const LICENSE_API = 'https://cvrdcupvqvkpwllwlkfw.functions.supabase.co/validar-licenca';
const LICENSE_SLUG = 'umbrahub-all';
const LICENSE_VERSION = '2.0.0';
const HEARTBEAT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

async function getDeviceId() {
  const result = await chrome.storage.local.get('umbra_device_id');
  if (result.umbra_device_id) return result.umbra_device_id;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ umbra_device_id: id });
  return id;
}

async function checkLicenseStatus() {
  try {
    const data = await chrome.storage.local.get(['umbra_token', 'umbra_chave', 'umbra_expiry']);
    if (!data.umbra_token || !data.umbra_chave) return { valido: false, motivo: 'Nenhuma licenca ativada' };

    if (data.umbra_expiry && Date.now() < data.umbra_expiry) {
      return { valido: true };
    }

    const deviceId = await getDeviceId();
    const res = await fetch(LICENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        chave: data.umbra_chave,
        device_id: deviceId,
        token: data.umbra_token,
        slug: LICENSE_SLUG,
        version: LICENSE_VERSION
      })
    });
    const json = await res.json();
    if (json.valido) {
      const expiry = Date.now() + (json.duracao_segundos || 86400) * 1000;
      await chrome.storage.local.set({ umbra_expiry: expiry });
      return { valido: true };
    }
    await chrome.storage.local.remove(['umbra_token', 'umbra_chave', 'umbra_expiry']);
    return { valido: false, motivo: json.motivo || 'Licenca expirada ou revogada' };
  } catch (e) {
    const data = await chrome.storage.local.get('umbra_expiry');
    if (data.umbra_expiry && Date.now() < data.umbra_expiry) return { valido: true };
    return { valido: false, motivo: 'Erro de conexao. Verifique sua internet.' };
  }
}

async function activateLicense(chave) {
  try {
    const deviceId = await getDeviceId();
    const res = await fetch(LICENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'activate',
        chave: chave,
        device_id: deviceId,
        slug: LICENSE_SLUG,
        version: LICENSE_VERSION
      })
    });
    const json = await res.json();
    if (json.valido) {
      const expiry = Date.now() + (json.duracao_segundos || 86400) * 1000;
      await chrome.storage.local.set({
        umbra_chave: chave,
        umbra_token: json.token || 'active',
        umbra_expiry: expiry
      });
      return { valido: true };
    }
    return { valido: false, motivo: json.motivo || 'Chave invalida ou limite de dispositivos atingido.' };
  } catch (e) {
    return { valido: false, motivo: 'Erro de conexao. Tente novamente.' };
  }
}

// Heartbeat — verifica licença a cada 6h
setInterval(() => { checkLicenseStatus(); }, HEARTBEAT_INTERVAL_MS);

// Error tracking state
let errorTrackingState = {
  errors: [],
  fixQueue: [],
  fixedPrompts: []
};

// Estado global persistente
let globalState = {
  isRunning: false,
  prompts: [],
  completedCount: 0,
  errorCount: 0,
  downloadedFiles: [],
  missingPrompts: [],
  retryQueue: [],
  startTime: null,
  tabId: null,
  downloadFolder: DEFAULT_DOWNLOAD_FOLDER,
  settings: {
    batchSize: 4,
    promptDelay: 2,
    batchInterval: 0
  }
};

// Carregar estado ao iniciar
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await saveState();
  } else {
    await loadState();
  }
});

// Carregar estado quando o service worker acordar
// IMPORTANTE: Guardar a promise para que o handler de mensagens possa esperar
let stateLoadedPromise = loadState().then(() => {
  // Após carregar estado, verificar downloads em andamento que podem ter
  // sido perdidos quando o worker reiniciou
  recoverInProgressDownloads();
});
loadGrokConfig();

async function loadState() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY, 'ff_selectedFolder']);
    if (result[STORAGE_KEY]) {
      globalState = { ...globalState, ...result[STORAGE_KEY] };
      console.log('[Umbra Flow] Estado carregado:', globalState.completedCount, 'completos');
    }

    // Carregar pasta selecionada
    if (result.ff_selectedFolder) {
      const folderNum = result.ff_selectedFolder;
      const folderNames = {
        1: 'Umbra Flow Videos',
        2: 'Umbra Flow Videos (2)',
        3: 'Umbra Flow Videos (3)',
        4: 'Umbra Flow Videos (4)',
        5: 'Umbra Flow Videos (5)',
        6: 'Umbra Flow Videos (6)',
        7: 'Umbra Flow Videos (7)',
        8: 'Umbra Flow Videos (8)'
      };
      currentDownloadFolder = folderNames[folderNum] || DEFAULT_DOWNLOAD_FOLDER;
      console.log('[Umbra Flow] Pasta carregada:', currentDownloadFolder);
    }
  } catch (e) {
    console.error('[Umbra Flow] Erro ao carregar estado:', e);
  }
}

async function loadGrokConfig() {
  try {
    const result = await chrome.storage.local.get(['grok_api_key', 'grok_auto_fix_enabled']);
    if (result.grok_api_key) {
      grokConfig.apiKey = result.grok_api_key;
      console.log('[Umbra Flow] Grok API key carregada do storage');
    }
    if (result.grok_auto_fix_enabled !== undefined) {
      grokConfig.autoFixEnabled = result.grok_auto_fix_enabled;
    }
  } catch (e) {
    console.error('[Umbra Flow] Erro ao carregar config Grok:', e);
  }
}

async function saveState() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: globalState });
  } catch (e) {
    console.error('[Umbra Flow] Erro ao salvar estado:', e);
  }
}

/**
 * Recuperar downloads que completaram enquanto o service worker estava inativo.
 * Quando o worker reinicia, os listeners onChanged são perdidos, mas os downloads
 * continuam no Chrome. Esta função verifica downloads recentes e registra os que
 * completaram mas não estão rastreados em globalState.downloadedFiles.
 */
async function recoverInProgressDownloads() {
  if (!globalState.isRunning && globalState.downloadedFiles.length === 0) return;

  try {
    // Buscar downloads recentes (últimas 2 horas) que são da extensão
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const downloads = await chrome.downloads.search({
      startedAfter: twoHoursAgo.toISOString(),
      state: 'complete',
      filenameRegex: '.*Prompt \\d{3}.*\\.mp4$'
    });

    if (downloads.length === 0) return;

    const trackedIds = new Set(globalState.downloadedFiles.map(f => f.downloadId));
    let recovered = 0;

    for (const dl of downloads) {
      if (trackedIds.has(dl.id)) continue;

      // Extrair número do prompt do nome do arquivo
      const match = dl.filename.match(/Prompt (\d{3})/);
      if (!match) continue;

      const promptNumber = parseInt(match[1], 10);

      // Verificar se este prompt está na lista de prompts ativos
      const promptExists = globalState.prompts.some(p => p.number === promptNumber);
      if (!promptExists && globalState.prompts.length > 0) continue;

      globalState.downloadedFiles.push({
        promptNumber,
        filename: dl.filename.split('/').pop().split('\\').pop(),
        downloadId: dl.id,
        timestamp: dl.endTime ? new Date(dl.endTime).getTime() : Date.now(),
        recovered: true
      });
      recovered++;
    }

    if (recovered > 0) {
      saveState();
      console.log(`[Umbra Flow] ✅ ${recovered} download(s) recuperado(s) após reinício do worker`);
    }
  } catch (e) {
    console.error('[Umbra Flow] Erro ao recuperar downloads:', e);
  }
}

// Sanitiza texto para nome de arquivo
function sanitizeFilename(text, maxLength = 80) {
  if (!text) return null;

  let clean = text
    .replace(/PROMPT\s*\d+\s*:?\s*/gi, '')  // Remove "PROMPT X:"
    .replace(/\[[0-9,\s]+\]\s*/g, '')        // Remove "[1, 2]"
    .replace(/[<>:"/\\|?*]/g, '')            // Caracteres proibidos Windows
    .replace(/[\x00-\x1f]/g, '')             // Caracteres de controle
    .replace(/\s+/g, ' ')                    // MÃºltiplos espaÃ§os
    .trim();

  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength).trim();
  }

  return clean || null;
}

// Download do video
async function downloadVideo(url, promptNumber, promptText, customFolder = null) {
  // Verificar se URL ja foi baixada
  const history = await getDownloadHistory();
  if (history.includes(url)) {
    console.log('[Umbra Flow] URL ja processada, pulando');
    return { success: false, reason: 'duplicate' };
  }

  // Marcar como processada
  await addToDownloadHistory(url);

  // Usar pasta customizada ou a atual
  const folder = customFolder || currentDownloadFolder || globalState.downloadFolder || DEFAULT_DOWNLOAD_FOLDER;

  // Criar nome do arquivo
  const paddedNumber = String(promptNumber).padStart(3, '0');
  const sanitizedPrompt = sanitizeFilename(promptText);
  const baseName = `Prompt ${paddedNumber} - ${sanitizedPrompt || 'Video'}`;
  const filename = `${folder}/${baseName}.mp4`;

  console.log(`[Umbra Flow] Baixando para pasta: ${folder}`);
  console.log(`[Umbra Flow] Arquivo: ${filename}`);

  return new Promise((resolve) => {
    // Timeout de segurança: se download não completar em 120s, reportar erro
    let resolved = false;
    const downloadTimeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      // Tentar remover listener se existir
      try { chrome.downloads.onChanged.removeListener(onDownloadChanged); } catch (e) { }
      console.error(`[Umbra Flow] ⏳ Download timeout para Prompt ${promptNumber} (120s)`);
      removeFromDownloadHistory(url);
      resolve({ success: false, error: 'Download timeout (120s)' });
    }, 120000);

    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        resolved = true;
        clearTimeout(downloadTimeout);
        console.error('[Umbra Flow] Erro no download:', chrome.runtime.lastError);
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      console.log(`[Umbra Flow] Download iniciado: ${filename} (ID: ${downloadId}). Aguardando conclusão...`);

      // Listener para verificar quando o download REALMENTE completa
      function onDownloadChanged(delta) {
        if (delta.id !== downloadId || resolved) return;

        // Download completou com sucesso
        if (delta.state && delta.state.current === 'complete') {
          resolved = true;
          chrome.downloads.onChanged.removeListener(onDownloadChanged);
          clearTimeout(downloadTimeout);

          console.log(`[Umbra Flow] ✅ Download CONCLUÍDO: ${filename} (ID: ${downloadId})`);

          // SÓ registrar como baixado APÓS confirmar que o arquivo foi salvo
          globalState.downloadedFiles.push({
            promptNumber,
            filename: baseName,
            downloadId,
            timestamp: Date.now()
          });
          saveState();

          resolve({ success: true, downloadId, filename });
        }

        // Download falhou ou foi interrompido
        if (delta.state && delta.state.current === 'interrupted') {
          resolved = true;
          chrome.downloads.onChanged.removeListener(onDownloadChanged);
          clearTimeout(downloadTimeout);

          const errorMsg = delta.error ? delta.error.current : 'Download interrompido';
          console.error(`[Umbra Flow] ❌ Download FALHOU: ${filename} (ID: ${downloadId}) - ${errorMsg}`);

          // Remover URL do histórico para permitir re-download
          removeFromDownloadHistory(url);
          resolve({ success: false, error: errorMsg, downloadId });
        }

        // Download foi cancelado
        if (delta.state && delta.state.current === 'cancelled') {
          resolved = true;
          chrome.downloads.onChanged.removeListener(onDownloadChanged);
          clearTimeout(downloadTimeout);

          console.error(`[Umbra Flow] ❌ Download CANCELADO: ${filename} (ID: ${downloadId})`);
          removeFromDownloadHistory(url);
          resolve({ success: false, error: 'Download cancelado', downloadId });
        }
      }

      chrome.downloads.onChanged.addListener(onDownloadChanged);
    });
  });
}

// Remover URL do histórico de downloads (para re-download quando falha)
async function removeFromDownloadHistory(url) {
  let history = await getDownloadHistory();
  history = history.filter(u => u !== url);
  await chrome.storage.local.set({ ff_download_history: history });
}

// HistÃ³rico de downloads
async function getDownloadHistory() {
  const result = await chrome.storage.local.get('ff_download_history');
  return result.ff_download_history || [];
}

async function addToDownloadHistory(url) {
  let history = await getDownloadHistory();
  history.push(url);

  if (history.length > MAX_HISTORY_SIZE) {
    history = history.slice(-MAX_HISTORY_SIZE);
  }

  await chrome.storage.local.set({ ff_download_history: history });
}

// Verificar prompts faltantes comparando com downloads
function checkMissingPrompts() {
  if (!globalState.prompts || globalState.prompts.length === 0) {
    return [];
  }

  const downloadedNumbers = new Set(
    globalState.downloadedFiles.map(f => f.promptNumber)
  );

  const missing = globalState.prompts
    .filter(p => !downloadedNumbers.has(p.number))
    .map(p => p.number);

  globalState.missingPrompts = missing;
  saveState();

  return missing;
}

/**
 * Verifica downloads REAIS no disco via chrome.downloads.search().
 * Similar ao check_missing.py — consulta o histórico do Chrome para
 * encontrar arquivos "Prompt XXX" na pasta da sessão.
 *
 * @param {string} folder - Pasta de download da sessão (ex: "Umbra Flow/Job-05")
 * @param {number[]} expectedNumbers - Lista de números de prompt esperados
 * @returns {Promise<{downloaded: Map, missing: number[], duplicates: Array}>}
 */
async function checkDownloadsOnDisk(folder, expectedNumbers) {
  return new Promise((resolve) => {
    // Buscar todos os downloads completos que contêm "Prompt" no nome
    chrome.downloads.search({
      state: 'complete',
      orderBy: ['-startTime'],
      maxResults: 5000
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('[Umbra Flow] Erro ao buscar downloads:', chrome.runtime.lastError);
        resolve({ downloaded: new Map(), missing: [...expectedNumbers], duplicates: [] });
        return;
      }

      // Filtrar apenas downloads na pasta correta
      const folderNorm = folder ? folder.replace(/\\/g, '/').toLowerCase() : '';
      const promptPattern = /Prompt\s+(\d+)/i;

      // Map: promptNumber -> [downloadInfo, ...]
      const downloaded = new Map();

      for (const dl of results) {
        if (!dl.filename) continue;
        const fnNorm = dl.filename.replace(/\\/g, '/').toLowerCase();

        // Verificar se está na pasta correta (se folder especificada)
        if (folderNorm && !fnNorm.includes(folderNorm)) continue;

        // Verificar se é um arquivo de prompt
        const match = dl.filename.match(promptPattern);
        if (!match) continue;

        const num = parseInt(match[1]);
        if (!downloaded.has(num)) downloaded.set(num, []);
        downloaded.get(num).push({
          id: dl.id,
          filename: dl.filename,
          fileSize: dl.fileSize || dl.totalBytes || 0,
          startTime: dl.startTime
        });
      }

      // Calcular faltantes
      const missing = expectedNumbers.filter(n => !downloaded.has(n)).sort((a, b) => a - b);

      // Calcular duplicados
      const duplicates = [];
      for (const [num, files] of downloaded) {
        if (files.length > 1) {
          duplicates.push({ num, count: files.length, files });
        }
      }

      console.log(`[Umbra Flow] 📊 Verificação de downloads:`);
      console.log(`[Umbra Flow]   Esperados: ${expectedNumbers.length}`);
      console.log(`[Umbra Flow]   Encontrados: ${downloaded.size}`);
      console.log(`[Umbra Flow]   Faltantes: ${missing.length}${missing.length > 0 ? ' → [' + missing.join(', ') + ']' : ''}`);
      console.log(`[Umbra Flow]   Duplicados: ${duplicates.length}`);

      resolve({ downloaded, missing, duplicates });
    });
  });
}

/**
 * Remove downloads duplicados mantendo o menor arquivo (como check_missing.py).
 * Usa chrome.downloads.removeFile() para deletar do disco e erase() para limpar histórico.
 *
 * @param {Array} duplicates - Array de {num, count, files}
 * @returns {Promise<{deleted: number, errors: number}>}
 */
async function removeDuplicateDownloads(duplicates) {
  let deleted = 0;
  let errors = 0;

  for (const { num, files } of duplicates) {
    // Ordenar por tamanho (menor primeiro) — manter o menor, como check_missing.py
    files.sort((a, b) => a.fileSize - b.fileSize);
    const keep = files[0];
    const toDelete = files.slice(1);

    console.log(`[Umbra Flow] 🗑️ Prompt ${num}: ${files.length} cópias, mantendo ${keep.filename.split('/').pop()} (${formatFileSize(keep.fileSize)})`);

    for (const dl of toDelete) {
      try {
        // Deletar arquivo do disco
        await new Promise((resolve, reject) => {
          chrome.downloads.removeFile(dl.id, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });

        // Remover do histórico do Chrome
        await new Promise((resolve) => {
          chrome.downloads.erase({ id: dl.id }, () => resolve());
        });

        console.log(`[Umbra Flow]   ❌ Deletado: ${dl.filename.split('/').pop()} (${formatFileSize(dl.fileSize)})`);
        deleted++;
      } catch (err) {
        console.error(`[Umbra Flow]   ⚠️ Erro ao deletar ${dl.filename}:`, err);
        errors++;
      }
    }
  }

  console.log(`[Umbra Flow] 🗑️ Limpeza concluída: ${deleted} deletados, ${errors} erros`);
  return { deleted, errors };
}

function formatFileSize(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Notificar popup sobre atualizaÃ§Ãµes
function notifyPopup(type, data) {
  chrome.runtime.sendMessage({ type, ...data }).catch(() => {
    // Popup pode estar fechado, ignorar erro
  });
}

/**
 * Corrigir prompt com Grok AI quando Flow rejeita por polÃ­tica.
 * Envia o prompt original + mensagem de erro para o Grok,
 * que reescreve removendo conteÃºdo problemÃ¡tico.
 */
async function fixPromptWithGrok(promptNumber, originalPrompt, errorMessage) {
  if (!grokConfig.apiKey) {
    return { success: false, error: 'API key nÃ£o configurada' };
  }

  console.log(`[Umbra Flow] Grok: corrigindo prompt ${promptNumber}...`);

  const systemMessage = `You are a prompt rewriting assistant for an AI video generation tool (Google Flow/Veo).
The user's prompt was rejected by the AI. Your job is to rewrite it so it passes content filters while keeping the same cinematic intent.

RULES:
1. If the error mentions "prominent people" or "real person": Replace ALL real person names with fictional character names. Keep the same physical description and personality.
   Example: "Robert Owen" â†’ "Thomas Hartwell" 
2. If the error mentions "harmful content": Remove or soften any violent, disturbing, or explicit content.
3. If the error mentions "third party" or "copyrighted": Remove brand names, copyrighted references. Replace with generic equivalents.
   Example: "ARRI Alexa 65" â†’ "professional cinema camera"
4. Keep the exact same visual style, camera angles, lighting, and scene description.
5. Keep the [N] bracket references exactly as they are (e.g. [2], [10]). These are ingredient references and must NOT be changed.
6. Return ONLY the corrected prompt text, nothing else. No explanations, no quotes.`;

  const userMessage = `Error from AI: "${errorMessage}"

Original prompt that was rejected:
${originalPrompt}

Please rewrite this prompt to avoid the policy violation while keeping the same cinematic scene.`;

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokConfig.apiKey}`
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Umbra Flow] Grok API error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const fixedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!fixedPrompt) {
      return { success: false, error: 'Resposta vazia do Grok' };
    }

    console.log(`[Umbra Flow] Grok: prompt ${promptNumber} corrigido com sucesso`);

    // Salvar no histÃ³rico
    errorTrackingState.fixedPrompts.push({
      promptNumber,
      originalPrompt,
      fixedPrompt,
      errorMessage,
      timestamp: Date.now()
    });

    return { success: true, fixedPrompt };
  } catch (error) {
    console.error('[Umbra Flow] Grok fetch error:', error);
    return { success: false, error: error.message };
  }
}

// ========== REAL CLICK VIA CDP (trusted mouse event) ==========

let _debuggerTabId = null;

async function ensureDebuggerAttached(tabId) {
  if (_debuggerTabId === tabId) return true;
  if (_debuggerTabId !== null) {
    await chrome.debugger.detach({ tabId: _debuggerTabId }).catch(() => {});
    _debuggerTabId = null;
  }
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    _debuggerTabId = tabId;
    return true;
  } catch(e) {
    if ((e.message || '').includes('already attached')) {
      _debuggerTabId = tabId;
      return true;
    }
    console.error('[Umbra Flow] Falha ao attach debugger:', e.message);
    return false;
  }
}

async function detachDebugger() {
  if (_debuggerTabId !== null) {
    await chrome.debugger.detach({ tabId: _debuggerTabId }).catch(() => {});
    _debuggerTabId = null;
  }
}

async function realClick(tabId, x, y) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url?.includes('labs.google')) {
      return { success: false, error: 'realClick restrito a labs.google' };
    }
  } catch(e) {
    return { success: false, error: 'Nao foi possivel verificar URL da aba' };
  }

  const attached = await ensureDebuggerAttached(tabId);
  if (!attached) return { success: false, error: 'Falha ao conectar debugger' };

  const target = { tabId };
  try {
    const base = { x, y, button: 'left', buttons: 1, clickCount: 1, modifiers: 0 };
    await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { ...base, type: 'mousePressed' });
    await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' });
    return { success: true };
  } catch(err) {
    if (_debuggerTabId === tabId) _debuggerTabId = null;
    return { success: false, error: err.message };
  }
}

// Listener de mensagens
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // CDP handlers diretos (antes do stateLoaded check)
  if (msg.action === 'realClick') {
    realClick(sender.tab.id, msg.x, msg.y).then(sendResponse);
    return true;
  }
  if (msg.action === 'attachDebugger') {
    ensureDebuggerAttached(msg.tabId).then(ok => sendResponse({ success: ok }));
    return true;
  }
  if (msg.action === 'detachDebugger') {
    detachDebugger().then(() => sendResponse({ success: true }));
    return true;
  }

  // ========== LICENSE SDK HANDLERS ==========
  if (msg.action === 'GET_STATUS') {
    checkLicenseStatus().then(sendResponse);
    return true;
  }
  if (msg.action === 'ACTIVATE') {
    activateLicense(msg.chave).then(sendResponse);
    return true;
  }

  // Garantir que o estado foi carregado antes de processar qualquer mensagem
  // Isso evita race condition onde mensagens chegam antes de loadState() completar
  // (causa do bug X/0 no progress)
  if (stateLoadedPromise) {
    stateLoadedPromise.then(() => {
      stateLoadedPromise = null; // Só precisa esperar uma vez
      processMessage(msg, sender, sendResponse);
    });
    return true; // Manter canal aberto para sendResponse assíncrono
  }

  return processMessage(msg, sender, sendResponse);
});

function processMessage(msg, sender, sendResponse) {

  // Definir pasta de download
  if (msg.action === 'SET_DOWNLOAD_FOLDER') {
    currentDownloadFolder = msg.folder || DEFAULT_DOWNLOAD_FOLDER;
    globalState.downloadFolder = currentDownloadFolder;
    saveState();
    console.log(`[Umbra Flow] Pasta de download alterada para: ${currentDownloadFolder}`);
    sendResponse({ success: true, folder: currentDownloadFolder });
    return true;
  }

  // Obter pasta de download atual
  if (msg.action === 'GET_DOWNLOAD_FOLDER') {
    sendResponse({ folder: currentDownloadFolder || globalState.downloadFolder || DEFAULT_DOWNLOAD_FOLDER });
    return true;
  }

  // Download de video
  if (msg.action === 'downloadVideo') {
    const folder = msg.folder || currentDownloadFolder;
    downloadVideo(msg.url, msg.promptNumber, msg.promptText, folder)
      .then(result => {
        // Atualizar contadores
        if (result.success) {
          globalState.completedCount++;
        } else if (result.reason !== 'duplicate') {
          globalState.errorCount++;
        }
        saveState();

        // Notificar popup
        notifyPopup('DOWNLOAD_COMPLETE', {
          promptNumber: msg.promptNumber,
          success: result.success,
          completedCount: globalState.completedCount,
          totalCount: globalState.prompts.length
        });

        sendResponse(result);
      });
    return true;
  }

  // Obter estado atual
  if (msg.action === 'GET_STATE') {
    const missing = checkMissingPrompts();
    sendResponse({
      ...globalState,
      missingPrompts: missing
    });
    return true;
  }

  // Iniciar automacao
  if (msg.action === 'START_AUTOMATION') {
    // Atualizar pasta se fornecida nas settings
    if (msg.settings && msg.settings.downloadFolder) {
      currentDownloadFolder = msg.settings.downloadFolder;
    }

    globalState.isRunning = true;
    globalState.prompts = msg.prompts;
    globalState.settings = msg.settings;
    globalState.downloadFolder = currentDownloadFolder;
    globalState.completedCount = 0;
    globalState.errorCount = 0;
    globalState.downloadedFiles = [];
    globalState.missingPrompts = [];
    globalState.retryQueue = [];
    globalState.startTime = Date.now();
    globalState.tabId = msg.tabId;
    saveState();

    console.log(`[Umbra Flow] Automacao iniciada. Pasta: ${currentDownloadFolder}`);
    sendResponse({ success: true });
    return true;
  }

  // Parar automaÃ§Ã£o
  if (msg.action === 'STOP_AUTOMATION') {
    globalState.isRunning = false;
    const missing = checkMissingPrompts();
    saveState();
    sendResponse({
      success: true,
      missingPrompts: missing,
      completedCount: globalState.completedCount,
      totalCount: globalState.prompts.length
    });
    return true;
  }

  // Atualizar progresso
  if (msg.action === 'UPDATE_PROGRESS') {
    globalState.completedCount = (msg.completedCount !== undefined) ? msg.completedCount : globalState.completedCount;
    globalState.errorCount = (msg.errorCount !== undefined) ? msg.errorCount : globalState.errorCount;
    if (msg.promptStatus) {
      const prompt = globalState.prompts.find(p => p.number === msg.promptStatus.number);
      if (prompt) {
        prompt.status = msg.promptStatus.status;
      }
    }
    saveState();
    sendResponse({ success: true });
    return true;
  }

  // Finalizar automaÃ§Ã£o
  if (msg.action === 'FINISH_AUTOMATION') {
    globalState.isRunning = false;

    // Usar verificação REAL no disco se temos folder
    const folder = currentDownloadFolder || globalState.downloadFolder;
    const expectedNumbers = (globalState.prompts || []).map(p => p.number);

    if (folder && expectedNumbers.length > 0) {
      // Verificação REAL via chrome.downloads.search()
      checkDownloadsOnDisk(folder, expectedNumbers).then(async (result) => {
        const { missing, duplicates } = result;

        // Auto-remover duplicados
        if (duplicates.length > 0) {
          console.log(`[Umbra Flow] 🗑️ Removendo ${duplicates.length} duplicados automaticamente...`);
          await removeDuplicateDownloads(duplicates);
        }

        // Armazenar prompts com falha
        if (msg.failedPrompts && msg.failedPrompts.length > 0) {
          globalState.failedPrompts = msg.failedPrompts;
          chrome.storage.local.set({ ff_failed_prompts: msg.failedPrompts });
        }

        globalState.missingPrompts = missing;
        saveState();

        if (missing.length > 0 && globalState.retryQueue.length === 0) {
          globalState.retryQueue = [...missing];
          saveState();

          sendResponse({
            success: true,
            status: 'needs_retry',
            missingPrompts: missing,
            duplicatesRemoved: duplicates.length,
            completedCount: expectedNumbers.length - missing.length,
            totalCount: expectedNumbers.length
          });
        } else {
          sendResponse({
            success: true,
            status: missing.length === 0 ? 'completed' : 'needs_retry',
            missingPrompts: missing,
            duplicatesRemoved: duplicates.length,
            completedCount: expectedNumbers.length - missing.length,
            totalCount: expectedNumbers.length
          });
        }
      });
    } else {
      // Fallback: verificação por memória
      const missing = checkMissingPrompts();
      if (msg.failedPrompts && msg.failedPrompts.length > 0) {
        globalState.failedPrompts = msg.failedPrompts;
        chrome.storage.local.set({ ff_failed_prompts: msg.failedPrompts });
      }

      if (missing.length > 0 && globalState.retryQueue.length === 0) {
        globalState.retryQueue = [...missing];
        saveState();
        sendResponse({
          success: true,
          status: 'needs_retry',
          missingPrompts: missing,
          completedCount: globalState.completedCount,
          totalCount: globalState.prompts.length
        });
      } else {
        saveState();
        sendResponse({
          success: true,
          status: 'completed',
          missingPrompts: missing,
          completedCount: globalState.completedCount,
          totalCount: globalState.prompts.length
        });
      }
    }
    return true;
  }

  // Verificar downloads no disco (chamado manualmente ou pelo content.js)
  if (msg.action === 'CHECK_DOWNLOADS_ON_DISK') {
    const folder = msg.folder || currentDownloadFolder || globalState.downloadFolder;
    const expectedNumbers = msg.expectedNumbers || (globalState.prompts || []).map(p => p.number);

    checkDownloadsOnDisk(folder, expectedNumbers).then((result) => {
      sendResponse({
        success: true,
        missing: result.missing,
        duplicates: result.duplicates.map(d => ({ num: d.num, count: d.count })),
        downloadedCount: result.downloaded.size,
        totalExpected: expectedNumbers.length
      });
    });
    return true;
  }

  // Remover duplicados automaticamente
  if (msg.action === 'FIX_DUPLICATE_DOWNLOADS') {
    const folder = msg.folder || currentDownloadFolder || globalState.downloadFolder;
    const expectedNumbers = msg.expectedNumbers || (globalState.prompts || []).map(p => p.number);

    checkDownloadsOnDisk(folder, expectedNumbers).then(async (result) => {
      if (result.duplicates.length > 0) {
        const cleanResult = await removeDuplicateDownloads(result.duplicates);
        sendResponse({
          success: true,
          deleted: cleanResult.deleted,
          errors: cleanResult.errors,
          remainingMissing: result.missing
        });
      } else {
        sendResponse({
          success: true,
          deleted: 0,
          errors: 0,
          remainingMissing: result.missing
        });
      }
    });
    return true;
  }

  // Notificação do recovery loop (sem re-verificação para evitar loop infinito)
  if (msg.action === 'RECOVERY_COMPLETE') {
    globalState.isRunning = false;
    globalState.missingPrompts = msg.missingPrompts || [];
    console.log(`[Umbra Flow] 📊 Recovery complete: ${msg.status}, ${msg.missingCount || 0} faltantes de ${msg.totalCount}`);
    saveState();
    sendResponse({ success: true });
    return true;
  }

  // Obter prompts com falha (para sidepanel/popup)
  if (msg.action === 'GET_FAILED_PROMPTS') {
    chrome.storage.local.get('ff_failed_prompts', (result) => {
      sendResponse({ failedPrompts: result.ff_failed_prompts || [] });
    });
    return true;
  }

  // Obter prompts para retry
  if (msg.action === 'GET_RETRY_PROMPTS') {
    const retryPrompts = globalState.prompts.filter(
      p => globalState.retryQueue.includes(p.number)
    );
    sendResponse({ prompts: retryPrompts });
    return true;
  }

  // Limpar retry queue (apÃ³s retry)
  if (msg.action === 'CLEAR_RETRY_QUEUE') {
    globalState.retryQueue = [];
    saveState();
    sendResponse({ success: true });
    return true;
  }

  // Reset completo
  if (msg.action === 'RESET_STATE') {
    globalState = {
      isRunning: false,
      prompts: [],
      completedCount: 0,
      errorCount: 0,
      downloadedFiles: [],
      missingPrompts: [],
      retryQueue: [],
      startTime: null,
      tabId: null,
      downloadFolder: currentDownloadFolder,
      settings: {
        batchSize: 4,
        promptDelay: 2,
        batchInterval: 0
      }
    };
    saveState();
    // Limpar também os prompts com falha persistidos
    chrome.storage.local.remove('ff_failed_prompts');
    sendResponse({ success: true });
    return true;
  }

  // Limpar histÃ³rico de downloads
  if (msg.action === 'CLEAR_DOWNLOAD_HISTORY') {
    chrome.storage.local.set({ ff_download_history: [] });
    sendResponse({ success: true });
    return true;
  }

  // ========== GROK AI HANDLERS ==========

  // Definir API key do Grok
  if (msg.action === 'SET_GROK_API_KEY') {
    grokConfig.apiKey = msg.apiKey;
    chrome.storage.local.set({ grok_api_key: msg.apiKey });
    console.log('[Umbra Flow] Grok API key atualizada');
    sendResponse({ success: true });
    return true;
  }

  // Definir auto-fix do Grok
  if (msg.action === 'SET_GROK_AUTO_FIX') {
    grokConfig.autoFixEnabled = msg.enabled;
    chrome.storage.local.set({ grok_auto_fix_enabled: msg.enabled });
    console.log('[Umbra Flow] Grok auto-fix:', msg.enabled);
    sendResponse({ success: true });
    return true;
  }

  // Corrigir prompt com Grok
  if (msg.action === 'FIX_PROMPT_WITH_GROK') {
    fixPromptWithGrok(msg.promptNumber, msg.originalPrompt, msg.errorMessage, msg.attemptNumber || 1, msg.errorType || 'policy')
      .then(result => {
        // Notificar popup sobre resultado
        notifyPopup('GROK_FIX_RESULT', {
          promptNumber: msg.promptNumber,
          success: result.success,
          fixedPrompt: result.fixedPrompt,
          error: result.error
        });
        sendResponse(result);
      })
      .catch(error => {
        notifyPopup('GROK_FIX_RESULT', {
          promptNumber: msg.promptNumber,
          success: false,
          error: error.message
        });
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // Obter status do Grok
  if (msg.action === 'GET_GROK_STATUS') {
    sendResponse({
      configured: !!grokConfig.apiKey,
      autoFixEnabled: grokConfig.autoFixEnabled
    });
    return true;
  }

  // Registrar erro de prompt (para tracking)
  if (msg.action === 'REGISTER_PROMPT_ERROR') {
    errorTrackingState.errors.push({
      promptNumber: msg.promptNumber,
      errorType: msg.errorType,
      errorMessage: msg.errorMessage,
      originalPrompt: msg.originalPrompt,
      timestamp: Date.now()
    });

    // Se for erro de polÃ­tica e auto-fix estÃ¡ habilitado, adicionar Ã  fila
    if (msg.errorType === 'policy' && grokConfig.autoFixEnabled && grokConfig.apiKey) {
      errorTrackingState.fixQueue.push({
        promptNumber: msg.promptNumber,
        originalPrompt: msg.originalPrompt,
        errorMessage: msg.errorMessage,
        status: 'pending'
      });
    }

    // Notificar popup
    notifyPopup('PROMPT_ERROR', {
      promptNumber: msg.promptNumber,
      errorType: msg.errorType,
      errorMessage: msg.errorMessage,
      originalPrompt: msg.originalPrompt
    });

    sendResponse({ success: true });
    return true;
  }

  // Obter fila de fix
  if (msg.action === 'GET_FIX_QUEUE') {
    sendResponse({
      queue: errorTrackingState.fixQueue,
      errors: errorTrackingState.errors,
      fixedPrompts: errorTrackingState.fixedPrompts
    });
    return true;
  }

  // Limpar estado de erros
  if (msg.action === 'CLEAR_ERROR_STATE') {
    errorTrackingState = {
      errors: [],
      fixQueue: [],
      fixedPrompts: []
    };
    sendResponse({ success: true });
    return true;
  }

  // ========== SERVER STATUS HANDLERS ==========

  // Obter status do servidor
  if (msg.action === 'GET_SERVER_STATUS') {
    sendResponse({
      connected: serverState.connected,
      layer: serverState.currentLayer,
      assignedFolder: serverState.assignedFolder,
      folderName: serverState.folderName
    });
    return true;
  }

  // Conectar ao servidor
  if (msg.action === 'CONNECT_SERVER') {
    connectWebSocket();
    sendResponse({ success: true });
    return true;
  }

  // Desconectar do servidor
  if (msg.action === 'DISCONNECT_SERVER') {
    disconnectWebSocket();
    sendResponse({ success: true });
    return true;
  }
}

// ========== PYTHON SERVER WEBSOCKET ==========

const WEBSOCKET_URL = 'ws://localhost:8765';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

let serverState = {
  connected: false,
  wasConnected: false, // Track if we were ever connected (to know when to show errors)
  currentLayer: 'MODO DIRETO',
  websocket: null,
  reconnectAttempt: 0,
  reconnectTimeout: null,
  pingInterval: null, // Keepalive ping interval
  assignedFolder: null, // Folder assigned by server (1-8)
  folderName: null // Folder name assigned by server
};

function connectWebSocket(silent = false) {
  if (serverState.websocket && serverState.websocket.readyState === WebSocket.OPEN) {
    if (!silent) console.log('[Umbra Flow] WebSocket already connected');
    return;
  }

  try {
    if (!silent) console.log('[Umbra Flow] Connecting to Python server...');
    serverState.websocket = new WebSocket(WEBSOCKET_URL);

    serverState.websocket.onopen = () => {
      console.log('[Umbra Flow] WebSocket connected');
      serverState.connected = true;
      serverState.wasConnected = true; // Mark that we successfully connected once
      serverState.reconnectAttempt = 0;
      serverState.currentLayer = 'LAYER 1 (DOM)';

      // Register with server (for multi-profile support)
      // Get Chrome profile name from user data dir or use extension ID as unique identifier
      const extensionId = chrome.runtime.id;
      // Profile name will be detected by server based on connection
      // For now use extension ID which is unique per profile
      sendToServer({
        type: 'REGISTER',
        profileName: `Profile_${extensionId.substring(0, 8)}`,
        extensionId: extensionId
      });

      // Notify popup
      notifyPopup('SERVER_STATUS', {
        connected: true,
        layer: serverState.currentLayer
      });

      // Start keepalive ping every 20 seconds to prevent timeout
      if (serverState.pingInterval) {
        clearInterval(serverState.pingInterval);
      }
      serverState.pingInterval = setInterval(() => {
        if (serverState.websocket && serverState.websocket.readyState === WebSocket.OPEN) {
          sendToServer({ type: 'PING', timestamp: Date.now() });
        }
      }, 20000);
    };

    serverState.websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (e) {
        console.error('[Umbra Flow] Error parsing server message:', e);
      }
    };

    serverState.websocket.onclose = (event) => {
      // Only log if it was previously connected (not initial connection failure)
      if (serverState.connected) {
        console.log('[Umbra Flow] WebSocket closed:', event.code, event.reason);
      }
      serverState.connected = false;
      serverState.currentLayer = 'MODO DIRETO';

      // Notify popup
      notifyPopup('SERVER_STATUS', {
        connected: false,
        layer: 'MODO DIRETO'
      });

      // Only attempt reconnection if it was previously connected and not intentionally closed
      if (serverState.wasConnected && event.code !== 1000) {
        scheduleReconnect();
      }
    };

    serverState.websocket.onerror = (error) => {
      // Silently handle connection refused errors - server may be intentionally off
      // Only log if we were previously connected
      if (serverState.wasConnected) {
        console.log('[Umbra Flow] WebSocket connection lost');
      }
    };

  } catch (e) {
    // Silent fail - server not running is expected
    serverState.connected = false;
  }
}

function disconnectWebSocket() {
  // Clear keepalive ping
  if (serverState.pingInterval) {
    clearInterval(serverState.pingInterval);
    serverState.pingInterval = null;
  }

  if (serverState.reconnectTimeout) {
    clearTimeout(serverState.reconnectTimeout);
    serverState.reconnectTimeout = null;
  }

  if (serverState.websocket) {
    serverState.websocket.close(1000, 'User disconnected');
    serverState.websocket = null;
  }

  serverState.connected = false;
  serverState.currentLayer = 'MODO DIRETO';
  serverState.reconnectAttempt = 0;

  console.log('[Umbra Flow] Disconnected from Python server');
}

function scheduleReconnect() {
  if (serverState.reconnectAttempt >= RECONNECT_DELAYS.length) {
    console.log('[Umbra Flow] Max reconnection attempts reached');
    return;
  }

  const delay = RECONNECT_DELAYS[serverState.reconnectAttempt];
  console.log(`[Umbra Flow] Reconnecting in ${delay}ms (attempt ${serverState.reconnectAttempt + 1})`);

  serverState.reconnectTimeout = setTimeout(() => {
    serverState.reconnectAttempt++;
    connectWebSocket();
  }, delay);
}

function handleServerMessage(message) {
  console.log('[Umbra Flow] Server message:', message);

  switch (message.type) {
    case 'CONNECTION_STATUS':
      // CRITICAL: Set connected state when server confirms connection
      serverState.connected = true;
      serverState.wasConnected = true;

      // Notify sidepanel immediately about connection status
      notifyPopup('SERVER_STATUS', {
        connected: true,
        layer: serverState.currentLayer,
        assignedFolder: serverState.assignedFolder,
        folderName: serverState.folderName
      });

      // Handle initial connection with folder assignment
      if (message.assignedFolder) {
        serverState.assignedFolder = message.assignedFolder;
        serverState.folderName = message.folderName;
        currentDownloadFolder = message.folderName;
        globalState.downloadFolder = message.folderName;
        saveState();

        console.log(`[Umbra Flow] Folder assigned by server: ${message.assignedFolder} (${message.folderName})`);

        // Notify sidepanel about folder assignment
        notifyPopup('FOLDER_ASSIGNED', {
          folder: message.assignedFolder,
          folderName: message.folderName,
          autoAssigned: true
        });
      }
      break;

    case 'LAYER_UPDATE':
      serverState.currentLayer = message.layer;
      notifyPopup('SERVER_STATUS', {
        connected: true,
        layer: message.layer
      });
      break;

    case 'VERIFICATION_RESULT':
      // Handle verification results from Python server
      // This will be used when robust mode is active
      if (message.tabId) {
        chrome.tabs.sendMessage(message.tabId, {
          type: 'VERIFICATION_RESULT',
          success: message.success,
          promptNumber: message.promptNumber,
          layer: message.layer
        });
      }
      break;

    case 'ERROR':
      console.error('[Umbra Flow] Server error:', message.error);
      break;

    case 'CONNECTION_ERROR':
      console.error('[Umbra Flow] Connection error:', message.error);
      notifyPopup('SERVER_ERROR', {
        error: message.error
      });
      break;
  }
}

function sendToServer(data) {
  if (serverState.websocket && serverState.websocket.readyState === WebSocket.OPEN) {
    serverState.websocket.send(JSON.stringify(data));
    return true;
  }
  return false;
}

// Try to connect on startup silently (server may be intentionally off)
setTimeout(() => {
  connectWebSocket(true); // silent mode - don't log errors if server not running
}, 1000);

// ========== GROK AI FUNCTIONS ==========

async function fixPromptWithGrok(promptNumber, originalPrompt, errorMessage, attemptNumber = 1, errorType = 'policy') {
  if (!grokConfig.apiKey) {
    return { success: false, error: 'API key nÃ£o configurada' };
  }

  console.log(`[Umbra Flow] Corrigindo prompt ${promptNumber} com Grok (tentativa ${attemptNumber}, tipo: ${errorType})...`);

  // Extrair elementos [X, Y, Z] do prompt original para preservÃ¡-los
  const elementsMatch = originalPrompt.match(/\[([0-9,\s]+)\]/);
  let elementsStr = '';
  if (elementsMatch) {
    elementsStr = elementsMatch[0];
  }

  // Extrair nÃºmero do prompt
  const promptNumMatch = originalPrompt.match(/PROMPT\s*(\d+)/i);
  const promptPrefix = promptNumMatch ? `PROMPT ${promptNumMatch[1]}` : '';

  // Limpar texto do prompt para enviar ao Grok
  let cleanPrompt = originalPrompt
    .replace(/PROMPT\s*\d+\s*:?\s*/gi, '')
    .replace(/\[[0-9,\s]+\]\s*/g, '')
    .trim();

  // EstratÃ©gia progressiva: depende do tipo de erro
  let systemPrompt;
  let temperature;

  if (errorType === 'generation_fail') {
    console.log(`[Umbra Flow] 🤖 Grok: errorType=generation_fail, attemptNumber=${attemptNumber}`);
    // ============================================================
    // AUDIO GENERATION FAILED â€” foco em modificar Ã¡udio/voz/diÃ¡logo
    // ============================================================
    if (attemptNumber <= 2) {
      temperature = 0.8;
      systemPrompt = `You are a prompt rewriter for Google's Veo 3 video generation AI. The prompt failed with "audio generation failed". The AI could not generate the audio/voice for this video.

Your task is to MODIFY the audio/voice/dialogue descriptions to make them easier for the AI to generate:

1. Simplify voice descriptions â€” remove complex accents, unusual vocal qualities
2. Change specific voice actors/styles to generic ones (e.g., "gravelly whisper" â†’ "calm deep voice")
3. Simplify dialogue â€” shorter sentences, simpler words
4. If there are singing or musical directions, make them simpler
5. Remove sound effects that might be hard to generate
6. Keep ALL visual descriptions EXACTLY the same
7. Return ONLY the rewritten text, no explanations
8. Do NOT include prompt numbers or element references like [1, 2]

Failed with: "${errorMessage}"`;
    } else {
      temperature = 1.0;
      systemPrompt = `You are a prompt rewriter for Google's Veo 3 video generation AI. This prompt has FAILED ${attemptNumber - 1} TIMES with "audio generation failed". Previous rewrites did NOT work.

MAKE RADICAL AUDIO CHANGES:
1. COMPLETELY REWRITE all dialogue â€” use simple, short sentences
2. REMOVE all accent/dialect specifications
3. CHANGE voice descriptions to the simplest possible (e.g., "male voice" or "female voice", nothing more)
4. REMOVE any singing, humming, or complex sound effects
5. If there's narration, make it minimal â€” 1-2 simple sentences max
6. REMOVE background audio descriptions (ambient sounds, music cues)
7. Keep visual descriptions the same but make audio DEAD SIMPLE
8. Return ONLY the rewritten text, no explanations
9. Do NOT include prompt numbers or element references

This is attempt ${attemptNumber}. Be EXTREMELY aggressive with audio simplification. ERROR: "${errorMessage}"`;
    }
  } else {
    console.log(`[Umbra Flow] 🤖 Grok: errorType=policy, attemptNumber=${attemptNumber}`);

    if (attemptNumber <= 2) {
      // Tentativas 1-2: MudanÃ§as moderadas
      temperature = 0.8;
      systemPrompt = `You are a prompt rewriter for Google's Veo 3 video generation AI. Rewrite prompts that were rejected for policy violations.

RULES:
1. SIGNIFICANTLY change any descriptions that could be considered harmful, violent, dangerous, or inappropriate
2. Replace dark/negative themes with neutral or positive alternatives
3. If a scene involves conflict, violence, or distress, rewrite it as peaceful or constructive
4. Replace any mention of weapons, injuries, death, crime, or suffering with safe alternatives
5. Keep the visual style (camera angles, lighting, cinematography)
6. Return ONLY the rewritten text, no explanations
7. Do NOT include prompt numbers or element references like [1, 2] â€” just the descriptive text

The prompt was rejected with: "${errorMessage}"`;
    } else if (attemptNumber <= 4) {
      // Tentativas 3-4: MudanÃ§as radicais
      temperature = 0.9;
      systemPrompt = `You are a prompt rewriter for Google's Veo 3 video generation AI. This prompt has ALREADY FAILED ${attemptNumber - 1} TIMES with policy violations. You MUST make RADICAL changes.

CRITICAL â€” PREVIOUS ATTEMPTS FAILED. You must change MORE:
1. COMPLETELY REWRITE any scene that could be remotely harmful, violent, scary, disturbing, or negative
2. Replace ALL characters in potentially problematic situations with people doing safe, everyday, POSITIVE activities
3. Remove ANY reference to: weapons, fire, danger, conflict, darkness, fear, pain, anger, crime, death, war, blood, abuse, drugs, alcohol, hate, discrimination
4. If the scene is dark or dramatic, make it BRIGHT, CHEERFUL, and WHOLESOME
5. Replace threatening or intense moments with gentle, warm, or humorous ones
6. Simplify complex descriptions that might contain hidden problematic content
7. Keep the cinematic style but make the CONTENT completely safe and family-friendly
8. Return ONLY the rewritten text, no explanations
9. Do NOT include prompt numbers or element references â€” just the descriptive text

ERROR that keeps appearing: "${errorMessage}"

BE RADICAL. The subtle approach has failed ${attemptNumber - 1} times. Make BIG changes this time.`;
    } else {
      // Tentativa 5+: Reescrita total
      temperature = 1.0;
      systemPrompt = `You are a prompt rewriter for Google's Veo 3 video generation AI. This prompt has FAILED ${attemptNumber - 1} TIMES despite multiple rewrites. This is a LAST RESORT.

YOU MUST COMPLETELY TRANSFORM THIS PROMPT:
1. Keep ONLY the basic visual style (camera type, aspect ratio, general cinematography)
2. REPLACE the entire story/scene with something completely different but visually similar
3. Make it about something universally safe: cooking, nature, travel, art, music, celebration, friendship, learning
4. All characters should be clearly happy, healthy, and in safe situations
5. NO dark lighting, NO tension, NO drama, NO conflict whatsoever
6. Think "tourism commercial" or "cooking show" level of safety
7. Return ONLY the rewritten text, no explanations
8. Do NOT include prompt numbers or element references

This is attempt ${attemptNumber}. All previous ${attemptNumber - 1} versions were rejected for: "${errorMessage}"

COMPLETELY redesign the scene content. Keep only the camera/visual style.`;
    }
  } // end else (policy errors)

  let userMessage;
  if (errorType === 'generation_fail') {
    userMessage = `Rewrite this prompt to fix audio generation failure. Simplify all voice/dialogue/audio descriptions:\n\n"${cleanPrompt}"\n\nReturn ONLY the rewritten prompt text, nothing else.`;
  } else {
    userMessage = `Rewrite this prompt to avoid policy violations:\n\n"${cleanPrompt}"\n\nReturn ONLY the rewritten prompt text, nothing else.`;
  }


  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokConfig.apiKey} `
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: temperature,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status} `);
    }

    const data = await response.json();
    let fixedText = data.choices?.[0]?.message?.content?.trim();

    if (!fixedText) {
      throw new Error('Resposta vazia do Grok');
    }

    // Limpar aspas extras se houver
    fixedText = fixedText.replace(/^["']|["']$/g, '').trim();

    // Reconstruir o prompt com formato correto
    let finalPrompt = '';
    if (promptPrefix) {
      finalPrompt += promptPrefix;
      if (elementsStr) {
        finalPrompt += ` ${elementsStr} `;
      }
      finalPrompt += `: ${fixedText} `;
    } else {
      if (elementsStr) {
        finalPrompt = `${elementsStr}: ${fixedText} `;
      } else {
        finalPrompt = fixedText;
      }
    }

    console.log(`[F & F Lab]Prompt ${promptNumber} corrigido com sucesso`);
    console.log(`[F & F Lab]Original: ${originalPrompt.substring(0, 100)}...`);
    console.log(`[F & F Lab]Corrigido: ${finalPrompt.substring(0, 100)}...`);

    // Atualizar estado
    const queueItem = errorTrackingState.fixQueue.find(
      item => item.promptNumber === promptNumber
    );
    if (queueItem) {
      queueItem.status = 'fixed';
      queueItem.fixedPrompt = finalPrompt;
    }

    errorTrackingState.fixedPrompts.push({
      promptNumber,
      originalPrompt,
      fixedPrompt: finalPrompt,
      timestamp: Date.now()
    });

    return {
      success: true,
      fixedPrompt: finalPrompt,
      originalPrompt
    };

  } catch (error) {
    console.error(`[F & F Lab]Erro ao corrigir prompt ${promptNumber}: `, error);

    // Atualizar estado de falha
    const queueItem = errorTrackingState.fixQueue.find(
      item => item.promptNumber === promptNumber
    );
    if (queueItem) {
      queueItem.status = 'failed';
      queueItem.error = error.message;
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// FunÃ§Ã£o para enviar prompt corrigido via WebSocket ao servidor Python (se conectado)
function sendFixedPromptToServer(promptNumber, fixedPrompt) {
  if (serverState.connected) {
    sendToServer({
      type: 'FIXED_PROMPT',
      promptNumber,
      fixedPrompt,
      timestamp: Date.now()
    });
  }
}

console.log('[Umbra Flow] Background service worker v1.7 iniciado (Side Panel)');
