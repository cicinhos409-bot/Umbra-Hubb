// ═══════════════════════════════════════════════════════
// UMBRA UNIFIED AUTOMATION - Background Service Worker
// Suporta ChatGPT e Claude em uma única extensão.
// ═══════════════════════════════════════════════════════

// ─── Automation State ─────────────────────────────────
let isRunning = false;
let lockedTabId = null;
let lockedPlatform = null; // 'chatgpt' | 'claude' | 'gemini'
let isPaused = false;

// ─── License SDK Config ───────────────────────────────
const SDK = {
  endpoint: 'https://cvrdcupvqvkpwllwlkfw.functions.supabase.co/validar-licenca',
  slug: 'umbrahub-all',
  version: '2.1.0',
  sessionHours: 24,
  heartbeatHours: 6,
};

// ═══════════════════════════════════════════════════════
// LICENSE
// ═══════════════════════════════════════════════════════

async function getDeviceId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['umbra_device_id'], (data) => {
      if (data.umbra_device_id) return resolve(data.umbra_device_id);
      const id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
      chrome.storage.local.set({ umbra_device_id: id }, () => resolve(id));
    });
  });
}

async function callLicenseAPI(payload) {
  try {
    const res = await fetch(SDK.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    console.error('[Umbra SDK] API error:', e);
    return null;
  }
}

async function activateLicense(chave) {
  const device_id = await getDeviceId();
  const result = await callLicenseAPI({
    action: 'activate', chave, device_id, slug: SDK.slug, version: SDK.version,
  });
  if (result && result.valido) {
    const expiry = Date.now() + SDK.sessionHours * 3600 * 1000;
    await chrome.storage.local.set({
      umbra_chave: chave,
      umbra_token: result.token || '',
      umbra_expiry: expiry,
    });
    scheduleHeartbeat();
    return { valido: true };
  }
  return { valido: false, motivo: result?.motivo || 'Chave inválida ou limite atingido.' };
}

async function verifyLicense() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['umbra_chave', 'umbra_token', 'umbra_expiry'], async (data) => {
      if (!data.umbra_chave) return resolve({ valido: false, motivo: 'Sem licença.' });
      if (data.umbra_expiry && Date.now() < data.umbra_expiry) return resolve({ valido: true });
      const device_id = await getDeviceId();
      const result = await callLicenseAPI({
        action: 'verify',
        chave: data.umbra_chave,
        device_id,
        token: data.umbra_token || '',
        slug: SDK.slug,
        version: SDK.version,
      });
      if (result && result.valido) {
        const expiry = Date.now() + SDK.sessionHours * 3600 * 1000;
        await chrome.storage.local.set({
          umbra_token: result.token || data.umbra_token,
          umbra_expiry: expiry,
        });
        return resolve({ valido: true });
      }
      await chrome.storage.local.remove(['umbra_chave', 'umbra_token', 'umbra_expiry']);
      resolve({ valido: false, motivo: result?.motivo || 'Licença revogada.' });
    });
  });
}

function scheduleHeartbeat() {
  chrome.alarms.create('umbra_heartbeat', { periodInMinutes: SDK.heartbeatHours * 60 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'umbra_heartbeat') verifyLicense();
});

chrome.storage.local.get(['umbra_chave'], (data) => {
  if (data.umbra_chave) scheduleHeartbeat();
});

