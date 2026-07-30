/**
 * Umbra Flow - Popup Script v2.0
 * Interface com persistência de estado, feedback de prompts faltantes, modo Extend
 * e integração com Grok AI para auto-fix de prompts com erro de política
 */

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('licenseOverlay');
  const keyInput = document.getElementById('licenseKeyInput');
  const activateBtn = document.getElementById('licenseActivateBtn');
  const errorMsg = document.getElementById('licenseError');

  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
    if (response && response.valido) {
      overlay.classList.add('hidden');
      init();
    }
  });

  activateBtn.addEventListener('click', () => {
    const chave = keyInput.value.trim().toUpperCase();
    if (!chave) return;
    activateBtn.disabled = true;
    activateBtn.textContent = '[ VALIDANDO... ]';
    errorMsg.textContent = '';

    chrome.runtime.sendMessage({ action: 'ACTIVATE', chave }, (response) => {
      activateBtn.disabled = false;
      activateBtn.textContent = '[ ATIVAR ]';
      if (response && response.valido) {
        overlay.classList.add('hidden');
        init();
      } else {
        errorMsg.textContent = response?.motivo || 'Chave invalida ou limite atingido.';
      }
    });
  });

  keyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') activateBtn.click();
  });
});

// Estado local
let prompts = [];
let isRunning = false;
let retryCount = 0;
const MAX_RETRIES = 2;

// Estado do Grok AI
let grokApiKey = '';
let grokAutoFixEnabled = true;

// Storage keys para Grok
const GROK_STORAGE_KEYS = {
  apiKey: 'grok_api_key',
  autoFixEnabled: 'grok_auto_fix_enabled'
};

// Estatísticas de erros da sessão atual
let errorStats = {
  policy: 0,
  timeout: 0,
  server: 0,
  rate_limit: 0,
  generation_fail: 0,
  unknown: 0
};

// Fila de prompts para fix com Grok
let fixQueue = [];

// Estado do modo atual
let currentMode = 'standard'; // 'standard' ou 'extend'

// Estado da pasta selecionada
let selectedFolder = 1; // 1, 2, 3, 4 ou 5

// Estado do servidor Python
let serverConnected = false;
let currentLayer = 'MODO DIRETO'; // 'MODO DIRETO', 'LAYER 1 (DOM)', 'LAYER 2 (RETRY)', etc.

// Mapeamento de pastas
const FOLDER_NAMES = {
  1: 'Umbra Flow Videos',
  2: 'Umbra Flow Videos (2)',
  3: 'Umbra Flow Videos (3)',
  4: 'Umbra Flow Videos (4)',
  5: 'Umbra Flow Videos (5)',
  6: 'Umbra Flow Videos (6)',
  7: 'Umbra Flow Videos (7)',
  8: 'Umbra Flow Videos (8)'
};

// Elementos DOM - Folder Selector
const folderElements = {
  folder1: null,
  folder2: null,
  folder3: null,
  folder4: null,
  folder5: null,
  folder6: null,
  folder7: null,
  folder8: null,
  folderPath: null,
  extendFolderDisplay: null
};

// Elementos DOM - Server Panel
const serverElements = {
  serverPanel: null,
  serverDot: null,
  serverStatusText: null,
  serverDetails: null,
  serverBtn: null,
  progressLayer: null,
  progressCount: null
};

// Elementos DOM - Grok Settings
const grokElements = {
  grokSettingsCard: null,
  grokApiKey: null,
  toggleApiKeyVisibility: null,
  saveGrokApiKey: null,
  grokStatus: null,
  grokAutoFixEnabled: null
};

// Elementos DOM - Error Stats
const errorStatsElements = {
  errorStatsContainer: null,
  statPolicy: null,
  statTimeout: null,
  statServer: null,
  statOther: null
};

// Elementos DOM - Standard Mode
const elements = {
  statusBar: null,
  statusText: null,
  headerStatus: null,
  settingsCard: null,
  inputSection: null,
  promptListCard: null,
  promptItems: null,
  promptCount: null,
  progressContainer: null,
  progressFill: null,
  progressText: null,
  missingPromptsCard: null,
  missingPromptsList: null,
  copyMissingBtn: null,
  processBtn: null,
  startBtn: null,
  controlButtons: null,
  stopBtn: null,
  cancelBtn: null,
  retryBtn: null,
  resetBtn: null,
  promptsInput: null,
  batchSize: null,
  promptDelay: null,
  batchPause: null
};

// Elementos DOM - Mode Selector
const modeElements = {
  modeStandard: null,
  modeExtend: null,
  standardModeSection: null,
  extendModeSection: null
};

// Elementos DOM - Extend Mode
const extendElements = {
  extendPromptsInput: null,
  extendPromptCount: null,
  extendProjectName: null,
  extendMaxWait: null,
  extendDelay: null,
  extendAutoDownload: null,
  extendTotal: null,
  extendProgressContainer: null,
  extendProgressFill: null,
  extendProgressText: null,
  extendCurrentScene: null,
  extendSceneText: null,
  extendStartBtn: null,
  extendControlButtons: null,
  extendStopBtn: null,
  extendDownloadBtn: null
};

// Valores padrão do Extend
const EXTEND_DEFAULTS = {
  projectName: 'plano_sequencia',
  maxWaitTime: 120,
  delayBetweenExtends: 5,
  autoDownload: true
};

// Chaves de storage para Extend
const EXTEND_STORAGE_KEYS = {
  projectName: 'extend_projectName',
  maxWaitTime: 'extend_maxWaitTime',
  delayBetweenExtends: 'extend_delayBetweenExtends',
  autoDownload: 'extend_autoDownload',
  prompts: 'extend_prompts',
  isRunning: 'extend_isRunning',
  currentProgress: 'extend_currentProgress',
  currentScene: 'extend_currentScene',
  lastStatus: 'extend_lastStatus',
  totalScenes: 'extend_totalScenes',
  currentMode: 'ff_currentMode'
};

// Chave de storage para pasta
const FOLDER_STORAGE_KEY = 'ff_selectedFolder';

// Speed Control defaults (match content.js CONFIG)
const SPEED_DEFAULTS = {
  promptDelayMin: 1500,
  promptDelayMax: 2500,
  checkIntervalMin: 500,
  checkIntervalMax: 1000,
  slotTimeout: 80,
  maxRetries: 2
};

const SPEED_STORAGE_KEYS = {
  promptDelayMin: 'ff_speed_promptDelayMin',
  promptDelayMax: 'ff_speed_promptDelayMax',
  checkIntervalMin: 'ff_speed_checkIntervalMin',
  checkIntervalMax: 'ff_speed_checkIntervalMax',
  slotTimeout: 'ff_speed_slotTimeout',
  maxRetries: 'ff_speed_maxRetries'
};

// Elementos DOM - Speed Control
const speedElements = {
  speedPromptDelay: null,
  speedCheckInterval: null,
  speedSlotTimeout: null,
  speedMaxRetries: null,
  speedPromptDelayMin: null,
  speedPromptDelayMax: null,
  speedCheckIntervalMin: null,
  speedCheckIntervalMax: null,
  speedSlotTimeoutInput: null,
  speedMaxRetriesInput: null,
  speedResetBtn: null,
  speedApplyBtn: null
};

