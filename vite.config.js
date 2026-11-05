import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Для GitHub Pages деплой идёт с VITE_PUBLIC_BASE=/pass_tracker/
// (см. .github/workflows/deploy.yml), локально база остаётся '/'.
const base = process.env.VITE_PUBLIC_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Проездные — учёт сроков',
        short_name: 'Проездные',
        description: 'Учёт сроков действия проездных билетов: автобус, комбо, турист',
        lang: 'ru',
        dir: 'ltr',
        theme_color: '#4f46e5',
        background_color: '#f1f5f9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        // sw-extra.js — обработчики уведомлений (public/sw-extra.js)
        importScripts: ['sw-extra.js']
      }
    })
  ]
});
