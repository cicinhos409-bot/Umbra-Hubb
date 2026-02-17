
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          // Previne criação de index.css
          if (assetInfo.name === 'index.css') {
            return 'assets/style.[hash].css';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
  },
});
