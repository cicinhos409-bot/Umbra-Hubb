// content.js — Pinterest Video Downloader v2 (Umbra Hub Edition)
// Injetado no pinterest.com com design Glassmorphism e API Vercel

;(function () {
  'use strict';
  if (window.__pvdLoaded) { window.__pvdToggle?.(); return; }
  window.__pvdLoaded = true;

  let scannedVideos = [];
  const PINTEREST_API_URL = 'https://umbrahubb.vercel.app';

  // ── BUILD HTML ─────────────────────────────────────────────
  function buildPanel() {
    const root = document.createElement('div');
    root.id = '__pvd-root';
    root.innerHTML = `
    <div id="__pvd-panel">
      <!-- Background Glow -->
      <div class="__pvd-bg-glow"></div>
      
      <div class="__pvd-header" id="__pvd-header">
        <div class="__pvd-logo">
          <svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" fill="currentColor"/></svg>
        </div>
        <div class="__pvd-title-container">
          <div class="__pvd-title">Pinterest Downloader</div>
          <div class="__pvd-subtitle">Baixe vídeos, imagens e GIFs</div>
        </div>
        <div class="__pvd-hbtns">
          <button class="__pvd-hbtn" id="__pvd-min" title="Minimizar">
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="__pvd-hbtn" id="__pvd-close" title="Fechar">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div class="__pvd-body" id="__pvd-body">
        <div class="__pvd-input-wrapper">
          <div class="__pvd-input-container">
            <div class="__pvd-input-icon">
               <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <input class="__pvd-url-input" id="__pvd-url" placeholder="Cole o link do Pinterest aqui..." type="text" autocomplete="off" spellcheck="false"/>
            <button class="__pvd-paste-btn" id="__pvd-paste">
               <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
               COLAR
            </button>
          </div>
          
          <button class="__pvd-fetch-btn" id="__pvd-fetch">
            <div class="__pvd-fetch-loading" id="__pvd-fetch-loading" style="display:none"></div>
            <span id="__pvd-fetch-text">BUSCAR MÍDIA</span>
          </button>

          <div class="__pvd-scan-alt">
             <button id="__pvd-scan">
               <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
               Escanear página
             </button>
             <label class="__pvd-auto-label">
                <input type="checkbox" id="__pvd-auto" checked/> Auto
             </label>
          </div>
        </div>

        <div class="__pvd-main-content">
          <div id="__pvd-result"></div>
          
          <div class="__pvd-scanned-section" id="__pvd-scanned-section" style="display:none">
            <div class="__pvd-scanned-header">
              <span>VÍDEOS DETECTADOS</span>
              <span class="__pvd-scanned-count" id="__pvd-scanned-count">0</span>
            </div>
            <div class="__pvd-list" id="__pvd-list"></div>
          </div>

          <div class="__pvd-empty" id="__pvd-empty">
            <div class="__pvd-empty-icon">🎬</div>
            <div class="__pvd-empty-title">Nenhum vídeo ainda</div>
            <div class="__pvd-empty-desc">Cole uma URL acima ou use o Escanear</div>
          </div>
        </div>

        <div class="__pvd-footer">
          <div class="__pvd-footer-msg">APENAS PARA USO PESSOAL</div>
          <button class="__pvd-dl-all" id="__pvd-dl-all" disabled>Baixar todos</button>
        </div>
      </div>
      <div class="__pvd-resizer" id="__pvd-resizer"></div>
    </div>`;
    document.body.appendChild(root);
    return root;
  }

  // ── TOAST ─────────────────────────────────────────────────
  let _toastEl = null;
  function toast(msg, type='info', ms=3000) {
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.className = '__pvd-toast';
      document.body.appendChild(_toastEl);
    }
    _toastEl.textContent = msg;
    _toastEl.className = '__pvd-toast --show' + (type==='error'?' --error':'');
    clearTimeout(_toastEl._t);
    _toastEl._t = setTimeout(function() { _toastEl.classList.remove('--show'); }, ms);
  }

  // ── DRAG & RESIZE ──────────────────────────────────────────
  function initDrag(panel, handle) {
    var dragging=false, ox, oy, startL, startT;
    handle.addEventListener('mousedown', function(e) {
      if (e.target.closest('button')) return;
      dragging=true;
      var r=panel.getBoundingClientRect();
      ox=e.clientX; oy=e.clientY; startL=r.left; startT=r.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      panel.style.left=(startL+e.clientX-ox)+'px';
      panel.style.top=(startT+e.clientY-oy)+'px';
      panel.style.right='auto'; panel.style.bottom='auto';
    });
    document.addEventListener('mouseup', function() { dragging=false; });
  }

  function initResize(panel, resizer) {
    var resizing=false, rx, ry, rw, rh;
    resizer.addEventListener('mousedown', function(e) {
      resizing=true; rx=e.clientX; ry=e.clientY; rw=panel.offsetWidth; rh=panel.offsetHeight; e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if (!resizing) return;
      panel.style.width=Math.max(340,rw+e.clientX-rx)+'px';
      panel.style.height=Math.max(400,rh+e.clientY-ry)+'px';
    });
    document.addEventListener('mouseup', function() { resizing=false; });
  }

  // ── API FETCH ──────────────────────────────────────────────
  async function fetchViaUmbra(url) {
    const response = await fetch(`${PINTEREST_API_URL}/api/pinterest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro ao buscar dados.');
    return result;
  }

  function getProxyDownloadUrl(item, data, url) {
    // Retornamos a URL direta (item.url) para download direto via extensão,
    // evitando os limites de 4.5MB da Vercel e problemas com yt-dlp no servidor.
    return item.url;
  }

  // ── RENDER RESULT ──────────────────────────────────────────
  function renderResult(data, pinUrl) {
    const area = document.getElementById('__pvd-result');
    const empty = document.getElementById('__pvd-empty');
    if (!area) return;

    empty.style.display = 'none';
    
    const media = data.type === 'video' ? data.videos : data.images;
    if (!media || media.length === 0) {
      area.innerHTML = `<div class="__pvd-error-box">Nenhuma mídia encontrada para este link.</div>`;
      return;
    }

    let downloadBtns = media.map((item, idx) => `
      <button class="__pvd-q-btn" data-url="${getProxyDownloadUrl(item, data, pinUrl)}" data-name="pinterest_${data.pinId}_${idx}">
        <div class="__pvd-q-info">
          <span class="__pvd-q-label">${item.label || 'Standard'}</span>
          <span class="__pvd-q-res">${item.width}x${item.height} ${item.format || ''}</span>
        </div>
        <div class="__pvd-q-icon"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
      </button>
    `).join('');

    area.innerHTML = `
      <div class="__pvd-card-result">
        <div class="__pvd-result-top">
          <div class="__pvd-result-thumb">
            <img src="${data.thumbnail}" onerror="this.style.display='none'">
            <div class="__pvd-type-badge ${data.type}">${data.type.toUpperCase()}</div>
          </div>
          <div class="__pvd-result-info">
            <div class="__pvd-result-title">${data.title || 'Pinterest Item'}</div>
            <div class="__pvd-result-id">ID: ${data.pinId}</div>
          </div>
        </div>
        <div class="__pvd-dl-options-title">OPÇÕES DE DOWNLOAD</div>
        <div class="__pvd-dl-grid">${downloadBtns}</div>
      </div>
    `;

    area.querySelectorAll('.__pvd-q-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerDownload(btn.dataset.url, btn.dataset.name);
        toast('⬇️ Iniciando download...');
      });
    });
  }

  // ── SCAN PAGE ──────────────────────────────────────────────
  function scanPage() {
    var found=[], seen=new Set();
    
    // 1. EXTRAÇÃO PROFUNDA (Power Scan) - Lendo dados internos do Pinterest
    var webData = document.getElementById('__PINTEREST_WEB_DATA__');
    if (webData) {
      try {
        var json = JSON.parse(webData.innerHTML);
        var pinData = json.resourceResponses?.[0]?.response?.data;
        if (pinData) {
          var vids = pinData.videos?.video_list || pinData.story_pin_data?.pages?.[0]?.video_list;
          if (vids) {
            // Pega a maior resolução disponível
            var qualities = Object.values(vids).sort((a,b) => (b.height||0) - (a.height||0));
            if (qualities.length > 0) {
              addVideo(qualities[0].url, pinData.images?.['736x']?.url || "", pinData.title || "Video Pinterest");
            }
          }
        }
      } catch(e) { console.warn('[PVD] Power Scan Error', e); }
    }

    // 2. EXTRAÇÃO VIA LD+JSON
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s) {
      try {
        var data = JSON.parse(s.innerHTML);
        var obj = Array.isArray(data) ? data[0] : data;
        if (obj["@type"] === "VideoObject" && obj.contentUrl) {
          addVideo(obj.contentUrl, obj.thumbnailUrl || "", obj.name || "Video Pinterest");
        }
      } catch(e) {}
    });

    // 3. EXTRAÇÃO VIA TAGS DE VÍDEO
    document.querySelectorAll('video').forEach(function(vid, i) {
      var poster=vid.poster||'';
      var cdnUrl=deriveCdnUrl(poster);
      var srcs=[vid.src, vid.currentSrc].filter(Boolean);
      var realUrl=null;
      srcs.forEach(s => { if(s.includes('pinimg.com')||s.endsWith('.mp4')) realUrl=s; });
      var finalUrl = cdnUrl || realUrl || (vid.src.startsWith('blob:')?vid.src:null);
      if(finalUrl) addVideo(finalUrl, poster, "Video #"+(i+1));
    });

    function addVideo(url, poster, title) {
      if (!url||seen.has(url)) return;
      seen.add(url);
      found.push({ url, poster, title, pinUrl: window.location.href });
    }
    return found;
  }

  function deriveCdnUrl(poster) {
    if (!poster||!poster.includes('pinimg.com')) return null;
    var m=poster.match(/\/([0-9a-f]{2})\/([0-9a-f]{2})\/([0-9a-f]{2,})\/([0-9a-f]+)\.\w+/i);
    if (!m) return null;
    return 'https://v.pinimg.com/videos/mc/720p/'+m[1]+'/'+m[2]+'/'+m[3]+'/'+m[4]+'.mp4';
  }

  function renderScannedList(videos) {
    var list=document.getElementById('__pvd-list');
    var section=document.getElementById('__pvd-scanned-section');
    var counter=document.getElementById('__pvd-scanned-count');
    var dlAll=document.getElementById('__pvd-dl-all');
    var empty=document.getElementById('__pvd-empty');
    if (!list) return;
    scannedVideos = videos;
    if (videos.length===0) {
      section.style.display='none';
      return;
    }
    section.style.display='block';
    empty.style.display='none';
    counter.textContent=videos.length;
    dlAll.disabled=false;

    list.innerHTML=videos.map((v,i) => `
      <div class="__pvd-mini-card">
        <img src="${v.poster}" class="__pvd-mini-thumb">
        <div class="__pvd-mini-info">
          <div class="__pvd-mini-title">${v.title}</div>
          <button class="__pvd-mini-dl" data-idx="${i}">BAIXAR</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.__pvd-mini-dl').forEach(btn => {
      btn.addEventListener('click', () => downloadScanned(parseInt(btn.dataset.idx), btn));
    });
  }

  async function downloadScanned(idx, btn) {
    var v=scannedVideos[idx];
    if (!v) return;
    btn.disabled=true; btn.textContent='AGUARDE...';
    try {
      // 1. Se for um link blob (local do navegador), baixa direto
      if (v.url.startsWith('blob:')) {
        const res = await fetch(v.url);
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        triggerDownload(obj, `pinterest_video_${idx}.mp4`);
        setTimeout(() => URL.revokeObjectURL(obj), 5000);
        btn.textContent = 'OK!';
        return;
      }

      // 2. Prioridade: Usar a URL direta extraída do scan
      // Isso é muito mais estável que processar o link pelo servidor Vercel
      triggerDownload(v.url, `pinterest_video_${idx}.mp4`);
      btn.textContent='OK!';
    } catch(e) {
      btn.textContent='ERRO';
      toast('Falha ao processar pelo servidor', 'error');
    }
  }

  // ── TRIGGER DOWNLOAD ──────────────────────────────────────
  async function triggerDownload(url, filename) {
    if (!filename.toLowerCase().endsWith('.mp4') && !filename.toLowerCase().endsWith('.jpg')) {
      filename += url.includes('.mp4') ? '.mp4' : '.jpg';
    }

    toast('📥 Iniciando download nativo... Aguarde.', 'info', 3000);

    try {
      // O fetch aqui ocorre no contexto da página do Pinterest (mesmo IP/Cookies)
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Falha no acesso ao vídeo (' + response.status + ')');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Cria um link invisível para disparar o download real do navegador
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpeza
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 20000);

      toast('✅ Download iniciado!');
    } catch (err) {
      console.error('[Native Download Error]', err);
      toast('❌ Erro no download: ' + err.message + '. Tente Escanear Página.', 'error', 5000);
    }
  }

  // ── HANDLERS ──────────────────────────────────────────────
  async function handleFetch() {
    var input=document.getElementById('__pvd-url');
    var url=(input?.value||'').trim();
    if (!url){toast('⚠️ Cole uma URL do Pinterest primeiro'); return;}
    
    var btn=document.getElementById('__pvd-fetch');
    var loader=document.getElementById('__pvd-fetch-loading');
    var text=document.getElementById('__pvd-fetch-text');
    
    btn.disabled=true;
    loader.style.display='block';
    text.textContent='BUSCANDO...';
    
    try {
      var data=await fetchViaUmbra(url);
      renderResult(data, url);
      toast('✅ Mídia encontrada!');
    } catch(err){
      console.error('[PVD FETCH ERROR]', err);
      // Se der erro 403 (Bloqueio) ou 500, tentamos o escanear local automaticamente
      if (err.message.includes('403') || err.message.includes('Erro yt-dlp') || err.message.includes('500')) {
        toast('Servidor bloqueado. Usando Escanear Local...', 'info');
        var v = scanPage();
        if (v.length > 0) {
          renderScannedList(v);
          toast('✅ Vídeos extraídos localmente!');
        } else {
          toast('Não foi possível encontrar o vídeo nesta página.', 'error');
        }
      } else {
        toast('Erro: ' + err.message, 'error');
      }
    } finally {
      btn.disabled=false;
      loader.style.display='none';
      text.textContent='BUSCAR MÍDIA';
    }
  }

  // ── INIT ──────────────────────────────────────────────────
  function init() {
    var root=buildPanel();
    var panel=root.querySelector('#__pvd-panel');
    initDrag(panel, panel.querySelector('#__pvd-header'));
    initResize(panel, panel.querySelector('#__pvd-resizer'));

    panel.querySelector('#__pvd-min').addEventListener('click',() => panel.classList.toggle('--minimized'));
    panel.querySelector('#__pvd-close').addEventListener('click',() => { root.remove(); window.__pvdLoaded=false; });
    
    panel.querySelector('#__pvd-paste').addEventListener('click', async () => {
      try {
        var txt=await navigator.clipboard.readText();
        if(txt.includes('pinterest') || txt.includes('pin.it')) {
          document.getElementById('__pvd-url').value=txt;
          handleFetch();
        } else toast('URL Inválida');
      } catch(e){toast('Sem permissão de clipboard');}
    });

    document.getElementById('__pvd-url').addEventListener('keydown',(e) => e.key==='Enter' && handleFetch());
    document.getElementById('__pvd-fetch').addEventListener('click', handleFetch);
    
    document.getElementById('__pvd-scan').addEventListener('click',() => {
      var v=scanPage();
      renderScannedList(v);
      toast(v.length>0?v.length+' vídeos encontrados':'Nenhum vídeo encontrado');
    });

    document.getElementById('__pvd-dl-all').addEventListener('click',() => {
      scannedVideos.forEach((_,i) => setTimeout(() => {
        var btn=document.querySelectorAll('.__pvd-mini-dl')[i];
        if(btn) btn.click();
      }, i*800));
    });

    // Auto scan
    let _autoTimer;
    new MutationObserver(() => {
      if(!document.getElementById('__pvd-auto')?.checked) return;
      clearTimeout(_autoTimer);
      _autoTimer=setTimeout(() => {
        var v=scanPage();
        if(v.length>0) renderScannedList(v);
      }, 2000);
    }).observe(document.body, {childList:true, subtree:true});

    window.__pvdToggle=() => root.style.display=root.style.display==='none'?'':'none';
    
    // Initial scan
    setTimeout(() => { var v=scanPage(); if(v.length>0) renderScannedList(v); }, 1500);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if(msg.action==='togglePanel'){
      if(!window.__pvdLoaded) init(); else window.__pvdToggle();
    }
  });

  init();
})();

