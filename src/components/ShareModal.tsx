import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { trackEvent, trackError, ERROR_SEVERITY, ERROR_CATEGORY } from '../services/analytics';
import { ANALYTICS_EVENTS } from '../services/analytics';
import { FeedbackForm } from './FeedbackForm';
import { cn } from '../lib/utils';
import { Z_INDEX } from '../constants/zIndex';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapId: string;
  initialMapName?: string;
  className?: string;
  children: React.ReactNode;
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Try using the clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers or non-HTTPS
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      textArea.remove();
      return true;
    } catch (err) {
      textArea.remove();
      return false;
    }
  } catch (err) {
    return false;
  }
};

export function ShareModal({ isOpen, onClose, mapId, initialMapName, className, children }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [mapName, setMapName] = useState(initialMapName || '');
  const [showFeedback, setShowFeedback] = useState(false);

  const shareUrl = `${window.location.origin}/map/${mapId}`;
  const embedCode = `<iframe src="${window.location.origin}/embed/${mapId}" width="100%" height="500" frameborder="0"></iframe>`;

  const handleCopyLink = async () => {
    try {
      const success = await copyToClipboard(shareUrl);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        trackEvent({
          event_name: ANALYTICS_EVENTS.MAP.SHARED,
          event_data: {
            map_id: mapId,
            share_type: 'link'
          }
        });
      } else {
        throw new Error('Failed to copy to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      trackError(error instanceof Error ? error : new Error('Failed to copy link'), {
        category: ERROR_CATEGORY.SYSTEM,
        severity: ERROR_SEVERITY.LOW,
        componentName: 'ShareModal',
        metadata: {
          action: 'copy_share_link',
          map_id: mapId
        }
      });
    }
  };

  const handleEmbedCopyClick = async () => {
    try {
      const success = await copyToClipboard(embedCode);
      if (success) {
        setEmbedCopied(true);
        setTimeout(() => setEmbedCopied(false), 2000);

        trackEvent({
          event_name: ANALYTICS_EVENTS.MAP.SHARED,
          event_data: {
            map_id: mapId,
            share_type: 'embed'
          }
        });
      } else {
        throw new Error('Failed to copy embed code to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy embed code:', error);
      trackError(error instanceof Error ? error : new Error('Failed to copy embed code'), {
        category: ERROR_CATEGORY.SYSTEM,
        severity: ERROR_SEVERITY.LOW,
        componentName: 'ShareModal',
        metadata: {
          action: 'copy_embed_code',
          map_id: mapId
        }
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative"
      style={{ zIndex: Z_INDEX.SHARE_MODAL_CONTENT }}
    >
      {/* Backdrop with proper z-index */}
      <div 
        className="fixed inset-0 bg-black/30 dark:bg-black/50" 
        aria-hidden="true"
        style={{ zIndex: Z_INDEX.SHARE_MODAL_BACKDROP }}
      />

      {/* Modal container - ensure proper stacking */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: Z_INDEX.SHARE_MODAL_CONTENT }}
      >
        <Dialog.Panel className={cn(
          "w-full max-w-md transform overflow-hidden rounded-2xl",
          "bg-white dark:bg-gray-900",
          "p-6 text-left align-middle shadow-xl transition-all",
          "border border-gray-200 dark:border-gray-800",
          className
        )}>
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Share Your Map
          </Dialog.Title>

          <div className="mt-4">
            <Input
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="Enter map name"
              className="mb-4 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
                <Button
                  onClick={handleCopyLink}
                  variant={copied ? "primary" : "outline"}
                  className="min-w-[100px] dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={embedCode}
                  readOnly
                  className="flex-1 bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
                <Button
                  onClick={handleEmbedCopyClick}
                  variant={embedCopied ? "primary" : "outline"}
                  className="min-w-[100px] dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  {embedCopied ? "Copied!" : "Copy Embed"}
                </Button>
              </div>
            </div>

            {children}

            <div className="mt-6 flex justify-between items-center">
              <Button
                onClick={() => setShowFeedback(true)}
                variant="ghost"
                className="text-sm text-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Give Feedback
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
          </div>

          {showFeedback && (
            <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <FeedbackForm
                mapId={mapId}
                onClose={() => setShowFeedback(false)}
                context="share"
              />
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}