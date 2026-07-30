/**
 * Umbra Flow - Content Script (Extend Mode)
 * Sistema de automacao para estender videos sequencialmente
 * Desenvolvido por Fabio e Felipe
 */

if (window.ffLabExtendInitialized && window.ffLabExtendAutomation) {
    console.log('[Umbra Flow] Ja inicializado, ignorando...');
    // Forçar uma parada aqui para prevenir execução duplicada
    throw new Error('[Umbra Flow] Script já carregado, abortando reinjeção.');
}

window.ffLabExtendInitialized = true;
console.log('[Umbra Flow] v1.0 - Sistema de extensao de videos iniciado');

// ========== CONFIGURACAO ==========

const CONFIG = {
    maxWaitTime: 120000,           // Tempo maximo para esperar geracao (2 min)
    delayBetweenExtends: 5000,     // Delay entre extensoes (5s)
    checkInterval: 3000,            // Intervalo de verificacao (3s)
    clickDelay: 800,               // Delay entre cliques
    inputDelay: 500,               // Delay apos digitar
    maxRetries: 3,                 // Numero maximo de retries por cena
    retryDelay: 3000,              // Delay antes de retry (3s)
    waitForNewClipTimeout: 60000,  // Tempo maximo para esperar novo clip aparecer (60s)
    stabilityCheckDelay: 2000,     // Delay para verificar estabilidade
    maxConcurrentGenerations: 1    // Nunca permitir mais de 1 geracao por vez
};

// Estado global
let isProcessingScene = false;
let lastSubmitTime = 0;

// ========== UTILIDADES ==========

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateStatus(text, progress = null, currentScene = null, done = false, success = false) {
    try {
        chrome.runtime.sendMessage({
            type: 'sequenceStatus',
            text,
            progress,
            currentScene,
            done,
            success
        });
    } catch (e) {
        console.log('[Umbra Flow] Popup fechado ou erro de comunicacao');
    }
}

// ========== CDP CLICK HELPER ==========

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

// ========== DETECTORES DE ELEMENTOS ==========

async function selectLastVideoInTimeline() {
    console.log('[Umbra Flow] Procurando ultimo video na timeline...');

    const candidates = [];

    // Buscar por divs com span "Timeline Video Thumbnail"
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
        if (div.offsetParent === null) continue;

        const span = div.querySelector('span');
        if (span && span.textContent.includes('Timeline Video Thumbnail')) {
            const rect = div.getBoundingClientRect();
            if (rect.top > window.innerHeight * 0.5 && rect.width > 50) {
                candidates.push({ el: div, x: rect.left, source: 'thumbnail span' });
            }
        }
    }

    // Buscar por classe de thumbnails
    const thumbnailDivs = document.querySelectorAll('div[class*="sc-624db470"]');
    for (const div of thumbnailDivs) {
        if (div.offsetParent === null) continue;

        const rect = div.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.5 && rect.width > 50) {
            const isDuplicate = candidates.some(c => c.el === div);
            if (!isDuplicate) {
                candidates.push({ el: div, x: rect.left, source: 'classe thumbnail' });
            }
        }
    }

    if (candidates.length === 0) {
        console.log('[Umbra Flow] Nenhum video encontrado na timeline');
        return false;
    }

    candidates.sort((a, b) => b.x - a.x);
    const lastVideo = candidates[0];
    console.log(`[Umbra Flow] Encontrados ${candidates.length} videos. Selecionando o ultimo (x=${Math.round(lastVideo.x)})`);

    lastVideo.el.click();
    await sleep(500);

    return true;
}