// ═══════════════════════════════════════════════════════
// MESSAGE ROUTER
// ═══════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // License
  if (request.action === 'GET_STATUS') {
    verifyLicense().then(sendResponse);
    return true;
  }
  if (request.action === 'ACTIVATE') {
    activateLicense(request.chave).then(sendResponse);
    return true;
  }
  if (request.action === 'LOGOUT') {
    chrome.storage.local.remove(['umbra_chave', 'umbra_token', 'umbra_expiry'], () => sendResponse({ ok: true }));
    return true;
  }

  // Automation
  if (request.action === 'startSequence') {
    isRunning = true;
    lockedTabId = sender.tab.id;
    lockedPlatform = detectPlatformFromUrl(sender.tab.url);
    chrome.storage.local.set({ isRunning: true });
    sendResponse({ ok: true, platform: lockedPlatform });
    processQueue(request.items, request.settings || {});
    return true;
  }
  if (request.action === 'stopSequence') {
    isRunning = false;
    isPaused = false;
    lockedTabId = null;
    lockedPlatform = null;
    chrome.storage.local.set({ isRunning: false });
    sendResponse({ ok: true });
    return true;
  }
  if (request.action === 'pauseSequence') {
    isPaused = true;
    notify({ action: 'paused' });
    sendResponse({ ok: true });
    return true;
  }
  if (request.action === 'resumeSequence') {
    isPaused = false;
    notify({ action: 'resumed' });
    sendResponse({ ok: true });
    return true;
  }
});

// Toggle panel on icon click
chrome.action.onClicked.addListener((tab) => {
  const platform = detectPlatformFromUrl(tab.url);
  if (!platform) {
    // Fora de plataforma suportada — abre ChatGPT por padrão
    // Suportado: chatgpt.com · claude.ai · gemini.google.com
    chrome.tabs.create({ url: 'https://chatgpt.com/' });
    return;
  }
  chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }, () => {
    if (chrome.runtime.lastError) {
      // Try to inject content script if not loaded
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }).catch(() => {});
    }
  });
});

function detectPlatformFromUrl(url = '') {
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) return 'chatgpt';
  if (url.includes('gemini.google.com')) return 'gemini';
  return null;
}

// ═══════════════════════════════════════════════════════
// AUTOMATION ENGINE
// ═══════════════════════════════════════════════════════

async function processQueue(items, settings) {
  const cooldown = Math.max(500, Number(settings.cooldown) || 2000);
  const skipErrors = !!settings.skipErrors;
  const infiniteLoop = !!settings.infiniteLoop;
  const stopIfContains = (settings.stopIfContains || '').trim();
  const autoCopy = !!settings.autoCopy;
  const autoScreenshot = !!settings.autoScreenshot;

  const originalItems = [...items];
  let queue = [...items];
  let index = 0;
  let loopRun = 1;
  const totalPerRun = originalItems.length;

  try {
    while (isRunning && lockedTabId) {
      if (queue.length === 0) {
        if (infiniteLoop && isRunning) {
          queue = [...originalItems];
          index = 0;
          loopRun++;
          notify({ action: 'loopReset', run: loopRun });
          await sleep(cooldown);
          continue;
        } else {
          break;
        }
      }

      index++;
      const item = queue[0];
      notify({ action: 'progress', step: index, total: totalPerRun, text: item.text, run: loopRun, infinite: infiniteLoop });

      // Retry loop
      let sent = false;
      for (let attempt = 1; attempt <= 3 && isRunning; attempt++) {
        const ok = await sendPromptToTab(lockedTabId, lockedPlatform, item);
        if (!ok) {
          if (attempt === 3) {
            if (skipErrors) { sent = false; break; }
            throw new Error('Não foi possível encontrar o campo de entrada.');
          }
          await sleep(1500);
          continue;
        }
        await waitForResponse(lockedTabId, lockedPlatform);
        const busyErr = await checkBusyError(lockedTabId);
        if (busyErr && attempt < 3) {
          notify({ action: 'progress', step: index, total: totalPerRun, text: `Tentando novamente (${attempt + 1}/3)…`, run: loopRun, infinite: infiniteLoop });
          await sleep(4000 * attempt);
          continue;
        }
        sent = true;
        break;
      }

      if (!sent) {
        if (skipErrors) {
          notify({ action: 'skipped', step: index, total: totalPerRun, text: item.text });
          queue.shift();
          if (queue.length > 0) await sleep(cooldown);
          continue;
        }
        throw new Error('Serviço ocupado. Tente novamente em instantes.');
      }

      if (!isRunning) break;

      // ── Post-response actions ──
      if (autoCopy) await copyLastResponse(lockedTabId, lockedPlatform);
      if (autoScreenshot) await takeScreenshot(lockedTabId, index, loopRun);
      if (stopIfContains) {
        const found = await checkResponseContains(lockedTabId, lockedPlatform, stopIfContains);
        if (found) {
          notify({ action: 'stoppedByKeyword', keyword: stopIfContains });
          break;
        }
      }

      queue.shift();
      await waitWhilePaused();
      if (queue.length > 0 || infiniteLoop) await sleep(cooldown);
    }
  } catch (e) {
    console.error('[Umbra] Automation error:', e);
    notify({ action: 'error', message: e.message });
  } finally {
    isRunning = false;
    isPaused = false;
    lockedTabId = null;
    lockedPlatform = null;
    chrome.storage.local.get(['reviewStatus', 'successCount'], (data) => {
      const status = data.reviewStatus || 'pending';
      const newCount = (data.successCount || 0) + 1;
      const update = { successCount: newCount, isRunning: false };
      if (status === 'pending' && (newCount === 3 || (newCount > 3 && newCount % 10 === 0))) {
        update.showReviewBanner = true;
      }
      chrome.storage.local.set(update, () => notify({ action: 'automationFinished', successCount: newCount }));
    });
  }
}

