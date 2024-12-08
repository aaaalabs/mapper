import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tile.openstreetmap.org;"
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          html2canvas: ['html2canvas']
        }
      }
    }
  }
});
