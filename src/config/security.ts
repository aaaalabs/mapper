// CSP Directives for both development and production
export const cspDirectives = {
  'default-src': ["'self'"],
  'connect-src': [
    "'self'",
    "https://*.sentry.io",
    "https://*.ingest.sentry.io",
    "https://o4507900568535040.ingest.de.sentry.io",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://sandbox-merchant.revolut.com"
  ],
  'img-src': [
    "'self'",
    "data:",
    "https://*.tile.openstreetmap.org",
    "https://*.imagekit.io",
    "https://*.unsplash.com",
    "https://images.unsplash.com",
    "https://*.licdn.com",
    "https://media.licdn.com",
    "https://*.google.com",
    "https://mt0.google.com",
    "https://mt1.google.com",
    "https://mt2.google.com",
    "https://mt3.google.com",
    "https://*.global.ssl.fastly.net"
  ],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "blob:",
    "https://sandbox-merchant.revolut.com"
  ],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'"],
  'frame-src': ["'self'", "https://*.revolut.com"],
  'worker-src': ["'self'", "blob:"]
};

// Generate CSP string for meta tag
export const generateCspString = () => {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// Generate CSP array for Vite config
export const generateViteCspArray = () => {
  return Object.entries(cspDirectives).map(
    ([directive, sources]) => `${directive} ${sources.join(' ')};`
  );
};
