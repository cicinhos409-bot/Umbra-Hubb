// background/background.js

// Click no ícone da extensão → toggle do painel flutuante
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || !tab.url.includes('pinterest')) return;

  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content.css'] });
  } catch (_) {}

  chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
});

// Proxy de download simples (Aceita Blob URLs da página ou URLs diretas)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'download') {
    let url = msg.url;
    let fname = msg.filename;

    if (!fname.includes('.')) {
      fname += url.includes('.mp4') ? '.mp4' : '.jpg';
    }

    chrome.downloads.download({
      url: url,
      filename: 'UmbraPin/' + fname,
      saveAs: false,
      conflictAction: 'uniquify'
    }, (id) => {
      const err = chrome.runtime.lastError;
      if (err) console.error('[Download Error]', err.message);
      sendResponse(err ? { ok: false, error: err.message } : { ok: true, id });
    });
    return true;
  }
});