function notify(payload) {
  chrome.tabs.query({ url: ['https://chatgpt.com/*', 'https://chat.openai.com/*', 'https://claude.ai/*', 'https://gemini.google.com/*'] }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, payload, () => { if (chrome.runtime.lastError) {} });
    });
  });
}

// ─── Send prompt (with optional image + links) ──────
async function sendPromptToTab(tabId, platform, item) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: injectedSender,
      args: [platform, item],
    });
    return results[0]?.result ?? false;
  } catch (e) {
    console.error('[Umbra] sendPrompt error:', e);
    return false;
  }
}

// This function runs in the page context.
function injectedSender(platform, item) {
  return new Promise(async (resolve) => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    // ─── Build final text with links appended ───
    let finalText = item.text || '';
    if (Array.isArray(item.links) && item.links.length) {
      finalText += '\n\n' + item.links.join('\n');
    }

    // ─── Locate editor ───
    const findEditor = () => {
      if (platform === 'chatgpt') {
        return (
          document.querySelector('#prompt-textarea') ||
          document.querySelector('div[contenteditable="true"]')
        );
      }
      if (platform === 'gemini') {
        return (
          document.querySelector('div.ql-editor[contenteditable="true"]') ||
          document.querySelector('rich-textarea div[contenteditable="true"]') ||
          document.querySelector('div[contenteditable="true"]')
        );
      }
      // claude
      return (
        document.querySelector('div[contenteditable="true"].ProseMirror') ||
        document.querySelector('[data-testid="composer-container"] div[contenteditable="true"]') ||
        document.querySelector('div[contenteditable="true"]')
      );
    };

    const editor = findEditor();
    if (!editor) return resolve(false);
    editor.focus();

    // ─── Attach images if any ───
    if (Array.isArray(item.images) && item.images.length) {
      try {
        // Map mime → extension (ChatGPT rejects mismatched names)
        const extFor = (type) => {
          if (/png/i.test(type)) return 'png';
          if (/jpe?g/i.test(type)) return 'jpg';
          if (/webp/i.test(type)) return 'webp';
          if (/gif/i.test(type)) return 'gif';
          return 'png';
        };

        // Build File list with correct extensions
        const files = [];
        for (const img of item.images) {
          const res = await fetch(img.dataUrl);
          const blob = await res.blob();
          const mime = blob.type || 'image/png';
          const ext = extFor(mime);
          // Strip original name extension and rebuild
          const baseName = (img.name || 'image').replace(/\.[^.]+$/, '');
          const finalName = `${baseName}.${ext}`;
          files.push(new File([blob], finalName, { type: mime }));
        }

        const hasPreview = () =>
          !!document.querySelector(
            'img[alt*="ttach"], [data-testid*="attachment"], [class*="thumbnail"], [class*="Attachment"], [data-testid*="file"]'
          );

        // ── Strategy A: file input (primary for ChatGPT) ──
        const tryFileInput = () => {
          const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
          const fileInput =
            inputs.find((i) => (i.accept || '').includes('image')) || inputs[0];
          if (!fileInput) return false;
          try {
            const dt = new DataTransfer();
            files.forEach((f) => dt.items.add(f));
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            fileInput.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          } catch (e) {
            console.warn('[Umbra] file input set failed:', e);
            return false;
          }
        };

        // ── Strategy B: paste event (primary for Claude) ──
        const tryPaste = () => {
          try {
            const dt = new DataTransfer();
            files.forEach((f) => dt.items.add(f));
            const pasteEvt = new Event('paste', { bubbles: true, cancelable: true });
            Object.defineProperty(pasteEvt, 'clipboardData', { value: dt });
            editor.dispatchEvent(pasteEvt);
            return true;
          } catch (e) { return false; }
        };

        if (platform === 'chatgpt') {
          if (!tryFileInput()) tryPaste();
        } else if (platform === 'gemini') {
          // Gemini: try file input button first, then paste
          if (!tryFileInput()) tryPaste();
          await wait(600);
          if (!hasPreview()) tryPaste();
        } else {
          // Claude: paste is primary
          if (!tryPaste()) tryFileInput();
          await wait(800);
          if (!hasPreview()) tryFileInput();
        }

        // Wait for upload to complete (preview visible) up to ~15s
        let ok = false;
        for (let i = 0; i < 37; i++) {
          if (hasPreview()) { ok = true; break; }
          await wait(400);
        }
        // Extra grace period so ChatGPT finishes the server-side upload
        if (ok) await wait(1200);
      } catch (e) {
        console.warn('[Umbra] image attach failed:', e);
      }
    }

    // ─── Insert text ───
    if (platform === 'chatgpt') {
      editor.innerHTML = '';
      const p = document.createElement('p');
      p.textContent = finalText;
      editor.appendChild(p);
      editor.dispatchEvent(new Event('focus', { bubbles: true }));
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: finalText }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (platform === 'gemini') {
      // Gemini uses Quill editor — execCommand works reliably
      editor.focus();
      await wait(100);
      // Clear existing content
      document.execCommand('selectAll', false, null);
      await wait(60);
      document.execCommand('delete', false, null);
      await wait(80);
      // Insert text (Quill responds to execCommand insertText)
      document.execCommand('insertText', false, finalText);
      await wait(150);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
      await wait(150);
      // Move cursor to end
      const selG = window.getSelection();
      const rangeG = document.createRange();
      rangeG.selectNodeContents(editor);
      rangeG.collapse(false);
      selG.removeAllRanges();
      selG.addRange(rangeG);
    } else {
      // Claude — ProseMirror bulk insert with fallback
      editor.focus();
      const sel2 = window.getSelection();
      const range2 = document.createRange();
      range2.selectNodeContents(editor);
      range2.collapse(false);
      sel2.removeAllRanges();
      sel2.addRange(range2);

      const isEditorEmpty = () => editor.innerText.replace(/\n/g, '').trim() === '';
      if (!isEditorEmpty()) {
        document.execCommand('selectAll', false, null);
        await wait(80);
        document.execCommand('delete', false, null);
        await wait(80);
      }

      // Attempt 1 — bulk insert (instant)
      editor.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertText', data: finalText, bubbles: true, cancelable: true,
      }));
      document.execCommand('insertText', false, finalText);
      await wait(200);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(100);

      // Check quickly if button is already enabled
      const quickCheck = () => {
        const b = document.querySelector(
          'button[aria-label="Send message"], button[aria-label="Enviar mensagem"], button[data-testid="send-button"]'
        );
        return b && !b.disabled && b.getAttribute('aria-disabled') !== 'true';
      };

      if (!quickCheck()) {
        // Attempt 2 — chunked insert (80 chars, 40ms delay)
        if (!isEditorEmpty()) { document.execCommand('selectAll', false, null); await wait(60); document.execCommand('delete', false, null); await wait(60); }
        const chunks = finalText.match(/.{1,80}/gs) || [finalText];
        for (const chunk of chunks) {
          editor.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: chunk, bubbles: true, cancelable: true }));
          document.execCommand('insertText', false, chunk);
          await wait(40);
        }
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(150);
      }

      if (!quickCheck()) {
        // Attempt 3 — char by char (last resort, only first 300 chars max)
        const shortText = finalText.slice(0, 300);
        if (!isEditorEmpty()) { document.execCommand('selectAll', false, null); await wait(60); document.execCommand('delete', false, null); await wait(60); }
        for (const char of shortText) {
          editor.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: char, bubbles: true, cancelable: true }));
          document.execCommand('insertText', false, char);
          await wait(10);
        }
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(100);
      }

      // Space + backspace trick to force state recompute
      editor.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: ' ', bubbles: true }));
      document.execCommand('insertText', false, ' ');
      await wait(60);
      editor.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true }));
      document.execCommand('delete', false, null);
      await wait(120);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // ─── Click send ───
    await wait(700);
    const vh = window.innerHeight;
    const tryFindSendBtn = () => {
      if (platform === 'chatgpt') {
        return (
          document.querySelector('button[data-testid="send-button"]') ||
          document.querySelector('button[aria-label="Send prompt"]') ||
          document.querySelector('button[aria-label="Enviar prompt"]') ||
          document.querySelector('form button[type="submit"]')
        );
      }
      if (platform === 'gemini') {
        return (
          document.querySelector('button[aria-label="Send message"]') ||
          document.querySelector('button.send-button') ||
          document.querySelector('button[data-mat-icon-name="send"]') ||
          document.querySelector('button[aria-label="Enviar mensagem"]') ||
          (() => {
            // Fallback: visible button near bottom with send icon
            const all = Array.from(document.querySelectorAll('button'));
            return all.find((b) => {
              const r = b.getBoundingClientRect();
              return r.top > vh * 0.6 && !b.disabled && r.width > 0 && b.querySelector('mat-icon, svg');
            }) || null;
          })()
        );
      }
      // Claude
      let btn =
        document.querySelector('button[aria-label="Send message"]') ||
        document.querySelector('button[aria-label="Enviar mensagem"]') ||
        document.querySelector('button[data-testid="send-button"]');
      if (btn) return btn;
      const all = Array.from(document.querySelectorAll('button'));
      btn = all.find((b) => {
        const r = b.getBoundingClientRect();
        return r.top > vh * 0.55 && !b.disabled && r.width > 0 && b.querySelector('svg');
      });
      return btn || null;
    };

    // Wait up to 15s for upload to finish / button to enable
    let btn = null;
    for (let i = 0; i < 30; i++) {
      btn = tryFindSendBtn();
      if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') break;
      // Re-dispatch input event to keep state fresh (Claude / Gemini)
      if (platform === 'claude' || platform === 'gemini') {
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await wait(500);
    }
    if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
      btn.click();
      return resolve(true);
    }
    // Fallback: Ctrl+Enter / Enter
    editor.focus();
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    editor.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    editor.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    resolve(true);
  });
}

