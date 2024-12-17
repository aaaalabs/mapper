// Cache name for map tiles
const TILE_CACHE = 'map-tiles-v1';
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Install event - create cache
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(TILE_CACHE));
});

// Fetch event - handle tile requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle tile requests
  if (url.pathname.includes('/tiles/')) {
    event.respondWith(handleTileRequest(event.request));
  }
});

async function handleTileRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is still valid
      const cachedDate = new Date(cachedResponse.headers.get('date'));
      if (Date.now() - cachedDate.getTime() < MAX_CACHE_AGE) {
        return cachedResponse;
      }
    }

    // Fetch new tile
    const response = await fetch(request);
    
    // Cache the new response
    const cache = await caches.open(TILE_CACHE);
    cache.put(request, response.clone());
    
    return response;
  } catch (error) {
    // If both network and cache fail, return a fallback tile
    return new Response(null, {
      status: 404,
      statusText: 'Map tile not available'
    });
  }
}

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('map-tiles-'))
          .filter(name => name !== TILE_CACHE)
          .map(name => caches.delete(name))
      );
    })
  );
});