async function init() {
  // Cachear elementos DOM - Standard Mode
  Object.keys(elements).forEach(key => {
    elements[key] = document.getElementById(key);
  });

  // Cachear elementos DOM - Mode Selector
  Object.keys(modeElements).forEach(key => {
    modeElements[key] = document.getElementById(key);
  });

  // Cachear elementos DOM - Extend Mode
  Object.keys(extendElements).forEach(key => {
    extendElements[key] = document.getElementById(key);
  });

  // Cachear elementos DOM - Folder Selector
  Object.keys(folderElements).forEach(key => {
    folderElements[key] = document.getElementById(key);
  });

  // Cachear elementos DOM - Server Panel
  Object.keys(serverElements).forEach(key => {
    serverElements[key] = document.getElementById(key);
  });

  // Cachear elementos DOM - Grok Settings
  Object.keys(grokElements).forEach(key => {
    grokElements[key] = document.getElementById(key);
  });

  // Cachear elementos DOM - Error Stats
  Object.keys(errorStatsElements).forEach(key => {
    errorStatsElements[key] = document.getElementById(key);
  });

  // Cachear elementos DOM - Speed Control
  Object.keys(speedElements).forEach(key => {
    speedElements[key] = document.getElementById(key);
  });

  // Listeners - Standard Mode
  elements.processBtn.addEventListener('click', processPrompts);
  elements.startBtn.addEventListener('click', startAutomation);
  elements.stopBtn.addEventListener('click', stopAutomation);
  elements.cancelBtn.addEventListener('click', cancelAutomation);
  elements.retryBtn.addEventListener('click', retryMissingPrompts);
  elements.resetBtn.addEventListener('click', resetSession);
  if (elements.copyMissingBtn) {
    elements.copyMissingBtn.addEventListener('click', copyMissingPrompts);
  }

  // Salvar configurações - Standard Mode
  ['batchSize', 'promptDelay', 'batchPause'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveSettings);
  });

  // Listeners - Folder Selector
  [1, 2, 3, 4, 5, 6, 7, 8].forEach(num => {
    folderElements[`folder${num}`].addEventListener('click', () => selectFolder(num));
  });

  // Listeners - Mode Selector
  modeElements.modeStandard.addEventListener('click', () => switchMode('standard'));
  modeElements.modeExtend.addEventListener('click', () => switchMode('extend'));

  // Listener - Server Panel
  serverElements.serverBtn.addEventListener('click', handleServerButton);

  // Listeners - Grok Settings
  if (grokElements.toggleApiKeyVisibility) {
    grokElements.toggleApiKeyVisibility.addEventListener('click', toggleGrokApiKeyVisibility);
  }
  if (grokElements.saveGrokApiKey) {
    grokElements.saveGrokApiKey.addEventListener('click', saveGrokApiKey);
  }
  if (grokElements.grokAutoFixEnabled) {
    grokElements.grokAutoFixEnabled.addEventListener('change', saveGrokSettings);
  }
  if (grokElements.grokApiKey) {
    grokElements.grokApiKey.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveGrokApiKey();
    });
  }

  // Listeners - Speed Control
  if (speedElements.speedResetBtn) {
    speedElements.speedResetBtn.addEventListener('click', resetSpeedSettings);
  }
  if (speedElements.speedApplyBtn) {
    speedElements.speedApplyBtn.addEventListener('click', applySpeedSettings);
  }

  // Listeners - Extend Mode
  extendElements.extendPromptsInput.addEventListener('input', updateExtendCount);
  extendElements.extendStartBtn.addEventListener('click', startExtendSequence);
  extendElements.extendStopBtn.addEventListener('click', stopExtendSequence);
  extendElements.extendDownloadBtn.addEventListener('click', downloadExtendVideo);

  // Salvar configurações do Extend quando alteradas
  extendElements.extendProjectName.addEventListener('change', saveExtendSettings);
  extendElements.extendMaxWait.addEventListener('change', () => {
    const value = Math.max(30, Math.min(300, parseInt(extendElements.extendMaxWait.value) || EXTEND_DEFAULTS.maxWaitTime));
    extendElements.extendMaxWait.value = value;
    saveExtendSettings();
  });
  extendElements.extendDelay.addEventListener('change', () => {
    const value = Math.max(2, Math.min(30, parseInt(extendElements.extendDelay.value) || EXTEND_DEFAULTS.delayBetweenExtends));
    extendElements.extendDelay.value = value;
    saveExtendSettings();
  });
  extendElements.extendAutoDownload.addEventListener('change', saveExtendSettings);

  // Salvar prompts do Extend com debounce
  let extendPromptSaveTimeout;
  extendElements.extendPromptsInput.addEventListener('input', () => {
    clearTimeout(extendPromptSaveTimeout);
    extendPromptSaveTimeout = setTimeout(() => {
      chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.prompts]: extendElements.extendPromptsInput.value });
    }, 500);
  });

  // Carregar configurações
  loadSettings();
  loadExtendSettings();
  loadSelectedFolder();
  loadGrokSettings();
  loadSpeedSettings();

  // Carregar modo salvo
  chrome.storage.local.get([EXTEND_STORAGE_KEYS.currentMode], (result) => {
    const savedMode = result[EXTEND_STORAGE_KEYS.currentMode] || 'standard';
    switchMode(savedMode, false); // false = não salvar novamente
  });

  // Verificar se está na aba correta
  await checkCurrentTab();

  // Restaurar estado se houver sessão em andamento
  await restoreState();
  await restoreExtendState();

  // Verificar status do servidor Python
  checkServerStatus();

  // Listener para atualizações do content script
  chrome.runtime.onMessage.addListener(handleMessage);
}

function handleMessage(message) {
  // Standard Mode Messages
  if (message.type === 'STATUS') {
    updateStatus(getStatusType(message.text), message.text);

    if (message.progress) {
      updateProgress(message.progress.current, message.progress.total);
    }

    if (message.done) {
      onAutomationComplete();
    }
  }

  if (message.type === 'DOWNLOAD_COMPLETE') {
    // Atualizar UI com novo download
    const prompt = prompts.find(p => p.number === message.promptNumber);
    if (prompt) {
      prompt.status = message.success ? 'sent' : 'error';
      displayPrompts();
    }
    updateProgress(message.completedCount, message.totalCount);
  }

  // Real-time progress updates from content script
  if (message.action === 'UPDATE_PROGRESS') {
    if (message.completedCount !== undefined && prompts.length > 0) {
      updateProgress(message.completedCount, prompts.length);
    }

    // Update prompt status in real-time if provided
    if (message.promptStatus) {
      const prompt = prompts.find(p => p.number === message.promptStatus.number);
      if (prompt) {
        prompt.status = message.promptStatus.status;
        if (message.promptStatus.errorType) {
          prompt.errorType = message.promptStatus.errorType;
          prompt.errorMessage = message.promptStatus.errorMessage;
        }
        displayPrompts();
      }
    }
  }

  // Extend Mode Messages
  if (message.type === 'sequenceStatus') {
    updateStatus(getStatusType(message.text), message.text);
    chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.lastStatus]: message.text });

    if (message.progress) {
      const pct = (message.progress.current / message.progress.total) * 100;
      extendElements.extendProgressFill.style.width = `${pct}%`;
      extendElements.extendProgressText.textContent = `Cena ${message.progress.current} de ${message.progress.total}`;

      // Salvar progresso
      chrome.storage.local.set({
        [EXTEND_STORAGE_KEYS.currentProgress]: message.progress.current,
        [EXTEND_STORAGE_KEYS.totalScenes]: message.progress.total
      });
    }

    if (message.currentScene) {
      extendElements.extendSceneText.textContent = message.currentScene;
      chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.currentScene]: message.currentScene });
    }

    if (message.done) {
      resetExtendUI();
      chrome.storage.local.set({
        [EXTEND_STORAGE_KEYS.isRunning]: false,
        [EXTEND_STORAGE_KEYS.lastStatus]: message.success ? 'Sequencia concluida com sucesso!' : message.text
      });
      if (message.success) {
        updateStatus('success', '✅ Sequencia concluida com sucesso!');
      }
    }
  }

  if (message.type === 'downloadStatus') {
    extendElements.extendDownloadBtn.textContent = `[ ${message.text.toUpperCase()} ]`;
    if (message.done) {
      extendElements.extendDownloadBtn.disabled = false;
      extendElements.extendDownloadBtn.textContent = '[ BAIXAR VIDEO FINAL ]';
      if (message.success) {
        updateStatus('success', '✅ Video baixado com sucesso!');
        chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.lastStatus]: 'Video baixado com sucesso!' });
      } else {
        updateStatus('error', `❌ ${message.error || 'Erro ao baixar video.'}`);
        chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.lastStatus]: message.error || 'Erro ao baixar video.' });
      }
    }
  }

  // Server Status Messages
  if (message.type === 'SERVER_STATUS') {
    updateServerUI(message.connected, message.layer);
  }

  // Prompt Error Messages (from content.js error detection)
  if (message.type === 'PROMPT_ERROR') {
    handlePromptError(message);
  }

  // Grok Fix Result Messages
  if (message.type === 'GROK_FIX_RESULT') {
    handleGrokFixResult(message);
  }

  // Final Report Messages
  if (message.type === 'BATCH_COMPLETE') {
    handleBatchComplete(message);
  }
}