function findPlusButton() {
    console.log('[Umbra Flow] Procurando botao + no final da timeline...');

    const candidates = [];

    // Buscar pelo ID especifico
    const byId = document.getElementById('PINHOLE_ADD_CLIP_CARD_ID');
    if (byId && byId.offsetParent !== null) {
        const rect = byId.getBoundingClientRect();
        candidates.push({ btn: byId, x: rect.left, source: 'ID' });
    }

    // Buscar botao com icone "add"
    const addIcons = document.querySelectorAll('i.material-icons, i[class*="material-icons"]');
    for (const icon of addIcons) {
        if (icon.textContent.trim() === 'add' && icon.offsetParent !== null) {
            const btn = icon.closest('button');
            if (btn && btn.offsetParent !== null) {
                const rect = btn.getBoundingClientRect();
                if (rect.top > window.innerHeight * 0.5) {
                    candidates.push({ btn, x: rect.left, source: 'icone add' });
                }
            }
        }
    }

    // Buscar pelo texto "Add clip"
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
        if (btn.offsetParent === null) continue;

        const spanText = btn.querySelector('span');
        if (spanText && spanText.textContent.toLowerCase().includes('add clip')) {
            const rect = btn.getBoundingClientRect();
            if (rect.top > window.innerHeight * 0.5) {
                candidates.push({ btn, x: rect.left, source: 'texto Add clip' });
            }
        }
    }

    if (candidates.length > 0) {
        candidates.sort((a, b) => b.x - a.x);
        const selected = candidates[0];
        console.log(`[Umbra Flow] Encontrados ${candidates.length} botoes +. Selecionando o mais a direita (${selected.source})`);
        return selected.btn;
    }

    console.log('[Umbra Flow] Botao + nao encontrado');
    return null;
}

function findExtendOption() {
    console.log('[Umbra Flow] Procurando opcao Extend no menu...');

    // Buscar menuitem com texto "Extend"
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    for (const item of menuItems) {
        if (item.offsetParent === null) continue;

        const text = item.textContent.trim();
        if (text.includes('Extend')) {
            console.log('[Umbra Flow] Opcao Extend encontrada');
            return item;
        }
    }

    // Buscar icone "logout" (usado no Extend)
    const logoutIcons = document.querySelectorAll('i.material-icons-outlined, i[class*="material-icons"]');
    for (const icon of logoutIcons) {
        if (icon.textContent.trim() === 'logout' && icon.offsetParent !== null) {
            const parent = icon.parentElement;
            if (parent && parent.textContent.includes('Extend')) {
                console.log('[Umbra Flow] Opcao Extend encontrada pelo icone');
                return parent;
            }
        }
    }

    // Buscar texto exato "Extend..."
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
        if (el.offsetParent === null) continue;
        if (el.children.length > 2) continue;

        const text = el.textContent.trim();
        if (text === 'Extend...' || text === 'Extend...') {
            console.log('[Umbra Flow] Opcao Extend encontrada por texto exato');
            return el;
        }
    }

    console.log('[Umbra Flow] Opcao Extend nao encontrada');
    return null;
}

function findExtendTextarea() {
    console.log('[Umbra Flow] Procurando caixa de texto do Extend...');

    // NOVO UI: Editor Slate.js (contenteditable div)
    const slateEditor = document.querySelector('[data-slate-editor="true"]');
    if (slateEditor && slateEditor.offsetParent !== null) {
        console.log('[Umbra Flow] Editor Slate.js encontrado');
        return slateEditor;
    }

    // Fallback: buscar div contenteditable com role textbox
    const contentEditables = document.querySelectorAll('[contenteditable="true"][role="textbox"]');
    for (const ce of contentEditables) {
        if (ce.offsetParent === null) continue;
        console.log('[Umbra Flow] Contenteditable textbox encontrado');
        return ce;
    }

    // Fallback antigo: buscar textarea
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
        if (ta.offsetParent === null) continue;
        if (ta.classList.contains('g-recaptcha-response')) continue;

        const placeholder = ta.placeholder || '';
        if (placeholder.includes('happens') ||
            placeholder.includes('extended shot') ||
            placeholder.includes('This happens')) {
            console.log('[Umbra Flow] Textarea de Extend encontrada pelo placeholder');
            return ta;
        }
    }

    console.log('[Umbra Flow] Nenhuma caixa de texto de Extend encontrada');
    return null;
}

