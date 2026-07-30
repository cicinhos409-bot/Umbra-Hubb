/**
 * Umbra - panel.js
 * Runs inside the floating iframe, communicates with content.js via postMessage
 */

const DEFAULTS = {
  umbra_on: true,
  hide_feed: false, redirect_subs: false,
  hide_sidebar: false, hide_recommended: false, hide_chat: false,
  hide_playlists: false, hide_donate: false,
  hide_endscreen: false, hide_cards: false, hide_shorts: false,
  hide_comments: false, hide_mix: false, hide_merch: false,
  hide_meta: false, hide_header: false, hide_notifs: false,
  hide_search: false, hide_trending: false, hide_moreyt: false,
  hide_subs: false, disable_autoplay: false, disable_annots: false,
  studio_hide_analytics: false, studio_hide_comments: false,
  studio_hide_revenue: false, studio_hide_subs_count: false,
  studio_hide_views: false, studio_hide_likes: false,
  studio_hide_dashboard: false, studio_hide_news: false,
  studio_hide_sidebar: false,
  studio_censor_titles: false, studio_censor_thumbs: false,
  studio_censor_profile: false, studio_censor_top_content: false,
  studio_censor_recent: false, studio_censor_audience: false
};

let settings = { ...DEFAULTS };

// ─── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupLogo();
  setupLicenseOverlay();
  loadSettings();
  setupTabs();
  setupToggles();
  setupHeader();
  setupFooter();
});

// ─── LOGO ─────────────────────────────────────────────
function setupLogo() {
  const logoUrl = chrome?.runtime?.getURL('icons/icon-48.png') || '';
  const panelLogo = document.getElementById('panel-logo');
  const licLogo   = document.getElementById('lic-logo');
  if (panelLogo) panelLogo.src = logoUrl;
  if (licLogo)   licLogo.src   = logoUrl;
}

// ─── LICENSE OVERLAY ──────────────────────────────────
const LIC_KEY_PATTERN = /^UMBRA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function setupLicenseOverlay() {
  const overlay = document.getElementById('licenca-overlay');
  const input   = document.getElementById('lic-input');
  const btn     = document.getElementById('lic-btn');
  const msg     = document.getElementById('lic-msg');

  // Auto-format input as user types
  input.addEventListener('input', () => {
    let v = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let parts = [];
    if (v.length > 0) parts.push(v.slice(0, 5));  // UMBRA
    if (v.length > 5) parts.push(v.slice(5, 9));
    if (v.length > 9) parts.push(v.slice(9, 13));
    if (v.length > 13) parts.push(v.slice(13, 17));
    input.value = parts.join('-');
    msg.textContent = '';
  });

  btn.addEventListener('click', () => {
    const key = input.value.trim().toUpperCase();
    if (!LIC_KEY_PATTERN.test(key)) {
      msg.textContent = 'Chave inválida. Use o formato UMBRA-XXXX-XXXX-XXXX.';
      input.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Verificando...';
    msg.textContent = '';

    // Send to parent for validation via chrome.storage
    window.parent.postMessage({ type: 'UMBRA_VALIDATE_LICENSE', key }, '*');
  });

  // Listen for validation response
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'UMBRA_LICENSE_RESULT') {
      btn.disabled = false;
      btn.textContent = 'Ativar Licença';
      if (e.data.valid) {
        overlay.classList.remove('visible');
      } else {
        msg.textContent = e.data.message || 'Licença inválida ou já utilizada.';
        input.focus();
      }
    }
  });

  // Check if already activated
  window.parent.postMessage({ type: 'UMBRA_CHECK_LICENSE' }, '*');

  window.addEventListener('message', (e) => {
    if (e.data?.type === 'UMBRA_LICENSE_STATUS') {
      if (!e.data.activated) {
        overlay.classList.add('visible');
      }
    }
  });
}


// ─── STORAGE via postMessage ──────────────────────────
function loadSettings() {
  window.parent.postMessage({ type: 'UMBRA_GET_SETTINGS' }, '*');
}

window.addEventListener('message', (e) => {
  if (e.data?.type === 'UMBRA_SETTINGS_DATA') {
    settings = { ...DEFAULTS, ...e.data.settings };
    applyToUI();
    updateStatus();
  }
});

