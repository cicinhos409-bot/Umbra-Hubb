import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { initAnalytics } from './services/analytics';
import { initSentry, Sentry } from './services/errorTracking';
import './index.css';
import './services/deviceIdBridge'; // Inicializa o ID global

// Inicializa monitoramento antes de qualquer render
initSentry();
initAnalytics();

// Apply saved theme before first paint to avoid flash
const savedTheme = localStorage.getItem('umbra_theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const SentryFallback = () => (
  <div className="min-h-screen bg-white flex items-center justify-center p-8">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">⚡</span>
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Algo deu errado</h2>
      <p className="text-gray-500 font-black text-sm mb-8 leading-relaxed">
        Um erro inesperado ocorreu. Nossa equipe foi notificada automaticamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-8 py-4 bg-black text-white font-black rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-gray-900 transition-all"
      >
        Recarregar
      </button>
    </div>
  </div>
);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<SentryFallback />} showDialog={false}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
