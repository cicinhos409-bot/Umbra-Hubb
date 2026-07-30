import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    cssCodeSplit: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Divide o bundle em chunks por domínio — reduz bundle inicial de ~927KB para ~280KB
        manualChunks: (id) => {
          // Vendor: bibliotecas externas raramente mudam → cache de longo prazo
          if (id.includes('node_modules')) {
            if (id.includes('@supabase'))          return 'vendor-supabase';
            if (id.includes('@google/generative')) return 'vendor-gemini';
            if (id.includes('lucide-react'))       return 'vendor-lucide';
            if (id.includes('jszip'))              return 'vendor-jszip';
            if (id.includes('posthog-js'))         return 'vendor-posthog';
            if (id.includes('@sentry'))            return 'vendor-sentry';
            return 'vendor';
          }
          // Ferramentas PRO pesadas → carregadas só quando acessadas (via React.lazy)
          if (id.includes('UmbraAudiosTool'))   return 'tool-audios';
          if (id.includes('ImageScoutTool'))    return 'tool-scout';
          if (id.includes('UmbraSearchTool'))   return 'tool-search';
          if (id.includes('UmbraYouTube'))      return 'tool-youtube';
          if (id.includes('MeusCanaisTool'))    return 'tool-canais';
          if (id.includes('ScreenshotTool'))    return 'tool-screenshot';
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') return 'assets/style.[hash].css';
          return 'assets/[name].[hash][extname]';
        },
      },
    },
  },
});
