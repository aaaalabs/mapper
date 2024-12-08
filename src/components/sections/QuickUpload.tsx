import React, { useState } from 'react';
import { FileDown, AlertCircle, CheckCircle2, ArrowRight, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { FileUpload } from '../FileUpload';
import { Map } from '../Map';
import { parseCsvFile } from '../../utils/mapUtils';
import { generateStandaloneHtml, downloadHtmlFile } from '../../utils/exportMap';
import { generateDemoCsv } from '../../utils/demoData';
import { calculateMapCenter } from '../../utils/mapUtils';
import { CommunityMember } from '../../types';
import { Overlay } from '../ui/Overlay';
import { OverlayContent } from '../ui/OverlayContent';
import { cn } from '../../lib/utils';
import { FeedbackForm } from '../FeedbackForm';
import { saveMap, trackMapDownload } from '../../services/mapService';
import { ShareModal } from '../ShareModal';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';

export function QuickUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [uploadStep, setUploadStep] = useState<'initial' | 'preview' | 'success'>('initial');
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quickRating, setQuickRating] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_CREATION.START,
        event_data: { file_size: file.size }
      });

      const parsedMembers = await parseCsvFile(file);
      setMembers(parsedMembers);
      const mapCenter = calculateMapCenter(parsedMembers);
      setCenter(mapCenter);
      setUploadStep('preview');

      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_CREATION.COMPLETE,
        event_data: { members_count: parsedMembers.length }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_CREATION.ERROR,
        event_data: { error: err instanceof Error ? err.message : 'Unknown error' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDemo = () => {
    const csvContent = generateDemoCsv();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'demo-community-map.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadMap = async () => {
    if (members.length > 0 && center) {
      try {
        setIsLoading(true);
        
        await trackEvent({
          event_name: ANALYTICS_EVENTS.MAP_DOWNLOAD.STARTED,
          event_data: { members_count: members.length }
        });

        const savedMap = await saveMap({
          name: 'Community Map',
          members,
          center,
          zoom: 2
        });
        
        const html = generateStandaloneHtml(members, center, {
          markerStyle: 'default',
          enableFullscreen: true,
          enableSharing: true,
          enableClustering: true
        });
        downloadHtmlFile(html, 'community-map.html');

        setCurrentMapId(savedMap.id);
        await trackMapDownload(savedMap.id);
        setUploadStep('success');

        await trackEvent({
          event_name: ANALYTICS_EVENTS.MAP_DOWNLOAD.COMPLETED,
          event_data: { map_id: savedMap.id }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save map');
        await trackEvent({
          event_name: ANALYTICS_EVENTS.MAP_DOWNLOAD.ERROR,
          event_data: { error: err instanceof Error ? err.message : 'Unknown error' }
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuickRating = async (rating: number) => {
    setQuickRating(rating);
    await trackEvent({
      event_name: ANALYTICS_EVENTS.FEEDBACK.RATING,
      event_data: { rating, map_id: currentMapId }
    });
    
    if (rating >= 4) {
      setTimeout(() => setShowFeedback(true), 500);
    }
  };

  const handleReset = () => {
    setMembers([]);
    setCenter(null);
    setUploadStep('initial');
    setError(null);
    setCurrentMapId(null);
    setShowFeedback(false);
    setQuickRating(null);
  };

  const handleShare = async () => {
    if (currentMapId) {
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_SHARING.INITIATED,
        event_data: { map_id: currentMapId }
      });
      setShowShare(true);
    }
  };

  return (
    <section id="quick-upload">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Create Your Map in Seconds
          </h2>
          <p className="text-base sm:text-lg text-secondary max-w-2xl mx-auto">
            Upload your CSV file and get an interactive map instantly. No sign-up required.
          </p>
        </div>

        <div className="bg-background-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Progress Steps */}
          <div className="border-b px-4 sm:px-8 py-4 bg-gray-50/50">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-4">
              {[
                { key: 'initial', label: 'Upload CSV' },
                { key: 'preview', label: 'Preview Map' },
                { key: 'success', label: 'Download Map' }
              ].map((step, index) => (
                <React.Fragment key={step.key}>
                  <div className="flex items-center gap-2">
                    <div 
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        uploadStep === step.key
                          ? "bg-accent text-white"
                          : uploadStep === 'success' || (index < ['initial', 'preview', 'success'].indexOf(uploadStep))
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {uploadStep === 'success' || (index < ['initial', 'preview', 'success'].indexOf(uploadStep)) ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span 
                      className={cn(
                        "text-sm font-medium",
                        uploadStep === step.key
                          ? "text-accent"
                          : uploadStep === 'success' || (index < ['initial', 'preview', 'success'].indexOf(uploadStep))
                            ? "text-green-600"
                            : "text-gray-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <ArrowRight className={cn(
                      "w-4 h-4 hidden sm:block",
                      uploadStep === 'success' || (index < ['initial', 'preview', 'success'].indexOf(uploadStep))
                        ? "text-green-600"
                        : "text-gray-300"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-8">
            {uploadStep === 'initial' && (
              <div className="space-y-6">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  className="border-2 border-dashed border-accent/20 hover:border-accent/40 rounded-xl p-8 transition-colors"
                />

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 text-sm text-tertiary">
                  <button 
                    onClick={handleDownloadDemo}
                    className="hover:text-accent transition-colors inline-flex items-center gap-1"
                  >
                    <FileDown className="w-4 h-4" />
                    Download sample CSV
                  </button>
                  <span>·</span>
                  <button 
                    onClick={() => setShowFormatGuide(true)}
                    className="hover:text-accent transition-colors inline-flex items-center gap-1"
                  >
                    View formatting guide
                  </button>
                </div>
              </div>
            )}

            {uploadStep === 'preview' && members.length > 0 && center && (
              <div className="space-y-6">
                <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                  <Map
                    members={members}
                    center={center}
                    isLoading={isLoading}
                    hideShareButton={true}
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    variant="primary"
                    onClick={handleDownloadMap}
                    disabled={isLoading}
                    className="w-full sm:w-auto sm:min-w-[200px] text-lg"
                  >
                    {isLoading ? 'Generating Map...' : (
                      <div className="flex items-center gap-2">
                        <FileDown className="w-5 h-5" />
                        Download Interactive Map
                      </div>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="w-full sm:w-auto text-sm text-gray-500 hover:text-gray-700"
                  >
                    Upload Different File
                  </Button>
                </div>
              </div>
            )}

            {uploadStep === 'success' && (
              <div className="text-center space-y-6">
                {!quickRating ? (
                  // Quick Rating Step
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Your Map is Ready!</h3>
                      <p className="text-gray-600 mb-6">
                        How was your experience creating the map?
                      </p>
                      <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleQuickRating(rating)}
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors",
                              "hover:bg-accent hover:text-white",
                              "border-2",
                              quickRating === rating
                                ? "border-accent bg-accent text-white"
                                : "border-gray-200 text-gray-600"
                            )}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <Button 
                        variant="primary"
                        onClick={handleShare}
                        className="flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Map
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleReset}
                      >
                        Create Another Map
                      </Button>
                    </div>
                  </>
                ) : showFeedback && currentMapId ? (
                  // Detailed Feedback Form (only for high ratings)
                  <FeedbackForm 
                    mapId={currentMapId}
                    onClose={handleReset}
                  />
                ) : (
                  // Thank You Step
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Thanks for your feedback!</h3>
                      <p className="text-gray-600 mb-6">
                        Your map is ready to be shared with your community.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <Button 
                        variant="primary"
                        onClick={handleShare}
                        className="flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Map
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleReset}
                      >
                        Create Another Map
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSV Formatting Guide Modal */}
      <Overlay isOpen={showFormatGuide} onClose={() => setShowFormatGuide(false)}>
        <OverlayContent
          title="CSV Format Requirements"
          description="Your CSV file must include the following columns in any order:"
        >
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">name</td>
                    <td className="px-4 py-3 text-sm text-green-600">Yes</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Full name of the community member</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">location</td>
                    <td className="px-4 py-3 text-sm text-green-600">Yes</td>
                    <td className="px-4 py-3 text-sm text-gray-500">City, Country or full address</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">latitude</td>
                    <td className="px-4 py-3 text-sm text-green-600">Yes</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Decimal latitude (e.g., 51.5074)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">longitude</td>
                    <td className="px-4 py-3 text-sm text-green-600">Yes</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Decimal longitude (e.g., -0.1278)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">image</td>
                    <td className="px-4 py-3 text-sm text-gray-500">No</td>
                    <td className="px-4 py-3 text-sm text-gray-500">URL to profile image</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">title</td>
                    <td className="px-4 py-3 text-sm text-gray-500">No</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Job title or role</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">linkedin</td>
                    <td className="px-4 py-3 text-sm text-gray-500">No</td>
                    <td className="px-4 py-3 text-sm text-gray-500">LinkedIn profile URL</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">website</td>
                    <td className="px-4 py-3 text-sm text-gray-500">No</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Personal website URL</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <h4 className="font-medium text-gray-900 mb-2">Tips:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Save your file with the .csv extension</li>
                <li>Use UTF-8 encoding for special characters</li>
                <li>Ensure coordinates are in decimal format</li>
                <li>URLs should include http:// or https://</li>
                <li>Download our sample CSV for reference</li>
              </ul>
            </div>
          </div>
        </OverlayContent>
      </Overlay>

      <Overlay isOpen={showShare} onClose={() => setShowShare(false)}>
        {currentMapId && (
          <ShareModal
            mapId={currentMapId}
            onClose={() => setShowShare(false)}
          />
        )}
      </Overlay>
    </section>
  );
}