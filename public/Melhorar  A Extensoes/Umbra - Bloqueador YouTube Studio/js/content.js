/**
 * Umbra - content.js
 * Shadow DOM aware censorship for YouTube Studio
 */
(function () {
  'use strict';

  const PANEL_WIDTH  = 420;
  const PANEL_HEIGHT = 650;
  const PANEL_MARGIN = 20;
  const HEADER_H     = 46;
  const STORAGE_KEY  = 'umbra_settings';
  const WRAPPER_ID   = 'umbra-floating-wrapper';
  const STYLE_ID     = 'umbra-censor-style';

  let settings       = {};
  let wrapper, iframe;
  let minimized      = false;
  let censorObserver = null;
  let shadowRoots    = new Set(); // track all shadow roots we've injected into

  chrome.storage.local.get([STORAGE_KEY], (res) => {
    settings = Object.assign(getDefaults(), res[STORAGE_KEY] || {});
    if (document.body) init();
    else document.addEventListener('DOMContentLoaded', init);
  });

  function init() {
    injectWrapper();
    applyAll();
    listenUrlChanges();
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'UMBRA_SHOW_PANEL' && wrapper) wrapper.style.display = 'block';
    });
  }

  // ─── DEFAULTS ─────────────────────────────────────
  function getDefaults() {
    return {
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
  }

  // ─── INJECT PANEL ─────────────────────────────────
  function injectWrapper() {
    if (document.getElementById(WRAPPER_ID)) return;

    wrapper = document.createElement('div');
    wrapper.id = WRAPPER_ID;
    Object.assign(wrapper.style, {
      position: 'fixed', top: PANEL_MARGIN + 'px', right: PANEL_MARGIN + 'px',
      width: PANEL_WIDTH + 'px', height: PANEL_HEIGHT + 'px',
      zIndex: '2147483647', borderRadius: '12px', overflow: 'hidden',
      boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
      transition: 'height 0.25s cubic-bezier(0.4,0,0.2,1)'
    });

    iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('panel.html');
    Object.assign(iframe.style, {
      width: '100%', height: '100%', border: 'none',
      display: 'block', borderRadius: '12px'
    });
    wrapper.appendChild(iframe);

    const overlay = document.createElement('div');
    overlay.id = 'umbra-drag-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '2147483646',
      display: 'none', cursor: 'grabbing'
    });

    document.documentElement.appendChild(wrapper);
    document.documentElement.appendChild(overlay);

    setupDrag(overlay);
    setupResize();
    window.addEventListener('message', onPanelMessage);
  }

  // ─── MESSAGES ─────────────────────────────────────
  function onPanelMessage(e) {
    if (!e.data?.type?.startsWith('UMBRA_')) return;
    switch (e.data.type) {
      case 'UMBRA_GET_SETTINGS':
        iframe?.contentWindow?.postMessage({ type: 'UMBRA_SETTINGS_DATA', settings }, '*');
        break;
      case 'UMBRA_SET_SETTINGS':
        settings = e.data.settings;
        chrome.storage.local.set({ [STORAGE_KEY]: settings });
        applyAll();
        break;
      case 'UMBRA_MINIMIZE':
        minimized = !minimized;
        if (wrapper) wrapper.style.height = (minimized ? HEADER_H : PANEL_HEIGHT) + 'px';
        break;
      case 'UMBRA_CLOSE':
        if (wrapper) wrapper.style.display = 'none';
        break;

      // ─── LICENSE ──────────────────────────────────
      case 'UMBRA_CHECK_LICENSE':
        chrome.storage.local.get(['umbra_license'], (res) => {
          const activated = !!res.umbra_license;
          iframe?.contentWindow?.postMessage({ type: 'UMBRA_LICENSE_STATUS', activated }, '*');
        });
        break;
      case 'UMBRA_VALIDATE_LICENSE': {
        const key = e.data.key || '';
        const LIC_PATTERN = /^UMBRA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (LIC_PATTERN.test(key)) {
          chrome.storage.local.set({ umbra_license: key }, () => {
            iframe?.contentWindow?.postMessage({ type: 'UMBRA_LICENSE_RESULT', valid: true }, '*');
          });
        } else {
          iframe?.contentWindow?.postMessage({
            type: 'UMBRA_LICENSE_RESULT', valid: false,
            message: 'Chave inválida. Verifique e tente novamente.'
          }, '*');
        }
        break;
      }
    }
  }

  // ─── DRAG ─────────────────────────────────────────
  function setupDrag(overlay) {
    let dragging = false, sx, sy, sl, st;
    window.addEventListener('message', (e) => {
      if (e.data?.type !== 'UMBRA_DRAG_START') return;
      dragging = true; overlay.style.display = 'block';
      const r = wrapper.getBoundingClientRect();
      sx = e.data.clientX; sy = e.data.clientY; sl = r.left; st = r.top;
    });
    overlay.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      let nl = Math.max(-PANEL_WIDTH + 60, Math.min(window.innerWidth  - 60, sl + e.clientX - sx));
      let nt = Math.max(0, Math.min(window.innerHeight - HEADER_H, st + e.clientY - sy));
      wrapper.style.left = nl + 'px'; wrapper.style.top = nt + 'px'; wrapper.style.right = 'auto';
    });
    overlay.addEventListener('mouseup',    () => { dragging = false; overlay.style.display = 'none'; });
    overlay.addEventListener('mouseleave', () => { dragging = false; overlay.style.display = 'none'; });
  }

  function setupResize() {
    window.addEventListener('message', (e) => {
      if (e.data?.type !== 'UMBRA_RESIZE' || !wrapper) return;
      wrapper.style.width  = Math.max(300, e.data.width)  + 'px';
      wrapper.style.height = Math.max(200, e.data.height) + 'px';
    });
  }

  // ─── APPLY ALL ────────────────────────────────────
  function applyAll() {
    const html  = document.documentElement;
    const isYT  = /^(www\.|m\.)?youtube\.com$/.test(location.hostname);
    const isStu = location.hostname === 'studio.youtube.com';
    const on    = settings.umbra_on;

    clearAttrs(html);
    stopCensor();

    if (!on) return;
    if (isYT)  applyYouTube(html);
    if (isStu) applyStudio(html);
  }

  function clearAttrs(html) {
    [
      'hide_feed','redirect_subs','hide_sidebar','hide_recommended','hide_chat',
      'hide_playlists','hide_donate','hide_endscreen','hide_cards','hide_shorts',
      'hide_comments','hide_mix','hide_merch','hide_meta','hide_header','hide_notifs',
      'hide_search','hide_trending','hide_moreyt','hide_subs','disable_autoplay','disable_annots',
      'studio_hide_analytics','studio_hide_comments','studio_hide_revenue',
      'studio_hide_subs_count','studio_hide_views','studio_hide_likes',
      'studio_hide_dashboard','studio_hide_news','studio_hide_sidebar'
    ].forEach(k => html.removeAttribute(k));
  }

  function applyYouTube(html) {
    [
      'hide_feed','redirect_subs','hide_sidebar','hide_recommended','hide_chat',
      'hide_playlists','hide_donate','hide_endscreen','hide_cards','hide_shorts',
      'hide_comments','hide_mix','hide_merch','hide_meta','hide_header','hide_notifs',
      'hide_search','hide_trending','hide_moreyt','hide_subs','disable_autoplay','disable_annots'
    ].forEach(k => { if (settings[k]) html.setAttribute(k, 'true'); });

    if (settings.redirect_subs && settings.hide_feed) {
      const p = location.pathname;
      if (p === '/' || p === '/index' || p === '') {
        location.replace('https://www.youtube.com/feed/subscriptions');
      }
    }
  }

  function applyStudio(html) {
    [
      'studio_hide_analytics','studio_hide_comments','studio_hide_revenue',
      'studio_hide_subs_count','studio_hide_views','studio_hide_likes',
      'studio_hide_dashboard','studio_hide_news','studio_hide_sidebar'
    ].forEach(k => { if (settings[k]) html.setAttribute(k, 'true'); });

    const needsCensor = [
      'studio_censor_titles','studio_censor_thumbs','studio_censor_profile',
      'studio_censor_top_content','studio_censor_recent','studio_censor_audience'
    ].some(k => settings[k]);

    if (needsCensor) startCensor();
  }

  // ═══════════════════════════════════════════════════════
  // CENSORSHIP ENGINE — Shadow DOM aware
  // The Studio uses Web Components with shadow roots.
  // We must: 1) inject CSS into every shadow root we find,
  //           2) use direct element.style for hiding cards,
  //           3) watch for new shadow roots as the SPA loads.
  // ═══════════════════════════════════════════════════════

  function startCensor() {
    // Global style for light DOM elements
    injectGlobalStyle();
    // Traverse all existing shadow roots and inject
    traverseAndInject(document.documentElement);
    // Run direct JS element hiding
    censorPass();

    // Retry passes for SPA lazy loading
    [300, 700, 1500, 2500, 4000, 6000].forEach(d => setTimeout(() => {
      traverseAndInject(document.documentElement);
      censorPass();
    }, d));

    // MutationObserver to catch new elements and new shadow hosts
    if (!censorObserver) {
      censorObserver = new MutationObserver(debounce(() => {
        traverseAndInject(document.documentElement);
        censorPass();
      }, 150));
      censorObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function stopCensor() {
    if (censorObserver) { censorObserver.disconnect(); censorObserver = null; }
    document.getElementById(STYLE_ID)?.remove();
    shadowRoots.forEach(sr => sr.getElementById?.(STYLE_ID)?.remove());
    shadowRoots.clear();
    undoCensorPass();
  }

  // Inject our CSS into both the document and every shadow root
  function injectGlobalStyle() {
    injectStyleInto(document, STYLE_ID);
  }

  function injectStyleInto(root, id) {
    const existing = root.getElementById ? root.getElementById(id) : root.querySelector('#' + id);
    if (existing) { existing.textContent = buildCensorCSS(); return; }
    const style = document.createElement('style');
    style.id = id;
    style.textContent = buildCensorCSS();
    const target = root.head || root.documentElement || root;
    target.appendChild(style);
  }

  // Walk the entire DOM tree including shadow roots
  function traverseAndInject(node) {
    if (!node) return;
    if (node.shadowRoot) {
      const sr = node.shadowRoot;
      if (!shadowRoots.has(sr)) {
        shadowRoots.add(sr);
        injectStyleInto(sr, STYLE_ID);
        // Also observe this shadow root for new children
        if (censorObserver) {
          try { censorObserver.observe(sr, { childList: true, subtree: true }); } catch(e) {}
        }
      }
      traverseAndInject(sr);
    }
    const children = node.children || node.childNodes || [];
    for (const child of children) {
      if (child.nodeType === 1) traverseAndInject(child);
    }
  }

  // Build the CSS string — applied inside every shadow root + global doc
  function buildCensorCSS() {
    const s = settings;
    let css = '';

    // ── Títulos (lista de vídeos) ────────────────────────────────────────
    if (s.studio_censor_titles) {
      css += `
        ytcp-video-list-cell-title,
        ytcp-video-list-cell-title span,
        ytcp-video-list-cell-title a,
        #video-title,
        .title,
        [class*="video-title"] {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
          background: linear-gradient(90deg,#14141c 25%,#1e1e2e 50%,#14141c 75%) !important;
          background-size: 200% 100% !important;
          animation: umbra-s 2.5s linear infinite !important;
          border-radius: 3px !important;
          text-shadow: none !important;
        }
      `;
    }

    // ── Miniaturas (lista de vídeos) ─────────────────────────────────────
    if (s.studio_censor_thumbs) {
      css += `
        ytcp-video-list-cell-thumbnail,
        ytcp-video-list-cell-thumbnail *,
        ytcp-thumbnail,
        ytcp-thumbnail img,
        ytcp-thumbnail-with-badge,
        ytcp-thumbnail-with-badge img,
        img[src*="ytimg"] {
          filter: blur(18px) brightness(0.1) !important;
          transition: filter 0.3s !important;
        }
        ytcp-video-list-cell-thumbnail:hover,
        ytcp-video-list-cell-thumbnail:hover *,
        ytcp-thumbnail:hover img,
        ytcp-thumbnail-with-badge:hover img,
        img[src*="ytimg"]:hover {
          filter: none !important;
        }
      `;
    }

    // ── Miniatura do card "Conteúdo mais recente" ────────────────────────
    if (s.studio_censor_recent) {
      css += `
        ytcp-latest-video-activity-module img,
        ytcp-latest-activity-card img,
        ytcp-latest-video-module img,
        ytcp-latest-video-thumbnail img,
        ytcp-dashboard-card img[src*="ytimg"],
        ytcp-dashboard-card img[src*="ggpht"],
        ytcp-dashboard-card ytcp-thumbnail img,
        ytcp-dashboard-card ytcp-thumbnail-with-badge img,
        ytcp-video-thumbnail img {
          filter: blur(20px) brightness(0.08) !important;
          transition: filter 0.3s !important;
        }
        ytcp-video-thumbnail-overlay-text,
        ytcp-thumbnail-overlay-text {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
          text-shadow: none !important;
        }
      `;
    }


    // ── Foto de perfil + nome do canal ───────────────────────────────────
    // Targets the left sidebar card with avatar + channel name
    if (s.studio_censor_profile) {
      css += `
        ytcp-channel-section-header,
        ytcp-channel-section-header *,
        [class*="channel-header"],
        [class*="channel-header"] *,
        ytcp-avatar,
        ytcp-avatar img,
        #channel-display-name,
        #channel-handle,
        .channel-name,
        .channel-handle { filter: blur(14px) brightness(0.15) !important; user-select: none !important; }
        ytcp-channel-section-header:hover,
        ytcp-channel-section-header:hover * { filter: none !important; }
      `;
    }

    css += `
      @keyframes umbra-s {
        0%  { background-position:  200% 0; }
        100%{ background-position: -200% 0; }
      }
    `;

    return css;
  }

  // ── Direct element hiding (display:none) via JS ──────────────────────
  // For cards that are full blocks (top content, recent, audience),
  // we hide the element directly with style because display:none
  // in shadow DOM CSS often doesn't propagate to host elements.

  const hiddenElements = new Map(); // el -> original display value

  function censorPass() {
    const s = settings;

    // ── 1. Foto de perfil + nome — sidebar esquerdo
    if (s.studio_censor_profile) {
      // Walk DOM to find the left nav channel section with avatar + name
      // The Studio nav has: img (avatar) + two text nodes (channel name + handle)
      findAndBlur([
        // Avatar no nav esquerdo — img dentro do link do canal
        'ytcp-app ytcp-navigation-drawer img',
        'ytcp-navigation-drawer img[src*="photo"]',
        'ytcp-navigation-drawer img[src*="ggpht"]',
        'ytcp-navigation-drawer img[src*="googleusercontent"]',
        'ytcp-navigation-drawer yt-img-shadow',
        'ytcp-navigation-drawer yt-img-shadow img',
        // Nome "Seu canal" e handle "lary_01"
        'ytcp-navigation-drawer #channel-name',
        'ytcp-navigation-drawer #channel-handle',
        'ytcp-navigation-drawer .channel-name',
        'ytcp-navigation-drawer .channel-info',
        // Seletor amplo para o bloco inteiro do canal no nav
        'ytcp-navigation-drawer #channel-info-container',
        'ytcp-navigation-drawer [class*="channel"]',
      ]);
      // Fallback: busca por texto "Seu canal" e blur no bloco pai
      blurByContent('Seu canal');
    }

    // ── 2. Conteúdo Principal do período — tabela com lista de vídeos top
    if (s.studio_censor_top_content) {
      findAndHide([
        'ytcp-analytics-main-video-list',
        'ytcp-top-content-card',
        '[heading*="principal"]',
        '[heading*="Conteúdo principal"]'
      ]);
      hideByHeadingText('Seu conteúdo principal no período');
      hideByHeadingText('Conteúdo principal no período');
    }

    // ── 3. Conteúdo mais Recente (card no dashboard) — censura miniatura
    if (s.studio_censor_recent) {
      censorRecentCardThumb();
    }

    // ── 3b. Censura título dentro do card "Conteúdo mais recente"
    if (s.studio_censor_titles || s.studio_censor_recent) {
      censorRecentCardTitle();
    }

    // ── 4. Vídeos que aumentam público (Analytics > aba Público)
    if (s.studio_censor_audience) {
      findAndHide([
        'ytcp-analytics-audience-section',
        'ytcp-analytics-videos-growing-audience'
      ]);
      hideByHeadingText('Vídeos que estão aumentando seu público');
      hideByHeadingText('Últimos 90 dias');
    }

    // ── 5. Títulos na tabela do Analytics (aba Conteúdo / Visão Geral)
    // Na página de Analytics, os títulos dos vídeos ficam em células de tabela
    if (s.studio_censor_titles) {
      censorAnalyticsTitles();
    }
  }

  // Censura títulos na tabela do Analytics — seletores específicos da página
  function censorAnalyticsTitles() {
    const SHIMMER = 'linear-gradient(90deg,#14141c 25%,#1e1e2e 50%,#14141c 75%)';
    // Seletores para células de título na tabela de Analytics e na lista de conteúdo
    const titleSels = [
      // Tabela da aba Analytics > Conteúdo (títulos de vídeo nas linhas)
      'ytcp-analytics-data-table td:nth-child(1) a',
      'ytcp-analytics-data-table td:nth-child(1) span',
      'ytcp-analytics-data-table .ytcp-analytics-data-table',
      // Visão geral — seção "Conteúdo principal"
      '.analytics-chart-content-entity-title',
      '[class*="entity-title"]',
      '[class*="content-title"]',
      // Células na tabela de vídeos do Analytics
      'ytcp-analytics-content-entity-info a',
      'ytcp-analytics-content-entity-info span',
      'ytcp-analytics-content-entity-info',
      // Linha da tabela — primeiro link/span com texto de título
      'td.title-cell a', 'td.title-cell span',
      '.title-cell a', '.title-cell span'
    ];
    titleSels.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (!el.dataset.umbraTitle) {
            el.dataset.umbraTitle = '1';
            el.style.setProperty('color', 'transparent', 'important');
            el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
            el.style.setProperty('background', SHIMMER, 'important');
            el.style.setProperty('background-size', '200% 100%', 'important');
            el.style.setProperty('animation', 'umbra-s 2.5s linear infinite', 'important');
            el.style.setProperty('border-radius', '3px', 'important');
            el.style.setProperty('text-shadow', 'none', 'important');
          }
        });
      } catch(e) {}
    });
  }

  // Blur elements (for profile - subtle, user can hover to see)
  function findAndBlur(selectors) {
    selectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (!el.dataset.umbraBlur) {
            el.dataset.umbraBlur = '1';
            el.style.setProperty('filter', 'blur(14px) brightness(0.15)', 'important');
            el.style.setProperty('transition', 'filter 0.3s', 'important');
            el.addEventListener('mouseenter', () => el.style.removeProperty('filter'));
            el.addEventListener('mouseleave', () => el.style.setProperty('filter', 'blur(14px) brightness(0.15)', 'important'));
          }
        });
      } catch(e) {}
    });
  }

  // Censura a miniatura do card "Conteúdo mais recente" — blur direto em imgs
  // O Studio usa Web Components aninhados; precisamos caminhar todos os shadow roots.
  function censorRecentCardThumb() {
    const CARD_TAGS = [
      'ytcp-latest-video-activity-module',
      'ytcp-latest-activity-card',
      'ytcp-latest-video-module',
      'ytcp-latest-video-thumbnail',
      'ytcp-video-thumbnail',
      'ytcp-dashboard-card',
      'ytcp-dashboard-section',
      'yta-entity-snapshot-carousel',
      'ytcp-thumbnail-with-title',
      'ytcd-entity-snapshot-item',
      'ytcp-post-snapshot'
    ];

    function blurImg(img) {
      if (!img || img.dataset.umbraThumb) return;

      // Se tiver alt text de vídeo recente ou test-id específico
      const alt = img.getAttribute('alt') || '';
      const tid = img.getAttribute('test-id') || '';

      if (alt.includes('recente') || alt.includes('Curte o Vídeo') || tid === 'thumbnail') {
        img.dataset.umbraThumb = '1';
        img.style.setProperty('filter', 'blur(22px) brightness(0.06)', 'important');
        img.style.setProperty('transition', 'none', 'important');
      }
    }

    // Walk a root (document or shadowRoot) collecting all imgs inside card hosts
    function walkRoot(root) {
      CARD_TAGS.forEach(tag => {
        try {
          root.querySelectorAll(tag).forEach(host => {
            // Direct imgs
            host.querySelectorAll('img').forEach(blurImg);
            // Shadow root imgs
            if (host.shadowRoot) {
              host.shadowRoot.querySelectorAll('img').forEach(blurImg);
              // Go deeper — nested shadow roots inside the card
              host.shadowRoot.querySelectorAll('*').forEach(child => {
                if (child.shadowRoot) {
                  child.shadowRoot.querySelectorAll('img').forEach(blurImg);
                }
              });
            }
          });
        } catch(e) {}
      });
    }

    // Walk light DOM
    walkRoot(document);
    // Walk every known shadow root we've already collected
    shadowRoots.forEach(sr => walkRoot(sr));

    // Fallback: blur any img whose src points to a video thumbnail URL
    // inside elements that have "recente" in their heading
    try {
      document.querySelectorAll('h2, h3, [heading]').forEach(heading => {
        if (!(heading.textContent || heading.getAttribute('heading') || '').includes('recente')) return;
        let parent = heading.parentElement;
        for (let d = 0; d < 8 && parent; d++) {
          parent.querySelectorAll('img').forEach(blurImg);
          parent = parent.parentElement;
        }
      });
    } catch(e) {}
  }

  // Censura o título do vídeo dentro do card "Conteúdo mais recente"
  // O card tem: thumbnail com overlay de texto (ex: "Curte o Vídeo e Inscreva-se!")
  // e logo abaixo métricas. O título fica como overlay na miniatura.
  function censorRecentCardTitle() {
    const SHIMMER = 'linear-gradient(90deg,#14141c 25%,#1e1e2e 50%,#14141c 75%)';

    function applyShimmer(el) {
      if (!el || el.dataset.umbraTitle) return;

      // Se for ícone ou botão, pula para não quebrar a UI e não dar erro visual
      const tag = el.tagName.toLowerCase();
      if (tag.includes('icon') || tag.includes('button')) return;
      if (el.closest('tp-yt-iron-icon') || el.closest('ytcp-icon-button') || el.closest('button')) return;

      el.dataset.umbraTitle = '1';

      // Se for overlay de miniatura (o texto "Curte o Vídeo..."), aplica blur forte
      if (el.tagName.toLowerCase().includes('thumbnail-overlay') || el.classList.contains('ytcp-video-thumbnail-overlay-text')) {
        el.style.setProperty('filter', 'blur(5px)', 'important');
        el.style.setProperty('color', 'transparent', 'important');
        el.style.setProperty('text-shadow', '0 0 8px rgba(255,255,255,0.8)', 'important');
        return;
      }

      el.style.setProperty('color', 'transparent', 'important');
      el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      el.style.setProperty('background', SHIMMER, 'important');
      el.style.setProperty('background-size', '200% 100%', 'important');
      el.style.setProperty('animation', 'umbra-s 2.5s linear infinite', 'important');
      el.style.setProperty('border-radius', '3px', 'important');
      el.style.setProperty('text-shadow', 'none', 'important');
    }

    const IGNORE = /^\d|%|Período|Visualizações|Marcações|Porcentagem|estatísticas|Ver |Gostei|hora|dia|mês|de |de\./i;

    // 1. Seletores CSS diretos
    ['ytcp-video-thumbnail-overlay-text','ytcp-thumbnail-overlay-text',
     'ytcp-latest-activity-card a[href*="/video/"]',
     'ytcp-latest-video-module a[href*="/video/"]',
     'ytcp-dashboard-card a[href*="/video/"]',
     'yta-entity-snapshot-carousel #title',
     'yta-entity-snapshot-carousel #analytics-section',
     'ytcp-thumbnail-with-title .thumbnail',
     'ytcd-entity-snapshot-item #video-snapshot',
     'ytcd-entity-snapshot-item .thumbnail-container',
     'ytcd-entity-snapshot-item .collapsable-bar',
     '.ytcpPostSnapshotPostText',
     '.ytcpPostSnapshotContentAttachment',
     'ytcp-navigation-drawer #entity-name',
     '.row-link.style-scope.yta-audience-interests-card'].forEach(sel => {
      try { document.querySelectorAll(sel).forEach(applyShimmer); } catch(e) {}
    });

    // 2. Percorre os cards de conteúdo recente (light DOM + shadow DOM)
    const cardTags = [
      'ytcp-latest-video-activity-module','ytcp-latest-activity-card',
      'ytcp-latest-video-module','ytcp-latest-video-thumbnail',
      'ytcp-dashboard-card', 'yta-entity-snapshot-carousel',
      'ytcp-thumbnail-with-title', 'ytcd-entity-snapshot-item',
      'ytcp-post-snapshot'
    ];
    cardTags.forEach(tag => {
      document.querySelectorAll(tag).forEach(host => {
        [host, host.shadowRoot].forEach(root => {
          if (!root) return;
          root.querySelectorAll('span, div, a, p').forEach(child => {
            if (child.children.length > 0) return;
            const txt = child.textContent.trim();
            if (txt.length < 5 || txt.length > 200) return;
            if (IGNORE.test(txt)) return;
            applyShimmer(child);
          });
        });
      });
    });
  }
  function blurByContent(text) {
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent.trim() === text) {
          // Walk up to a block-level container
          let el = node.parentElement;
          let depth = 0;
          while (el && depth < 6) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className || '';
            if (tag.startsWith('ytcp-') || cls.includes('channel') || cls.includes('nav') || tag === 'li' || tag === 'section') {
              if (!el.dataset.umbraBlur) {
                el.dataset.umbraBlur = '1';
                el.style.setProperty('filter', 'blur(14px) brightness(0.15)', 'important');
                el.style.setProperty('transition', 'filter 0.3s', 'important');
                el.addEventListener('mouseenter', () => el.style.removeProperty('filter'));
                el.addEventListener('mouseleave', () => el.style.setProperty('filter', 'blur(14px) brightness(0.15)', 'important'));
              }
              break;
            }
            el = el.parentElement;
            depth++;
          }
        }
      }
    } catch(e) {}
  }

  // Hide elements completely (for cards/sections)
  function findAndHide(selectors) {
    selectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (!hiddenElements.has(el)) {
            hiddenElements.set(el, el.style.display);
            el.style.setProperty('display', 'none', 'important');
          }
        });
      } catch(e) {}
    });
  }

  // Search for elements by their visible heading text and hide their parent card
  function hideByHeadingText(text) {
    try {
      // Look in all headings, h1-h3, and span elements
      const all = document.querySelectorAll('h1, h2, h3, span, div[class*="title"], [class*="header-text"]');
      for (const el of all) {
        if (el.textContent.trim().includes(text)) {
          // Walk up to find the card container
          let parent = el.parentElement;
          let depth = 0;
          while (parent && depth < 8) {
            const tag = parent.tagName.toLowerCase();
            // Stop at known card containers
            if (tag.startsWith('ytcp-') || 
                parent.classList.toString().includes('card') ||
                parent.classList.toString().includes('section') ||
                parent.classList.toString().includes('module')) {
              if (!hiddenElements.has(parent)) {
                hiddenElements.set(parent, parent.style.display);
                parent.style.setProperty('display', 'none', 'important');
              }
              break;
            }
            parent = parent.parentElement;
            depth++;
          }
        }
      }
    } catch(e) {}
  }

  function undoCensorPass() {
    hiddenElements.forEach((origDisplay, el) => {
      try { el.style.display = origDisplay || ''; } catch(e) {}
    });
    hiddenElements.clear();

    document.querySelectorAll('[data-umbra-blur]').forEach(el => {
      el.style.removeProperty('filter');
      el.style.removeProperty('transition');
      delete el.dataset.umbraBlur;
    });

    document.querySelectorAll('[data-umbra-title]').forEach(el => {
      ['color','-webkit-text-fill-color','background','background-size','animation','border-radius','text-shadow']
        .forEach(p => el.style.removeProperty(p));
      delete el.dataset.umbraTitle;
    });

    document.querySelectorAll('[data-umbra-thumb]').forEach(el => {
      el.style.removeProperty('filter');
      el.style.removeProperty('transition');
      delete el.dataset.umbraThumb;

    });
  }

  // ─── URL WATCHER ──────────────────────────────────
  function listenUrlChanges() {
    let last = location.href;
    new MutationObserver(() => {
      if (location.href !== last) {
        last = location.href;
        setTimeout(applyAll, 400);
        setTimeout(applyAll, 1200);
      }
    }).observe(document, { childList: true, subtree: true });
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

})();
