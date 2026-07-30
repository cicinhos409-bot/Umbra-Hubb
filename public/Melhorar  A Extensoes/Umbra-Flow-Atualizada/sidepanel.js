/**
 * Umbra Flow - Side Panel Script v2.0
 * Interface com persistência de estado, feedback de prompts faltantes, modo Extend
 * e integração com Grok AI para auto-fix de prompts com erro de política
 * Side Panel version - runs in browser side panel
 */

document.addEventListener('DOMContentLoaded', () => {
  // License check before init
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
let parsedAssets = [];
let selectedImageModel = 'Nano Banana 2'; // 'Nano Banana 2' or 'Nano Banana Pro'
let isRunning = false;
let retryCount = 0;
const MAX_RETRIES = 2;

// Job Queue System
let jobQueue = [];
let currentJobIndex = -1;
let nextJobNumber = 1;
const JOB_COUNTER_KEY = 'ff_job_counter';
const JOB_QUEUE_KEY = 'ff_job_queue';

// ========== PROMPT TRACKER ==========
// Tracks individual prompt status with timing and errors

class PromptTracker {
  constructor(promptData) {
    this.id = promptData.id || `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.number = promptData.number;
    this.text = promptData.text;
    this.elements = promptData.elements || [];
    this.status = 'waiting'; // waiting, pending, generating, completed, error, retrying
    this.attempts = 0;
    this.maxAttempts = 3;
    this.errors = [];
    this.startedAt = null;
    this.completedAt = null;
    this.videoUrl = null;
    this.downloadId = null;
  }

  start() {
    this.status = 'pending';
    this.startedAt = Date.now();
    this.attempts++;
  }

  setGenerating() {
    this.status = 'generating';
  }

  complete(videoUrl = null, downloadId = null) {
    this.status = 'completed';
    this.completedAt = Date.now();
    this.videoUrl = videoUrl;
    this.downloadId = downloadId;
  }

  fail(error) {
    this.errors.push({
      message: error,
      timestamp: Date.now(),
      attempt: this.attempts
    });

    if (this.attempts < this.maxAttempts) {
      this.status = 'retrying';
    } else {
      this.status = 'error';
    }
  }

  canRetry() {
    return this.attempts < this.maxAttempts && this.status !== 'completed';
  }

  getDuration() {
    if (!this.startedAt) return 0;
    const end = this.completedAt || Date.now();
    return end - this.startedAt;
  }

  toJSON() {
    return {
      id: this.id,
      number: this.number,
      text: this.text,
      elements: this.elements,
      status: this.status,
      attempts: this.attempts,
      errors: this.errors,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      videoUrl: this.videoUrl,
      downloadId: this.downloadId
    };
  }
}

// Track all prompts in current job
let promptTrackers = new Map();

// JSON Prompting support
let currentPromptFormat = 'text'; // 'text' or 'json'
let jsonPromptData = null; // Stores parsed JSON prompt data

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
let selectedFolder = 1; // 1-8
let folderAutoAssigned = false; // Se a pasta foi atribuída automaticamente pelo servidor

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
  addToQueueBtn: null,
  startQueueBtn: null,
  controlButtons: null,
  stopBtn: null,
  cancelBtn: null,
  retryBtn: null,
  resetBtn: null,
  promptsInput: null,
  batchSize: null,
  promptDelay: null,
  batchPause: null,
  jobNameCard: null,
  jobNameInput: null,
  assetsInput: null,
  assetCount: null,
  modelNB2: null,
  modelNBPro: null
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

async function init() {
  console.log('[Umbra Flow] Initializing sidepanel...');

  try {
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

    console.log('[Umbra Flow] Elements cached');

    // Listeners - Standard Mode (with null checks)
    if (elements.processBtn) {
      elements.processBtn.addEventListener('click', processPrompts);
      console.log('[Umbra Flow] processBtn listener attached');
    } else {
      console.error('[Umbra Flow] processBtn not found!');
    }

    if (elements.startBtn) {
      elements.startBtn.addEventListener('click', startAutomation);
    }
    if (elements.addToQueueBtn) {
      elements.addToQueueBtn.addEventListener('click', addCurrentToQueue);
    }
    if (elements.startQueueBtn) {
      elements.startQueueBtn.addEventListener('click', startJobQueue);
    }
    if (elements.stopBtn) {
      elements.stopBtn.addEventListener('click', stopAutomation);
    }
    if (elements.cancelBtn) {
      elements.cancelBtn.addEventListener('click', cancelAutomation);
    }
    if (elements.retryBtn) {
      elements.retryBtn.addEventListener('click', retryMissingPrompts);
    }
    if (elements.resetBtn) {
      elements.resetBtn.addEventListener('click', resetSession);
    }
    if (elements.copyMissingBtn) {
      elements.copyMissingBtn.addEventListener('click', copyMissingPrompts);
    }

    // Salvar configurações - Standard Mode
    ['batchSize', 'promptDelay', 'batchPause'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', saveSettings);
    });

    // Listeners - Assets
    if (elements.assetsInput) {
      elements.assetsInput.addEventListener('input', () => {
        updateAssetCount();
        // Save assets to storage
        chrome.storage.local.set({ ff_assets_text: elements.assetsInput.value });
      });
    }
    if (elements.modelNB2) {
      elements.modelNB2.addEventListener('click', () => selectImageModel('Nano Banana 2'));
    }
    if (elements.modelNBPro) {
      elements.modelNBPro.addEventListener('click', () => selectImageModel('Nano Banana Pro'));
    }

    // Save prompts on input
    if (elements.promptsInput) {
      elements.promptsInput.addEventListener('input', () => {
        chrome.storage.local.set({ ff_prompts_text: elements.promptsInput.value });
      });
    }

    // Load saved data (model, assets textarea, prompts textarea)
    chrome.storage.local.get(['ff_image_model', 'ff_assets_text', 'ff_prompts_text'], (result) => {
      if (result.ff_image_model) {
        selectImageModel(result.ff_image_model, false);
      }
      if (result.ff_assets_text && elements.assetsInput) {
        elements.assetsInput.value = result.ff_assets_text;
        updateAssetCount();
      }
      if (result.ff_prompts_text && elements.promptsInput) {
        elements.promptsInput.value = result.ff_prompts_text;
      }
    });

    // Listeners - Folder Selector
    [1, 2, 3, 4, 5, 6, 7, 8].forEach(num => {
      const btn = folderElements[`folder${num}`];
      if (btn) btn.addEventListener('click', () => selectFolder(num));
    });

    // Listeners - Mode Selector (with null checks)
    if (modeElements.modeStandard) {
      modeElements.modeStandard.addEventListener('click', () => switchMode('standard'));
    }
    if (modeElements.modeExtend) {
      modeElements.modeExtend.addEventListener('click', () => switchMode('extend'));
    }

    // Listener - Server Panel
    console.log('[Umbra Flow] serverBtn element:', serverElements.serverBtn);
    if (serverElements.serverBtn) {
      serverElements.serverBtn.addEventListener('click', handleServerButton);
      console.log('[Umbra Flow] Server button listener attached');
    } else {
      console.error('[Umbra Flow] serverBtn NOT FOUND!');
      // Try direct getElementById
      const btn = document.getElementById('serverBtn');
      console.log('[Umbra Flow] Direct getElementById serverBtn:', btn);
      if (btn) {
        btn.addEventListener('click', handleServerButton);
        serverElements.serverBtn = btn;
        console.log('[Umbra Flow] Attached via direct lookup');
      }
    }

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

    // Listeners - Extend Mode (with null checks)
    if (extendElements.extendPromptsInput) {
      extendElements.extendPromptsInput.addEventListener('input', updateExtendCount);
    }
    if (extendElements.extendStartBtn) {
      extendElements.extendStartBtn.addEventListener('click', startExtendSequence);
    }
    if (extendElements.extendStopBtn) {
      extendElements.extendStopBtn.addEventListener('click', stopExtendSequence);
    }
    if (extendElements.extendDownloadBtn) {
      extendElements.extendDownloadBtn.addEventListener('click', downloadExtendVideo);
    }

    // Salvar configurações do Extend quando alteradas
    if (extendElements.extendProjectName) {
      extendElements.extendProjectName.addEventListener('change', saveExtendSettings);
    }
    if (extendElements.extendMaxWait) {
      extendElements.extendMaxWait.addEventListener('change', () => {
        const value = Math.max(30, Math.min(300, parseInt(extendElements.extendMaxWait.value) || EXTEND_DEFAULTS.maxWaitTime));
        extendElements.extendMaxWait.value = value;
        saveExtendSettings();
      });
    }
    if (extendElements.extendDelay) {
      extendElements.extendDelay.addEventListener('change', () => {
        const value = Math.max(2, Math.min(30, parseInt(extendElements.extendDelay.value) || EXTEND_DEFAULTS.delayBetweenExtends));
        extendElements.extendDelay.value = value;
        saveExtendSettings();
      });
    }
    if (extendElements.extendAutoDownload) {
      extendElements.extendAutoDownload.addEventListener('change', saveExtendSettings);
    }

    // Salvar prompts do Extend com debounce
    let extendPromptSaveTimeout;
    if (extendElements.extendPromptsInput) {
      extendElements.extendPromptsInput.addEventListener('input', () => {
        clearTimeout(extendPromptSaveTimeout);
        extendPromptSaveTimeout = setTimeout(() => {
          chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.prompts]: extendElements.extendPromptsInput.value });
        }, 500);
      });
    }

    // Setup TXT file upload
    setupPromptFileUpload();

    // Carregar configurações
    loadSettings();
    loadExtendSettings();
    loadSelectedFolder();
    loadGrokSettings();
    loadJobQueue();

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

    console.log('[Umbra Flow] Init completed successfully');

  } catch (error) {
    console.error('[Umbra Flow] Init error:', error);
  }

  // Verificar status do servidor Python (com retry)
  checkServerStatus();
  // Retry after 1 second in case background isn't ready
  setTimeout(checkServerStatus, 1000);
  setTimeout(checkServerStatus, 3000);

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
    // Usar prompts.length como fallback quando totalCount=0 (service worker reiniciou)
    const total = message.totalCount || prompts.length || 0;
    updateProgress(message.completedCount, total);
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
        updateStatus('success', 'Sequencia concluida com sucesso!');
      }
    }
  }

  if (message.type === 'downloadStatus') {
    extendElements.extendDownloadBtn.textContent = `[ ${message.text.toUpperCase()} ]`;
    if (message.done) {
      extendElements.extendDownloadBtn.disabled = false;
      extendElements.extendDownloadBtn.textContent = '[ BAIXAR VIDEO FINAL ]';
      if (message.success) {
        updateStatus('success', 'Video baixado com sucesso!');
        chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.lastStatus]: 'Video baixado com sucesso!' });
      } else {
        updateStatus('error', `${message.error || 'Erro ao baixar video.'}`);
        chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.lastStatus]: message.error || 'Erro ao baixar video.' });
      }
    }
  }

  // Server Status Messages
  if (message.type === 'SERVER_STATUS') {
    updateServerUI(message.connected, message.layer);
  }

  // Folder Assignment Messages (from server via background)
  if (message.type === 'FOLDER_ASSIGNED') {
    handleFolderAssignment(message.folder, message.folderName, message.autoAssigned);
  }

  // Server Error Messages
  if (message.type === 'SERVER_ERROR') {
    updateStatus('error', message.error || 'Erro de conexao com servidor');
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

  // Asset Generation Messages
  if (message.type === 'ASSET_STATUS') {
    updateStatus('running', message.text);
    if (message.progress) {
      updateProgress(message.progress.current, message.progress.total);
    }
    if (message.assetsComplete) {
      // Assets done — videos starting automatically
      updateStatus('running', `Assets prontos! Iniciando ${prompts.length} videos...`);
    }
  }

  if (message.type === 'ASSET_ERROR') {
    isRunning = false;
    elements.controlButtons.classList.add('hidden');
    elements.resetBtn.classList.remove('hidden');
    updateStatus('error', `⚠️ ERRO no Asset ${message.assetNumber}: ${message.error}. Gere manualmente e reinicie.`);
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
        updateStatus('success', 'Veo 3 Flow detectado!');
      } else {
        updateStatus('success', 'Pronto para iniciar. Certifique-se de ter um video no Scenebuilder.');
      }
    } else {
      elements.headerStatus.classList.remove('active');
      elements.processBtn.disabled = true;
      extendElements.extendStartBtn.disabled = true;
      extendElements.extendDownloadBtn.disabled = true;

      if (currentMode === 'standard') {
        updateStatus('error', 'Abra o Veo 3 Flow primeiro!');
      } else {
        updateStatus('error', 'Navegue ate o Flow Scenebuilder para usar.');
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
        updateStatus('running', `Gerando... ${response.completedCount}/${prompts.length}`);
      } else {
        // Sessão concluída ou pausada
        elements.controlButtons.classList.add('hidden');

        if (response.missingPrompts && response.missingPrompts.length > 0) {
          showMissingPrompts(response.missingPrompts);
          elements.retryBtn.classList.remove('hidden');
          updateStatus('warning', `${response.missingPrompts.length} prompts faltantes!`);
        } else if (response.completedCount === prompts.length) {
          updateStatus('success', `Concluido! ${response.completedCount} videos baixados`);
        }

        elements.resetBtn.classList.remove('hidden');
      }
    } else if (retryAttempt < 2) {
      // Service Worker pode estar dormindo - retry apos breve delay
      console.log(`[Umbra Flow] restoreState: sem dados, retry ${retryAttempt + 1}/2...`);
      setTimeout(() => restoreState(retryAttempt + 1), 500);
    } else {
      // Após 2 retries sem dados do service worker
      // Fallback: verificar se há prompts com falha salvos no storage local
      chrome.storage.local.get('ff_failed_prompts', (result) => {
        const failedPrompts = result.ff_failed_prompts || [];
        if (failedPrompts.length > 0) {
          const uniqueNumbers = [...new Set(failedPrompts.map(fp => fp.number))];
          // Populate prompts array from storage for display and copy
          if (prompts.length === 0) {
            const seen = new Set();
            for (const fp of failedPrompts) {
              if (!seen.has(fp.number)) {
                seen.add(fp.number);
                prompts.push({
                  number: fp.number,
                  text: fp.text,
                  elements: fp.elements || [],
                  status: 'error',
                  errorType: fp.errorType,
                  errorMessage: fp.errorMessage
                });
              }
            }
            elements.promptListCard?.classList.remove('hidden');
            displayPrompts();
          }
          elements.inputSection.classList.add('hidden');
          elements.settingsCard.classList.add('hidden');
          elements.processBtn.classList.add('hidden');
          elements.progressContainer.classList.remove('hidden');
          showMissingPrompts(uniqueNumbers);
          elements.retryBtn.classList.remove('hidden');
          elements.resetBtn.classList.remove('hidden');
          updateStatus('warning', `${uniqueNumbers.length} prompts com erro da sessão anterior.`);
          console.log(`[Umbra Flow] restoreState: ${uniqueNumbers.length} prompts com erro recuperados do storage local`);
        }
      });
    }
  } catch (error) {
    console.error('Erro ao restaurar estado:', error);
    if (retryAttempt < 2) {
      console.log(`[Umbra Flow] restoreState: erro, retry ${retryAttempt + 1}/2...`);
      setTimeout(() => restoreState(retryAttempt + 1), 500);
    } else {
      // Fallback final
      chrome.storage.local.get('ff_failed_prompts', (result) => {
        const failedPrompts = result.ff_failed_prompts || [];
        if (failedPrompts.length > 0) {
          const uniqueNumbers = [...new Set(failedPrompts.map(fp => fp.number))];
          // Populate prompts array from storage for display and copy
          if (prompts.length === 0) {
            const seen = new Set();
            for (const fp of failedPrompts) {
              if (!seen.has(fp.number)) {
                seen.add(fp.number);
                prompts.push({
                  number: fp.number,
                  text: fp.text,
                  elements: fp.elements || [],
                  status: 'error',
                  errorType: fp.errorType,
                  errorMessage: fp.errorMessage
                });
              }
            }
            elements.promptListCard?.classList.remove('hidden');
            displayPrompts();
          }
          showMissingPrompts(uniqueNumbers);
          elements.retryBtn.classList.remove('hidden');
          elements.resetBtn.classList.remove('hidden');
          updateStatus('warning', `${uniqueNumbers.length} prompts com erro encontrados.`);
        }
      });
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
    updateStatus('error', 'Cole seus prompts primeiro!');
    return;
  }

  // Check if we have JSON data
  if (currentPromptFormat === 'json' && jsonPromptData) {
    processJsonPrompts();
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

    // Check if it's a JSON prompt marker
    const isJsonPrompt = trimmed.includes('[JSON]');

    // Extrair elementos [1, 2, 3] - but not [JSON]
    const elementsMatch = trimmed.match(/\[([0-9,\s]+)\]/);
    let promptElements = [];
    if (elementsMatch && !elementsMatch[1].includes('JSON')) {
      promptElements = elementsMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }

    // Limpar texto do prompt
    let promptText = trimmed
      .replace(/PROMPT\s*\d+\s*/i, '')
      .replace(/\[JSON\]\s*/g, '')
      .replace(/\[[0-9,\s]+\]\s*/g, '')
      .replace(/\|\s*[\d:]+\s*-\s*[\d:]+\s*/g, '')
      .replace(/^:\s*/, '')
      .trim();

    if (promptText) {
      prompts.push({
        number: promptNum,
        elements: promptElements,
        text: `PROMPT ${promptNum}: ${promptText}`,
        status: 'waiting',
        isJson: isJsonPrompt
      });
    }
  }

  prompts.sort((a, b) => a.number - b.number);

  // Also parse assets at this point
  parseAssets();

  if (prompts.length === 0 && parsedAssets.length === 0) {
    updateStatus('error', 'Escreva assim: PROMPT 1 [2]: dancing (onde [2] é a imagem da galeria)');
    return;
  }

  // Atualizar UI
  displayPrompts();
  elements.inputSection.classList.add('hidden');
  elements.settingsCard.classList.add('hidden');
  elements.processBtn.classList.add('hidden');
  elements.promptListCard.classList.remove('hidden');
  elements.startBtn.classList.remove('hidden');

  // Mostrar botão de adicionar a fila
  if (elements.addToQueueBtn) {
    elements.addToQueueBtn.classList.remove('hidden');
  }

  const withElements = prompts.filter(p => p.elements && p.elements.length > 0).length;
  const jsonCount = prompts.filter(p => p.isJson).length;
  let statusMsg = `${prompts.length} prompts prontos!`;
  if (parsedAssets.length > 0) statusMsg += ` + ${parsedAssets.length} assets`;
  if (withElements > 0) statusMsg += ` (${withElements} com elementos)`;
  if (jsonCount > 0) statusMsg += ` (${jsonCount} JSON)`;
  updateStatus('success', statusMsg);
}

function processJsonPrompts() {
  prompts = [];

  let jsonArray = [];
  if (Array.isArray(jsonPromptData)) {
    jsonArray = jsonPromptData;
  } else if (jsonPromptData.prompts && Array.isArray(jsonPromptData.prompts)) {
    jsonArray = jsonPromptData.prompts;
  } else if (jsonPromptData.scenes && Array.isArray(jsonPromptData.scenes)) {
    jsonArray = jsonPromptData.scenes;
  } else {
    jsonArray = [jsonPromptData];
  }

  jsonArray.forEach((jsonPrompt, i) => {
    const promptNum = jsonPrompt._promptNumber || jsonPrompt.promptNumber || (i + 1);

    // Extract elements from JSON - supports "elements", "images", "refs" fields
    let promptElements = [];
    if (Array.isArray(jsonPrompt.elements)) {
      promptElements = jsonPrompt.elements.map(e => parseInt(e)).filter(n => !isNaN(n) && n >= 1 && n <= 24);
    } else if (Array.isArray(jsonPrompt.images)) {
      promptElements = jsonPrompt.images.map(e => parseInt(e)).filter(n => !isNaN(n) && n >= 1 && n <= 24);
    } else if (Array.isArray(jsonPrompt.refs)) {
      promptElements = jsonPrompt.refs.map(e => parseInt(e)).filter(n => !isNaN(n) && n >= 1 && n <= 24);
    } else if (typeof jsonPrompt.elements === 'string') {
      // Support comma-separated string: "1, 5, 12"
      promptElements = jsonPrompt.elements.split(',').map(e => parseInt(e.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 24);
    }

    // Convert JSON to text for display
    let displayText;
    if (typeof jsonPrompt === 'string') {
      displayText = jsonPrompt;
    } else {
      displayText = getJsonPromptSummary(jsonPrompt);
    }

    // Build display text with elements if present
    const elementsDisplay = promptElements.length > 0 ? ` [${promptElements.join(', ')}]` : '';

    prompts.push({
      number: promptNum,
      elements: promptElements,
      text: `PROMPT ${promptNum}${elementsDisplay}: ${displayText}`,
      status: 'waiting',
      isJson: true,
      jsonData: jsonPrompt // Store full JSON for sending to Flow
    });
  });

  prompts.sort((a, b) => a.number - b.number);

  if (prompts.length === 0) {
    updateStatus('error', 'Nenhum prompt JSON encontrado!');
    return;
  }

  // Atualizar UI
  displayPrompts();
  elements.inputSection.classList.add('hidden');
  elements.settingsCard.classList.add('hidden');
  elements.processBtn.classList.add('hidden');
  elements.promptListCard.classList.remove('hidden');
  elements.startBtn.classList.remove('hidden');

  // Mostrar botão de adicionar a fila
  if (elements.addToQueueBtn) {
    elements.addToQueueBtn.classList.remove('hidden');
  }

  updateStatus('success', `${prompts.length} prompts JSON prontos para geracao!`);
}

function displayPrompts() {
  const completed = prompts.filter(p => p.status === 'sent' || p.status === 'completed').length;
  elements.promptCount.textContent = `${completed}/${prompts.length}`;

  elements.promptItems.innerHTML = prompts.map((p, i) => {
    const preview = p.text.substring(0, 35) + (p.text.length > 35 ? '...' : '');

    // Enhanced status icons with more states
    const statusIcon = {
      'waiting': '⏳',
      'pending': '📤',
      'sending': '📤',
      'generating': '🔄',
      'sent': '✅',
      'completed': '✅',
      'error': '❌',
      'retrying': '🔁'
    }[p.status] || '⏳';

    // Status class for CSS
    const statusClass = p.status === 'sent' ? 'completed' : p.status;

    // Visual slots: render based on element count
    let slotsHtml = '';
    if (p.elements && p.elements.length > 0) {
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

    // Show attempts if retrying
    const attemptsHtml = p.attempts && p.attempts > 1
      ? `<span class="prompt-attempts">${p.attempts}x</span>`
      : '';

    return `
      <div class="prompt-item ${statusClass}" data-index="${i}">
        <span class="number">${p.number}</span>
        ${slotsHtml}
        <span class="text" title="${p.text.replace(/"/g, '&quot;')}">${preview}</span>
        ${attemptsHtml}
        <span class="status-icon">${statusIcon}</span>
      </div>
    `;
  }).join('');
}

async function startAutomation() {
  // Parse assets from the assets textarea
  parseAssets();

  if (prompts.length === 0 && parsedAssets.length === 0) {
    updateStatus('error', 'Nenhum prompt ou asset para enviar!');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url.includes('labs.google')) {
    updateStatus('error', 'Abra o Veo 3 Flow primeiro!');
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

  // Informar background sobre a pasta atual
  chrome.runtime.sendMessage({
    action: 'SET_DOWNLOAD_FOLDER',
    folder: getCurrentFolderName()
  });

  // Se há assets, iniciar Fase 1 (geração de imagens) antes dos vídeos
  if (parsedAssets.length > 0) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'startAssetGeneration',
      assets: parsedAssets,
      imageModel: selectedImageModel,
      prompts: prompts,
      settings: settings
    });
    updateStatus('running', `Fase 1: Gerando ${parsedAssets.length} assets...`);
  } else {
    // Sem assets: ir direto para geração de vídeos
    chrome.tabs.sendMessage(tab.id, {
      action: 'startAutomation',
      prompts: prompts,
      settings: settings
    });
    updateStatus('running', `Iniciando geracao de ${prompts.length} videos...`);
  }

  // Atualizar UI
  elements.startBtn.classList.add('hidden');
  elements.controlButtons.classList.remove('hidden');
  elements.progressContainer.classList.remove('hidden');
}

// ========== ASSET FUNCTIONS ==========

function parseAssets() {
  const input = elements.assetsInput ? elements.assetsInput.value.trim() : '';
  parsedAssets = [];

  if (!input) return;

  // Split by ASSET [N] markers
  const lines = input.split(/(?=ASSET\s*\[\d+\])/i).filter(s => s.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Extract asset number: ASSET [N]
    const numMatch = trimmed.match(/ASSET\s*\[(\d+)\]/i);
    if (!numMatch) continue;

    const assetNum = parseInt(numMatch[1]);

    // Extract the prompt text (everything after ASSET [N] — or ASSET [N]: )
    let assetText = trimmed
      .replace(/ASSET\s*\[\d+\]\s*/i, '')
      .replace(/^[—\-:]\s*/, '')
      .trim();

    if (assetText) {
      parsedAssets.push({
        number: assetNum,
        text: assetText
      });
    }
  }

  // Sort by number
  parsedAssets.sort((a, b) => a.number - b.number);
  console.log(`[Umbra Flow] Parsed ${parsedAssets.length} assets`);
}

function selectImageModel(modelName, save = true) {
  selectedImageModel = modelName;

  if (elements.modelNB2 && elements.modelNBPro) {
    if (modelName === 'Nano Banana 2') {
      elements.modelNB2.classList.add('active');
      elements.modelNBPro.classList.remove('active');
    } else {
      elements.modelNB2.classList.remove('active');
      elements.modelNBPro.classList.add('active');
    }
  }

  if (save) {
    chrome.storage.local.set({ ff_image_model: modelName });
  }
}

function updateAssetCount() {
  const input = elements.assetsInput ? elements.assetsInput.value.trim() : '';
  if (!input) {
    if (elements.assetCount) elements.assetCount.textContent = '0 assets';
    return;
  }

  const count = (input.match(/ASSET\s*\[\d+\]/gi) || []).length;
  if (elements.assetCount) {
    elements.assetCount.textContent = `${count} asset${count !== 1 ? 's' : ''}`;
  }
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
          elements.startBtn.textContent = '[ CONTINUAR ]';
          updateStatus('warning', `Pausado. ${response.missingPrompts.length} prompts faltantes.`);
        } else if (response.completedCount === prompts.length) {
          elements.resetBtn.classList.remove('hidden');
          updateStatus('success', `Concluido! ${response.completedCount} videos baixados`);
        } else {
          elements.startBtn.classList.remove('hidden');
          elements.startBtn.textContent = '[ CONTINUAR ]';
          updateStatus('warning', 'Geracao pausada');
        }
      } else {
        // GET_STATE retornou vazio (service worker pode ter reiniciado)
        // Fallback: ler ff_failed_prompts do chrome.storage.local
        chrome.storage.local.get('ff_failed_prompts', (result) => {
          const failedPrompts = result.ff_failed_prompts || [];
          if (failedPrompts.length > 0) {
            const uniqueNumbers = [...new Set(failedPrompts.map(fp => fp.number))];
            showMissingPrompts(uniqueNumbers);
            elements.retryBtn.classList.remove('hidden');
            elements.resetBtn.classList.remove('hidden');
            updateStatus('warning', `Pausado. ${uniqueNumbers.length} prompts com erro encontrados.`);
            console.log(`[Umbra Flow] Sidepanel (stop): ${uniqueNumbers.length} prompts com erro recuperados do storage local`);
          } else {
            elements.startBtn.classList.remove('hidden');
            elements.startBtn.textContent = '[ CONTINUAR ]';
            updateStatus('warning', 'Geracao pausada');
          }
        });
      }
    } catch (e) {
      console.error('[Umbra Flow] Erro ao buscar estado apos stop:', e);
      // Fallback final: tentar chrome.storage.local
      chrome.storage.local.get('ff_failed_prompts', (result) => {
        const failedPrompts = result.ff_failed_prompts || [];
        if (failedPrompts.length > 0) {
          const uniqueNumbers = [...new Set(failedPrompts.map(fp => fp.number))];
          showMissingPrompts(uniqueNumbers);
          elements.retryBtn.classList.remove('hidden');
          elements.resetBtn.classList.remove('hidden');
          updateStatus('warning', `${uniqueNumbers.length} prompts com erro encontrados.`);
        } else {
          elements.startBtn.classList.remove('hidden');
          elements.startBtn.textContent = '[ CONTINUAR ]';
          updateStatus('warning', 'Geracao pausada');
        }
      });
    }
  }, 500);
}

async function cancelAutomation() {
  if (!confirm('Cancelar a geracao atual?')) return;

  await stopAutomation();
  await chrome.runtime.sendMessage({ action: 'RESET_STATE' });

  resetUI();
  updateStatus('info', 'Geracao cancelada');
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
        updateStatus('warning', `${response.missingPrompts.length} faltantes. Retry automatico ${retryCount}/${MAX_RETRIES}...`);

        setTimeout(() => {
          retryMissingPrompts();
        }, 3000);
      } else {
        // Mostrar feedback final
        showMissingPrompts(response.missingPrompts);
        elements.retryBtn.classList.remove('hidden');
        elements.resetBtn.classList.remove('hidden');
        updateStatus('error', `${response.missingPrompts.length} prompts falharam apos ${MAX_RETRIES} tentativas`);
      }
    } else {
      // GET_STATE retornou vazio (service worker pode ter reiniciado)
      // Fallback: ler ff_failed_prompts do chrome.storage.local
      chrome.storage.local.get('ff_failed_prompts', (result) => {
        const failedPrompts = result.ff_failed_prompts || [];
        if (failedPrompts.length > 0) {
          // Deduplicar por número de prompt
          const uniqueNumbers = [...new Set(failedPrompts.map(fp => fp.number))];

          // Populate prompts array from storage so displayPrompts() and copyMissingPrompts() work
          if (prompts.length === 0) {
            const seen = new Set();
            for (const fp of failedPrompts) {
              if (!seen.has(fp.number)) {
                seen.add(fp.number);
                prompts.push({
                  number: fp.number,
                  text: fp.text,
                  elements: fp.elements || [],
                  status: 'error',
                  errorType: fp.errorType,
                  errorMessage: fp.errorMessage
                });
              }
            }
            elements.promptListCard?.classList.remove('hidden');
            displayPrompts();
          }

          showMissingPrompts(uniqueNumbers);
          elements.retryBtn.classList.remove('hidden');
          elements.resetBtn.classList.remove('hidden');
          updateStatus('warning', `${uniqueNumbers.length} prompts com erro. Copie ou tente novamente.`);
          console.log(`[Umbra Flow] Sidepanel: ${uniqueNumbers.length} prompts com erro recuperados do storage local`);
        } else {
          // Sucesso total
          elements.resetBtn.classList.remove('hidden');
          updateStatus('success', `Concluido! Todos os ${prompts.length} videos foram baixados!`);
        }
      });
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
        updateStatus('running', `Retry de ${retryPrompts.length} prompts...`);
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

    // Helper to build prompt text line
    const buildLine = (p) => {
      const elemStr = (p.elements && p.elements.length > 0) ? ` [${p.elements.join(', ')}]` : '';
      const textOnly = p.text.replace(/^PROMPT\s*\d+\s*:\s*/i, '');
      return `PROMPT ${p.number}${elemStr}: ${textOnly}`;
    };

    // Try from prompts array first
    let texts = missingNumbers.map(num => {
      const p = prompts.find(pr => pr.number === num);
      return p ? buildLine(p) : null;
    });

    // Fallback to ff_failed_prompts storage if any are missing
    const missingFromArray = texts.filter(t => t === null).length;
    if (missingFromArray > 0) {
      const result = await chrome.storage.local.get('ff_failed_prompts');
      const failedPrompts = result.ff_failed_prompts || [];
      if (failedPrompts.length > 0) {
        texts = missingNumbers.map(num => {
          const p = prompts.find(pr => pr.number === num);
          if (p) return buildLine(p);
          const fp = failedPrompts.find(f => f.number === num);
          if (fp) return buildLine(fp);
          return `PROMPT ${num}: (texto nao encontrado)`;
        });
      } else {
        texts = texts.map((t, i) => t || `PROMPT ${missingNumbers[i]}: (texto nao encontrado)`);
      }
    }

    const missingTexts = texts.join('\n\n');
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
  if (!confirm('Iniciar nova sessao? O progresso atual sera limpo.')) return;

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

  elements.startBtn.textContent = '[ INICIAR GERACAO ]';
  elements.promptsInput.value = '';
  elements.progressFill.style.width = '0%';
  if (elements.progressText) {
    elements.progressText.textContent = '0%';
  }

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
  if (text.includes('Concluido') || text.includes('OK') || text.includes('sucesso')) return 'success';
  if (text.includes('Erro') || text.includes('falharam')) return 'error';
  if (text.includes('Pausa') || text.includes('faltantes')) return 'warning';
  if (text.includes('Gerando') || text.includes('Enviando') || text.includes('Iniciando')) return 'running';
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
  // Se pasta foi auto-atribuída pelo servidor, não permitir mudança manual
  if (folderAutoAssigned && save) {
    updateStatus('warning', 'Pasta atribuida automaticamente pelo servidor');
    return;
  }

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

function handleFolderAssignment(folderNum, folderName, autoAssigned) {
  console.log(`[Umbra Flow] Pasta atribuida pelo servidor: ${folderNum} (${folderName})`);

  folderAutoAssigned = autoAssigned;
  selectedFolder = folderNum;

  // Atualizar botões
  [1, 2, 3, 4, 5, 6, 7, 8].forEach(num => {
    const btn = folderElements[`folder${num}`];
    if (btn) {
      btn.classList.toggle('active', num === folderNum);
      // Desabilitar botões se auto-atribuído
      if (autoAssigned) {
        btn.disabled = true;
        btn.classList.add('auto-assigned');
      } else {
        btn.disabled = false;
        btn.classList.remove('auto-assigned');
      }
    }
  });

  // Atualizar exibição do caminho
  const displayName = folderName || FOLDER_NAMES[folderNum];
  if (folderElements.folderPath) {
    folderElements.folderPath.textContent = autoAssigned
      ? `${displayName}/ (auto)`
      : `${displayName}/`;
  }

  // Atualizar display no modo Extend também
  if (folderElements.extendFolderDisplay) {
    folderElements.extendFolderDisplay.textContent = `Downloads/${displayName}/`;
  }

  // Salvar localmente
  chrome.storage.local.set({ [FOLDER_STORAGE_KEY]: folderNum });

  updateStatus('success', `Pasta ${folderNum} atribuida automaticamente`);
}

function enableFolderSelection() {
  // Re-habilitar seleção manual de pasta (quando servidor desconecta)
  folderAutoAssigned = false;
  [1, 2, 3, 4, 5, 6, 7, 8].forEach(num => {
    const btn = folderElements[`folder${num}`];
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('auto-assigned');
    }
  });

  // Atualizar exibição do caminho (remover "(auto)")
  const folderName = FOLDER_NAMES[selectedFolder];
  if (folderElements.folderPath) {
    folderElements.folderPath.textContent = `${folderName}/`;
  }
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
    updateStatus('error', 'Insira pelo menos uma cena para estender.');
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
    updateStatus('error', 'Erro ao iniciar automacao.');
    console.error(error);
    resetExtendUI();
    chrome.storage.local.set({ [EXTEND_STORAGE_KEYS.isRunning]: false });
  }
}

async function stopExtendSequence() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'stopSequence' });
  resetExtendUI();
  updateStatus('warning', 'Sequencia interrompida pelo usuario.');
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
  console.log('[Umbra Flow] Sidepanel checking server status...');
  chrome.runtime.sendMessage({ action: 'GET_SERVER_STATUS' }, (response) => {
    console.log('[Umbra Flow] Server status response:', response);
    if (chrome.runtime.lastError) {
      console.error('[Umbra Flow] Error getting status:', chrome.runtime.lastError);
      updateServerUI(false);
      return;
    }
    if (response) {
      console.log('[Umbra Flow] Updating UI - connected:', response.connected);
      updateServerUI(response.connected, response.layer);

      // Se servidor está conectado e tem pasta atribuída
      if (response.connected && response.assignedFolder) {
        handleFolderAssignment(response.assignedFolder, response.folderName, true);
      }
    } else {
      console.log('[Umbra Flow] No response received');
      updateServerUI(false);
    }
  });
}

function updateServerUI(connected, layer = null) {
  console.log('[Umbra Flow] updateServerUI called with connected:', connected);
  serverConnected = connected;

  // Make sure elements exist - re-cache if needed
  if (!serverElements.serverDot) {
    serverElements.serverDot = document.getElementById('serverDot');
  }
  if (!serverElements.serverStatusText) {
    serverElements.serverStatusText = document.getElementById('serverStatusText');
  }
  if (!serverElements.serverDetails) {
    serverElements.serverDetails = document.getElementById('serverDetails');
  }
  if (!serverElements.serverBtn) {
    serverElements.serverBtn = document.getElementById('serverBtn');
  }

  // Check if all elements exist now
  if (!serverElements.serverDot || !serverElements.serverStatusText || !serverElements.serverBtn) {
    console.error('[Umbra Flow] Server elements still not found after re-cache!');
    return;
  }

  if (connected) {
    console.log('[Umbra Flow] Setting UI to ONLINE');
    serverElements.serverDot.classList.remove('offline');
    serverElements.serverDot.classList.add('online');
    serverElements.serverStatusText.textContent = 'Online';
    if (serverElements.serverDetails) {
      serverElements.serverDetails.textContent = 'Modo Robusto ativo';
    }
    serverElements.serverBtn.textContent = 'Parar';
    serverElements.serverBtn.classList.remove('btn-server-start');
    serverElements.serverBtn.classList.add('btn-server-stop');
    currentLayer = layer || 'LAYER 1 (DOM)';
  } else {
    serverElements.serverDot.classList.remove('online');
    serverElements.serverDot.classList.add('offline');
    serverElements.serverStatusText.textContent = 'Offline';
    if (serverElements.serverDetails) {
      serverElements.serverDetails.textContent = 'Modo Direto ativo';
    }
    serverElements.serverBtn.textContent = 'Iniciar';
    serverElements.serverBtn.classList.remove('btn-server-stop');
    serverElements.serverBtn.classList.add('btn-server-start');
    currentLayer = 'MODO DIRETO';

    // Re-habilitar seleção manual de pasta quando servidor desconecta
    enableFolderSelection();
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
  console.log('[Umbra Flow] Button clicked, serverConnected:', serverConnected);
  if (serverConnected) {
    // Parar servidor (desconectar WebSocket)
    chrome.runtime.sendMessage({ action: 'DISCONNECT_SERVER' }, () => {
      updateServerUI(false);
    });
  } else {
    // Tentar conectar ao servidor
    console.log('[Umbra Flow] Sending CONNECT_SERVER...');
    chrome.runtime.sendMessage({ action: 'CONNECT_SERVER' }, (response) => {
      console.log('[Umbra Flow] CONNECT_SERVER response:', response);
      // Check status immediately
      setTimeout(() => {
        console.log('[Umbra Flow] Checking status after connect...');
        checkServerStatus();
      }, 500);
      // Then poll
      startConnectionPolling();
    });
  }
}

function startConnectionPolling() {
  // Verificar a cada 1 segundo por 30 segundos
  let attempts = 0;
  const maxAttempts = 30;

  // Check immediately first
  checkServerStatus();

  const pollInterval = setInterval(() => {
    attempts++;
    console.log('[Umbra Flow] Polling attempt', attempts);

    chrome.runtime.sendMessage({ action: 'GET_SERVER_STATUS' }, (response) => {
      console.log('[Umbra Flow] Poll response:', response);
      if (response && response.connected) {
        console.log('[Umbra Flow] Connected! Stopping poll.');
        clearInterval(pollInterval);
        updateServerUI(true, response.layer);
        if (response.assignedFolder) {
          handleFolderAssignment(response.assignedFolder, response.folderName, true);
        }
      } else if (attempts >= maxAttempts) {
        console.log('[Umbra Flow] Max attempts reached');
        clearInterval(pollInterval);
      }
    });
  }, 1000);
}

// ========== JOB QUEUE FUNCTIONS ==========

async function loadJobCounter() {
  const result = await chrome.storage.local.get([JOB_COUNTER_KEY]);
  nextJobNumber = (result[JOB_COUNTER_KEY] || 0) + 1;
  return nextJobNumber;
}

async function incrementJobCounter() {
  nextJobNumber++;
  await chrome.storage.local.set({ [JOB_COUNTER_KEY]: nextJobNumber - 1 });
  return nextJobNumber;
}

async function resetJobCounter() {
  nextJobNumber = 1;
  await chrome.storage.local.set({ [JOB_COUNTER_KEY]: 0 });
}

function generateJobName(customName = null) {
  const paddedNum = String(nextJobNumber).padStart(2, '0');
  if (customName && customName.trim()) {
    return `Job-${paddedNum}_${customName.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  return `Job-${paddedNum}`;
}

function createJob(prompts, customName = null) {
  const jobName = generateJobName(customName);
  const folderName = getCurrentFolderName();

  return {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: jobName,
    downloadFolder: `${folderName}/${jobName}`,
    prompts: prompts.map(p => ({
      ...p,
      status: 'waiting',
      attempts: 0,
      errors: [],
      startedAt: null,
      completedAt: null
    })),
    status: 'queued', // queued, running, paused, completed, error
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    completedCount: 0,
    errorCount: 0
  };
}

function addJobToQueue(job) {
  jobQueue.push(job);
  incrementJobCounter();
  saveJobQueue();
  updateJobQueueUI();
  return job;
}

function removeJobFromQueue(jobId) {
  const index = jobQueue.findIndex(j => j.id === jobId);
  if (index > -1) {
    jobQueue.splice(index, 1);
    saveJobQueue();
    updateJobQueueUI();
  }
}

async function saveJobQueue() {
  await chrome.storage.local.set({ [JOB_QUEUE_KEY]: jobQueue });
}

async function loadJobQueue() {
  const result = await chrome.storage.local.get([JOB_QUEUE_KEY]);
  jobQueue = result[JOB_QUEUE_KEY] || [];
  await loadJobCounter();
  updateJobQueueUI();
}

function updateJobQueueUI() {
  const queueCard = document.getElementById('jobQueueCard');
  const queueList = document.getElementById('jobQueueList');

  if (!queueCard || !queueList) return;

  if (jobQueue.length === 0) {
    queueCard.classList.add('hidden');
    return;
  }

  queueCard.classList.remove('hidden');

  queueList.innerHTML = jobQueue.map((job, index) => {
    const statusIcon = {
      'queued': '⏳',
      'running': '▶️',
      'paused': '⏸️',
      'completed': '✅',
      'error': '❌'
    }[job.status] || '⏳';

    const progress = job.prompts.length > 0
      ? `${job.completedCount}/${job.prompts.length}`
      : '0/0';

    return `
      <div class="job-item ${job.status}" data-job-id="${job.id}">
        <span class="job-status-icon">${statusIcon}</span>
        <span class="job-name">${job.name}</span>
        <span class="job-progress">${progress}</span>
        ${job.status === 'queued' ? `<button class="job-remove-btn" onclick="removeJobFromQueue('${job.id}')">×</button>` : ''}
      </div>
    `;
  }).join('');
}

function getCurrentJob() {
  if (currentJobIndex >= 0 && currentJobIndex < jobQueue.length) {
    return jobQueue[currentJobIndex];
  }
  return null;
}

function getNextQueuedJob() {
  return jobQueue.find(j => j.status === 'queued');
}

async function startNextJob() {
  const job = getNextQueuedJob();
  if (!job) {
    updateStatus('success', 'Todos os jobs concluidos!');
    return false;
  }

  currentJobIndex = jobQueue.indexOf(job);
  job.status = 'running';
  job.startedAt = Date.now();

  // Set prompts for automation
  prompts = job.prompts;

  saveJobQueue();
  updateJobQueueUI();

  // Start the automation with job-specific folder
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url.includes('labs.google')) {
    updateStatus('error', 'Abra o Veo 3 Flow primeiro!');
    return false;
  }

  isRunning = true;
  retryCount = 0;

  // Inject content script if needed
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => typeof window.ffLabAutomation !== 'undefined'
    });

    if (!result.result) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch (e) {
    console.log('Erro ao verificar/injetar content script:', e);
  }

  const settings = {
    batchSize: parseInt(elements.batchSize.value) || 4,
    promptDelay: parseInt(elements.promptDelay.value) || 2,
    batchPause: parseInt(elements.batchPause.value) || 0,
    downloadFolder: job.downloadFolder
  };

  chrome.tabs.sendMessage(tab.id, {
    action: 'startAutomation',
    prompts: job.prompts,
    settings: settings
  });

  chrome.runtime.sendMessage({
    action: 'SET_DOWNLOAD_FOLDER',
    folder: job.downloadFolder
  });

  elements.startBtn.classList.add('hidden');
  elements.controlButtons.classList.remove('hidden');
  elements.progressContainer.classList.remove('hidden');

  updateStatus('running', `Job "${job.name}": Gerando ${job.prompts.length} videos...`);

  return true;
}

