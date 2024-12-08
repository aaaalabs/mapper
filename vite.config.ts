import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com;
        style-src 'self' 'unsafe-inline' https://unpkg.com;
        img-src 'self' data: https: blob:;
        font-src 'self' data:;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        frame-src 'self';
        connect-src 'self' 
          https://*.tile.openstreetmap.org 
          https://unpkg.com 
          https://*.supabase.co 
          https://jduhhbvmjoampjgsgpej.supabase.co
          wss://*.supabase.co;
        worker-src 'self' blob:;
        child-src 'self' blob:;
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
