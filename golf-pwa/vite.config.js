import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Auf GitHub Pages liegt die App unter /<repo>/ (setzt der Workflow über BASE_PATH)
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'logo-wannsee.png'],
      manifest: {
        name: 'B10 Golf',
        short_name: 'B10 Golf',
        description: 'B10 Golf: Turniere mit Brutto-/Nettowertung, Scorecard, GPS-Distanzen und Statistik',
        lang: 'de',
        theme_color: '#14532d',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
});