async function checkCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && (tab.url.includes('labs.google/fx') || tab.url.includes('labs.google/flow'))) {
      elements.headerStatus.classList.add('active');
      elements.processBtn.disabled = false;

      // Verificar se não está rodando no Extend para habilitar o botão
      chrome.storage.local.get([EXTEND_STORAGE_KEYS.isRunning], (result) => {
        if (!result[EXTEND_STORAGE_KEYS.isRunning]) {
          extendElements.extendStartBtn.disabled = false;
          extendElements.extendDownloadBtn.disabled = false;
        }
      });

      if (currentMode === 'standard') {
        updateStatus('success', '✅ Veo 3 Flow detectado!');
      } else {
        updateStatus('success', '✅ Pronto para iniciar. Certifique-se de ter um video no Scenebuilder.');
      }
    } else {
      elements.headerStatus.classList.remove('active');
      elements.processBtn.disabled = true;
      extendElements.extendStartBtn.disabled = true;
      extendElements.extendDownloadBtn.disabled = true;

      if (currentMode === 'standard') {
        updateStatus('error', '❌ Abra o Veo 3 Flow primeiro!');
      } else {
        updateStatus('error', '❌ Navegue ate o Flow Scenebuilder para usar.');
      }
    }
  } catch (error) {
    console.error('Erro ao verificar aba:', error);
  }
}

async function restoreState(retryAttempt = 0) {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'GET_STATE' });

    if (response && response.prompts && response.prompts.length > 0) {
      prompts = response.prompts;
      isRunning = response.isRunning;

      // Mostrar UI de sessão em andamento/concluída
      elements.inputSection.classList.add('hidden');
      elements.settingsCard.classList.add('hidden');
      elements.processBtn.classList.add('hidden');
      elements.promptListCard.classList.remove('hidden');
      elements.progressContainer.classList.remove('hidden');

      displayPrompts();
      updateProgress(response.completedCount, prompts.length);

      if (isRunning) {
        elements.controlButtons.classList.remove('hidden');
        elements.startBtn.classList.add('hidden');
        updateStatus('running', `🚀 Gerando... ${response.completedCount}/${prompts.length}`);
      } else {
        // Sessão concluída ou pausada
        elements.controlButtons.classList.add('hidden');

        if (response.missingPrompts && response.missingPrompts.length > 0) {
          showMissingPrompts(response.missingPrompts);
          elements.retryBtn.classList.remove('hidden');
          updateStatus('warning', `⚠️ ${response.missingPrompts.length} prompts faltantes!`);
        } else if (response.completedCount === prompts.length) {
          updateStatus('success', `✅ Concluído! ${response.completedCount} vídeos baixados`);
        }

        elements.resetBtn.classList.remove('hidden');
      }
    } else if (retryAttempt < 2) {
      // Service Worker pode estar dormindo - retry apos breve delay
      console.log(`[Umbra Flow] restoreState: sem dados, retry ${retryAttempt + 1}/2...`);
      setTimeout(() => restoreState(retryAttempt + 1), 500);
    }
  } catch (error) {
    console.error('Erro ao restaurar estado:', error);
    if (retryAttempt < 2) {
      console.log(`[Umbra Flow] restoreState: erro, retry ${retryAttempt + 1}/2...`);
      setTimeout(() => restoreState(retryAttempt + 1), 500);
    }
  }
}

function loadSettings() {
  chrome.storage.local.get(['ff_batchSize', 'ff_promptDelay', 'ff_batchPause'], (result) => {
    if (result.ff_batchSize) elements.batchSize.value = result.ff_batchSize;
    if (result.ff_promptDelay) elements.promptDelay.value = result.ff_promptDelay;
    if (result.ff_batchPause !== undefined) elements.batchPause.value = result.ff_batchPause;
  });
}

function saveSettings() {
  chrome.storage.local.set({
    ff_batchSize: parseInt(elements.batchSize.value),
    ff_promptDelay: parseInt(elements.promptDelay.value),
    ff_batchPause: parseInt(elements.batchPause.value)
  });
}

function processPrompts() {
  const input = elements.promptsInput.value.trim();

  if (!input) {
    updateStatus('error', '❌ Cole seus prompts primeiro!');
    return;
  }

  // Parser de prompts (formato: PROMPT X [elementos]: texto)
  const lines = input.split(/(?=PROMPT\s*\d+)/i).filter(s => s.trim());

  prompts = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Extrair número do prompt
    const numMatch = trimmed.match(/PROMPT\s*(\d+)/i);
    if (!numMatch) continue;

    const promptNum = parseInt(numMatch[1]);

    // Extrair elementos [1, 2, 3]
    const elementsMatch = trimmed.match(/\[([0-9,\s]+)\]/);
    let promptElements = [];
    if (elementsMatch) {
      promptElements = elementsMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }

    // Limpar texto do prompt
    let promptText = trimmed
      .replace(/PROMPT\s*\d+\s*/i, '')
      .replace(/\[[0-9,\s]+\]\s*/g, '')
      .replace(/\|\s*[\d:]+\s*-\s*[\d:]+\s*/g, '')
      .replace(/^:\s*/, '')
      .trim();

    if (promptText) {
      prompts.push({
        number: promptNum,
        elements: promptElements,
        text: `PROMPT ${promptNum}: ${promptText}`,
        status: 'waiting'
      });
    }
  }

  prompts.sort((a, b) => a.number - b.number);

  if (prompts.length === 0) {
    updateStatus('error', '❌ Nenhum prompt encontrado! Use formato: PROMPT 1: texto');
    return;
  }

  // Atualizar UI
  displayPrompts();
  elements.inputSection.classList.add('hidden');
  elements.settingsCard.classList.add('hidden');
  elements.processBtn.classList.add('hidden');
  elements.promptListCard.classList.remove('hidden');
  elements.startBtn.classList.remove('hidden');

  const withElements = prompts.filter(p => p.elements.length > 0).length;
  updateStatus('success', `✅ ${prompts.length} prompts prontos! (${withElements} com elementos)`);
}

function displayPrompts() {
  const sent = prompts.filter(p => p.status === 'sent').length;
  elements.promptCount.textContent = `${sent}/${prompts.length}`;

  elements.promptItems.innerHTML = prompts.map((p, i) => {
    const preview = p.text.substring(0, 35) + (p.text.length > 35 ? '...' : '');
    const statusIcon = {
      'waiting': '⏳',
      'sending': '🔄',
      'sent': '✅',
      'error': '❌'
    }[p.status];

    // Visual slots: render based on element count
    let slotsHtml = '';
    if (p.elements.length > 0) {
      // Has elements - show visual slots
      const slots = [];
      for (let s = 0; s < 3; s++) {
        const isFilled = s < p.elements.length;
        slots.push(`<span class="slot ${isFilled ? 'filled' : 'empty'}"></span>`);
      }
      const elemNumbers = p.elements.map(e => `<span class="slot-number">${e}</span>`).join('');
      slotsHtml = `
        <div class="prompt-slots">
          <div class="slots-row">${slots.join('')}</div>
          <div class="slots-numbers">${elemNumbers}</div>
        </div>
      `;
    } else {
      // Text only - show TXT badge
      slotsHtml = `
        <div class="prompt-slots">
          <span class="slot-text-only">TXT</span>
          <span class="slot-label">texto</span>
        </div>
      `;
    }

    return `
      <div class="prompt-item ${p.status}" data-index="${i}">
        <span class="number">${p.number}</span>
        ${slotsHtml}
        <span class="text" title="${p.text.replace(/"/g, '&quot;')}">${preview}</span>
        <span class="status-icon">${statusIcon}</span>
      </div>
    `;
  }).join('');
}

async function startAutomation() {
  if (prompts.length === 0) {
    updateStatus('error', '❌ Nenhum prompt para enviar!');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url.includes('labs.google')) {
    updateStatus('error', '❌ Abra o Veo 3 Flow primeiro!');
    return;
  }

  isRunning = true;
  retryCount = 0;

  // Injetar content script apenas se não estiver carregado
  try {
    // Verificar se o content script já está carregado
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => typeof window.ffLabAutomation !== 'undefined'
    });

    // Só injetar se não estiver carregado
    if (!result.result) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      // Aguardar um pouco para o script carregar
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch (e) {
    console.log('Erro ao verificar/injetar content script:', e);
  }

  // Configurações
  const settings = {
    batchSize: parseInt(elements.batchSize.value) || 4,
    promptDelay: parseInt(elements.promptDelay.value) || 2,
    batchPause: parseInt(elements.batchPause.value) || 0,
    downloadFolder: getCurrentFolderName()
  };

  // Enviar comando para iniciar
  chrome.tabs.sendMessage(tab.id, {
    action: 'startAutomation',
    prompts: prompts,
    settings: settings
  });

  // Informar background sobre a pasta atual
  chrome.runtime.sendMessage({
    action: 'SET_DOWNLOAD_FOLDER',
    folder: getCurrentFolderName()
  });

  // Atualizar UI
  elements.startBtn.classList.add('hidden');
  elements.controlButtons.classList.remove('hidden');
  elements.progressContainer.classList.remove('hidden');

  updateStatus('running', `🚀 Iniciando geração de ${prompts.length} vídeos...`);
}

