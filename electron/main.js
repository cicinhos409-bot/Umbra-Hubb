const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// ─── Configurar Protocolo (Deep Linking) ───────────────────────────────────
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('umbra-hub', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('umbra-hub');
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

// ─── Carregar .env do diretório do executável ───────────────────────────────
function loadEnvFile() {
  // Em produção: ao lado do .exe. Em dev: raiz do projeto.
  const envPaths = [
    path.join(path.dirname(process.execPath), '.env'),
    path.join(app.getAppPath(), '..', '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.env.local'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log('[ENV] Carregando:', envPath);
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
      return envPath;
    }
  }
  console.warn('[ENV] Nenhum arquivo .env encontrado. Usando variáveis do sistema.');
  return null;
}

// ─── Estado Global ───────────────────────────────────────────────────────────
let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 3001;

// ─── Iniciar Backend Python ──────────────────────────────────────────────────
function startBackend() {
  const isDev = !app.isPackaged;

  // Caminho do executável Python empacotado
  const serverExeName = process.platform === 'win32' ? 'server.exe' : 'server';
  const serverExePath = isDev
    ? null // Em dev, não usa o exe
    : path.join(process.resourcesPath, 'backend', serverExeName);

  // Em desenvolvimento, inicia o server.py diretamente com python
  if (isDev) {
    const serverPyPath = path.join(__dirname, '..', 'server.py');
    console.log('[BACKEND] Modo dev - iniciando:', serverPyPath);
    backendProcess = spawn('python', [serverPyPath], {
      env: { ...process.env, PORT: String(BACKEND_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } else if (fs.existsSync(serverExePath)) {
    console.log('[BACKEND] Iniciando exe:', serverExePath);
    backendProcess = spawn(serverExePath, [], {
      env: { ...process.env, PORT: String(BACKEND_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } else {
    console.warn('[BACKEND] server.exe não encontrado em:', serverExePath);
    return;
  }

  backendProcess.stdout?.on('data', (d) => console.log('[PY]', d.toString().trim()));
  backendProcess.stderr?.on('data', (d) => console.error('[PY ERR]', d.toString().trim()));
  backendProcess.on('exit', (code) => console.log('[BACKEND] Processo encerrado, código:', code));
}

// ─── Aguardar Backend Ficar Pronto ──────────────────────────────────────────
async function waitForBackend(retries = 20, delay = 500) {
  const http = require('http');
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/health`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status: ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => { req.destroy(); reject(new Error('Timeout')); });
      });
      console.log('[BACKEND] Pronto na tentativa', i + 1);
      return true;
    } catch {
      console.log(`[BACKEND] Aguardando... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return false;
}

// ─── Criar Janela Principal ──────────────────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Umbra Hub',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, 
      devTools: true,
    },
    autoHideMenuBar: true,
    show: false,
  });

  // Splash / loading antes de mostrar
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    // Em desenvolvimento: carrega o servidor Vite
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // Fallback: carrega arquivos estáticos
      const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
      mainWindow.loadFile(distIndex);
    });
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção: carrega os arquivos estáticos do dist/
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    await mainWindow.loadFile(indexPath);
  }

  // --- SEGURANÇA: Impedir que o app saia dos arquivos locais ---
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isDev = !app.isPackaged;
    const isLocal = url.startsWith('file://') || (isDev && url.startsWith('http://localhost'));

    if (!isLocal) {
      console.log('[SECURITY] Bloqueando navegação externa indesejada para:', url);
      event.preventDefault();
      
      // Se for um link de verdade que o usuário clicou, abre no navegador padrão do Windows
      if (url.startsWith('http')) {
        shell.openExternal(url);
      }
    }
  });

  // Abrir links externos (window.open) no navegador padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function handleDeepLink(url) {
  if (!mainWindow) return;
  console.log('[DEEP-LINK] Enviando para o renderer:', url);
  mainWindow.webContents.send('on-deep-link', url);
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  loadEnvFile();
  startBackend();
  await waitForBackend();
  await createWindow();

  // Se o app foi aberto via protocolo pela primeira vez (app estava fechado)
  const initialUrl = process.argv.find(arg => arg.startsWith('umbra-hub://'));
  if (initialUrl) {
    // Aumentamos para 4 segundos para garantir que o React e o Supabase inicializaram
    setTimeout(() => handleDeepLink(initialUrl), 4000);
  }

  app.on('second-instance', (event, commandLine) => {
    const url = commandLine.find(arg => arg.startsWith('umbra-hub://'));
    if (url) handleDeepLink(url);

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Encerrar o processo Python ao fechar o app
  if (backendProcess) {
    console.log('[MAIN] Encerrando backend Python...');
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