function onJobComplete(success = true) {
  const job = getCurrentJob();
  if (job) {
    job.status = success ? 'completed' : 'error';
    job.completedAt = Date.now();
    saveJobQueue();
    updateJobQueueUI();
  }

  // Check for more jobs
  if (getNextQueuedJob()) {
    updateStatus('info', 'Iniciando proximo job...');
    setTimeout(() => startNextJob(), 2000);
  } else {
    updateStatus('success', 'Todos os jobs da fila concluidos!');
    currentJobIndex = -1;
    elements.controlButtons.classList.add('hidden');
    elements.resetBtn.classList.remove('hidden');
  }
}

function addCurrentToQueue() {
  if (prompts.length === 0) {
    updateStatus('error', 'Processe os prompts primeiro!');
    return;
  }

  const jobNameInput = document.getElementById('jobNameInput');
  const customName = jobNameInput ? jobNameInput.value.trim() : null;

  const job = createJob(prompts, customName);
  addJobToQueue(job);

  // Clear input for next job
  if (jobNameInput) jobNameInput.value = '';
  elements.promptsInput.value = '';
  prompts = [];

  // Reset UI
  elements.promptListCard.classList.add('hidden');
  elements.inputSection.classList.remove('hidden');
  elements.settingsCard.classList.remove('hidden');
  elements.processBtn.classList.remove('hidden');
  elements.startBtn.classList.add('hidden');
  elements.addToQueueBtn.classList.add('hidden');

  // Show queue start button if there are jobs
  if (elements.startQueueBtn) {
    elements.startQueueBtn.classList.toggle('hidden', jobQueue.length === 0);
  }

  updateStatus('success', `Job "${job.name}" adicionado a fila (${jobQueue.length} jobs)`);
}