async function stopAutomation() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'stopAutomation' });
  }

  isRunning = false;

  elements.controlButtons.classList.add('hidden');

  // Aguardar background processar o stop e buscar estado atualizado
  setTimeout(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_STATE' });
      if (response && response.prompts && response.prompts.length > 0) {
        prompts = response.prompts;
        displayPrompts();
        updateProgress(response.completedCount, prompts.length);

        if (response.missingPrompts && response.missingPrompts.length > 0) {
          showMissingPrompts(response.missingPrompts);
          elements.retryBtn.classList.remove('hidden');
          elements.resetBtn.classList.remove('hidden');
          elements.startBtn.classList.remove('hidden');
          elements.startBtn.textContent = '▶️ Continuar';
          updateStatus('warning', `⏸️ Pausado. ${response.missingPrompts.length} prompts faltantes.`);
        } else if (response.completedCount === prompts.length) {
          elements.resetBtn.classList.remove('hidden');
          updateStatus('success', `✅ Concluído! ${response.completedCount} vídeos baixados`);
        } else {
          elements.startBtn.classList.remove('hidden');
          elements.startBtn.textContent = '▶️ Continuar';
          updateStatus('warning', '⏸️ Geração pausada');
        }
      } else {
        elements.startBtn.classList.remove('hidden');
        elements.startBtn.textContent = '▶️ Continuar';
        updateStatus('warning', '⏸️ Geração pausada');
      }
    } catch (e) {
      console.error('[Umbra Flow] Erro ao buscar estado apos stop:', e);
      elements.startBtn.classList.remove('hidden');
      elements.startBtn.textContent = '▶️ Continuar';
      updateStatus('warning', '⏸️ Geração pausada');
    }
  }, 500);
}

async function cancelAutomation() {
  if (!confirm('Cancelar a geração atual?')) return;

  await stopAutomation();
  await chrome.runtime.sendMessage({ action: 'RESET_STATE' });

  resetUI();
  updateStatus('info', 'Geração cancelada');
}

function onAutomationComplete() {
  isRunning = false;
  elements.controlButtons.classList.add('hidden');

  // Verificar prompts faltantes
  chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
    if (response && response.missingPrompts && response.missingPrompts.length > 0) {
      if (retryCount < MAX_RETRIES) {
        // Fazer retry automático
        retryCount++;
        showMissingPrompts(response.missingPrompts);
        updateStatus('warning', `⚠️ ${response.missingPrompts.length} faltantes. Retry automático ${retryCount}/${MAX_RETRIES}...`);

        setTimeout(() => {
          retryMissingPrompts();
        }, 3000);
      } else {
        // Mostrar feedback final
        showMissingPrompts(response.missingPrompts);
        elements.retryBtn.classList.remove('hidden');
        elements.resetBtn.classList.remove('hidden');
        updateStatus('error', `❌ ${response.missingPrompts.length} prompts falharam após ${MAX_RETRIES} tentativas`);
      }
    } else {
      // Sucesso total
      elements.resetBtn.classList.remove('hidden');
      updateStatus('success', `✅ Concluído! Todos os ${prompts.length} vídeos foram baixados!`);
    }
  });
}

async function retryMissingPrompts() {
  chrome.runtime.sendMessage({ action: 'GET_RETRY_PROMPTS' }, async (response) => {
    if (response && response.prompts && response.prompts.length > 0) {
      const retryPrompts = response.prompts;

      // Resetar status dos prompts para retry
      retryPrompts.forEach(rp => {
        const prompt = prompts.find(p => p.number === rp.number);
        if (prompt) {
          prompt.status = 'waiting';
        }
      });

      displayPrompts();
      elements.retryBtn.classList.add('hidden');
      elements.missingPromptsCard.classList.add('hidden');

      // Iniciar retry
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab) {
        const settings = {
          batchSize: parseInt(elements.batchSize.value) || 4,
          promptDelay: parseInt(elements.promptDelay.value) || 2,
          batchPause: 0
        };

        chrome.tabs.sendMessage(tab.id, {
          action: 'retryPrompts',
          prompts: retryPrompts,
          settings: settings
        });

        elements.controlButtons.classList.remove('hidden');
        updateStatus('running', `🔄 Retry de ${retryPrompts.length} prompts...`);
      }
    }
  });
}

function showMissingPrompts(missingNumbers) {
  elements.missingPromptsCard.classList.remove('hidden');
  elements.missingPromptsList.textContent = `Prompts: ${missingNumbers.join(', ')}`;
  // Store missing numbers for copy function
  elements.missingPromptsCard.dataset.missingNumbers = JSON.stringify(missingNumbers);
}

async function copyMissingPrompts() {
  try {
    const missingNumbers = JSON.parse(elements.missingPromptsCard.dataset.missingNumbers || '[]');
    if (missingNumbers.length === 0) return;

    // Build full text of missing prompts from the prompts array
    const missingTexts = missingNumbers
      .map(num => {
        const p = prompts.find(pr => pr.number === num);
        if (!p) return `PROMPT ${num}: (texto nao encontrado)`;
        // Rebuild with elements [X, Y, Z] if they exist
        const elemStr = (p.elements && p.elements.length > 0) ? ` [${p.elements.join(', ')}]` : '';
        // Extract the prompt text after "PROMPT N:"
        const textOnly = p.text.replace(/^PROMPT\s*\d+\s*:\s*/i, '');
        return `PROMPT ${p.number}${elemStr}: ${textOnly}`;
      })
      .join('\n\n');

    await navigator.clipboard.writeText(missingTexts);

    // Visual feedback
    const btn = elements.copyMissingBtn;
    btn.classList.add('copied');
    btn.textContent = '[ COPIADO! ]';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = '[ COPIAR PROMPTS FALTANTES ]';
    }, 2000);
  } catch (err) {
    console.error('[Umbra Flow] Erro ao copiar prompts:', err);
  }
}

async function resetSession() {
  if (!confirm('Iniciar nova sessão? O progresso atual será limpo.')) return;

  await chrome.runtime.sendMessage({ action: 'RESET_STATE' });
  resetUI();
  updateStatus('info', 'Cole seus prompts e clique em PROCESSAR');
}

function resetUI() {
  prompts = [];
  isRunning = false;
  retryCount = 0;

  elements.inputSection.classList.remove('hidden');
  elements.settingsCard.classList.remove('hidden');
  elements.processBtn.classList.remove('hidden');
  elements.promptListCard.classList.add('hidden');
  elements.progressContainer.classList.add('hidden');
  elements.missingPromptsCard.classList.add('hidden');
  elements.startBtn.classList.add('hidden');
  elements.controlButtons.classList.add('hidden');
  elements.retryBtn.classList.add('hidden');
  elements.resetBtn.classList.add('hidden');

  elements.startBtn.textContent = '🚀 Iniciar Geração';
  elements.promptsInput.value = '';
  elements.progressFill.style.width = '0%';
  elements.progressText.textContent = '0%';

  // Reset error stats and fix queue
  resetErrorStats();

  // Esconder relatório final se existir
  const reportContainer = document.getElementById('finalReportContainer');
  if (reportContainer) {
    reportContainer.classList.add('hidden');
  }
}

function updateStatus(type, text) {
  elements.statusBar.className = `status-bar ${type}`;
  elements.statusText.textContent = text;
}

function updateProgress(current, total) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  elements.progressFill.style.width = `${percent}%`;

  // Update the new progress info layout
  if (serverElements.progressCount) {
    serverElements.progressCount.textContent = `${current}/${total} prompts`;
  }
  // Fallback for old layout if present
  if (elements.progressText) {
    elements.progressText.textContent = `${current}/${total} (${percent}%)`;
  }
}

function getStatusType(text) {
  if (text.includes('✅') || text.includes('Concluído') || text.includes('OK')) return 'success';
  if (text.includes('❌') || text.includes('Erro') || text.includes('falharam')) return 'error';
  if (text.includes('⚠️') || text.includes('Pausa') || text.includes('faltantes')) return 'warning';
  if (text.includes('🚀') || text.includes('Gerando') || text.includes('Enviando')) return 'running';
  return 'info';
}

// ========== MODE SWITCHING ==========

function switchMode(mode, save = true) {
  currentMode = mode;

  // Atualizar botões do seletor
  modeElements.modeStandard.classList.toggle('active', mode === 'standard');
  modeElements.modeExtend.classList.toggle('active', mode === 'extend');

  // Mostrar/esconder seções
  modeElements.standardModeSection.classList.toggle('hidden', mode !== 'standard');
  modeElements.extendModeSection.classList.toggle('hidden', mode !== 'extend');

  // Atualizar status de acordo com o modo
  if (mode === 'standard') {
    elements.statusText.textContent = 'Cole seus prompts e clique em PROCESSAR';
  } else {
    elements.statusText.textContent = 'Navegue ate o Flow Scenebuilder com um video criado';
    checkCurrentTab(); // Atualizar estado do botão
  }

  // Salvar modo
  if (save) {
    chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.currentMode]: mode });
  }
}

