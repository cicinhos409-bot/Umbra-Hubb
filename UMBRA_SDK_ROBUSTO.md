
# Umbra SDK v2.0 (DottiFlow Style)

Este é o novo padrão de licenciamento para as extensões da UmbraHub. Ele inclui **Kill Switch**, **Sessões de 24h** e **Heartbeat**.

---

## 🏗️ 1. Arquivo `background.js` (O "Cérebro")

Este arquivo deve rodar em segundo plano para manter a sessão ativa e verificar bloqueios.

```javascript
const SDK_CONFIG = {
  url: 'https://cvrdcupvqvkpwllwlkfw.functions.supabase.co/validar-licenca',
  slug: 'umbrahub-all', // Mude para o slug da extensão específica se necessário
  version: '2.0.0',
  heartbeatInterval: 6 * 60 * 60 * 1000 // 6 horas
};

// --- FUNÇÕES CORE DO SDK ---

async function getDeviceId() {
  return new Promise(async (resolve) => {
    // 1. Tenta recuperar do storage primeiro (Sempre prioridade)
    const data = await chrome.storage.local.get('umbra_device_id');
    if (data.umbra_device_id) return resolve(data.umbra_device_id);

    // 2. Gerador de Fingerprint Estável (Service Worker Compatible)
    try {
      // Captura informações estáveis de hardware e plataforma
      const platform = await new Promise(r => chrome.runtime.getPlatformInfo(r));
      
      const components = [
        navigator.userAgent,
        navigator.language,
        navigator.hardwareConcurrency || '8',
        platform.os,
        platform.arch,
        platform.nacl_arch || ''
      ];

      // Cria um hash curto e estável
      const rawId = components.join('|');
      const hash = btoa(rawId).replace(/[/+=]/g, '').slice(-24);
      const finalId = 'umb-' + hash.toLowerCase();
      
      await chrome.storage.local.set({ umbra_device_id: finalId });
      resolve(finalId);
    } catch (e) {
      // Fallback randômico se tudo falhar
      const fallback = 'dev-' + Math.random().toString(36).slice(2) + Date.now();
      await chrome.storage.local.set({ umbra_device_id: fallback });
      resolve(fallback);
    }
  });
}

async function callSDK(action, extra = {}) {
  const device_id = await getDeviceId();
  const storage = await chrome.storage.local.get(['umbra_token', 'umbra_chave']);
  
  try {
    const res = await fetch(SDK_CONFIG.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        device_id,
        slug: SDK_CONFIG.slug,
        version: SDK_CONFIG.version,
        token: storage.umbra_token,
        chave: storage.umbra_chave,
        ...extra
      })
    });
    return await res.json();
  } catch (e) {
    return { error: 'offline' };
  }
}

// Verifica status (Kill Switch + Session)
async function checkStatus() {
  const data = await chrome.storage.local.get(['umbra_token', 'umbra_expiry']);
  
  // 1. Verifica Kill Switch primeiro
  const info = await callSDK('verify');
  
  if (info.blocked) {
    await chrome.storage.local.set({ umbra_blocked: true, umbra_motivo: info.motivo });
    return { blocked: true, motivo: info.motivo };
  }

  // 2. Verifica se a sessão local é válida (Fallback Offline)
  const isExpired = data.umbra_expiry && Date.now() > data.umbra_expiry;
  
  if (info.error === 'offline') {
    return { valido: !isExpired, offline: true };
  }

  if (info.valido) {
    await chrome.storage.local.set({ umbra_blocked: false });
    return { valido: true, plano: info.plano };
  } else {
    // Sessão inválida no servidor
    await chrome.storage.local.remove(['umbra_token', 'umbra_expiry']);
    return { valido: false, motivo: info.motivo };
  }
}

// Ativação da Chave
async function activate(chave) {
  const res = await callSDK('activate', { chave });
  if (res.valido) {
    const expiry = Date.now() + (res.token_duration * 1000);
    await chrome.storage.local.set({
      umbra_chave: chave,
      umbra_token: res.token,
      umbra_expiry: expiry,
      umbra_plano: res.plano,
      umbra_blocked: false
    });
  }
  return res;
}

// Heartbeat Periódico
chrome.alarms.create('heartbeat', { periodInMinutes: 360 }); // 6 horas
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'heartbeat') checkStatus();
});

// Comunicação com o Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_STATUS') {
    checkStatus().then(sendResponse);
    return true;
  }
  if (request.action === 'ACTIVATE') {
    activate(request.chave).then(sendResponse);
    return true;
  }
});
```

---

## 🎨 2. Arquivo `popup.js` (Interface)

```javascript
const elements = {
  telaLogin: document.getElementById('login-screen'),
  telaApp: document.getElementById('app-screen'),
  inputChave: document.getElementById('chave-input'),
  btnAtivar: document.getElementById('btn-ativar'),
  statusMsg: document.getElementById('status-msg')
};

// Inicializa
async function init() {
  const status = await chrome.runtime.sendMessage({ action: 'GET_STATUS' });

  if (status.blocked) {
    alert('BLOQUEIO REMOTO: ' + status.motivo);
    document.body.innerHTML = `<div style="padding:20px; color:red;">${status.motivo}</div>`;
    return;
  }

  if (status.valido) {
    mostrarApp(status.plano);
  } else {
    mostrarLogin();
  }
}

function mostrarApp(plano) {
  elements.telaLogin.style.display = 'none';
  elements.telaApp.style.display = 'block';
  elements.statusMsg.innerText = `Plano ${plano.toUpperCase()} Ativo`;
}

function mostrarLogin() {
  elements.telaLogin.style.display = 'block';
  elements.telaApp.style.display = 'none';
}

elements.btnAtivar.addEventListener('click', async () => {
  const chave = elements.inputChave.value.trim();
  if (!chave) return;

  elements.btnAtivar.disabled = true;
  elements.btnAtivar.innerText = 'Verificando...';

  const res = await chrome.runtime.sendMessage({ action: 'ACTIVATE', chave });

  if (res.valido) {
    mostrarApp(res.plano);
  } else {
    alert(res.motivo || 'Erro ao ativar.');
  }
  
  elements.btnAtivar.disabled = false;
  elements.btnAtivar.innerText = 'ATIVAR';
});

init();
```