function startJobQueue() {
  if (jobQueue.length === 0 || !getNextQueuedJob()) {
    updateStatus('error', 'Nenhum job na fila para iniciar');
    return;
  }

  // Hide setup UI
  elements.inputSection.classList.add('hidden');
  elements.settingsCard.classList.add('hidden');
  elements.processBtn.classList.add('hidden');
  if (elements.startQueueBtn) elements.startQueueBtn.classList.add('hidden');
  if (elements.addToQueueBtn) elements.addToQueueBtn.classList.add('hidden');

  // Show progress
  elements.promptListCard.classList.remove('hidden');
  elements.progressContainer.classList.remove('hidden');

  startNextJob();
}

// ========== TXT FILE UPLOAD FUNCTIONS ==========

function setupPromptFileUpload() {
  // Standard Mode TXT/JSON Upload
  const fileInput = document.getElementById('promptFileInput');
  const uploadBtn = document.getElementById('uploadPromptsBtn');

  if (fileInput && uploadBtn) {
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      const isJson = fileName.endsWith('.json');
      const isTxt = fileName.endsWith('.txt');

      if (!isJson && !isTxt) {
        updateStatus('error', 'Apenas arquivos .txt ou .json sao aceitos');
        fileInput.value = '';
        return;
      }

      try {
        const text = await file.text();

        if (isJson) {
          // Parse JSON file
          const result = parseJsonPromptFile(text, file.name);
          if (result.success) {
            elements.promptsInput.value = result.displayText;
            jsonPromptData = result.jsonData;
            currentPromptFormat = 'json';
            updateFormatIndicator('json', `${result.promptCount} prompts JSON`);
            updateStatus('success', `${result.promptCount} prompts JSON carregados de "${file.name}"`);
          } else {
            updateStatus('error', result.error);
          }
        } else {
          // Check if TXT content might be JSON
          const trimmed = text.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            // Might be JSON, try to parse
            const result = parseJsonPromptFile(text, file.name);
            if (result.success) {
              elements.promptsInput.value = result.displayText;
              jsonPromptData = result.jsonData;
              currentPromptFormat = 'json';
              updateFormatIndicator('json', `${result.promptCount} prompts JSON (detectado)`);
              updateStatus('success', `${result.promptCount} prompts JSON detectados em "${file.name}"`);
            } else {
              // Not valid JSON, treat as text
              parseTextPromptFile(text, file.name);
            }
          } else {
            // Regular text file
            parseTextPromptFile(text, file.name);
          }
        }

        // Feedback visual no botão
        uploadBtn.innerHTML = '<span class="upload-icon">✓</span> Carregado!';
        setTimeout(() => {
          uploadBtn.innerHTML = '<span class="upload-icon">📄</span> Carregar TXT/JSON';
        }, 2000);

      } catch (err) {
        console.error('[Umbra Flow] Erro ao ler arquivo:', err);
        updateStatus('error', 'Erro ao ler arquivo');
      }

      // Reset input para permitir mesmo arquivo novamente
      fileInput.value = '';
    });
  }

  // Also add listener for textarea changes to auto-detect JSON
  if (elements.promptsInput) {
    elements.promptsInput.addEventListener('input', debounce(() => {
      detectPromptFormat(elements.promptsInput.value);
    }, 500));
  }

  // Extend Mode TXT Upload
  const extendFileInput = document.getElementById('extendFileInput');
  const extendUploadBtn = document.getElementById('uploadExtendBtn');

  if (extendFileInput && extendUploadBtn) {
    extendUploadBtn.addEventListener('click', () => extendFileInput.click());

    extendFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Verificar se é arquivo TXT
      if (!file.name.toLowerCase().endsWith('.txt')) {
        updateStatus('error', 'Apenas arquivos .txt sao aceitos');
        extendFileInput.value = '';
        return;
      }

      try {
        const text = await file.text();

        // Parse cenas - uma por linha (no Extend mode)
        const scenes = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (scenes.length === 0) {
          updateStatus('error', 'Nenhuma cena encontrada no arquivo');
          extendFileInput.value = '';
          return;
        }

        // Preencher textarea do Extend
        extendElements.extendPromptsInput.value = scenes.join('\n');

        // Atualizar contador
        updateExtendCount();

        updateStatus('success', `${scenes.length} cenas carregadas de "${file.name}"`);

        // Feedback visual no botão
        extendUploadBtn.innerHTML = '<span class="upload-icon">✓</span> Carregado!';
        setTimeout(() => {
          extendUploadBtn.innerHTML = '<span class="upload-icon">📄</span> Carregar TXT';
        }, 2000);

      } catch (err) {
        console.error('[Umbra Flow] Erro ao ler arquivo:', err);
        updateStatus('error', 'Erro ao ler arquivo TXT');
      }

      // Reset input
      extendFileInput.value = '';
    });
  }
}