async function waitForResponse(tabId, platform) {
  await sleep(1500);
  return new Promise((resolve) => {
    let idle = 0;
    const iv = setInterval(() => {
      if (!isRunning) { clearInterval(iv); resolve(); return; }
      chrome.scripting.executeScript({
        target: { tabId },
        func: (plat) => {
          if (plat === 'chatgpt') {
            return !!(
              document.querySelector('button[data-testid="stop-button"]') ||
              document.querySelector('.result-streaming, [class*="streaming"]') ||
              document.querySelector('[aria-label="Stop generating"]') ||
              document.querySelector('[aria-label="Parar geração"]')
            );
          }
          if (plat === 'gemini') {
            return !!(
              document.querySelector('button[aria-label="Stop response"]') ||
              document.querySelector('button[aria-label="Parar resposta"]') ||
              document.querySelector('.loading-indicator') ||
              document.querySelector('model-response .loading') ||
              document.querySelector('[aria-label="Generating response"]') ||
              document.querySelector('mat-progress-spinner')
            );
          }
          // claude
          return !!(
            document.querySelector('.font-claude-message [data-is-streaming="true"]') ||
            document.querySelector('[data-is-streaming]') ||
            document.querySelector('button[aria-label="Stop"]') ||
            document.querySelector('button[aria-label="Parar"]') ||
            document.querySelector('.loading-indicator, [class*="spinner"]')
          );
        },
        args: [platform],
      }, (res) => {
        if (chrome.runtime.lastError) { clearInterval(iv); resolve(); return; }
        const busy = res?.[0]?.result;
        if (!busy) {
          idle++;
          if (idle >= 3) { clearInterval(iv); setTimeout(resolve, 500); }
        } else { idle = 0; }
      });
    }, 1000);
  });
}

