
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // GitHub Pagesのサブディレクトリ名に合わせてベースパスを設定
  base: "/SAKURA-AME/",
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png', 'notification-icon.png', 'bg-start.webp', 'bg-night.webp', 'bg-capital.webp', 'bg-tsumugi.webp', 'bg-start@2x.webp', 'bg-night@2x.webp', 'bg-capital@2x.webp', 'bg-tsumugi@2x.webp'],
      manifest: {
        name: '桜雨 - SakuraAme',
        short_name: '桜雨',
        description: 'Zen healing experience inspired by a Japanese garden',
        theme_color: '#4a0417',
        background_color: '#1c1917',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 3000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // パフォーマンス向上のためチャンク分割を最適化
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react']
        }
      }
    }
  }
});
