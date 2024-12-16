import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      proxy: {
        '/api/geocode': {
          target: 'https://hook.eu1.make.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/geocode/, '/x949oltyqbmwlgkw9wrikm8tb3cc8krn'),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Keep using 'location' parameter without transforming to 'locator'
              const url = new URL(req.url!, 'http://dummy.com');
              proxyReq.path = `/x949oltyqbmwlgkw9wrikm8tb3cc8krn?location=${url.searchParams.get('location')}`;
            });
          },
        },
      },
      headers: {
        'Content-Security-Policy': `
          default-src 'self';
          img-src 'self' data: https: blob:;
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          connect-src 'self' https://jduhhbvmjoampjgsgpej.supabase.co wss://jduhhbvmjoampjgsgpej.supabase.co https://*.tile.openstreetmap.org https://hook.eu1.make.com;
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
    },
    define: {
      // Expose env variables to the client
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    }
  };
});
