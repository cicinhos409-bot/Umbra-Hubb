// ═══════════════════════════════════════════════════════
// UMBRA UNIFIED AUTOMATION - Content Script (Panel)
// Funciona em ChatGPT e Claude. Detecta plataforma,
// injeta painel flutuante e orquestra mensagens, imagens
// e links para o service worker.
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';
  if (document.getElementById('umbra-panel-wrapper')) return;

  // ─── Platform detection ───────────────────────────
  const host = location.hostname;
  const PLATFORM = host.includes('claude.ai') ? 'claude'
                 : (host.includes('chatgpt.com') || host.includes('chat.openai.com')) ? 'chatgpt'
                 : host.includes('gemini.google.com') ? 'gemini'
                 : null;
  if (!PLATFORM) return;

  const PLATFORM_NAME = PLATFORM === 'claude' ? 'Claude'
                      : PLATFORM === 'gemini' ? 'Gemini'
                      : 'ChatGPT';

  // ─── Inject panel HTML ────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.id = 'umbra-panel-wrapper';
  wrapper.classList.add('umbra-visible');
  wrapper.innerHTML = `
    <div id="umbra-panel">
      <div id="umbra-header">
        <div class="umbra-logo">
          <div class="umbra-logo-icon">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
          </div>
          <span class="umbra-title"><span>Umbra</span> Unified <small style="opacity:.65;font-weight:500">· ${PLATFORM_NAME}</small></span>
        </div>
        <div class="umbra-header-btns">
          <button class="umbra-btn-icon" id="umbra-minimize-btn" title="Minimizar">─</button>
          <button class="umbra-btn-icon" id="umbra-close-btn" title="Fechar">✕</button>
        </div>
      </div>

      <!-- License view -->
      <div id="umbra-view-activation">
        <div class="umbra-license-icon">🔐</div>
        <p class="umbra-license-desc">Insira sua licença do Umbra Hub para liberar o acesso:</p>
        <div class="umbra-license-input-group">
          <input type="text" id="umbra-key-input" placeholder="UMBRA-XXXX-XXXX-XXXX" spellcheck="false" autocomplete="off" />
        </div>
        <button id="umbra-activate-btn" class="umbra-btn-activate">Ativar Agora</button>
        <p id="umbra-license-error"></p>
        <a href="https://umbrahubb.vercel.app/" target="_blank" class="umbra-license-link">Obter licença →</a>
      </div>

      <!-- App view -->
      <div id="umbra-view-app" style="display:none">
        <div id="umbra-body">

          <div id="umbra-status"><span class="umbra-spinner"></span> <span id="umbra-status-text">Automação em execução...</span></div>

          <!-- Progress bar -->
          <div id="umbra-progress-wrap" style="display:none;">
            <div class="umbra-progress-label">
              <span id="umbra-progress-step">0 / 0</span>
              <span id="umbra-progress-pct">0%</span>
            </div>
            <div class="umbra-progress-track"><div id="umbra-progress-fill"></div></div>
          </div>

          <div id="umbra-review">
            <strong>🌟 Curtindo a extensão?</strong>
            <p>Deixe uma avaliação e nos ajude a crescer!</p>
            <div class="umbra-review-btns">
              <button class="umbra-rate-now" id="umbra-rate-now">Avaliar agora</button>
              <button class="umbra-rate-later" id="umbra-rate-later">Depois</button>
              <button class="umbra-rate-never" id="umbra-rate-never">Não mostrar</button>
            </div>
          </div>

          <div class="umbra-section">
            <label class="umbra-label">Nova mensagem</label>
            <div class="umbra-input-group">
              <textarea id="umbra-message-input" placeholder="Digite a mensagem e pressione + para adicionar..."></textarea>
              <div class="umbra-input-actions">
                <select id="umbra-var-select" title="Inserir variável">
                  <option value="" disabled selected>Vars</option>
                  <option value="NEW_VAR">+ Nova</option>
                </select>
                <button id="umbra-add-btn" title="Adicionar à fila">+</button>
              </div>
            </div>
            <div class="umbra-input-meta">
              <div class="umbra-var-hint">Use <strong>{{x}}</strong> para variáveis dinâmicas.</div>
              <span id="umbra-char-count" class="umbra-char-count">0</span>
            </div>

            <!-- Attachments row -->
            <div class="umbra-attach-row">
              <button class="umbra-attach-btn" id="umbra-img-btn" title="Anexar imagens">📎 Imagem</button>
              <button class="umbra-attach-btn" id="umbra-link-btn" title="Adicionar link">🔗 Link</button>
              <input type="file" id="umbra-file-input" accept="image/*" multiple style="display:none" />
            </div>
            <div id="umbra-attach-preview"></div>
          </div>

          <div class="umbra-section">
            <label class="umbra-label">Fila de mensagens</label>
            <div id="umbra-messages-box">
              <div id="umbra-messages-list"><div class="umbra-msg-empty">Nenhuma mensagem adicionada</div></div>
              <div class="umbra-msg-actions">
                <button id="umbra-save-seq-btn">💾 Salvar</button>
                <button id="umbra-import-txt-btn" title="Importar prompts de arquivo .txt ou .csv (um por linha)">📥 TXT/CSV</button>
                <button id="umbra-clear-btn">🗑 Limpar</button>
                <input type="file" id="umbra-txt-input" accept=".txt,.csv,text/plain,text/csv" style="display:none" />
              </div>
            </div>
          </div>

          <div class="umbra-section">
            <div class="umbra-tpl-header" id="umbra-snip-toggle">
              <label class="umbra-label" style="cursor:pointer;margin:0">⚡ Snippets <span style="color:#4b5563;font-size:9px;font-weight:400;text-transform:none">· digite / no campo</span></label>
              <span class="umbra-tpl-arrow" id="umbra-snip-arrow">▶</span>
            </div>
            <div id="umbra-snippets-panel" style="display:none"></div>
          </div>

          <div class="umbra-section">
            <div class="umbra-tpl-header" id="umbra-tpl-toggle">
              <label class="umbra-label" style="cursor:pointer;margin:0">📋 Templates rápidos</label>
              <span class="umbra-tpl-arrow" id="umbra-tpl-arrow">▶</span>
            </div>
            <div id="umbra-templates-list" style="display:none"></div>
          </div>

          <div class="umbra-section">
            <label class="umbra-label">Sequências salvas</label>
            <div class="umbra-seq-row">
              <select id="umbra-seq-dropdown"><option value="" disabled selected>Salve uma sequência primeiro</option></select>
              <button id="umbra-load-seq" title="Carregar na fila">↓</button>
              <button id="umbra-delete-seq" title="Excluir sequência">✕</button>
            </div>
            <div class="umbra-seq-io">
              <button id="umbra-export-btn" title="Exportar todas as sequências">⇪ Exportar</button>
              <button id="umbra-import-btn" title="Importar sequências">⇩ Importar</button>
              <input type="file" id="umbra-import-input" accept="application/json" style="display:none" />
            </div>
          </div>

          <div class="umbra-section">
            <label class="umbra-label">Configurações</label>
            <div class="umbra-settings">
              <label class="umbra-set-row">
                <span>Intervalo entre mensagens (ms)</span>
                <input type="number" id="umbra-cooldown" min="500" max="30000" step="500" value="2000" />
              </label>
              <label class="umbra-set-row">
                <span>Repetir a fila</span>
                <input type="number" id="umbra-loop-count" min="1" max="50" value="1" />
              </label>
              <label class="umbra-set-row umbra-set-toggle">
                <span>🔔 Som ao terminar</span>
                <input type="checkbox" id="umbra-sound-toggle" checked />
              </label>
              <label class="umbra-set-row umbra-set-toggle">
                <span>⏩ Pular erros automaticamente</span>
                <input type="checkbox" id="umbra-skip-errors" />
              </label>
              <label class="umbra-set-row umbra-set-toggle">
                <span>♾ Loop infinito</span>
                <input type="checkbox" id="umbra-infinite-loop" />
              </label>
              <label class="umbra-set-row umbra-set-toggle">
                <span>📤 Copiar resposta auto</span>
                <input type="checkbox" id="umbra-auto-copy" />
              </label>
              <label class="umbra-set-row umbra-set-toggle">
                <span>📸 Screenshot da resposta</span>
                <input type="checkbox" id="umbra-auto-screenshot" />
              </label>
              <label class="umbra-set-row">
                <span>🎯 Parar se contém</span>
                <input type="text" id="umbra-stop-if-contains" placeholder="palavra-chave…" style="width:110px;background:#0d0d0f;border:1px solid rgba(139,92,246,0.3);border-radius:6px;color:#e5e7eb;padding:4px 7px;font-size:12px;outline:none;" />
              </label>
            </div>
          </div>

          <div class="umbra-section">
            <div class="umbra-send-row">
              <button id="umbra-new-chat-btn" title="Abrir novo chat antes de enviar">🆕</button>
              <button id="umbra-send-btn">▶ Enviar Mensagens</button>
            </div>
            <div id="umbra-running-row" style="display:none">
              <button id="umbra-pause-btn">⏸ Pausar</button>
              <button id="umbra-stop-btn">⏹ Parar</button>
            </div>
          </div>
        </div>

        <div id="umbra-footer">
          <a href="https://umbrahubb.vercel.app/" target="_blank" class="umbra-footer-link">🌐 umbrahubb.vercel.app</a>
          <button id="umbra-logout-btn" class="umbra-logout-btn" title="Sair da licença">Sair</button>
        </div>
      </div>

      <div id="umbra-resizer">⋰</div>

      <!-- Variable input modal -->
      <div id="umbra-var-modal">
        <div class="umbra-var-modal-box">
          <div class="umbra-var-modal-title">📝 Preencha as variáveis</div>
          <div id="umbra-var-modal-fields"></div>
          <div class="umbra-var-modal-btns">
            <button id="umbra-var-modal-cancel">Cancelar</button>
            <button id="umbra-var-modal-ok">▶ Enviar</button>
          </div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(wrapper);

  // ─── Element refs ─────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const panel = $('umbra-panel');
  const header = $('umbra-header');
  const minimizeBtn = $('umbra-minimize-btn');
  const closeBtn = $('umbra-close-btn');
  const viewActivation = $('umbra-view-activation');
  const viewApp = $('umbra-view-app');
  const keyInput = $('umbra-key-input');
  const activateBtn = $('umbra-activate-btn');
  const licenseError = $('umbra-license-error');
  const logoutBtn = $('umbra-logout-btn');
  const statusEl = $('umbra-status');
  const statusText = $('umbra-status-text');
  const progressWrap = $('umbra-progress-wrap');
  const progressStep = $('umbra-progress-step');
  const progressPct = $('umbra-progress-pct');
  const progressFill = $('umbra-progress-fill');
  const reviewEl = $('umbra-review');
  const msgInput = $('umbra-message-input');
  const varSelect = $('umbra-var-select');
  const addBtn = $('umbra-add-btn');
  const msgList = $('umbra-messages-list');
  const saveSeqBtn = $('umbra-save-seq-btn');
  const clearBtn = $('umbra-clear-btn');
  const seqDropdown = $('umbra-seq-dropdown');
  const loadSeqBtn = $('umbra-load-seq');
  const deleteSeqBtn = $('umbra-delete-seq');
  const exportBtn = $('umbra-export-btn');
  const importBtn = $('umbra-import-btn');
  const importInput = $('umbra-import-input');
  const sendBtn = $('umbra-send-btn');
  const stopBtn = $('umbra-stop-btn');
  const resizer = $('umbra-resizer');
  const imgBtn = $('umbra-img-btn');
  const linkBtn = $('umbra-link-btn');
  const fileInput = $('umbra-file-input');
  const attachPreview = $('umbra-attach-preview');
  const cooldownInput = $('umbra-cooldown');
  const loopCountInput = $('umbra-loop-count');
  const rateNowBtn = $('umbra-rate-now');
  const rateLaterBtn = $('umbra-rate-later');
  const rateNeverBtn = $('umbra-rate-never');
  const varModal = $('umbra-var-modal');
  const varModalFields = $('umbra-var-modal-fields');
  const varModalOk = $('umbra-var-modal-ok');
  const varModalCancel = $('umbra-var-modal-cancel');
  const charCount = $('umbra-char-count');
  const newChatBtn = $('umbra-new-chat-btn');
  const infiniteLoopToggle = $('umbra-infinite-loop');
  const autoCopyToggle = $('umbra-auto-copy');
  const autoScreenshotToggle = $('umbra-auto-screenshot');
  const stopIfContainsInput = $('umbra-stop-if-contains');
  const importTxtBtn = $('umbra-import-txt-btn');
  const txtInput = $('umbra-txt-input');
  const soundToggle = $('umbra-sound-toggle');
  const skipErrorsToggle = $('umbra-skip-errors');
  const pauseBtn = $('umbra-pause-btn');
  const runningRow = $('umbra-running-row');

  // ─── State ────────────────────────────────────────
  // messages items now shape: { text, images:[{dataUrl,name}], links:[] }
  let messages = [];
  let savedSequences = {};
  let draftImages = [];
  let draftLinks = [];
  let isMinimized = false;
  let settings = { cooldown: 2000, loop: 1, sound: true, skipErrors: false, infiniteLoop: false, autoCopy: false, autoScreenshot: false, stopIfContains: '' };

  // ═══════════════════════════════════════════════════
  // LICENSE
  // ═══════════════════════════════════════════════════
  function showActivation() {
    viewActivation.style.display = 'flex';
    viewApp.style.display = 'none';
    panel.style.width = '420px';
    panel.style.height = '650px';
  }
  function showApp() {
    viewActivation.style.display = 'none';
    viewApp.style.display = 'flex';
    panel.style.width = '420px';
    panel.style.height = '650px';
    loadAppData();
  }

  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
    if (response && response.valido) showApp(); else showActivation();
  });

  activateBtn.addEventListener('click', () => {
    const chave = keyInput.value.trim().toUpperCase();
    if (!chave) return;
    activateBtn.disabled = true;
    activateBtn.textContent = 'Validando...';
    licenseError.textContent = '';
    chrome.runtime.sendMessage({ action: 'ACTIVATE', chave }, (response) => {
      activateBtn.disabled = false;
      activateBtn.textContent = 'Ativar Agora';
      if (response && response.valido) showApp();
      else licenseError.textContent = (response && response.motivo) || 'Chave inválida ou limite atingido.';
    });
  });
  keyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') activateBtn.click(); });
  logoutBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'LOGOUT' }, () => { messages = []; savedSequences = {}; showActivation(); });
  });

  // ═══════════════════════════════════════════════════
  // APP DATA
  // ═══════════════════════════════════════════════════
  function loadAppData() {
    chrome.storage.local.get(['umbra_messages', 'umbra_sequences', 'isRunning', 'showReviewBanner', 'umbra_settings'], (data) => {
      if (data.umbra_messages) { messages = data.umbra_messages; renderMessages(); }
      if (data.umbra_sequences) { savedSequences = data.umbra_sequences; renderSequences(); }
      if (data.umbra_settings) { Object.assign(settings, data.umbra_settings); applySettings(); }
      if (data.isRunning) setUIRunning(true);
      if (data.showReviewBanner) reviewEl.style.display = 'block';
      refreshVarDropdown();
    });
  }

  function applySettings() {
    cooldownInput.value = settings.cooldown;
    loopCountInput.value = settings.loop;
    soundToggle.checked = settings.sound !== false;
    skipErrorsToggle.checked = !!settings.skipErrors;
    infiniteLoopToggle.checked = !!settings.infiniteLoop;
    autoCopyToggle.checked = !!settings.autoCopy;
    autoScreenshotToggle.checked = !!settings.autoScreenshot;
    stopIfContainsInput.value = settings.stopIfContains || '';
    // When infinite loop is on, hide the loop count field
    loopCountInput.closest('label').style.display = settings.infiniteLoop ? 'none' : '';
  }
  function saveSettings() { chrome.storage.local.set({ umbra_settings: settings }); }
  cooldownInput.addEventListener('change', () => { settings.cooldown = parseInt(cooldownInput.value, 10) || 2000; saveSettings(); });
  loopCountInput.addEventListener('change', () => { settings.loop = Math.max(1, parseInt(loopCountInput.value, 10) || 1); saveSettings(); });
  soundToggle.addEventListener('change', () => { settings.sound = soundToggle.checked; saveSettings(); });
  skipErrorsToggle.addEventListener('change', () => { settings.skipErrors = skipErrorsToggle.checked; saveSettings(); });
  infiniteLoopToggle.addEventListener('change', () => {
    settings.infiniteLoop = infiniteLoopToggle.checked;
    loopCountInput.closest('label').style.display = settings.infiniteLoop ? 'none' : '';
    saveSettings();
  });
  autoCopyToggle.addEventListener('change', () => { settings.autoCopy = autoCopyToggle.checked; saveSettings(); });
  autoScreenshotToggle.addEventListener('change', () => { settings.autoScreenshot = autoScreenshotToggle.checked; saveSettings(); });
  stopIfContainsInput.addEventListener('input', () => { settings.stopIfContains = stopIfContainsInput.value.trim(); saveSettings(); });

  // ─── Background messages ──────────────────────────
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'togglePanel') {
      wrapper.classList.toggle('umbra-visible');
    } else if (request.action === 'automationFinished') {
      handleAutomationFinished();
    } else if (request.action === 'progress') {
      updateProgress(request.step, request.total, request.text, request.run, request.infinite);
    } else if (request.action === 'error') {
      statusEl.style.display = 'flex';
      statusEl.classList.remove('umbra-success');
      statusEl.innerHTML = '⚠ ' + (request.message || 'Erro na automação');
    } else if (request.action === 'paused') {
      paused = true;
      pauseBtn.textContent = '▶ Retomar';
      pauseBtn.classList.add('umbra-paused');
      statusEl.style.display = 'flex';
      statusEl.innerHTML = '⏸ Automação pausada — clique em Retomar para continuar';
      if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    } else if (request.action === 'resumed') {
      paused = false;
      pauseBtn.textContent = '⏸ Pausar';
      pauseBtn.classList.remove('umbra-paused');
      statusEl.innerHTML = '<span class="umbra-spinner"></span> Retomando...';
    } else if (request.action === 'skipped') {
      statusEl.style.display = 'flex';
      statusEl.innerHTML = `⏩ Pulado ${request.step}/${request.total} · continuando...`;
    } else if (request.action === 'loopReset') {
      statusEl.style.display = 'flex';
      statusEl.innerHTML = `<span class="umbra-spinner"></span> ♾ Rodada ${request.run} iniciando...`;
      progressFill.style.width = '0%';
      progressStep.textContent = `0 / ?`;
      progressPct.textContent = '0%';
    } else if (request.action === 'stoppedByKeyword') {
      if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
      paused = false;
      playDoneSound();
      setUIRunning(false);
      statusEl.style.display = 'flex';
      statusEl.classList.add('umbra-success');
      statusEl.innerHTML = `🎯 Parado — palavra-chave detectada: <em>${esc(request.keyword || '')}</em>`;
      progressFill.style.width = '100%';
      setTimeout(() => { statusEl.style.display = 'none'; statusEl.classList.remove('umbra-success'); progressWrap.style.display = 'none'; }, 5000);
    }
  });

  // ─── Drag ─────────────────────────────────────────
  let dragging = false, dragOffX = 0, dragOffY = 0;
  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('.umbra-btn-icon')) return;
    dragging = true;
    const r = wrapper.getBoundingClientRect();
    dragOffX = e.clientX - r.left;
    dragOffY = e.clientY - r.top;
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    let x = e.clientX - dragOffX, y = e.clientY - dragOffY;
    const mv = 60;
    x = Math.max(-wrapper.offsetWidth + mv, Math.min(x, window.innerWidth - mv));
    y = Math.max(0, Math.min(y, window.innerHeight - mv));
    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
    wrapper.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => { if (dragging) { dragging = false; document.body.style.userSelect = ''; } });

  // ─── Minimize / Close ─────────────────────────────
  minimizeBtn.addEventListener('click', () => {
    isMinimized = !isMinimized;
    panel.classList.toggle('umbra-minimized', isMinimized);
    minimizeBtn.textContent = isMinimized ? '▢' : '─';
  });
  closeBtn.addEventListener('click', () => { wrapper.classList.remove('umbra-visible'); });

  // ─── Resize ──────────────────────────────────────
  let resizing = false, rsX = 0, rsY = 0, rsW = 0, rsH = 0;
  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault(); e.stopPropagation();
    resizing = true; rsX = e.clientX; rsY = e.clientY;
    rsW = panel.offsetWidth; rsH = panel.offsetHeight;
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', (e) => {
    if (!resizing) return;
    panel.style.width = Math.max(340, rsW + (e.clientX - rsX)) + 'px';
    panel.style.height = Math.max(320, rsH + (e.clientY - rsY)) + 'px';
  });
  document.addEventListener('mouseup', () => { if (resizing) { resizing = false; document.body.style.userSelect = ''; } });

  // ═══════════════════════════════════════════════════
  // VARIABLES
  // ═══════════════════════════════════════════════════
  function getVariables() {
    const vars = new Set();
    const scan = (str) => { const r = /\{\{(.*?)\}\}/g; let m; while ((m = r.exec(str)) !== null) if (m[1].trim()) vars.add(m[1].trim()); };
    messages.forEach((m) => scan(m.text));
    scan(msgInput.value);
    return Array.from(vars);
  }
  function refreshVarDropdown() {
    varSelect.innerHTML = `<option value="" disabled selected>Vars</option><option value="NEW_VAR">+ Nova</option>`;
    getVariables().forEach((v) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v; varSelect.appendChild(o);
    });
  }
  msgInput.addEventListener('input', refreshVarDropdown);
  msgInput.addEventListener('input', () => {
    charCount.textContent = msgInput.value.length;
    charCount.style.color = msgInput.value.length > 3000 ? '#f87171' : msgInput.value.length > 2000 ? '#fbbf24' : '#4b5563';
  });
  varSelect.addEventListener('change', function () {
    const val = this.value;
    if (val === 'NEW_VAR') { const n = prompt('Nome da nova variável:'); if (n && n.trim()) { insertAtCursor(`{{${n.trim()}}}`); refreshVarDropdown(); } }
    else if (val) insertAtCursor(`{{${val}}}`);
    this.value = '';
  });
  function insertAtCursor(text) {
    const s = msgInput.selectionStart, v = msgInput.value;
    msgInput.value = v.slice(0, s) + text + v.slice(msgInput.selectionEnd);
    msgInput.focus(); msgInput.setSelectionRange(s + text.length, s + text.length);
  }

  // ═══════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════
  const TEMPLATES = [
    { cat: '📝 Texto', items: [
      { label: 'Resumir em 5 bullets', text: 'Resuma o seguinte em exatamente 5 pontos curtos e diretos:\n\n' },
      { label: 'Reescrever formal', text: 'Reescreva o texto abaixo em tom formal e profissional, mantendo a ideia central:\n\n' },
      { label: 'Reescrever casual', text: 'Reescreva o texto abaixo em linguagem casual e conversacional:\n\n' },
      { label: 'Corrigir gramática', text: 'Corrija todos os erros de gramática, ortografia e estilo sem alterar o sentido:\n\n' },
      { label: 'Expandir texto', text: 'Expanda o texto abaixo com mais detalhes e exemplos, mantendo o tom:\n\n' },
    ]},
    { cat: '🎬 Vídeo', items: [
      { label: 'Roteiro Short 45s', text: 'Escreva um roteiro de Short para YouTube de 45 segundos sobre: ' },
      { label: '10 títulos virais', text: 'Gere 10 títulos virais para um vídeo sobre: ' },
      { label: 'Hook de abertura', text: 'Crie 5 hooks de abertura (primeiros 3 segundos) para um vídeo sobre: ' },
      { label: 'Descrição + hashtags', text: 'Escreva uma descrição SEO de 150 palavras e 15 hashtags para um vídeo sobre: ' },
    ]},
    { cat: '🌐 Tradução', items: [
      { label: 'PT → EN', text: 'Translate the following text to English, keeping the original tone:\n\n' },
      { label: 'EN → PT', text: 'Traduza o texto abaixo para português do Brasil, mantendo o tom:\n\n' },
      { label: 'Explicar simples', text: 'Explique o seguinte como se eu tivesse 10 anos, sem termos técnicos:\n\n' },
    ]},
    { cat: '💡 Criativo', items: [
      { label: '10 ideias de conteúdo', text: 'Gere 10 ideias criativas de conteúdo para o nicho: ' },
      { label: 'Criar variações', text: 'Crie 5 variações diferentes do texto abaixo, cada uma com tom diferente:\n\n' },
      { label: 'Brainstorm rápido', text: 'Faça um brainstorm com 15 ideias sobre: ' },
    ]},
  ];

  function renderTemplates() {
    const list = $('umbra-templates-list');
    if (!list) return;
    list.innerHTML = TEMPLATES.map((cat) => `
      <div class="umbra-tpl-cat">
        <div class="umbra-tpl-cat-label">${esc(cat.cat)}</div>
        <div class="umbra-tpl-items">
          ${cat.items.map((t) => `<button class="umbra-tpl-item" data-text="${esc(t.text)}" title="${esc(t.text)}">${esc(t.label)}</button>`).join('')}
        </div>
      </div>`).join('');
    list.querySelectorAll('.umbra-tpl-item').forEach((b) => {
      b.addEventListener('click', () => {
        msgInput.value = b.dataset.text;
        msgInput.focus();
        charCount.textContent = msgInput.value.length;
        refreshVarDropdown();
        // Move cursor to end
        msgInput.setSelectionRange(msgInput.value.length, msgInput.value.length);
      });
    });
  }

  let tplOpen = false;
  $('umbra-tpl-toggle').addEventListener('click', () => {
    tplOpen = !tplOpen;
    const list = $('umbra-templates-list');
    const arrow = $('umbra-tpl-arrow');
    list.style.display = tplOpen ? 'block' : 'none';
    arrow.textContent = tplOpen ? '▼' : '▶';
    if (tplOpen && !list.children.length) renderTemplates();
  });

  // ═══════════════════════════════════════════════════
  // SNIPPETS (autocomplete: type /keyword in textarea)
  // ═══════════════════════════════════════════════════
  const SNIPPETS = [
    { trigger: 'resumo',   label: '📄 Resumir em bullets',    text: 'Resuma o seguinte em exatamente 5 pontos curtos e diretos:\n\n' },
    { trigger: 'formal',   label: '👔 Reescrever formal',      text: 'Reescreva o texto abaixo em tom formal e profissional, mantendo a ideia central:\n\n' },
    { trigger: 'casual',   label: '😄 Reescrever casual',      text: 'Reescreva o texto abaixo em linguagem casual e conversacional:\n\n' },
    { trigger: 'corrigir', label: '✏ Corrigir gramática',      text: 'Corrija todos os erros de gramática, ortografia e estilo sem alterar o sentido:\n\n' },
    { trigger: 'expandir', label: '📈 Expandir texto',         text: 'Expanda o texto abaixo com mais detalhes e exemplos, mantendo o tom:\n\n' },
    { trigger: 'titulo',   label: '🏆 10 títulos virais',       text: 'Gere 10 títulos virais para um vídeo sobre: ' },
    { trigger: 'roteiro',  label: '🎬 Roteiro Short 45s',       text: 'Escreva um roteiro de Short para YouTube de 45 segundos sobre: ' },
    { trigger: 'hook',     label: '⚡ Hook de abertura',        text: 'Crie 5 hooks de abertura (primeiros 3 segundos) para um vídeo sobre: ' },
    { trigger: 'ideias',   label: '💡 10 ideias de conteúdo',   text: 'Gere 10 ideias criativas de conteúdo para o nicho: ' },
    { trigger: 'traduzir', label: '🌐 Traduzir EN→PT',          text: 'Traduza o texto abaixo para português do Brasil, mantendo o tom:\n\n' },
    { trigger: 'brainstorm', label: '🧠 Brainstorm rápido',     text: 'Faça um brainstorm com 15 ideias sobre: ' },
    { trigger: 'hashtags', label: '#️⃣ Descrição + hashtags',    text: 'Escreva uma descrição SEO de 150 palavras e 15 hashtags para um vídeo sobre: ' },
    { trigger: 'variacao', label: '🔄 5 variações de texto',    text: 'Crie 5 variações diferentes do texto abaixo, cada uma com tom diferente:\n\n' },
    { trigger: 'simples',  label: '🔍 Explicar simples',        text: 'Explique o seguinte como se eu tivesse 10 anos, sem termos técnicos:\n\n' },
  ];

  // Load user custom snippets from storage
  let userSnippets = [];
  chrome.storage.local.get(['umbra_snippets'], (d) => {
    if (d.umbra_snippets) { userSnippets = d.umbra_snippets; renderSnippetsPanel(); }
  });

  function allSnippets() { return [...SNIPPETS, ...userSnippets]; }

  function renderSnippetsPanel() {
    const panel = $('umbra-snippets-panel');
    if (!panel) return;
    const all = allSnippets();
    panel.innerHTML = `
      <div class="umbra-snip-list">
        ${all.map((s, i) => `
          <div class="umbra-snip-item" data-i="${i}">
            <span class="umbra-snip-trigger">/${esc(s.trigger)}</span>
            <span class="umbra-snip-label">${esc(s.label)}</span>
            ${i >= SNIPPETS.length ? `<button class="umbra-snip-del" data-i="${i - SNIPPETS.length}" title="Remover">✕</button>` : ''}
          </div>`).join('')}
      </div>
      <div class="umbra-snip-add-row">
        <input id="umbra-snip-new-trigger" placeholder="/trigger" maxlength="20" style="width:80px" />
        <input id="umbra-snip-new-text" placeholder="Texto do snippet..." style="flex:1" />
        <button id="umbra-snip-add-btn" title="Adicionar snippet">+</button>
      </div>`;

    panel.querySelectorAll('.umbra-snip-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.umbra-snip-del')) return;
        const idx = parseInt(el.dataset.i, 10);
        const snip = all[idx];
        if (snip) {
          msgInput.value = snip.text;
          msgInput.focus();
          msgInput.setSelectionRange(msgInput.value.length, msgInput.value.length);
          charCount.textContent = msgInput.value.length;
          refreshVarDropdown();
        }
      });
    });
    panel.querySelectorAll('.umbra-snip-del').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(b.dataset.i, 10);
        userSnippets.splice(idx, 1);
        chrome.storage.local.set({ umbra_snippets: userSnippets });
        renderSnippetsPanel();
      });
    });
    const addTriggerEl = $('umbra-snip-new-trigger');
    const addTextEl = $('umbra-snip-new-text');
    const addBtnEl = $('umbra-snip-add-btn');
    if (addBtnEl) {
      addBtnEl.addEventListener('click', () => {
        let trigger = (addTriggerEl.value || '').trim().replace(/^\//, '');
        const text = (addTextEl.value || '').trim();
        if (!trigger || !text) return;
        userSnippets.push({ trigger, label: '⭐ ' + trigger, text });
        chrome.storage.local.set({ umbra_snippets: userSnippets });
        addTriggerEl.value = ''; addTextEl.value = '';
        renderSnippetsPanel();
      });
    }
  }

  let snipOpen = false;
  $('umbra-snip-toggle').addEventListener('click', () => {
    snipOpen = !snipOpen;
    const panel = $('umbra-snippets-panel');
    const arrow = $('umbra-snip-arrow');
    panel.style.display = snipOpen ? 'block' : 'none';
    arrow.textContent = snipOpen ? '▼' : '▶';
    if (snipOpen) renderSnippetsPanel();
  });

  // ─── Snippet autocomplete dropdown ───────────────
  let snipDropdownEl = null;
  function showSnipDropdown(matches, slashStart) {
    hideSnipDropdown();
    if (!matches.length) return;
    snipDropdownEl = document.createElement('div');
    snipDropdownEl.id = 'umbra-snip-dropdown';
    snipDropdownEl.className = 'umbra-snip-dropdown';
    matches.forEach((s, i) => {
      const item = document.createElement('div');
      item.className = 'umbra-snip-dd-item' + (i === 0 ? ' umbra-snip-dd-active' : '');
      item.innerHTML = `<span class="umbra-snip-dd-trigger">/${esc(s.trigger)}</span> <span class="umbra-snip-dd-lbl">${esc(s.label)}</span>`;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        expandSnip(s, slashStart);
      });
      snipDropdownEl.appendChild(item);
    });
    // Position relative to textarea
    const rect = msgInput.getBoundingClientRect();
    const wRect = wrapper.getBoundingClientRect();
    snipDropdownEl.style.left = (rect.left - wRect.left) + 'px';
    snipDropdownEl.style.bottom = (wRect.bottom - rect.top) + 'px';
    panel.appendChild(snipDropdownEl);
  }
  function hideSnipDropdown() {
    if (snipDropdownEl) { snipDropdownEl.remove(); snipDropdownEl = null; }
  }
  function expandSnip(snip, slashStart) {
    const val = msgInput.value;
    const end = msgInput.selectionEnd;
    msgInput.value = val.slice(0, slashStart) + snip.text + val.slice(end);
    msgInput.focus();
    const newPos = slashStart + snip.text.length;
    msgInput.setSelectionRange(newPos, newPos);
    charCount.textContent = msgInput.value.length;
    refreshVarDropdown();
    hideSnipDropdown();
  }

  let _snipSlashStart = -1;
  msgInput.addEventListener('keyup', (e) => {
    if (['Escape', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const val = msgInput.value;
    const pos = msgInput.selectionEnd;
    // Find the last '/' before cursor on the same line
    const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
    const segment = val.slice(lineStart, pos);
    const slashIdx = segment.lastIndexOf('/');
    if (slashIdx === -1) { hideSnipDropdown(); return; }
    const typed = segment.slice(slashIdx + 1).toLowerCase();
    _snipSlashStart = lineStart + slashIdx;
    const matches = allSnippets().filter((s) => s.trigger.startsWith(typed));
    showSnipDropdown(matches, _snipSlashStart);
  });
  msgInput.addEventListener('keydown', (e) => {
    if (!snipDropdownEl) return;
    const items = snipDropdownEl.querySelectorAll('.umbra-snip-dd-item');
    const activeIdx = Array.from(items).findIndex((el) => el.classList.contains('umbra-snip-dd-active'));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (activeIdx + 1) % items.length;
      items.forEach((el, i) => el.classList.toggle('umbra-snip-dd-active', i === next));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (activeIdx - 1 + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle('umbra-snip-dd-active', i === prev));
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      const activeItem = items[activeIdx < 0 ? 0 : activeIdx];
      if (activeItem) {
        e.preventDefault();
        const idx = Array.from(items).indexOf(activeItem);
        const snip = allSnippets().filter((s) => {
          const val = msgInput.value;
          const pos = msgInput.selectionEnd;
          const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
          const segment = val.slice(lineStart, pos);
          const slashIdx = segment.lastIndexOf('/');
          if (slashIdx === -1) return false;
          const typed = segment.slice(slashIdx + 1).toLowerCase();
          return s.trigger.startsWith(typed);
        })[idx];
        if (snip) expandSnip(snip, _snipSlashStart);
      }
    } else if (e.key === 'Escape') {
      hideSnipDropdown();
    }
  });
  msgInput.addEventListener('blur', () => { setTimeout(hideSnipDropdown, 150); });

  // ═══════════════════════════════════════════════════
  // ATTACHMENTS (images + links)
  // ═══════════════════════════════════════════════════
  imgBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const dataUrl = await fileToDataUrl(f);
      draftImages.push({ name: f.name, dataUrl });
    }
    fileInput.value = '';
    renderAttachPreview();
  });
  linkBtn.addEventListener('click', () => {
    const url = prompt('URL / link para anexar ao prompt:');
    if (!url || !url.trim()) return;
    draftLinks.push(url.trim());
    renderAttachPreview();
  });

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderAttachPreview() {
    if (!draftImages.length && !draftLinks.length) {
      attachPreview.innerHTML = '';
      attachPreview.style.display = 'none';
      return;
    }
    attachPreview.style.display = 'flex';
    const imgs = draftImages.map((img, i) => `
      <div class="umbra-attach-item umbra-attach-img">
        <img src="${img.dataUrl}" alt="" />
        <button class="umbra-attach-del" data-type="img" data-i="${i}" title="Remover">✕</button>
      </div>`).join('');
    const lks = draftLinks.map((l, i) => `
      <div class="umbra-attach-item umbra-attach-link" title="${esc(l)}">
        🔗 ${esc(l.length > 32 ? l.slice(0, 32) + '…' : l)}
        <button class="umbra-attach-del" data-type="link" data-i="${i}" title="Remover">✕</button>
      </div>`).join('');
    attachPreview.innerHTML = imgs + lks;
    attachPreview.querySelectorAll('.umbra-attach-del').forEach((b) => {
      b.addEventListener('click', () => {
        const t = b.dataset.type, i = parseInt(b.dataset.i, 10);
        if (t === 'img') draftImages.splice(i, 1); else draftLinks.splice(i, 1);
        renderAttachPreview();
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // QUEUE
  // ═══════════════════════════════════════════════════
  addBtn.addEventListener('click', () => {
    const text = msgInput.value.trim();
    if (!text && !draftImages.length && !draftLinks.length) return;
    messages.push({ text, images: [...draftImages], links: [...draftLinks] });
    msgInput.value = '';
    draftImages = [];
    draftLinks = [];
    renderAttachPreview();
    saveMessages();
    renderMessages();
    refreshVarDropdown();
  });
  msgInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addBtn.click(); } });

  function renderMessages() {
    if (!messages.length) { msgList.innerHTML = '<div class="umbra-msg-empty">Nenhuma mensagem adicionada</div>'; return; }
    msgList.innerHTML = messages.map((m, i) => {
      const badges = [];
      if (m.images && m.images.length) badges.push(`<span class="umbra-badge">📎 ${m.images.length}</span>`);
      if (m.links && m.links.length) badges.push(`<span class="umbra-badge">🔗 ${m.links.length}</span>`);
      return `<div class="umbra-msg-item" data-i="${i}">
        <span class="umbra-msg-num">${i + 1}</span>
        <span class="umbra-msg-text">${esc(m.text || '(sem texto)')}</span>
        <span class="umbra-msg-badges">${badges.join('')}</span>
        <div class="umbra-msg-btns">
          ${i > 0 ? `<button class="umbra-msg-action umbra-msg-up" data-i="${i}" title="Mover para cima">↑</button>` : '<span class="umbra-msg-action-placeholder"></span>'}
          ${i < messages.length - 1 ? `<button class="umbra-msg-action umbra-msg-down" data-i="${i}" title="Mover para baixo">↓</button>` : '<span class="umbra-msg-action-placeholder"></span>'}
          <button class="umbra-msg-action umbra-msg-edit" data-i="${i}" title="Editar">✏</button>
          <button class="umbra-msg-action umbra-msg-dupe" data-i="${i}" title="Duplicar">⎘</button>
          <button class="umbra-msg-action umbra-msg-del" data-i="${i}" title="Remover">✕</button>
        </div>
      </div>`;
    }).join('');
    msgList.querySelectorAll('.umbra-msg-up').forEach((b) => {
      b.addEventListener('click', (e) => { e.stopPropagation(); const i = parseInt(b.dataset.i, 10); [messages[i - 1], messages[i]] = [messages[i], messages[i - 1]]; saveMessages(); renderMessages(); refreshVarDropdown(); });
    });
    msgList.querySelectorAll('.umbra-msg-down').forEach((b) => {
      b.addEventListener('click', (e) => { e.stopPropagation(); const i = parseInt(b.dataset.i, 10); [messages[i], messages[i + 1]] = [messages[i + 1], messages[i]]; saveMessages(); renderMessages(); refreshVarDropdown(); });
    });
    msgList.querySelectorAll('.umbra-msg-edit').forEach((b) => {
      b.addEventListener('click', (e) => { e.stopPropagation(); const i = parseInt(b.dataset.i, 10); const m = messages[i]; msgInput.value = m.text || ''; draftImages = [...(m.images || [])]; draftLinks = [...(m.links || [])]; renderAttachPreview(); charCount.textContent = msgInput.value.length; messages.splice(i, 1); saveMessages(); renderMessages(); refreshVarDropdown(); msgInput.focus(); });
    });
    msgList.querySelectorAll('.umbra-msg-dupe').forEach((b) => {
      b.addEventListener('click', (e) => { e.stopPropagation(); const i = parseInt(b.dataset.i, 10); const m = messages[i]; messages.splice(i + 1, 0, { ...m, images: [...(m.images || [])], links: [...(m.links || [])] }); saveMessages(); renderMessages(); refreshVarDropdown(); });
    });
    msgList.querySelectorAll('.umbra-msg-del').forEach((b) => {
      b.addEventListener('click', (e) => { e.stopPropagation(); messages.splice(parseInt(b.dataset.i, 10), 1); saveMessages(); renderMessages(); refreshVarDropdown(); });
    });
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  clearBtn.addEventListener('click', () => { messages = []; saveMessages(); renderMessages(); refreshVarDropdown(); });

  // ═══════════════════════════════════════════════════
  // SEQUENCES
  // ═══════════════════════════════════════════════════
  saveSeqBtn.addEventListener('click', () => {
    if (!messages.length) { alert('Adicione mensagens antes de salvar.'); return; }
    const name = prompt('Nome para esta sequência:');
    if (!name || !name.trim()) return;
    savedSequences[name.trim()] = messages.map((m) => ({ ...m, images: [...(m.images || [])], links: [...(m.links || [])] }));
    chrome.storage.local.set({ umbra_sequences: savedSequences }, () => renderSequences(name.trim()));
  });
  function renderSequences(selectName) {
    const names = Object.keys(savedSequences);
    if (!names.length) { seqDropdown.innerHTML = '<option value="" disabled selected>Salve uma sequência primeiro</option>'; return; }
    seqDropdown.innerHTML = names.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    seqDropdown.value = (selectName && savedSequences[selectName]) ? selectName : names[0];
  }
  loadSeqBtn.addEventListener('click', () => {
    const n = seqDropdown.value;
    if (n && savedSequences[n]) {
      messages = savedSequences[n].map((m) => ({ ...m, images: [...(m.images || [])], links: [...(m.links || [])] }));
      saveMessages(); renderMessages(); refreshVarDropdown();
    }
  });
  deleteSeqBtn.addEventListener('click', () => {
    const n = seqDropdown.value;
    if (!n || !savedSequences[n]) return;
    if (!confirm(`Excluir a sequência "${n}"?`)) return;
    delete savedSequences[n];
    chrome.storage.local.set({ umbra_sequences: savedSequences }, () => renderSequences());
  });

  // Export / Import
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ sequences: savedSequences, version: 2 }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `umbra-sequences-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const parsed = JSON.parse(txt);
      if (parsed && parsed.sequences && typeof parsed.sequences === 'object') {
        savedSequences = { ...savedSequences, ...parsed.sequences };
        chrome.storage.local.set({ umbra_sequences: savedSequences }, () => renderSequences());
        alert('Sequências importadas!');
      } else alert('Arquivo inválido.');
    } catch { alert('Erro ao ler o arquivo.'); }
    importInput.value = '';
  });

  // ═══════════════════════════════════════════════════
  // SEND
  // ═══════════════════════════════════════════════════
  sendBtn.addEventListener('click', () => {
    if (!messages.length) { alert('Adicione mensagens à fila antes de enviar.'); return; }
    const vars = getVariables();
    if (vars.length > 0) {
      // Show modal
      varModalFields.innerHTML = vars.map((v) => `
        <div class="umbra-var-field">
          <label class="umbra-var-field-label">{{${v}}}</label>
          <input class="umbra-var-field-input" type="text" data-var="${esc(v)}" placeholder="Valor para ${esc(v)}..." autocomplete="off" />
        </div>`).join('');
      varModal.style.display = 'flex';
      const firstInput = varModalFields.querySelector('input');
      if (firstInput) setTimeout(() => firstInput.focus(), 50);
    } else {
      doSend({});
    }
  });

  varModalCancel.addEventListener('click', () => { varModal.style.display = 'none'; });
  varModalOk.addEventListener('click', () => {
    const values = {};
    varModalFields.querySelectorAll('.umbra-var-field-input').forEach((inp) => {
      values[inp.dataset.var] = inp.value;
    });
    varModal.style.display = 'none';
    doSend(values);
  });
  varModal.addEventListener('keydown', (e) => { if (e.key === 'Enter') varModalOk.click(); if (e.key === 'Escape') varModalCancel.click(); });

  function playDoneSound() {
    if (!settings.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [[880, 0, 0.12], [1100, 0.13, 0.12], [1320, 0.26, 0.2]].forEach(([freq, start, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.05);
      });
    } catch (e) {}
  }

  function doSend(values) {
    let resolved = messages.map((m) => ({ ...m }));
    resolved = resolved.map((m) => {
      let t = m.text || '';
      for (const [k, v] of Object.entries(values)) t = t.split(`{{${k}}}`).join(v);
      return { ...m, text: t };
    });
    // Infinite loop: pass original items once; background handles cycling
    // Normal loop: replicate items here
    const loopCount = settings.infiniteLoop ? 1 : Math.max(1, parseInt(loopCountInput.value, 10) || 1);
    const items = [];
    for (let i = 0; i < loopCount; i++) items.push(...resolved);
    setUIRunning(true);
    chrome.runtime.sendMessage({
      action: 'startSequence',
      items,
      settings: {
        cooldown: settings.cooldown,
        skipErrors: settings.skipErrors,
        infiniteLoop: settings.infiniteLoop,
        autoCopy: settings.autoCopy,
        autoScreenshot: settings.autoScreenshot,
        stopIfContains: settings.stopIfContains || '',
      },
    });
  }

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopSequence' });
    setUIRunning(false);
  });

  let paused = false;
  pauseBtn.addEventListener('click', () => {
    if (!paused) {
      chrome.runtime.sendMessage({ action: 'pauseSequence' });
    } else {
      chrome.runtime.sendMessage({ action: 'resumeSequence' });
    }
  });

  newChatBtn.addEventListener('click', () => {
    if (PLATFORM === 'claude') {
      window.location.href = 'https://claude.ai/new';
    } else if (PLATFORM === 'gemini') {
      window.location.href = 'https://gemini.google.com/app';
    } else {
      window.location.href = 'https://chatgpt.com/';
    }
  });

  importTxtBtn.addEventListener('click', () => txtInput.click());
  txtInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (!lines.length) { alert('Arquivo vazio ou sem linhas válidas.'); return; }
      // CSV: if line has commas and first line looks like header, skip it
      const isCSV = f.name.endsWith('.csv');
      const prompts = isCSV ? lines.filter((_, i) => i > 0 || !lines[0].toLowerCase().includes('prompt')) : lines;
      let added = 0;
      prompts.forEach((p) => {
        if (p) { messages.push({ text: p, images: [], links: [] }); added++; }
      });
      saveMessages();
      renderMessages();
      refreshVarDropdown();
      alert(`✅ ${added} prompt${added !== 1 ? 's' : ''} importado${added !== 1 ? 's' : ''} com sucesso!`);
    } catch (err) {
      alert('Erro ao ler o arquivo: ' + err.message);
    }
    txtInput.value = '';
  });

  // ─── UI state ─────────────────────────────────────
  function setUIRunning(running) {
    const sendRow = document.querySelector('.umbra-send-row');
    if (sendRow) sendRow.style.display = running ? 'none' : 'flex';
    runningRow.style.display = running ? 'flex' : 'none';
    statusEl.style.display = running ? 'flex' : 'none';
    statusEl.classList.remove('umbra-success');
    statusEl.innerHTML = '<span class="umbra-spinner"></span> <span id="umbra-status-text">Iniciando automação...</span>';
    progressWrap.style.display = running ? 'block' : 'none';
    if (!running) { paused = false; pauseBtn.textContent = '⏸ Pausar'; pauseBtn.classList.remove('umbra-paused'); }
  }
  let countdownTimer = null;
  function updateProgress(step, total, text, run, infinite) {
    progressWrap.style.display = 'block';
    const pct = total ? Math.round((step / total) * 100) : 0;
    const runLabel = infinite ? `♾ R${run || 1} · ` : (run && run > 1 ? `R${run} · ` : '');
    progressStep.textContent = `${runLabel}${step} / ${total}`;
    progressPct.textContent = infinite ? '∞' : pct + '%';
    progressFill.style.width = infinite ? '100%' : pct + '%';
    if (infinite) progressFill.classList.add('umbra-infinite-bar');
    else progressFill.classList.remove('umbra-infinite-bar');
    statusEl.style.display = 'flex';
    statusEl.innerHTML = `<span class="umbra-spinner"></span> ${runLabel}Enviando ${step}/${total}${text ? ' · ' + esc((text || '').slice(0, 28)) : ''}`;
    // Start countdown for next message
    if (step < total && settings.cooldown > 1000) {
      if (countdownTimer) clearInterval(countdownTimer);
      let remaining = Math.ceil(settings.cooldown / 1000);
      const countEl = document.createElement('span');
      countEl.id = 'umbra-countdown';
      countEl.className = 'umbra-countdown';
      countEl.textContent = ` ⏱ ${remaining}s`;
      statusEl.appendChild(countEl);
      countdownTimer = setInterval(() => {
        remaining--;
        const el = document.getElementById('umbra-countdown');
        if (el && remaining > 0) el.textContent = ` ⏱ ${remaining}s`;
        else if (remaining <= 0) { clearInterval(countdownTimer); countdownTimer = null; }
      }, 1000);
    }
  }
  function handleAutomationFinished() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    paused = false;
    playDoneSound();
    setUIRunning(false);
    statusEl.style.display = 'flex';
    statusEl.classList.add('umbra-success');
    statusEl.innerHTML = '✔ Automação concluída!';
    progressFill.style.width = '100%';
    setTimeout(() => { statusEl.style.display = 'none'; statusEl.classList.remove('umbra-success'); progressWrap.style.display = 'none'; }, 3500);
    chrome.storage.local.get(['showReviewBanner'], (data) => { if (data.showReviewBanner) reviewEl.style.display = 'block'; });
  }

  // ─── Review ──────────────────────────────────────
  rateNowBtn.addEventListener('click', () => { window.open('https://umbrahubb.vercel.app/', '_blank'); chrome.storage.local.set({ reviewStatus: 'rated', showReviewBanner: false }); reviewEl.style.display = 'none'; });
  rateLaterBtn.addEventListener('click', () => { chrome.storage.local.set({ showReviewBanner: false }); reviewEl.style.display = 'none'; });
  rateNeverBtn.addEventListener('click', () => { chrome.storage.local.set({ reviewStatus: 'never', showReviewBanner: false }); reviewEl.style.display = 'none'; });

  function saveMessages() { chrome.storage.local.set({ umbra_messages: messages }); }
})();