// ========== FOLDER SELECTION FUNCTIONS ==========

function loadSelectedFolder() {
  chrome.storage.local.get([FOLDER_STORAGE_KEY], (result) => {
    const saved = result[FOLDER_STORAGE_KEY] || 1;
    selectFolder(saved, false); // false = não salvar novamente
  });
}

function selectFolder(folderNum, save = true) {
  selectedFolder = folderNum;

  // Atualizar botões
  [1, 2, 3, 4, 5, 6, 7, 8].forEach(num => {
    folderElements[`folder${num}`].classList.toggle('active', num === folderNum);
  });

  // Atualizar exibição do caminho
  const folderName = FOLDER_NAMES[folderNum];
  folderElements.folderPath.textContent = `${folderName}/`;

  // Atualizar display no modo Extend também
  if (folderElements.extendFolderDisplay) {
    folderElements.extendFolderDisplay.textContent = `Downloads/${folderName}/`;
  }

  // Salvar
  if (save) {
    chrome.storage.local.set({ [FOLDER_STORAGE_KEY]: folderNum });
  }

  // Notificar background sobre a mudança de pasta
  chrome.runtime.sendMessage({
    action: 'SET_DOWNLOAD_FOLDER',
    folder: folderName
  });
}

function getCurrentFolderName() {
  return FOLDER_NAMES[selectedFolder];
}

// ========== EXTEND MODE FUNCTIONS ==========

function loadExtendSettings() {
  chrome.storage.local.get([
    EXTEND_STORAGE_KEYS.projectName,
    EXTEND_STORAGE_KEYS.maxWaitTime,
    EXTEND_STORAGE_KEYS.delayBetweenExtends,
    EXTEND_STORAGE_KEYS.autoDownload,
    EXTEND_STORAGE_KEYS.prompts
  ], (result) => {
    if (result[EXTEND_STORAGE_KEYS.projectName]) {
      extendElements.extendProjectName.value = result[EXTEND_STORAGE_KEYS.projectName];
    }
    if (result[EXTEND_STORAGE_KEYS.maxWaitTime]) {
      extendElements.extendMaxWait.value = result[EXTEND_STORAGE_KEYS.maxWaitTime];
    }
    if (result[EXTEND_STORAGE_KEYS.delayBetweenExtends]) {
      extendElements.extendDelay.value = result[EXTEND_STORAGE_KEYS.delayBetweenExtends];
    }
    if (result[EXTEND_STORAGE_KEYS.autoDownload] !== undefined) {
      extendElements.extendAutoDownload.checked = result[EXTEND_STORAGE_KEYS.autoDownload];
    }
    if (result[EXTEND_STORAGE_KEYS.prompts]) {
      extendElements.extendPromptsInput.value = result[EXTEND_STORAGE_KEYS.prompts];
      updateExtendCount();
    }
  });
}

function saveExtendSettings() {
  chrome.storage.local.set({
    [EXTEND_STORAGE_KEYS.projectName]: extendElements.extendProjectName.value,
    [EXTEND_STORAGE_KEYS.maxWaitTime]: parseInt(extendElements.extendMaxWait.value),
    [EXTEND_STORAGE_KEYS.delayBetweenExtends]: parseInt(extendElements.extendDelay.value),
    [EXTEND_STORAGE_KEYS.autoDownload]: extendElements.extendAutoDownload.checked
  });
}

function getExtendPromptList() {
  const cleanText = extendElements.extendPromptsInput.value
    .replace(/[\u200B-\u200D\uFEFF\u2028\u2029\u00A0]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  return cleanText
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function updateExtendCount() {
  const promptsList = getExtendPromptList();
  extendElements.extendPromptCount.textContent = `${promptsList.length} cenas`;
  extendElements.extendTotal.textContent = `Total: ${promptsList.length} cenas a estender`;
  return promptsList;
}

async function restoreExtendState() {
  try {
    const result = await new Promise(resolve => {
      chrome.storage.local.get([
        EXTEND_STORAGE_KEYS.isRunning,
        EXTEND_STORAGE_KEYS.currentProgress,
        EXTEND_STORAGE_KEYS.totalScenes,
        EXTEND_STORAGE_KEYS.currentScene,
        EXTEND_STORAGE_KEYS.lastStatus
      ], resolve);
    });

    if (result[EXTEND_STORAGE_KEYS.isRunning]) {
      // Restaurar UI de execução
      extendElements.extendStartBtn.disabled = true;
      extendElements.extendStartBtn.classList.add('hidden');
      extendElements.extendControlButtons.classList.remove('hidden');
      extendElements.extendDownloadBtn.classList.add('hidden');
      extendElements.extendPromptsInput.disabled = true;
      extendElements.extendProjectName.disabled = true;
      extendElements.extendMaxWait.disabled = true;
      extendElements.extendDelay.disabled = true;
      extendElements.extendAutoDownload.disabled = true;

      // Mostrar progresso
      extendElements.extendProgressContainer.classList.remove('hidden');
      extendElements.extendCurrentScene.classList.remove('hidden');

      // Restaurar valores
      if (result[EXTEND_STORAGE_KEYS.currentProgress] !== undefined && result[EXTEND_STORAGE_KEYS.totalScenes]) {
        const current = result[EXTEND_STORAGE_KEYS.currentProgress];
        const total = result[EXTEND_STORAGE_KEYS.totalScenes];
        const pct = (current / total) * 100;
        extendElements.extendProgressFill.style.width = `${pct}%`;
        extendElements.extendProgressText.textContent = `Cena ${current} de ${total}`;
      }

      if (result[EXTEND_STORAGE_KEYS.currentScene]) {
        extendElements.extendSceneText.textContent = result[EXTEND_STORAGE_KEYS.currentScene];
      }

      if (result[EXTEND_STORAGE_KEYS.lastStatus]) {
        updateStatus('running', result[EXTEND_STORAGE_KEYS.lastStatus]);
      }
    }
  } catch (error) {
    console.error('Erro ao restaurar estado do Extend:', error);
  }
}

async function startExtendSequence() {
  const promptsList = updateExtendCount();

  if (promptsList.length === 0) {
    updateStatus('error', '❌ Insira pelo menos uma cena para estender.');
    return;
  }

  // Criar fila com índice
  const queue = promptsList.map((text, index) => ({
    text: text,
    index: index + 1
  }));

  // Bloquear UI
  extendElements.extendStartBtn.disabled = true;
  extendElements.extendStartBtn.classList.add('hidden');
  extendElements.extendControlButtons.classList.remove('hidden');
  extendElements.extendDownloadBtn.classList.add('hidden');
  extendElements.extendPromptsInput.disabled = true;
  extendElements.extendProjectName.disabled = true;
  extendElements.extendMaxWait.disabled = true;
  extendElements.extendDelay.disabled = true;
  extendElements.extendAutoDownload.disabled = true;

  // Mostrar progresso
  extendElements.extendProgressContainer.classList.remove('hidden');
  extendElements.extendCurrentScene.classList.remove('hidden');
  extendElements.extendProgressFill.style.width = '0%';
  extendElements.extendProgressText.textContent = 'Preparando...';

  // Salvar estado de execução
  chrome.storage.local.set({
    [EXTEND_STORAGE_KEYS.isRunning]: true,
    [EXTEND_STORAGE_KEYS.totalScenes]: promptsList.length,
    [EXTEND_STORAGE_KEYS.currentProgress]: 0,
    [EXTEND_STORAGE_KEYS.lastStatus]: 'Iniciando sequencia...'
  });

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Verificar se o content script do extend já está carregado
    const [extendResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => typeof window.ffLabExtendAutomation !== 'undefined'
    });

    // Só injetar se não estiver carregado
    if (!extendResult.result) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-extend.js']
      });
      // Aguardar um pouco para o script carregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Informar background sobre a pasta atual
    chrome.runtime.sendMessage({
      action: 'SET_DOWNLOAD_FOLDER',
      folder: getCurrentFolderName()
    });

    // Enviar comando para iniciar
    chrome.tabs.sendMessage(tab.id, {
      action: 'startSequence',
      prompts: queue,
      config: {
        projectName: extendElements.extendProjectName.value || EXTEND_DEFAULTS.projectName,
        maxWaitTime: parseInt(extendElements.extendMaxWait.value) || EXTEND_DEFAULTS.maxWaitTime,
        delayBetweenExtends: parseInt(extendElements.extendDelay.value) || EXTEND_DEFAULTS.delayBetweenExtends,
        autoDownload: extendElements.extendAutoDownload.checked,
        downloadFolder: getCurrentFolderName()
      }
    });

  } catch (error) {
    updateStatus('error', '❌ Erro ao iniciar automacao.');
    console.error(error);
    resetExtendUI();
    chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.isRunning]: false });
  }
}