function findSubmitArrow() {
    const NEVER = ['add_2', 'arrow_back', 'go back'];

    // P0: ícone google-symbols arrow_forward + span "Create"
    for (const btn of document.querySelectorAll('button:not([disabled])')) {
        const icon = btn.querySelector('i[class*="google-symbols"]');
        if (icon && icon.textContent.trim() === 'arrow_forward') {
            const hasCreate = [...btn.querySelectorAll('span')].some(
                s => s.textContent.trim().toLowerCase() === 'create'
            );
            if (hasCreate) return btn;
        }
    }
    // P1: textContent combinado arrow_forward + Create
    for (const btn of document.querySelectorAll('button:not([disabled])')) {
        const t = btn.textContent || '';
        if (t.includes('arrow_forward') && t.includes('Create') &&
            NEVER.every(n => !t.toLowerCase().includes(n)))
            return btn;
    }
    // P2: classes conhecidas (novo sc-e8425ea6 e legado sc-c70e41ad)
    for (const btn of document.querySelectorAll('button:not([disabled])')) {
        const cls = btn.className || '', t = btn.textContent || '';
        if ((cls.includes('sc-e8425ea6') || cls.includes('sc-c70e41ad')) &&
            (t.includes('arrow_forward') || t.includes('Create')) &&
            NEVER.every(n => !t.toLowerCase().includes(n)))
            return btn;
    }
    // P3: arrow_forward na metade inferior da viewport
    const H = window.innerHeight;
    for (const btn of document.querySelectorAll('button:not([disabled])')) {
        const t = btn.textContent || '';
        if (!t.includes('arrow_forward')) continue;
        if (NEVER.some(n => t.toLowerCase().includes(n))) continue;
        const r = btn.getBoundingClientRect();
        if (r.top > H * 0.5 && r.width > 0 && r.height > 0) return btn;
    }
    return null;
}

function getTimelineClipsInfo() {
    const clips = [];

    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
        if (div.offsetParent === null) continue;

        const rect = div.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5 || rect.width < 30) continue;

        const span = div.querySelector('span');
        if (span && span.textContent.includes('Timeline Video Thumbnail')) {
            const percentText = div.textContent.match(/(\d{1,2})%/);
            const isGenerating = percentText && parseInt(percentText[1]) < 100;

            clips.push({
                el: div,
                x: rect.left,
                isGenerating: isGenerating,
                percent: percentText ? parseInt(percentText[1]) : null
            });
        }
    }

    clips.sort((a, b) => a.x - b.x);
    return clips;
}

function isLastClipGenerating() {
    const clips = getTimelineClipsInfo();

    if (clips.length === 0) {
        return { generating: false, percent: null, totalClips: 0 };
    }

    const lastClip = clips[clips.length - 1];

    if (lastClip.isGenerating) {
        console.log(`[Umbra Flow] Ultimo clip (${clips.length}) gerando: ${lastClip.percent}%`);
        return { generating: true, percent: lastClip.percent, totalClips: clips.length };
    }

    return { generating: false, percent: null, totalClips: clips.length };
}

function detectGenerationError() {
    const errorPhrases = [
        'violates our policies',
        'policy violation',
        'couldn\'t generate',
        'unable to generate',
        'generation failed',
        'please try again',
        'try a different prompt',
        'request was blocked',
        'content was rejected',
        'not allowed'
    ];

    const alertElements = document.querySelectorAll('[role="alert"], [class*="error-message"], [class*="alert-error"], [class*="snackbar"]');

    for (const el of alertElements) {
        if (el.offsetParent === null) continue;

        const text = el.textContent.toLowerCase().trim();

        for (const phrase of errorPhrases) {
            if (text.includes(phrase)) {
                console.log(`[Umbra Flow] ERRO DETECTADO: "${text.substring(0, 80)}..."`);
                return { hasError: true, message: text };
            }
        }
    }

    return { hasError: false, message: null };
}