function parseTextPromptFile(text, fileName) {
  // Parse prompts - separados por linha em branco
  const promptBlocks = text
    .split(/\n\s*\n/) // Split por linhas em branco
    .map(block => block.trim())
    .filter(block => block.length > 0);

  if (promptBlocks.length === 0) {
    updateStatus('error', 'Nenhum prompt encontrado no arquivo');
    return;
  }

  // Preencher textarea
  elements.promptsInput.value = promptBlocks.join('\n\n');
  currentPromptFormat = 'text';
  jsonPromptData = null;
  updateFormatIndicator('txt', 'Modo texto padrao');

  updateStatus('success', `${promptBlocks.length} prompts carregados de "${fileName}"`);
}

function parseJsonPromptFile(text, fileName) {
  try {
    const json = JSON.parse(text);

    // Support multiple JSON formats
    let prompts = [];

    if (Array.isArray(json)) {
      // Array of prompts
      prompts = json;
    } else if (json.prompts && Array.isArray(json.prompts)) {
      // Object with prompts array
      prompts = json.prompts;
    } else if (json.scenes && Array.isArray(json.scenes)) {
      // Veo 3 format with scenes
      prompts = json.scenes.map((scene, i) => ({
        ...scene,
        _promptNumber: i + 1
      }));
    } else if (typeof json === 'object') {
      // Single prompt object
      prompts = [json];
    }

    if (prompts.length === 0) {
      return { success: false, error: 'Nenhum prompt encontrado no JSON' };
    }

    // Create display text for textarea
    const displayText = prompts.map((p, i) => {
      const num = p._promptNumber || p.promptNumber || (i + 1);
      if (typeof p === 'string') {
        return `PROMPT ${num}: ${p}`;
      }
      // Extract elements for display
      let elementsStr = '';
      if (Array.isArray(p.elements) && p.elements.length > 0) {
        elementsStr = ` [${p.elements.join(', ')}]`;
      } else if (Array.isArray(p.images) && p.images.length > 0) {
        elementsStr = ` [${p.images.join(', ')}]`;
      } else if (Array.isArray(p.refs) && p.refs.length > 0) {
        elementsStr = ` [${p.refs.join(', ')}]`;
      }
      // For JSON objects, create a summary
      const summary = getJsonPromptSummary(p);
      return `PROMPT ${num}${elementsStr} [JSON]: ${summary}`;
    }).join('\n\n');

    return {
      success: true,
      jsonData: json,
      prompts: prompts,
      promptCount: prompts.length,
      displayText: displayText
    };

  } catch (e) {
    return { success: false, error: `JSON invalido: ${e.message}` };
  }
}