async function checkBusyError(tabId) {
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const txt = document.body.innerText || '';
        return /temporarily busy|try again shortly|rate.?limit|too many requests|servi(c|ç)o.*ocupado/i.test(txt);
      },
    });
    return !!res?.[0]?.result;
  } catch { return false; }
}

async function copyLastResponse(tabId, platform) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (plat) => {
        let text = '';
        if (plat === 'chatgpt') {
          const msgs = document.querySelectorAll('[data-message-author-role="assistant"]');
          if (msgs.length) text = msgs[msgs.length - 1].innerText || '';
        } else if (plat === 'gemini') {
          const msgs = document.querySelectorAll('model-response .markdown, model-response .response-content, .model-response-text');
          if (msgs.length) text = msgs[msgs.length - 1].innerText || '';
          if (!text) {
            const all = document.querySelectorAll('model-response');
            if (all.length) text = all[all.length - 1].innerText || '';
          }
        } else {
          const msgs = document.querySelectorAll('.font-claude-message');
          if (msgs.length) text = msgs[msgs.length - 1].innerText || '';
        }
        if (text) {
          navigator.clipboard.writeText(text).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
          });
        }
        return !!text;
      },
      args: [platform],
    });
  } catch (e) { console.warn('[Umbra] copyLastResponse failed:', e); }
}

