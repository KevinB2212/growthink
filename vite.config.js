import { defineConfig } from 'vite';

export default defineConfig({
  base: '/growthink/',
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        passes: 2
      }
    },
    assetsInlineLimit: 0,
    rollupOptions: {
      input: 'index.html',
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  server: {
    open: true
  }
});
