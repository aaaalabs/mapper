import html2canvas from 'html2canvas';

export async function generateMapThumbnail(mapElement: HTMLElement): Promise<string> {
  try {
    // Wait for map tiles to load by checking for leaflet-tile-loaded class
    const checkTilesLoaded = () => {
      const tiles = mapElement.querySelectorAll('.leaflet-tile-loaded');
      return tiles.length > 0;
    };

    // Wait up to 5 seconds for tiles to load
    await new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        if (checkTilesLoaded()) {
          resolve(true);
        } else if (attempts >= 50) { // 5 seconds (100ms * 50)
          resolve(false); // Continue anyway but log warning
          console.warn('Map tiles did not load in time');
        } else {
          attempts++;
          setTimeout(check, 100);
        }
      };
      check();
    });

    // Additional wait to ensure markers and popups are rendered
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(mapElement, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      foreignObjectRendering: true,
      removeContainer: true,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Ensure map container has explicit dimensions
        const clonedMap = clonedDoc.querySelector('.leaflet-container');
        if (clonedMap instanceof HTMLElement) {
          clonedMap.style.width = '100%';
          clonedMap.style.height = '100%';
        }
      }
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate thumbnail blob'));
            return;
          }
          const url = URL.createObjectURL(blob);
          // Clean up the blob URL after 1 minute
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          resolve(url);
        },
        'image/jpeg',
        0.85 // Slightly higher quality
      );
    });
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    throw new Error('Failed to generate map preview');
  }
}

export function generateMetaTags(mapId: string, thumbnailUrl: string, title: string) {
  const description = 'Interactive community map created with VoiceLoop';
  return {
    'og:title': title,
    'og:description': description,
    'og:image': thumbnailUrl,
    'og:url': `${window.location.origin}/map/${mapId}`,
    'og:type': 'website',
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': thumbnailUrl,
  };
} 