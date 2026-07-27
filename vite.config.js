import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://lms-mrole.pages.dev',
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdf: ['jspdf', 'html2canvas'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
