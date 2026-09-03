import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const root = path.dirname(fileURLToPath(import.meta.url));
  return {
    base: './',
    plugins: [tailwindcss()],
    resolve: { alias: { '@': path.resolve(root, '.') } },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(root, 'index.html'),
          en: path.resolve(root, 'en/index.html'),
          enQuranKids: path.resolve(root, 'en/quran-kids/index.html'),
          enQuranAdults: path.resolve(root, 'en/quran-adults/index.html'),
          enArabic: path.resolve(root, 'en/arabic/index.html'),
          ru: path.resolve(root, 'ru/index.html'),
          ruQuran: path.resolve(root, 'ru/quran/index.html'),
          ruArabic: path.resolve(root, 'ru/arabic/index.html'),
          uz: path.resolve(root, 'uz/index.html'),
          uzQuran: path.resolve(root, 'uz/quran/index.html'),
          uzArabic: path.resolve(root, 'uz/arabic/index.html'),
          admin: path.resolve(root, 'admin.html'),
        },
      },
    },
    server: { host: '127.0.0.1' },
    preview: { host: '127.0.0.1' },
  };
});