async function stopExtendSequence() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'stopSequence' });
  resetExtendUI();
  updateStatus('warning', '⏸️ Sequencia interrompida pelo usuario.');
  chrome.storage.local.set({
    [EXTEND_STORAGE_KEYS.isRunning]: false,
    [EXTEND_STORAGE_KEYS.lastStatus]: 'Sequencia interrompida pelo usuario.'
  });
}

async function downloadExtendVideo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  extendElements.extendDownloadBtn.disabled = true;
  extendElements.extendDownloadBtn.textContent = '[ BUSCANDO VIDEO... ]';

  chrome.tabs.sendMessage(tab.id, {
    action: 'downloadFinalVideo',
    projectName: extendElements.extendProjectName.value || EXTEND_DEFAULTS.projectName,
    downloadFolder: getCurrentFolderName()
  });
}

function resetExtendUI() {
  extendElements.extendStartBtn.disabled = false;
  extendElements.extendStartBtn.classList.remove('hidden');
  extendElements.extendControlButtons.classList.add('hidden');
  extendElements.extendDownloadBtn.classList.remove('hidden');
  extendElements.extendDownloadBtn.disabled = false;
  extendElements.extendDownloadBtn.textContent = '[ BAIXAR VIDEO FINAL ]';
  extendElements.extendPromptsInput.disabled = false;
  extendElements.extendProjectName.disabled = false;
  extendElements.extendMaxWait.disabled = false;
  extendElements.extendDelay.disabled = false;
  extendElements.extendAutoDownload.disabled = false;
  extendElements.extendProgressContainer.classList.add('hidden');
  extendElements.extendCurrentScene.classList.add('hidden');
}

// ========== SERVER PANEL FUNCTIONS ==========

function checkServerStatus() {
  chrome.runtime.sendMessage({ action: 'GET_SERVER_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      updateServerUI(false);
      return;
    }
    if (response) {
      updateServerUI(response.connected, response.layer);
    } else {
      updateServerUI(false);
    }
  });
}

function updateServerUI(connected, layer = null) {
  serverConnected = connected;

  if (connected) {
    serverElements.serverDot.classList.remove('offline');
    serverElements.serverDot.classList.add('online');
    serverElements.serverStatusText.textContent = 'Online';
    serverElements.serverDetails.textContent = 'Modo Robusto ativo';
    serverElements.serverBtn.textContent = 'Parar';
    serverElements.serverBtn.classList.remove('btn-server-start');
    serverElements.serverBtn.classList.add('btn-server-stop');
    currentLayer = layer || 'LAYER 1 (DOM)';
  } else {
    serverElements.serverDot.classList.remove('online');
    serverElements.serverDot.classList.add('offline');
    serverElements.serverStatusText.textContent = 'Offline';
    serverElements.serverDetails.textContent = 'Modo Direto ativo';
    serverElements.serverBtn.textContent = 'Iniciar';
    serverElements.serverBtn.classList.remove('btn-server-stop');
    serverElements.serverBtn.classList.add('btn-server-start');
    currentLayer = 'MODO DIRETO';
  }

  // Atualizar indicador de layer no progresso
  updateProgressLayer();
}

function updateProgressLayer() {
  if (serverElements.progressLayer) {
    serverElements.progressLayer.textContent = `// ${currentLayer}`;
  }
}

function handleServerButton() {
  if (serverConnected) {
    // Parar servidor (desconectar WebSocket)
    chrome.runtime.sendMessage({ action: 'DISCONNECT_SERVER' }, () => {
      updateServerUI(false);
    });
  } else {
    // Abrir página de ajuda para iniciar servidor
    chrome.tabs.create({ url: chrome.runtime.getURL('start-server.html') });

    // Começar a verificar conexão periodicamente
    startConnectionPolling();
  }
}

function startConnectionPolling() {
  // Verificar a cada 2 segundos por 60 segundos
  let attempts = 0;
  const maxAttempts = 30;

  const pollInterval = setInterval(() => {
    attempts++;

    chrome.runtime.sendMessage({ action: 'GET_SERVER_STATUS' }, (response) => {
      if (response && response.connected) {
        clearInterval(pollInterval);
        updateServerUI(true, response.layer);
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
      }
    });
  }, 2000);
}

// ========== GROK AI FUNCTIONS ==========

function loadGrokSettings() {
  chrome.storage.local.get([
    GROK_STORAGE_KEYS.apiKey,
    GROK_STORAGE_KEYS.autoFixEnabled
  ], (result) => {
    // Load API key
    if (result[GROK_STORAGE_KEYS.apiKey]) {
      grokApiKey = result[GROK_STORAGE_KEYS.apiKey];
      if (grokElements.grokApiKey) {
        grokElements.grokApiKey.value = grokApiKey;
      }
      updateGrokStatusUI(true);
    } else {
      updateGrokStatusUI(false);
    }

    // Load auto-fix setting
    if (result[GROK_STORAGE_KEYS.autoFixEnabled] !== undefined) {
      grokAutoFixEnabled = result[GROK_STORAGE_KEYS.autoFixEnabled];
    } else {
      grokAutoFixEnabled = true; // Default to enabled
    }
    if (grokElements.grokAutoFixEnabled) {
      grokElements.grokAutoFixEnabled.checked = grokAutoFixEnabled;
    }
  });
}

function saveGrokApiKey() {
  if (!grokElements.grokApiKey) return;

  const apiKey = grokElements.grokApiKey.value.trim();

  if (!apiKey) {
    updateGrokStatusUI(false, 'Chave inválida');
    return;
  }

  // Validar formato básico (xai-...)
  if (!apiKey.startsWith('xai-')) {
    updateGrokStatusUI(false, 'Formato inválido');
    return;
  }

  grokApiKey = apiKey;
  chrome.storage.local.set({ [GROK_STORAGE_KEYS.apiKey]: apiKey }, () => {
    updateGrokStatusUI(true, 'Salvo!');

    // Notificar background sobre a nova API key
    chrome.runtime.sendMessage({
      action: 'SET_GROK_API_KEY',
      apiKey: apiKey
    });

    // Voltar ao status normal após 2 segundos
    setTimeout(() => {
      updateGrokStatusUI(true);
    }, 2000);
  });
}

function saveGrokSettings() {
  if (grokElements.grokAutoFixEnabled) {
    grokAutoFixEnabled = grokElements.grokAutoFixEnabled.checked;
    chrome.storage.local.set({
      [GROK_STORAGE_KEYS.autoFixEnabled]: grokAutoFixEnabled
    });

    // Notificar background
    chrome.runtime.sendMessage({
      action: 'SET_GROK_AUTO_FIX',
      enabled: grokAutoFixEnabled
    });
  }
}

function toggleGrokApiKeyVisibility() {
  if (!grokElements.grokApiKey || !grokElements.toggleApiKeyVisibility) return;

  const input = grokElements.grokApiKey;
  const btn = grokElements.toggleApiKeyVisibility;
  const icon = btn.querySelector('.icon');

  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.textContent = 'visibility';
  } else {
    input.type = 'password';
    if (icon) icon.textContent = 'visibility_off';
  }
}

function updateGrokStatusUI(isConfigured, customText = null) {
  if (!grokElements.grokStatus) return;

  const dot = grokElements.grokStatus.querySelector('.grok-dot');
  const text = grokElements.grokStatus.querySelector('.grok-status-text');

  if (isConfigured) {
    if (dot) {
      dot.classList.remove('offline');
      dot.classList.add('configured');
    }
    if (text) {
      text.textContent = customText || 'Configurado';
    }
  } else {
    if (dot) {
      dot.classList.remove('configured');
      dot.classList.add('offline');
    }
    if (text) {
      text.textContent = customText || 'Não configurado';
    }
  }
}

// ========== ERROR TRACKING FUNCTIONS ==========

