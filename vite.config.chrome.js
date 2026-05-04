import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { cpSync, readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),

    {
      name: 'chrome-extension-html',
      transformIndexHtml(html) {
        return html
          .replace(/<script async src="https:\/\/pagead2\.googlesyndication\.com[^>]*><\/script>/, '')
          .replace(/<script>[\s\S]*?if\s*\(\s*'serviceWorker'\s*in\s*navigator[\s\S]*?<\/script>/, '')
          .replace(/<link rel="manifest"[^>]*\/>/, '')
          .replace(/<meta name="apple-mobile-web-app-capable"[^>]*\/>/, '')
          .replace(/<meta name="apple-mobile-web-app-status-bar-style"[^>]*\/>/, '')
          .replace(/<meta name="apple-mobile-web-app-title"[^>]*\/>/, '');
      }
    },

    {
      name: 'chrome-extension-assets',
      async closeBundle() {
        const outDir = resolve(__dirname, 'dist-chrome');
        const iconsDir = resolve(outDir, 'icons');
        mkdirSync(iconsDir, { recursive: true });

        const svg = readFileSync(resolve(__dirname, 'public/favicon.svg'));
        await Promise.all([16, 48, 128].map(size =>
          sharp(svg).resize(size, size).png().toFile(resolve(iconsDir, `icon-${size}.png`))
        ));

        cpSync(resolve(__dirname, 'src/chrome/manifest.json'), resolve(outDir, 'manifest.json'));
        cpSync(resolve(__dirname, 'src/chrome/background.js'), resolve(outDir, 'background.js'));
      }
    }
  ],

  base: './',

  build: {
    outDir: 'dist-chrome',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
