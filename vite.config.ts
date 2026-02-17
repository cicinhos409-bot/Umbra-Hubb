
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-index-css',
      transformIndexHtml(html) {
        // Remove any reference to index.css that might be injected
        return html.replace(/<link[^>]*href=["'].*?index\.css["'][^>]*>/gi, '');
      },
    },
  ],
  base: './',
});
