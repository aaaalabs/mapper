import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { trackEvent, ANALYTICS_EVENTS } from '../services/analytics';
import { updateMapNameVisibility, getMap } from '../services/mapService';
import { supabase } from '../config/supabase';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapId: string;
  initialMapName?: string;
}

export function ShareModal({ isOpen, onClose, mapId, initialMapName }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showName, setShowName] = useState(true); // Default to true
  const [mapName, setMapName] = useState<string>(initialMapName || '');

  const shareUrl = `${window.location.origin}/map/${mapId}`;
  const embedCode = `<iframe src="${window.location.origin}/embed/${mapId}" width="100%" height="500" frameborder="0"></iframe>`;

  useEffect(() => {
    async function loadMapData() {
      if (mapId === 'demo') return;
      
      try {
        const mapData = await getMap(mapId);
        setShowName(mapData.settings?.customization?.showName ?? true);
        setMapName(mapData.name || initialMapName || '');
      } catch (error) {
        console.error('Failed to load map data:', error);
      }
    }

    if (isOpen) {
      loadMapData();

      // Subscribe to real-time updates
      const subscription = supabase
        .channel(`map:${mapId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'maps',
            filter: `id=eq.${mapId}`
          },
          (payload) => {
            // Update the map name if it changed
            if (payload.new.name) {
              setMapName(payload.new.name);
            }
            // Update show name setting if it changed
            if (payload.new.settings?.customization?.showName !== undefined) {
              setShowName(payload.new.settings.customization.showName);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOpen, mapId, initialMapName]);

  const handleShowNameChange = async (checked: boolean) => {
    if (mapId === 'demo') {
      setShowName(checked);
      return;
    }

    try {
      await updateMapNameVisibility(mapId, checked);
      setShowName(checked);
    } catch (error) {
      console.error('Failed to update map name visibility:', error);
      // Reset checkbox if update failed
      setShowName(!checked);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      trackEvent(ANALYTICS_EVENTS.SHARE_LINK_COPIED, {
        map_id: mapId
      });
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
      
      trackEvent(ANALYTICS_EVENTS.EMBED_CODE_COPIED, {
        map_id: mapId
      });
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`Share ${mapName ? `"${mapName}"` : ''} Map`}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <Button onClick={copyShareLink}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Share this link with others to let them view your map
          </p>
        </div>

        <div className="pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Embed Code
          </label>
          <div className="flex gap-2">
            <textarea
              value={embedCode}
              readOnly
              rows={3}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <Button onClick={copyEmbedCode}>
              {embedCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}