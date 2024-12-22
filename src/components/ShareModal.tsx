import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { trackEvent, ANALYTICS_EVENTS } from '../services/analytics';
import { updateMapNameVisibility, getMap } from '../services/mapService';
import { supabase } from '../config/supabase';
import { FeedbackForm } from './FeedbackForm';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapId: string;
  initialMapName?: string;
}

export function ShareModal({ isOpen, onClose, mapId, initialMapName }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [mapName, setMapName] = useState<string>(initialMapName || '');
  const [showFeedback, setShowFeedback] = useState(false);

  const shareUrl = `${window.location.origin}/map/${mapId}`;
  const embedCode = `<iframe src="${window.location.origin}/embed/${mapId}" width="100%" height="500" frameborder="0"></iframe>`;

  useEffect(() => {
    async function loadMapData() {
      if (mapId === 'demo') return;
      
      try {
        const mapData = await getMap(mapId);
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
            if (payload.new) {
              setMapName(payload.new.name);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOpen, mapId, initialMapName]);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      await trackEvent({
        event_name: ANALYTICS_EVENTS.INTERACTION.BUTTON_CLICK,
        event_data: { 
          action: 'copy_share_url',
          map_id: mapId
        }
      });
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleEmbedCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);

      await trackEvent({
        event_name: ANALYTICS_EVENTS.INTERACTION.BUTTON_CLICK,
        event_data: { 
          action: 'copy_embed_code',
          map_id: mapId
        }
      });
    } catch (error) {
      console.error('Failed to copy embed code:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Your Map">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2 text-primary dark:text-dark-primary">Share Link</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
            />
            <Button onClick={handleCopyClick} variant="outline">
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2 text-primary dark:text-dark-primary">Embed Code</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={embedCode}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono"
            />
            <Button onClick={handleEmbedCopyClick} variant="outline">
              {embedCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {!showFeedback && (
          <div className="pt-4">
            <Button
              onClick={() => setShowFeedback(true)}
              variant="outline"
              className="w-full"
            >
              Share Your Feedback
            </Button>
          </div>
        )}

        {showFeedback && mapId && (
          <FeedbackForm mapId={mapId} onClose={() => setShowFeedback(false)} />
        )}
      </div>
    </Modal>
  );
}