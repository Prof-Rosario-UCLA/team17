import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [
    react(),
    mkcert(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Triv.AI',
        short_name: 'TrivAI',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: 'trivai-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'trivai-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
      },
      
    }),
    
  ],
  server: {
    https: true,  // ✅ Revert to HTTP
    port: 5173,     // optional, use your preferred port
  },
  define: {
    'process.env': {}
  }
});
