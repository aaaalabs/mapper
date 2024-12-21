import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { generateViteCspArray, generateCspString } from './src/config/security';

// Plugin to inject CSP into HTML
const cspInjectorPlugin = (): Plugin => ({
  name: 'csp-injector',
  transformIndexHtml: {
    enforce: 'pre',
    transform(html) {
      return html.replace('%VITE_CSP_META%', generateCspString());
    },
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Configuring Vite with Revolut API key:', env.VITE_REVOLUT_SANDBOX_SK ? 'Present' : 'Missing');

  return {
    plugins: [
      react(),
      sentryVitePlugin({
        org: "voiceloop",
        project: "mapper",
        authToken: env.SENTRY_AUTH_TOKEN,
      }),
      cspInjectorPlugin(),
    ],
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
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_REVOLUT_SANDBOX_SK}`);
            });

            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err);
            });
          }
        },
      },
      headers: {
        'Content-Security-Policy': generateViteCspArray().join('; ')
      }
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            html2canvas: ['html2canvas']
          }
        }
      }
    },
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    }
  };
});