async function closeErrorModal() {
    const closeButtons = document.querySelectorAll(
        '[aria-label="close"], [aria-label="Close"], ' +
        'button[class*="close"], button[class*="dismiss"]'
    );

    for (const btn of closeButtons) {
        const actualBtn = btn.closest('button') || btn;
        if (actualBtn.offsetParent !== null) {
            console.log('[Umbra Flow] Fechando modal de erro...');
            actualBtn.click();
            await sleep(500);
            return true;
        }
    }

    document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true
    }));
    await sleep(300);

    return false;
}

// ========== ACOES PRINCIPAIS ==========

async function enterPromptText(text) {
    console.log(`[Umbra Flow] Inserindo prompt: "${text.substring(0, 40)}..."`);

    for (let attempt = 0; attempt < 5; attempt++) {
        const textarea = findExtendTextarea();

        if (textarea) {
            console.log('[Umbra Flow] Campo de texto encontrado');

            textarea.focus();
            await sleep(200);

            if (textarea.tagName === 'TEXTAREA' || textarea.tagName === 'INPUT') {
                // Fallback antigo
                textarea.select();
                await sleep(100);
                textarea.value = text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                // NOVO UI: Editor Slate.js (contenteditable div)
                // Usar Selection API + beforeinput events (único método que funciona com Slate.js)
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(textarea);
                selection.removeAllRanges();
                selection.addRange(range);
                await sleep(100);

                // Deletar via beforeinput
                textarea.dispatchEvent(new InputEvent('beforeinput', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'deleteContentBackward',
                }));
                await sleep(100);

                // Inserir texto via beforeinput
                textarea.dispatchEvent(new InputEvent('beforeinput', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: text,
                }));
            }

            await sleep(CONFIG.inputDelay);
            console.log('[Umbra Flow] Prompt inserido com sucesso');
            return true;
        }

        console.log(`[Umbra Flow] Campo de texto nao encontrado, tentativa ${attempt + 1}/5`);
        await sleep(800);
    }

    console.error('[Umbra Flow] Falha ao encontrar campo de texto');
    return false;
}

async function clickSubmitArrow() {
    console.log('[Umbra Flow] Procurando botao de enviar...');

    for (let attempt = 0; attempt < 8; attempt++) {
        const submitBtn = findSubmitArrow();

        if (submitBtn) {
            console.log('[Umbra Flow] Botao de enviar encontrado, clicando via CDP...');
            await clickWithCDP(submitBtn);
            await sleep(CONFIG.clickDelay);
            return true;
        }

        if (attempt === 4) {
            console.log('[Umbra Flow] Tentando enviar via Enter...');
            const textarea = findExtendTextarea();
            if (textarea) {
                textarea.focus();
                textarea.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true,
                    keyCode: 13,
                    which: 13
                }));
                await sleep(CONFIG.clickDelay);
            }
        }

        console.log(`[Umbra Flow] Botao de enviar nao encontrado, tentativa ${attempt + 1}/8`);
        await sleep(600);
    }

    console.error('[Umbra Flow] Falha ao encontrar botao de enviar');
    return false;
}

