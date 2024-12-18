import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Configuring Vite with Revolut API key:', env.VITE_REVOLUT_SANDBOX_SK ? 'Present' : 'Missing');

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
              const url = new URL(req.url!, 'http://dummy.com');
              proxyReq.path = `/x949oltyqbmwlgkw9wrikm8tb3cc8krn?location=${url.searchParams.get('location')}`;
            });
          },
        },
        '/api/revolut': {
          target: 'https://sandbox-merchant.revolut.com/api/1.0',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/revolut/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Use the secret key for authentication
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_REVOLUT_SANDBOX_SK}`);
            });

            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err);
            });
          }
        },
      },
      headers: {
        'Content-Security-Policy': [
          // Allow resources from trusted domains
          "default-src 'self' https://sandbox-merchant.revolut.com https://*.supabase.co;",
          // Allow images from trusted sources including map tiles
          "img-src 'self' data: https://*.tile.openstreetmap.org https://*.imagekit.io https://*.unsplash.com https://images.unsplash.com https://*.licdn.com https://media.licdn.com https://*.google.com https://mt0.google.com https://mt1.google.com https://mt2.google.com https://mt3.google.com https://*.global.ssl.fastly.net;",
          // Allow connections to APIs and WebSocket
          "connect-src 'self' https://sandbox-merchant.revolut.com https://*.supabase.co wss://*.supabase.co;",
          // Allow frames for Revolut checkout
          "frame-src 'self' https://sandbox-merchant.revolut.com;",
          // Allow scripts with unsafe-inline for React
          "script-src 'self' 'unsafe-inline' https://sandbox-merchant.revolut.com;",
          // Allow styles with unsafe-inline for Tailwind
          "style-src 'self' 'unsafe-inline';"
        ].join('; ')
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