function getJsonPromptSummary(jsonPrompt) {
  // Create a human-readable summary of a JSON prompt
  const parts = [];

  if (jsonPrompt.subject?.description) {
    parts.push(jsonPrompt.subject.description.substring(0, 50));
  }
  if (jsonPrompt.action) {
    parts.push(jsonPrompt.action.substring(0, 30));
  }
  if (jsonPrompt.scene?.location) {
    parts.push(`@ ${jsonPrompt.scene.location}`);
  }
  if (jsonPrompt.shot?.composition) {
    parts.push(`(${jsonPrompt.shot.composition})`);
  }

  if (parts.length === 0) {
    // Fallback: use first few keys
    const keys = Object.keys(jsonPrompt).slice(0, 3);
    return keys.join(', ') + '...';
  }

  return parts.join(' | ');
}

function detectPromptFormat(text) {
  const trimmed = text.trim();

  if (!trimmed) {
    updateFormatIndicator(null);
    return;
  }

  // Check if it looks like JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json = JSON.parse(trimmed);
      currentPromptFormat = 'json';
      jsonPromptData = json;
      updateFormatIndicator('json', 'JSON detectado');
      return;
    } catch (e) {
      // Not valid JSON
    }
  }

  // Check for JSON markers in prompts
  if (trimmed.includes('[JSON]')) {
    updateFormatIndicator('json', 'Prompts JSON');
    return;
  }

  // Regular text
  currentPromptFormat = 'text';
  jsonPromptData = null;
  updateFormatIndicator('txt', 'Modo texto');
}