async function waitForGeneration(maxWait, initialClipCount = null) {
    console.log(`[Umbra Flow] Aguardando geracao (max ${maxWait / 1000}s)...`);

    const startTime = Date.now();

    if (initialClipCount === null) {
        const clipsInfo = getTimelineClipsInfo();
        initialClipCount = clipsInfo.length;
    }

    const expectedClipCount = initialClipCount + 1;
    console.log(`[Umbra Flow] Clips antes: ${initialClipCount}, esperando: ${expectedClipCount}`);

    // Esperar o novo clip aparecer
    let newClipAppeared = false;
    console.log('[Umbra Flow] Esperando novo clip aparecer...');

    for (let i = 0; i < 60; i++) {
        const errorCheck = detectGenerationError();
        if (errorCheck.hasError) {
            console.error('[Umbra Flow] Erro detectado antes do clip aparecer');
            return { success: false, error: true, message: errorCheck.message };
        }

        const currentClips = getTimelineClipsInfo();

        if (currentClips.length >= expectedClipCount) {
            newClipAppeared = true;
            const lastClip = currentClips[currentClips.length - 1];
            console.log(`[Umbra Flow] Novo clip apareceu! Total: ${currentClips.length}, Status: ${lastClip.isGenerating ? lastClip.percent + '%' : 'completo'}`);
            break;
        }

        if (i > 0 && i % 10 === 0) {
            console.log(`[Umbra Flow] Ainda esperando novo clip... (${i / 2}s, clips: ${currentClips.length})`);
        }

        await sleep(500);
    }

    if (!newClipAppeared) {
        const errorCheck = detectGenerationError();
        if (errorCheck.hasError) {
            return { success: false, error: true, message: errorCheck.message };
        }

        console.warn('[Umbra Flow] Novo clip nao apareceu apos 30s');
        return { success: false, error: true, message: 'Novo clip nao apareceu' };
    }

    // Aguardar o ultimo clip completar
    console.log('[Umbra Flow] Aguardando novo clip completar geracao...');
    let lastProgressLog = Date.now();
    let lastPercent = 0;

    while (Date.now() - startTime < maxWait) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);

        const errorCheck = detectGenerationError();
        if (errorCheck.hasError) {
            console.error('[Umbra Flow] Erro detectado durante geracao');
            return { success: false, error: true, message: errorCheck.message };
        }

        const clipsInfo = getTimelineClipsInfo();

        if (clipsInfo.length < expectedClipCount) {
            console.warn('[Umbra Flow] Clip sumiu da timeline?');
            await sleep(2000);
            continue;
        }

        const lastClip = clipsInfo[clipsInfo.length - 1];

        if (!lastClip.isGenerating) {
            console.log(`[Umbra Flow] Geracao concluida! Clip ${clipsInfo.length} esta pronto.`);
            return { success: true, error: false, message: null };
        }

        if (lastClip.percent !== lastPercent) {
            lastPercent = lastClip.percent;
            console.log(`[Umbra Flow] Progresso do novo clip: ${lastPercent}%`);
        }

        if (Date.now() - lastProgressLog > 5000) {
            updateStatus(
                `Gerando video... ${lastClip.percent || ''}% (${elapsed}s)`,
                null,
                null
            );
            lastProgressLog = Date.now();
        }

        await sleep(CONFIG.checkInterval);
    }

    console.warn('[Umbra Flow] Timeout na geracao');
    return { success: false, error: false, message: 'Timeout na geracao' };
}

// ========== DOWNLOAD ==========

async function downloadFinalVideo(projectName, downloadFolder = null) {
    console.log('[Umbra Flow] Buscando video final para download...');
    console.log(`[Umbra Flow] Pasta de destino: ${downloadFolder || 'padrao'}`);

    updateDownloadStatus('Buscando video...', false);

    // Procurar botao de download
    const downloadButtons = document.querySelectorAll('button, [role="button"]');
    let downloadBtn = null;

    for (const btn of downloadButtons) {
        const text = btn.textContent.toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

        if ((text.includes('download') ||
            text.includes('baixar') ||
            text.includes('export') ||
            ariaLabel.includes('download')) &&
            btn.offsetParent !== null) {
            downloadBtn = btn;
            break;
        }
    }

    if (downloadBtn) {
        console.log('[Umbra Flow] Botao de download encontrado, clicando...');
        downloadBtn.click();
        await sleep(2000);

        updateDownloadStatus('Download iniciado!', true, true);
        return true;
    }

    // Se nao encontrou botao, tentar pegar URL do video
    const videoElements = document.querySelectorAll('video');
    for (const video of videoElements) {
        if (video.src && video.src.startsWith('http')) {
            console.log('[Umbra Flow] Video encontrado, enviando para download...');

            chrome.runtime.sendMessage({
                action: 'downloadVideo',
                url: video.src,
                promptNumber: 1,
                promptText: `${projectName}_sequencia`,
                folder: downloadFolder
            }, (response) => {
                if (response && response.success) {
                    updateDownloadStatus('Download concluido!', true, true);
                } else {
                    updateDownloadStatus('Erro no download', true, false, 'Falha ao baixar video');
                }
            });

            return true;
        }
    }

    updateDownloadStatus('Video nao encontrado', true, false, 'Nao foi possivel encontrar o video para download');
    return false;
}

