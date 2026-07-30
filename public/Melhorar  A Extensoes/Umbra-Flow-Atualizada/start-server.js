// Umbra Flow - Start Server Page Script

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const osTabs = document.querySelectorAll('.os-tab');
const macInstructions = document.getElementById('mac-instructions');
const windowsInstructions = document.getElementById('windows-instructions');

// Detect OS
const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;

// Set initial state based on OS
if (isWindows) {
  osTabs.forEach(t => t.classList.remove('active'));
  document.querySelector('[data-os="windows"]').classList.add('active');
  macInstructions.classList.remove('active');
  windowsInstructions.classList.add('active');
}

// OS Tab switching
osTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    osTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    if (tab.dataset.os === 'mac') {
      macInstructions.classList.add('active');
      windowsInstructions.classList.remove('active');
    } else {
      macInstructions.classList.remove('active');
      windowsInstructions.classList.add('active');
    }
  });
});

// Copy function
function copyText(text, btn) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    btn.textContent = 'Copiado!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copiar';
      btn.classList.remove('copied');
    }, 2000);
  } catch (e) {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copiado!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copiar';
        btn.classList.remove('copied');
      }, 2000);
    });
  }

  document.body.removeChild(textarea);
}

// All copy buttons
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Check if it has data-cmd attribute or is a specific button
    const cmd = btn.dataset.cmd || btn.previousElementSibling?.textContent || '';
    if (cmd) {
      copyText(cmd, btn);
    }
  });
});

// Status checking
function checkServerStatus() {
  chrome.runtime.sendMessage({ action: 'GET_SERVER_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      statusDot.classList.remove('checking', 'connected');
      statusText.classList.remove('connected');
      statusText.textContent = 'Aguardando servidor...';
      return;
    }

    if (response && response.connected) {
      statusDot.classList.remove('checking');
      statusDot.classList.add('connected');
      statusText.classList.add('connected');
      statusText.textContent = 'Conectado! Servidor rodando.';
    } else {
      statusDot.classList.remove('checking', 'connected');
      statusText.classList.remove('connected');
      statusText.textContent = 'Aguardando servidor...';
    }
  });
}

checkServerStatus();
setInterval(checkServerStatus, 2000);
