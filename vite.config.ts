import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        img-src 'self' data: https: blob:;
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        connect-src 'self' https://jduhhbvmjoampjgsgpej.supabase.co wss://jduhhbvmjoampjgsgpej.supabase.co https://*.tile.openstreetmap.org;
        frame-src 'self';
        font-src 'self' data:;
      `.replace(/\s+/g, ' ').trim()
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