function updateFormatIndicator(format, text = null) {
  const indicator = document.getElementById('promptFormatIndicator');
  const badge = document.getElementById('formatBadge');
  const formatText = document.getElementById('formatText');

  if (!indicator || !badge || !formatText) return;

  if (!format) {
    indicator.classList.add('hidden');
    return;
  }

  indicator.classList.remove('hidden');
  badge.className = `format-badge ${format}`;
  badge.textContent = format.toUpperCase();
  formatText.textContent = text || (format === 'json' ? 'Modo JSON' : 'Modo texto');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
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
    updateGrokStatusUI(false, 'Chave invalida');
    return;
  }

  // Validar formato básico (xai-...)
  if (!apiKey.startsWith('xai-')) {
    updateGrokStatusUI(false, 'Formato invalido');
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
      text.textContent = customText || 'Nao configurado';
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

  console.log(`[Umbra Flow] Prompt ${promptNumber} adicionado a fila de fix. Total na fila: ${fixQueue.length}`);
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
    updateStatus('info', `Corrigindo ${pendingFixes.length} prompts com Grok AI...`);
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
    <div class="card-title">// RELATORIO FINAL</div>
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
          ${errorStats.policy > 0 ? `<span class="error-type policy">Politica: ${errorStats.policy}</span>` : ''}
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
            Reenviar ${fixQueueStatus.fixed} Prompts Corrigidos
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
    updateStatus('success', `Excelente! ${successRate}% de sucesso`);
  } else if (successRate >= 80) {
    updateStatus('warning', `${successRate}% de sucesso - ${errorCount} erros`);
  } else {
    updateStatus('error', `${successRate}% de sucesso - Verifique os erros`);
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
    updateStatus('running', `Reenviando ${retryPrompts.length} prompts corrigidos pelo Grok...`);
  }
}