function handlePromptError(message) {
  const { promptNumber, errorType, errorMessage, originalPrompt } = message;

  // Atualizar estatísticas
  if (errorStats[errorType] !== undefined) {
    errorStats[errorType]++;
  } else {
    errorStats.unknown++;
  }

  // Atualizar UI de stats
  updateErrorStatsUI();

  // Atualizar status do prompt na lista
  const prompt = prompts.find(p => p.number === promptNumber);
  if (prompt) {
    prompt.status = 'error';
    prompt.errorType = errorType;
    prompt.errorMessage = errorMessage;
    displayPrompts();
  }

  // Se for erro de política e Grok auto-fix está habilitado, adicionar à fila
  if (errorType === 'policy' && grokAutoFixEnabled && grokApiKey) {
    addToFixQueue(promptNumber, originalPrompt, errorMessage);
  }

  console.log(`[Umbra Flow] Erro detectado - Prompt ${promptNumber}: ${errorType} - ${errorMessage}`);
}

function updateErrorStatsUI() {
  // Só mostrar se tiver algum erro
  const totalErrors = Object.values(errorStats).reduce((a, b) => a + b, 0);

  if (totalErrors === 0) {
    if (errorStatsElements.errorStatsContainer) {
      errorStatsElements.errorStatsContainer.classList.add('hidden');
    }
    return;
  }

  if (errorStatsElements.errorStatsContainer) {
    errorStatsElements.errorStatsContainer.classList.remove('hidden');
  }

  // Atualizar contadores individuais
  if (errorStatsElements.statPolicy) {
    errorStatsElements.statPolicy.textContent = errorStats.policy;
  }
  if (errorStatsElements.statTimeout) {
    errorStatsElements.statTimeout.textContent = errorStats.timeout;
  }
  if (errorStatsElements.statServer) {
    errorStatsElements.statServer.textContent = errorStats.server;
  }
  if (errorStatsElements.statOther) {
    const otherCount = errorStats.rate_limit + errorStats.generation_fail + errorStats.unknown;
    errorStatsElements.statOther.textContent = otherCount;
  }
}

function resetErrorStats() {
  errorStats = {
    policy: 0,
    timeout: 0,
    server: 0,
    rate_limit: 0,
    generation_fail: 0,
    unknown: 0
  };
  fixQueue = [];
  updateErrorStatsUI();
}

// ========== FIX QUEUE FUNCTIONS ==========

function addToFixQueue(promptNumber, originalPrompt, errorMessage) {
  // Verificar se já está na fila
  const existing = fixQueue.find(item => item.promptNumber === promptNumber);
  if (existing) {
    existing.attempts++;
    return;
  }

  fixQueue.push({
    promptNumber,
    originalPrompt,
    errorMessage,
    attempts: 1,
    status: 'pending' // pending, fixing, fixed, failed
  });

  console.log(`[Umbra Flow] Prompt ${promptNumber} adicionado à fila de fix. Total na fila: ${fixQueue.length}`);
}

function getFixQueueStatus() {
  return {
    total: fixQueue.length,
    pending: fixQueue.filter(item => item.status === 'pending').length,
    fixing: fixQueue.filter(item => item.status === 'fixing').length,
    fixed: fixQueue.filter(item => item.status === 'fixed').length,
    failed: fixQueue.filter(item => item.status === 'failed').length
  };
}

function handleGrokFixResult(message) {
  const { promptNumber, success, fixedPrompt, error } = message;

  const queueItem = fixQueue.find(item => item.promptNumber === promptNumber);
  if (queueItem) {
    if (success) {
      queueItem.status = 'fixed';
      queueItem.fixedPrompt = fixedPrompt;
      console.log(`[Umbra Flow] Prompt ${promptNumber} corrigido pelo Grok`);
    } else {
      queueItem.status = 'failed';
      queueItem.fixError = error;
      console.log(`[Umbra Flow] Grok falhou ao corrigir prompt ${promptNumber}: ${error}`);
    }
  }
}

// ========== BATCH COMPLETE & FINAL REPORT ==========

function handleBatchComplete(message) {
  const { totalPrompts, successCount, errorCount, downloadedCount } = message;

  // Se tiver prompts na fila de fix, iniciar processo de fix
  const pendingFixes = fixQueue.filter(item => item.status === 'pending');

  if (pendingFixes.length > 0 && grokApiKey && grokAutoFixEnabled) {
    updateStatus('info', `🔧 Corrigindo ${pendingFixes.length} prompts com Grok AI...`);
    startGrokFixProcess();
  } else {
    // Mostrar relatório final
    showFinalReport({
      totalPrompts,
      successCount,
      errorCount,
      downloadedCount,
      fixQueueStatus: getFixQueueStatus()
    });
  }
}

async function startGrokFixProcess() {
  const pendingFixes = fixQueue.filter(item => item.status === 'pending');

  if (pendingFixes.length === 0) {
    // Todos corrigidos, mostrar relatório
    showFinalReport({
      totalPrompts: prompts.length,
      successCount: prompts.filter(p => p.status === 'sent').length,
      errorCount: prompts.filter(p => p.status === 'error').length,
      downloadedCount: prompts.filter(p => p.status === 'sent').length,
      fixQueueStatus: getFixQueueStatus()
    });
    return;
  }

  // Enviar para background processar com Grok
  for (const item of pendingFixes) {
    item.status = 'fixing';

    chrome.runtime.sendMessage({
      action: 'FIX_PROMPT_WITH_GROK',
      promptNumber: item.promptNumber,
      originalPrompt: item.originalPrompt,
      errorMessage: item.errorMessage
    });

    // Pequeno delay entre requisições para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

function showFinalReport(reportData) {
  const { totalPrompts, successCount, errorCount, fixQueueStatus } = reportData;

  // Criar elemento de relatório se não existir
  let reportContainer = document.getElementById('finalReportContainer');
  if (!reportContainer) {
    reportContainer = document.createElement('div');
    reportContainer.id = 'finalReportContainer';
    reportContainer.className = 'card final-report';

    // Inserir após o progress container
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer && progressContainer.parentNode) {
      progressContainer.parentNode.insertBefore(reportContainer, progressContainer.nextSibling);
    }
  }

  const successRate = totalPrompts > 0 ? Math.round((successCount / totalPrompts) * 100) : 0;

  let reportHTML = `
    <div class="card-title">// RELATÓRIO FINAL</div>
    <div class="report-summary">
      <div class="report-stat">
        <span class="report-number">${totalPrompts}</span>
        <span class="report-label">Total</span>
      </div>
      <div class="report-stat success">
        <span class="report-number">${successCount}</span>
        <span class="report-label">Sucesso</span>
      </div>
      <div class="report-stat error">
        <span class="report-number">${errorCount}</span>
        <span class="report-label">Erros</span>
      </div>
      <div class="report-stat rate">
        <span class="report-number">${successRate}%</span>
        <span class="report-label">Taxa</span>
      </div>
    </div>
  `;

  // Adicionar seção de erros por tipo se houver erros
  const totalErrors = Object.values(errorStats).reduce((a, b) => a + b, 0);
  if (totalErrors > 0) {
    reportHTML += `
      <div class="report-errors">
        <div class="report-subtitle">Erros por Tipo:</div>
        <div class="error-breakdown">
          ${errorStats.policy > 0 ? `<span class="error-type policy">Política: ${errorStats.policy}</span>` : ''}
          ${errorStats.timeout > 0 ? `<span class="error-type timeout">Timeout: ${errorStats.timeout}</span>` : ''}
          ${errorStats.server > 0 ? `<span class="error-type server">Servidor: ${errorStats.server}</span>` : ''}
          ${(errorStats.rate_limit + errorStats.generation_fail + errorStats.unknown) > 0 ?
            `<span class="error-type other">Outros: ${errorStats.rate_limit + errorStats.generation_fail + errorStats.unknown}</span>` : ''}
        </div>
      </div>
    `;
  }

  // Adicionar seção de Grok se houver fixes
  if (fixQueueStatus && fixQueueStatus.total > 0) {
    reportHTML += `
      <div class="report-grok">
        <div class="report-subtitle">Grok AI Auto-Fix:</div>
        <div class="grok-breakdown">
          <span class="grok-stat fixed">Corrigidos: ${fixQueueStatus.fixed}</span>
          <span class="grok-stat failed">Falharam: ${fixQueueStatus.failed}</span>
          ${fixQueueStatus.pending > 0 ? `<span class="grok-stat pending">Pendentes: ${fixQueueStatus.pending}</span>` : ''}
        </div>
      </div>
    `;

    // Se houver prompts corrigidos, oferecer opção de retry
    if (fixQueueStatus.fixed > 0) {
      reportHTML += `
        <div class="report-actions">
          <button class="btn btn-primary" id="retryFixedPromptsBtn">
            🔄 Reenviar ${fixQueueStatus.fixed} Prompts Corrigidos
          </button>
        </div>
      `;
    }
  }

  reportContainer.innerHTML = reportHTML;
  reportContainer.classList.remove('hidden');

  // Adicionar listener para botão de retry se existir
  const retryFixedBtn = document.getElementById('retryFixedPromptsBtn');
  if (retryFixedBtn) {
    retryFixedBtn.addEventListener('click', retryFixedPrompts);
  }

  // Atualizar status geral
  if (successRate >= 95) {
    updateStatus('success', `✅ Excelente! ${successRate}% de sucesso`);
  } else if (successRate >= 80) {
    updateStatus('warning', `⚠️ ${successRate}% de sucesso - ${errorCount} erros`);
  } else {
    updateStatus('error', `❌ ${successRate}% de sucesso - Verifique os erros`);
  }
}

async function retryFixedPrompts() {
  const fixedItems = fixQueue.filter(item => item.status === 'fixed' && item.fixedPrompt);

  if (fixedItems.length === 0) {
    updateStatus('warning', 'Nenhum prompt corrigido para reenviar');
    return;
  }

  // Preparar prompts corrigidos para reenvio
  const retryPrompts = fixedItems.map(item => {
    // Encontrar prompt original para manter elementos/metadata
    const originalPrompt = prompts.find(p => p.number === item.promptNumber);

    return {
      number: item.promptNumber,
      elements: originalPrompt ? originalPrompt.elements : [],
      text: item.fixedPrompt,
      status: 'waiting',
      isFixed: true // Flag para identificar que é um prompt corrigido
    };
  });

  // Resetar status dos prompts corrigidos na lista principal
  retryPrompts.forEach(rp => {
    const prompt = prompts.find(p => p.number === rp.number);
    if (prompt) {
      prompt.status = 'waiting';
      prompt.text = rp.text;
      prompt.isFixed = true;
    }
  });

  displayPrompts();

  // Esconder relatório
  const reportContainer = document.getElementById('finalReportContainer');
  if (reportContainer) {
    reportContainer.classList.add('hidden');
  }

  // Iniciar retry
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab) {
    const settings = {
      batchSize: parseInt(elements.batchSize.value) || 4,
      promptDelay: parseInt(elements.promptDelay.value) || 2,
      batchPause: 0,
      downloadFolder: getCurrentFolderName()
    };

    chrome.tabs.sendMessage(tab.id, {
      action: 'retryPrompts',
      prompts: retryPrompts,
      settings: settings
    });

    elements.controlButtons.classList.remove('hidden');
    updateStatus('running', `🔄 Reenviando ${retryPrompts.length} prompts corrigidos pelo Grok...`);
  }
}

