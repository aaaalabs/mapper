import React, { useState } from 'react';
import { Copy, Check, Link2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { trackEvent, ANALYTICS_EVENTS } from '../services/analytics';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapId: string;
}

export function ShareModal({ isOpen, onClose, mapId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  const shareUrl = `${window.location.origin}/map/${mapId}`;
  const embedCode = `<iframe src="${window.location.origin}/embed/${mapId}" width="100%" height="500" frameborder="0"></iframe>`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_SHARING.COMPLETED,
        event_data: { 
          map_id: mapId,
          share_type: 'link'
        }
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_SHARING.ERROR,
        event_data: { 
          map_id: mapId,
          error: err instanceof Error ? err.message : 'Failed to copy link'
        }
      });
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_SHARING.COMPLETED,
        event_data: { 
          map_id: mapId,
          share_type: 'embed'
        }
      });
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (err) {
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_SHARING.ERROR,
        event_data: { 
          map_id: mapId,
          error: err instanceof Error ? err.message : 'Failed to copy embed code'
        }
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Map">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Embed Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={embedCode}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 text-sm font-mono"
            />
            <Button
              onClick={handleCopyEmbed}
              variant="outline"
              className="flex-shrink-0"
            >
              {embedCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Paste this code into your website to embed the map.
          </p>
        </div>
      </div>
    </Modal>
  );
} 