function updateDownloadStatus(text, done, success = false, error = null) {
    try {
        chrome.runtime.sendMessage({
            type: 'downloadStatus',
            text,
            done,
            success,
            error
        });
    } catch (e) {
        console.log('[Umbra Flow] Erro ao enviar status de download');
    }
}

// ========== AUTOMACAO PRINCIPAL ==========

class ExtendAutomation {
    constructor() {
        this.isRunning = false;
        this.queue = [];
        this.currentIndex = 0;
        this.completedCount = 0;
        this.config = {};
    }

    async start(prompts, config) {
        if (this.isRunning) {
            console.log('[Umbra Flow] Ja esta rodando');
            return;
        }

        this.isRunning = true;
        this.queue = prompts;
        this.currentIndex = 0;
        this.completedCount = 0;
        this.config = {
            maxWaitTime: (config.maxWaitTime || 120) * 1000,
            delayBetweenExtends: (config.delayBetweenExtends || 5) * 1000,
            projectName: config.projectName || 'plano_sequencia',
            autoDownload: config.autoDownload !== false,
            downloadFolder: config.downloadFolder || null
        };

        console.log(`[Umbra Flow] Iniciando sequencia com ${this.queue.length} cenas`);
        console.log(`[Umbra Flow] Config:`, this.config);
        console.log(`[Umbra Flow] Pasta de download: ${this.config.downloadFolder || 'padrao'}`);

        updateStatus(
            `Iniciando sequencia de ${this.queue.length} cenas...`,
            { current: 0, total: this.queue.length }
        );

        await this.processQueue();
    }

    async processQueue() {
        while (this.isRunning && this.currentIndex < this.queue.length) {
            const scene = this.queue[this.currentIndex];

            console.log(`[Umbra Flow] === Processando cena ${scene.index}/${this.queue.length} ===`);
            console.log(`[Umbra Flow] Prompt: "${scene.text.substring(0, 50)}..."`);

            updateStatus(
                `Processando cena ${scene.index}...`,
                { current: this.currentIndex, total: this.queue.length },
                scene.text
            );

            const success = await this.processScene(scene);

            if (success) {
                this.completedCount++;
                console.log(`[Umbra Flow] Cena ${scene.index} processada com sucesso`);
            } else {
                console.error(`[Umbra Flow] Falha na cena ${scene.index}`);
                updateStatus(
                    `Erro na cena ${scene.index}. Tentando continuar...`,
                    { current: this.currentIndex, total: this.queue.length },
                    scene.text
                );
            }

            this.currentIndex++;

            if (this.isRunning && this.currentIndex < this.queue.length) {
                console.log(`[Umbra Flow] Aguardando ${this.config.delayBetweenExtends / 1000}s antes da proxima cena...`);
                await sleep(this.config.delayBetweenExtends);
            }
        }

        this.finish();
    }

