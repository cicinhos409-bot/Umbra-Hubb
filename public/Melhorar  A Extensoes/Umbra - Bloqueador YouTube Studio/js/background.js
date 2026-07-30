/**
 * Umbra v3.0.0 - background.js
 * SDK de Licença v2.0 — Umbra Hub (Supabase)
 */

// ─── Config ───────────────────────────────────────────────────────
const SDK_ENDPOINT = 'https://cvrdcupvqvkpwllwlkfw.functions.supabase.co/validar-licenca';
const SDK_SLUG     = 'umbra-studio';
const SDK_VERSION  = '5.1.0';
const HEARTBEAT_MS = 6 * 60 * 60 * 1000; // 6 horas
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas (sessão offline)

// ─── Init ─────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  // Garante device_id único e persistente
  await ensureDeviceId();
  // Garante settings padrão
  const { umbra_settings } = await storageGet(['umbra_settings']);
  if (!umbra_settings) {
    await storageSet({ umbra_settings: { umbra_on: true } });
  }
  // Inicia heartbeat se já houver licença ativa
  scheduleHeartbeat();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleHeartbeat();
});

// ─── Mensagens do popup / content ─────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'GET_STATUS') {
    getStatus().then(sendResponse);
    return true;
  }
  if (msg.action === 'ACTIVATE') {
    activate(msg.chave).then(sendResponse);
    return true;
  }
  if (msg.action === 'LOGOUT') {
    logout().then(sendResponse);
    return true;
  }
  // Repassa mensagem para aba ativa (UMBRA_SHOW_PANEL)
  if (msg.type === 'UMBRA_SHOW_PANEL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
    });
    return false;
  }
});

// ─── Clique no ícone — abre/mostra o Studio ───────────────────────
chrome.action.onClicked.addListener((tab) => {
  const url = tab?.url || '';
  if (url.includes('youtube.com') || url.includes('studio.youtube.com')) {
    chrome.tabs.sendMessage(tab.id, { type: 'UMBRA_SHOW_PANEL' }).catch(() => {});
  } else {
    chrome.tabs.create({ url: 'https://studio.youtube.com' });
  }
});


// ─── Atualização de ícone por umbra_settings ──────────────────────
chrome.storage.onChanged.addListener((changes) => {
  if (changes.umbra_settings) {
    const s = changes.umbra_settings.newValue || {};
    updateIcon(s.umbra_on !== false);
  }
});

// ═══════════════════════════════════════════════════════════════════
// SDK CORE
// ═══════════════════════════════════════════════════════════════════

async function getStatus() {
  const { umbra_chave, umbra_token, umbra_expiry } = await storageGet([
    'umbra_chave', 'umbra_token', 'umbra_expiry'
  ]);

  if (!umbra_chave || !umbra_token) return { valido: false, motivo: 'Sem licença' };

  // Verifica sessão offline (token ainda válido por 24h)
  const now = Date.now();
  if (umbra_expiry && now < umbra_expiry) {
    return { valido: true, chave: umbra_chave };
  }

  // Token expirado — faz verify no servidor
  return await verify(umbra_chave, umbra_token);
}

async function activate(chave) {
  if (!chave) return { valido: false, motivo: 'Chave vazia' };
  const device_id = await ensureDeviceId();

  try {
    const res = await fetch(SDK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'activate',
        chave: chave.toUpperCase(),
        device_id,
        slug: SDK_SLUG,
        version: SDK_VERSION
      })
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (data.valido || data.success) {
      const token  = data.token || data.session_token || '';
      const expiry = Date.now() + TOKEN_TTL_MS;
      await storageSet({
        umbra_chave:  chave.toUpperCase(),
        umbra_token:  token,
        umbra_expiry: expiry
      });
      scheduleHeartbeat();
      return { valido: true, chave: chave.toUpperCase() };
    } else {
      return { valido: false, motivo: data.motivo || data.message || 'Chave inválida' };
    }
  } catch (err) {
    return { valido: false, motivo: 'Erro de conexão: ' + err.message };
  }
}

async function verify(chave, token) {
  const device_id = await ensureDeviceId();
  try {
    const res = await fetch(SDK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        chave,
        device_id,
        token,
        slug: SDK_SLUG,
        version: SDK_VERSION
      })
    });

    if (!res.ok) {
      // Rede indisponível — considera válido por mais 24h (modo offline)
      await storageSet({ umbra_expiry: Date.now() + TOKEN_TTL_MS });
      return { valido: true, chave, offline: true };
    }

    const data = await res.json();
    if (data.valido || data.success) {
      const newToken  = data.token || data.session_token || token;
      const newExpiry = Date.now() + TOKEN_TTL_MS;
      await storageSet({ umbra_token: newToken, umbra_expiry: newExpiry });
      return { valido: true, chave };
    } else {
      // Kill switch acionado — remove licença
      await logout();
      return { valido: false, motivo: data.motivo || 'Licença revogada' };
    }
  } catch {
    await storageSet({ umbra_expiry: Date.now() + TOKEN_TTL_MS });
    return { valido: true, chave, offline: true };
  }
}

async function logout() {
  await storageRemove(['umbra_chave', 'umbra_token', 'umbra_expiry']);
  return { valido: false };
}

// ─── Heartbeat a cada 6h ──────────────────────────────────────────
let heartbeatTimer = null;

function scheduleHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    const { umbra_chave, umbra_token } = await storageGet(['umbra_chave', 'umbra_token']);
    if (umbra_chave && umbra_token) {
      await verify(umbra_chave, umbra_token);
    }
  }, HEARTBEAT_MS);
}

// ─── Device ID ────────────────────────────────────────────────────
async function ensureDeviceId() {
  const { umbra_device_id } = await storageGet(['umbra_device_id']);
  if (umbra_device_id) return umbra_device_id;
  const id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  await storageSet({ umbra_device_id: id });
  return id;
}

// ─── Icon ─────────────────────────────────────────────────────────
function updateIcon(on) {
  const s = on ? '' : '-off';
  chrome.action.setIcon({
    path: {
      '16':  'icons/icon' + s + '-16.png',
      '32':  'icons/icon' + s + '-32.png',
      '48':  'icons/icon' + s + '-48.png',
      '128': 'icons/icon' + s + '-128.png'
    }
  }).catch(() => {});
}

// ─── Storage helpers (Promise) ────────────────────────────────────
function storageGet(keys) {
  return new Promise(res => chrome.storage.local.get(keys, res));
}
function storageSet(obj) {
  return new Promise(res => chrome.storage.local.set(obj, res));
}
function storageRemove(keys) {
  return new Promise(res => chrome.storage.local.remove(keys, res));
}