async function checkResponseContains(tabId, platform, keyword) {
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId },
      func: (plat, kw) => {
        let text = '';
        if (plat === 'chatgpt') {
          const msgs = document.querySelectorAll('[data-message-author-role="assistant"]');
          if (msgs.length) text = msgs[msgs.length - 1].innerText || '';
        } else if (plat === 'gemini') {
          const msgs = document.querySelectorAll('model-response .markdown, model-response .response-content, .model-response-text');
          if (msgs.length) text = msgs[msgs.length - 1].innerText || '';
          if (!text) {
            const all = document.querySelectorAll('model-response');
            if (all.length) text = all[all.length - 1].innerText || '';
          }
        } else {
          const msgs = document.querySelectorAll('.font-claude-message');
          if (msgs.length) text = msgs[msgs.length - 1].innerText || '';
        }
        return text.toLowerCase().includes(kw.toLowerCase());
      },
      args: [platform, keyword],
    });
    return !!res?.[0]?.result;
  } catch (e) { return false; }
}

async function takeScreenshot(tabId, index, run) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (url, idx, r) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `umbra-r${r}-msg${idx}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 500);
      },
      args: [dataUrl, index, run],
    });
  } catch (e) { console.warn('[Umbra] screenshot failed:', e); }
}

async function waitWhilePaused() {
  while (isPaused && isRunning) {
    await sleep(300);
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