    async processScene(scene) {
        const maxRetries = CONFIG.maxRetries;

        if (isProcessingScene) {
            console.error('[Umbra Flow] ERRO CRITICO: Tentativa de processar cena enquanto outra esta em andamento!');
            return false;
        }

        isProcessingScene = true;
        console.log(`[Umbra Flow] === INICIANDO CENA ${scene.index} ===`);

        try {
            for (let retry = 0; retry <= maxRetries; retry++) {
                try {
                    if (retry > 0) {
                        console.log(`[Umbra Flow] === RETRY ${retry}/${maxRetries} para cena ${scene.index} ===`);
                        updateStatus(
                            `Retry ${retry}/${maxRetries} - Cena ${scene.index}...`,
                            { current: this.currentIndex, total: this.queue.length },
                            scene.text
                        );

                        await closeErrorModal();
                        await sleep(CONFIG.retryDelay);
                    }

                    // Contar clips antes de iniciar
                    const clipsBefore = getTimelineClipsInfo();
                    const initialClipCount = clipsBefore.length;
                    console.log(`[Umbra Flow] Clips na timeline ANTES: ${initialClipCount}`);

                    // Passo 0: Selecionar o ultimo video
                    console.log('[Umbra Flow] Passo 0: Selecionar ultimo video na timeline');
                    await selectLastVideoInTimeline();
                    await sleep(500);

                    // Passo 1: Clicar no botao "+"
                    console.log('[Umbra Flow] Passo 1: Clicar no botao +');
                    const plusClicked = await this.clickPlusButton();
                    if (!plusClicked) {
                        console.error('[Umbra Flow] Falha ao clicar no botao +');
                        if (retry < maxRetries) continue;
                        return false;
                    }

                    await sleep(800);

                    // Passo 2: Selecionar "Extend..."
                    console.log('[Umbra Flow] Passo 2: Selecionar Extend no menu');
                    const extendSelected = await this.selectExtendOption();
                    if (!extendSelected) {
                        console.error('[Umbra Flow] Falha ao selecionar Extend');
                        if (retry < maxRetries) continue;
                        return false;
                    }

                    await sleep(800);

                    // Passo 3: Inserir o prompt
                    console.log('[Umbra Flow] Passo 3: Inserir prompt');
                    const promptEntered = await enterPromptText(scene.text);
                    if (!promptEntered) {
                        console.error('[Umbra Flow] Falha ao inserir prompt');
                        if (retry < maxRetries) continue;
                        return false;
                    }

                    await sleep(500);

                    // Passo 4: Enviar
                    console.log('[Umbra Flow] Passo 4: Enviar');
                    const submitted = await clickSubmitArrow();
                    if (!submitted) {
                        console.error('[Umbra Flow] Falha ao enviar');
                        if (retry < maxRetries) continue;
                        return false;
                    }

                    lastSubmitTime = Date.now();
                    console.log('[Umbra Flow] Submit registrado, aguardando geracao...');

                    // Passo 5: Aguardar geracao
                    console.log('[Umbra Flow] Passo 5: Aguardar geracao');
                    const result = await waitForGeneration(this.config.maxWaitTime, initialClipCount);

                    if (result.success) {
                        console.log(`[Umbra Flow] Cena ${scene.index} concluida!`);
                        return true;
                    }

                    if (result.error) {
                        console.error(`[Umbra Flow] Erro na geracao: ${result.message}`);
                        updateStatus(
                            `Erro na cena ${scene.index}: ${result.message ? result.message.substring(0, 50) : 'erro desconhecido'}`,
                            { current: this.currentIndex, total: this.queue.length },
                            scene.text
                        );

                        await closeErrorModal();

                        if (retry < maxRetries) {
                            continue;
                        }

                        return false;
                    }

                    // Timeout sem erro
                    if (!result.error && !result.success) {
                        console.warn('[Umbra Flow] Timeout na geracao, verificando se completou...');

                        await sleep(5000);

                        const currentClips = getTimelineClipsInfo();
                        const lastClip = currentClips[currentClips.length - 1];

                        if (lastClip && !lastClip.isGenerating) {
                            console.log('[Umbra Flow] Clip completou apos timeout');
                            return true;
                        }

                        if (retry < maxRetries) continue;
                    }

                    return true;

                } catch (error) {
                    console.error(`[Umbra Flow] Erro ao processar cena:`, error);
                    if (retry < maxRetries) {
                        await closeErrorModal();
                        continue;
                    }
                    return false;
                }
            }

            return false;

        } finally {
            isProcessingScene = false;
            console.log(`[Umbra Flow] === CENA ${scene.index} FINALIZADA ===`);
        }
    }