function saveSettings() {
  window.parent.postMessage({ type: 'UMBRA_SET_SETTINGS', settings }, '*');
  updateStatus();
}

// ─── UI SYNC ──────────────────────────────────────────
function applyToUI() {
  // Power button
  const powerBtn = document.getElementById('btn-power');
  if (settings.umbra_on) {
    powerBtn.classList.add('power-on');
    powerBtn.classList.remove('power-off');
    document.getElementById('panel-content').classList.remove('disabled');
  } else {
    powerBtn.classList.remove('power-on');
    powerBtn.classList.add('power-off');
    document.getElementById('panel-content').classList.add('disabled');
  }

  // All checkboxes
  document.querySelectorAll('[data-key]').forEach(row => {
    const key = row.dataset.key;
    const cb = row.querySelector('input[type="checkbox"]');
    if (!cb) return;
    const val = !!settings[key];
    cb.checked = val;
    row.classList.toggle('checked', val);

    // Expand children if parent is checked
    const childId = row.dataset.children;
    if (childId) {
      const group = document.getElementById(childId);
      if (group) group.classList.toggle('expanded', val);
    }
  });
}

function updateStatus() {
  const dot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const countEl = document.getElementById('active-count');

  const on = settings.umbra_on;
  dot.className = 'status-dot ' + (on ? 'active' : 'inactive');
  statusText.textContent = on ? 'Umbra ativo' : 'Umbra desativado';

  const count = Object.entries(settings)
    .filter(([k, v]) => k !== 'umbra_on' && v === true).length;
  countEl.textContent = count + ' ' + (count === 1 ? 'ativo' : 'ativos');
}

// ─── TABS ─────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab)?.classList.add('active');
    });
  });
}

// ─── TOGGLES ──────────────────────────────────────────
function setupToggles() {
  document.querySelectorAll('[data-key]').forEach(row => {
    const key = row.dataset.key;
    const cb = row.querySelector('input[type="checkbox"]');
    if (!cb) return;

    cb.addEventListener('change', () => {
      settings[key] = cb.checked;
      row.classList.toggle('checked', cb.checked);

      // Toggle children visibility
      const childId = row.dataset.children;
      if (childId) {
        document.getElementById(childId)?.classList.toggle('expanded', cb.checked);
      }
      saveSettings();
    });
  });
}

// ─── DRAG FROM HEADER ─────────────────────────────────
function setupDrag() {
  const header = document.getElementById('panel-header');
  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('.header-controls')) return;
    window.parent.postMessage({
      type: 'UMBRA_DRAG_START',
      clientX: e.screenX,
      clientY: e.screenY
    }, '*');
  });
}

// ─── RESIZE FROM CORNER ────────────────────────────────
function setupResize() {
  const resizer = document.getElementById('resizer');
  let startX, startY, startW, startH;

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    startW = window.frameElement?.offsetWidth  || 420;
    startH = window.frameElement?.offsetHeight || 650;

    const onMove = (me) => {
      const dw = me.clientX - startX;
      const dh = me.clientY - startY;
      window.parent.postMessage({
        type: 'UMBRA_RESIZE',
        width:  startW + dw,
        height: startH + dh
      }, '*');
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ─── HEADER BUTTONS ───────────────────────────────────
function setupHeader() {
  setupDrag();
  setupResize();
  document.getElementById('btn-power').addEventListener('click', () => {
    settings.umbra_on = !settings.umbra_on;
    saveSettings();
    applyToUI();
  });

  document.getElementById('btn-minimize').addEventListener('click', () => {
    window.parent.postMessage({ type: 'UMBRA_MINIMIZE' }, '*');
  });

  document.getElementById('btn-close').addEventListener('click', () => {
    window.parent.postMessage({ type: 'UMBRA_CLOSE' }, '*');
  });
}

// ─── FOOTER BUTTONS ───────────────────────────────────
function setupFooter() {
  document.getElementById('btn-enable-all').addEventListener('click', () => {
    const on = settings.umbra_on;
    Object.keys(DEFAULTS).forEach(k => {
      if (k !== 'umbra_on') settings[k] = true;
    });
    settings.umbra_on = on;
    saveSettings();
    applyToUI();
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Resetar todas as configurações?')) {
      settings = { ...DEFAULTS };
      saveSettings();
      applyToUI();
    }
  });
}
