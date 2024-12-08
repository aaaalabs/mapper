import React, { useState } from 'react';
import { Copy, Link2, Download, Share2, ExternalLink, Image } from 'lucide-react';
import { Button } from './ui/Button';
import { trackMapShare } from '../services/mapService';
import { cn } from '../lib/utils';
import { generateMapThumbnail } from '../services/thumbnailService';

interface ShareModalProps {
  mapId: string;
  mapRef?: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

export function ShareModal({ mapId, mapRef, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}/map/${mapId}`;
  const embedCode = `<iframe src="${window.location.origin}/map/${mapId}/embed" width="100%" height="500" frameborder="0" style="border: 1px solid #eee; border-radius: 8px;"></iframe>`;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    await trackMapShare(mapId);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = async (platform: 'twitter' | 'linkedin') => {
    if (!thumbnailUrl && mapRef?.current) {
      setIsGeneratingThumbnail(true);
      try {
        const url = await generateMapThumbnail(mapRef.current);
        setThumbnailUrl(url);
        shareToSocial(platform, url);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        shareToSocial(platform);
      } finally {
        setIsGeneratingThumbnail(false);
      }
    } else {
      shareToSocial(platform, thumbnailUrl || undefined);
    }
  };

  const shareToSocial = (platform: 'twitter' | 'linkedin', imageUrl?: string) => {
    const text = encodeURIComponent('Check out my community map!');
    const url = encodeURIComponent(shareUrl);
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}${imageUrl ? `&image=${encodeURIComponent(imageUrl)}` : ''}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    };

    window.open(shareUrls[platform], '_blank');
  };

  const handlePreviewEmbed = () => {
    window.open(`/map/${mapId}/embed`, '_blank', 'width=800,height=600');
  };

  return (
    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-auto">
      <h3 className="text-xl font-semibold mb-4">
        Share Your Map
      </h3>

      {/* Share Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('link')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'link'
              ? "bg-accent text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Share Link
        </button>
        <button
          onClick={() => setActiveTab('embed')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'embed'
              ? "bg-accent text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Embed
        </button>
      </div>

      {/* Share Content */}
      {activeTab === 'link' ? (
        <div className="space-y-6">
          {/* Copy Link */}
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
            />
            <Button
              variant="secondary"
              onClick={() => handleCopy(shareUrl)}
              className="flex items-center gap-2"
            >
              {copied ? (
                'Copied!'
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Social Share */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => handleSocialShare('twitter')}
              className="flex-1 flex items-center justify-center gap-2"
              disabled={isGeneratingThumbnail}
            >
              <Share2 className="w-4 h-4" />
              {isGeneratingThumbnail ? 'Generating Preview...' : 'Twitter'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSocialShare('linkedin')}
              className="flex-1 flex items-center justify-center gap-2"
              disabled={isGeneratingThumbnail}
            >
              <Link2 className="w-4 h-4" />
              LinkedIn
            </Button>
          </div>

          {thumbnailUrl && (
            <div className="mt-4 p-2 border rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Preview Image
              </div>
              <img
                src={thumbnailUrl}
                alt="Map preview"
                className="w-full rounded-md"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Copy this code to embed the map on your website:
          </p>
          <div className="flex gap-2">
            <textarea
              value={embedCode}
              readOnly
              rows={3}
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm font-mono"
            />
            <Button
              variant="secondary"
              onClick={() => handleCopy(embedCode)}
              className="flex items-center gap-2"
            >
              {copied ? (
                'Copied!'
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={handlePreviewEmbed}
              className="w-full flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Preview Embed
            </Button>
          </div>
        </div>
      )}

      {/* Close Button */}
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
} 