// ========== SPEED CONTROL FUNCTIONS ==========

function loadSpeedSettings() {
  chrome.storage.local.get(Object.values(SPEED_STORAGE_KEYS), (result) => {
    // Carregar valores salvos ou usar defaults
    const promptDelayMin = result[SPEED_STORAGE_KEYS.promptDelayMin] || SPEED_DEFAULTS.promptDelayMin;
    const promptDelayMax = result[SPEED_STORAGE_KEYS.promptDelayMax] || SPEED_DEFAULTS.promptDelayMax;
    const checkIntervalMin = result[SPEED_STORAGE_KEYS.checkIntervalMin] || SPEED_DEFAULTS.checkIntervalMin;
    const checkIntervalMax = result[SPEED_STORAGE_KEYS.checkIntervalMax] || SPEED_DEFAULTS.checkIntervalMax;
    const slotTimeout = result[SPEED_STORAGE_KEYS.slotTimeout] || SPEED_DEFAULTS.slotTimeout;
    const maxRetries = result[SPEED_STORAGE_KEYS.maxRetries] || SPEED_DEFAULTS.maxRetries;

    // Atualizar inputs
    if (speedElements.speedPromptDelayMin) speedElements.speedPromptDelayMin.value = promptDelayMin;
    if (speedElements.speedPromptDelayMax) speedElements.speedPromptDelayMax.value = promptDelayMax;
    if (speedElements.speedCheckIntervalMin) speedElements.speedCheckIntervalMin.value = checkIntervalMin;
    if (speedElements.speedCheckIntervalMax) speedElements.speedCheckIntervalMax.value = checkIntervalMax;
    if (speedElements.speedSlotTimeoutInput) speedElements.speedSlotTimeoutInput.value = slotTimeout;
    if (speedElements.speedMaxRetriesInput) speedElements.speedMaxRetriesInput.value = maxRetries;

    // Atualizar displays
    updateSpeedDisplay({
      promptDelayMin,
      promptDelayMax,
      checkIntervalMin,
      checkIntervalMax,
      slotTimeout,
      maxRetries
    });
  });
}

function updateSpeedDisplay(values) {
  if (speedElements.speedPromptDelay) {
    speedElements.speedPromptDelay.textContent = `${values.promptDelayMin / 1000}-${values.promptDelayMax / 1000}s`;
  }
  if (speedElements.speedCheckInterval) {
    speedElements.speedCheckInterval.textContent = `${values.checkIntervalMin / 1000}-${values.checkIntervalMax / 1000}s`;
  }
  if (speedElements.speedSlotTimeout) {
    speedElements.speedSlotTimeout.textContent = `${values.slotTimeout}s`;
  }
  if (speedElements.speedMaxRetries) {
    speedElements.speedMaxRetries.textContent = `${values.maxRetries}x`;
  }
}

function applySpeedSettings() {
  // Ler valores dos inputs
  const promptDelayMin = parseInt(speedElements.speedPromptDelayMin.value);
  const promptDelayMax = parseInt(speedElements.speedPromptDelayMax.value);
  const checkIntervalMin = parseInt(speedElements.speedCheckIntervalMin.value);
  const checkIntervalMax = parseInt(speedElements.speedCheckIntervalMax.value);
  const slotTimeout = parseInt(speedElements.speedSlotTimeoutInput.value);
  const maxRetries = parseInt(speedElements.speedMaxRetriesInput.value);

  // Validar valores
  if (promptDelayMin > promptDelayMax) {
    updateStatus('error', '❌ Delay mínimo deve ser menor que máximo!');
    return;
  }
  if (checkIntervalMin > checkIntervalMax) {
    updateStatus('error', '❌ Check interval mínimo deve ser menor que máximo!');
    return;
  }

  // Salvar no storage
  chrome.storage.local.set({
    [SPEED_STORAGE_KEYS.promptDelayMin]: promptDelayMin,
    [SPEED_STORAGE_KEYS.promptDelayMax]: promptDelayMax,
    [SPEED_STORAGE_KEYS.checkIntervalMin]: checkIntervalMin,
    [SPEED_STORAGE_KEYS.checkIntervalMax]: checkIntervalMax,
    [SPEED_STORAGE_KEYS.slotTimeout]: slotTimeout,
    [SPEED_STORAGE_KEYS.maxRetries]: maxRetries
  }, () => {
    // Atualizar displays
    updateSpeedDisplay({
      promptDelayMin,
      promptDelayMax,
      checkIntervalMin,
      checkIntervalMax,
      slotTimeout,
      maxRetries
    });

    // Notificar content script para aplicar as mudanças
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'UPDATE_SPEED_CONFIG',
          config: {
            delayBetweenPrompts: { min: promptDelayMin, max: promptDelayMax },
            checkInterval: { min: checkIntervalMin, max: checkIntervalMax },
            slotTimeout: slotTimeout * 1000, // Convert to ms
            maxRetries: maxRetries
          }
        });
      }
    });

    updateStatus('success', '✓ Velocidade atualizada!');

    // Feedback visual no botão
    const originalText = speedElements.speedApplyBtn.textContent;
    speedElements.speedApplyBtn.textContent = '✓ Aplicado!';
    setTimeout(() => {
      speedElements.speedApplyBtn.textContent = originalText;
    }, 1500);
  });
}

function resetSpeedSettings() {
  // Resetar para defaults
  speedElements.speedPromptDelayMin.value = SPEED_DEFAULTS.promptDelayMin;
  speedElements.speedPromptDelayMax.value = SPEED_DEFAULTS.promptDelayMax;
  speedElements.speedCheckIntervalMin.value = SPEED_DEFAULTS.checkIntervalMin;
  speedElements.speedCheckIntervalMax.value = SPEED_DEFAULTS.checkIntervalMax;
  speedElements.speedSlotTimeoutInput.value = SPEED_DEFAULTS.slotTimeout;
  speedElements.speedMaxRetriesInput.value = SPEED_DEFAULTS.maxRetries;

  // Aplicar automaticamente
  applySpeedSettings();

  updateStatus('info', '↻ Velocidade resetada para padrão');
}
