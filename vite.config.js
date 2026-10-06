import { defineConfig } from 'vite';

// پیکربندی Vite برای بازی «کارآگاه لوکی»
// خروجی سبک و بدون وابستگی اضافه؛ مناسب اجرای روان در مرورگر.
export default defineConfig({
  base: './',
  server: {
    port: 5188,
    open: true,
    host: '127.0.0.1'
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1200
  }
});