    async clickPlusButton() {
        for (let attempt = 0; attempt < 5; attempt++) {
            const plusBtn = findPlusButton();
            if (plusBtn) {
                console.log('[Umbra Flow] Clicando no botao +...');
                plusBtn.click();
                await sleep(CONFIG.clickDelay);
                return true;
            }
            console.log(`[Umbra Flow] Botao + nao encontrado, tentativa ${attempt + 1}/5`);
            await sleep(800);
        }
        return false;
    }

    async selectExtendOption() {
        for (let attempt = 0; attempt < 5; attempt++) {
            const extendOption = findExtendOption();
            if (extendOption) {
                console.log('[Umbra Flow] Clicando em Extend...');
                extendOption.click();
                await sleep(CONFIG.clickDelay);
                return true;
            }
            console.log(`[Umbra Flow] Opcao Extend nao encontrada, tentativa ${attempt + 1}/5`);
            await sleep(500);
        }
        return false;
    }

    stop() {
        this.isRunning = false;
        console.log(`[Umbra Flow] Parado. ${this.completedCount} cenas processadas.`);
        updateStatus('Sequencia interrompida', null, null, true, false);
    }

    async finish() {
        this.isRunning = false;

        const allSuccess = this.completedCount === this.queue.length && this.completedCount > 0;

        console.log(`[Umbra Flow] === SEQUENCIA FINALIZADA ===`);
        console.log(`[Umbra Flow] ${this.completedCount}/${this.queue.length} cenas processadas`);

        updateStatus(
            allSuccess
                ? `Sequencia concluida! ${this.completedCount} cenas processadas.`
                : `Sequencia finalizada com erros. ${this.completedCount}/${this.queue.length} cenas.`,
            { current: this.completedCount, total: this.queue.length },
            null,
            true,
            allSuccess
        );

        if (this.config.autoDownload && this.completedCount > 0 && allSuccess) {
            console.log('[Umbra Flow] Iniciando download automatico...');
            console.log(`[Umbra Flow] Pasta de destino: ${this.config.downloadFolder || 'padrao'}`);
            await sleep(3000);
            await downloadFinalVideo(this.config.projectName, this.config.downloadFolder);
        }
    }
}

// ========== INSTANCIA GLOBAL ==========

const automation = new ExtendAutomation();
window.ffLabExtendAutomation = automation;

// ========== LISTENER DE MENSAGENS ==========

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (chrome.runtime.lastError) {
        console.error('[Umbra Flow] Erro no listener:', chrome.runtime.lastError);
        return true;
    }

    if (message.action === 'startSequence') {
        console.log('[Umbra Flow] Recebido comando para iniciar sequencia');
        console.log(`[Umbra Flow] Pasta configurada: ${message.config.downloadFolder || 'padrao'}`);
        automation.start(message.prompts, message.config);
    } else if (message.action === 'stopSequence') {
        console.log('[Umbra Flow] Recebido comando para parar sequencia');
        automation.stop();
    } else if (message.action === 'downloadFinalVideo') {
        console.log('[Umbra Flow] Recebido comando para download');
        console.log(`[Umbra Flow] Pasta: ${message.downloadFolder || 'padrao'}`);
        downloadFinalVideo(message.projectName, message.downloadFolder);
    }

    return true;
});

console.log('[Umbra Flow] Script carregado e pronto!');
