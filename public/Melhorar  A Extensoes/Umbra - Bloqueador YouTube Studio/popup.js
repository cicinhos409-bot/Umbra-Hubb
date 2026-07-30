/**
 * Umbra v4.0.5 - popup.js
 * Simple launcher — opens YouTube Studio and shows the floating panel.
 */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-open').addEventListener('click', openStudio);
});

function openStudio() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const url = tab?.url || '';
    if (url.includes('youtube.com') || url.includes('studio.youtube.com')) {
      chrome.tabs.sendMessage(tab.id, { type: 'UMBRA_SHOW_PANEL' }).catch(() => {});
      window.close();
    } else {
      chrome.tabs.create({ url: 'https://studio.youtube.com' });
      window.close();
    }
  });
}
