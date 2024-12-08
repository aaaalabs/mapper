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
          <label className="block text-sm font-medium text-foreground mb-2">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
              className="flex-shrink-0 h-10 w-10"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Share this link with others to let them view your map
          </p>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Embed Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={embedCode}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-mono"
            />
            <Button
              onClick={handleCopyEmbed}
              variant="outline"
              size="icon"
              className="flex-shrink-0 h-10 w-10"
            >
              {embedCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Paste this code into your website to embed the map
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
} 