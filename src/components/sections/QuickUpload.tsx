import React, { useState } from 'react';
import { FileDown, AlertCircle, CheckCircle2, ArrowRight, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { FileUpload } from '../FileUpload';
import { Map } from '../Map';
import { parseCsvFile } from '../../utils/mapUtils';
import { generateStandaloneHtml, downloadHtmlFile, MapOptions } from '../../utils/exportMap';
import { generateDemoCsv } from '../../utils/demoData';
import { calculateMapCenter } from '../../utils/mapUtils';
import { CommunityMember } from '../../types';
import { Overlay } from '../ui/Overlay';
import { OverlayContent } from '../ui/OverlayContent';
import { cn } from '../../lib/utils';
import { FeedbackForm } from '../FeedbackForm';
import { createMap, trackMapDownload } from '../../services/mapService';
import { ShareModal } from '../ShareModal';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MapSettings } from '../../types/mapSettings';

interface QuickUploadProps {
  onMapCreated: (mapId: string) => void;
}

const STEPS = [
  { key: 'initial', label: 'Upload' },
  { key: 'preview', label: 'Preview' },
  { key: 'success', label: 'Download' }
];

const defaultMapSettings = {
  style: {
    id: 'standard',
    markerStyle: 'pins',  
    popupStyle: {
      background: '#FFFFFF',
      text: '#1D3640',
      border: '#E2E8F0',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  },
  features: {
    enableClustering: true,
    enableFullscreen: true,
    enableSharing: true,
    enableSearch: false
  },
  customization: {
    markerColor: '#E9B893',
    clusterColor: '#F99D7C',
    fontFamily: 'Inter'
  }
};

export function QuickUpload({ onMapCreated }: QuickUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [uploadStep, setUploadStep] = useState<'initial' | 'preview' | 'success'>('initial');
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    style: {
      id: 'standard',
      markerStyle: 'pins',  
      popupStyle: {
        background: '#FFFFFF',
        text: '#1D3640',
        border: '#E2E8F0',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    },
    features: {
      enableClustering: true,
      enableFullscreen: true,
      enableSharing: true,
      enableSearch: false
    },
    customization: {
      markerColor: '#E9B893',
      clusterColor: '#F99D7C',
      fontFamily: 'Inter'
    }
  });

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_CREATION.START,
        event_data: { file_size: file.size }
      });

      console.log('Starting file processing and geocoding...');
      const parsedMembers = await parseCsvFile(file);
      
      if (parsedMembers.length === 0) {
        throw new Error('No valid community members found in the CSV file');
      }

      // Calculate map center from the geocoded members
      const mapCenter = calculateMapCenter(parsedMembers);
      
      setMembers(parsedMembers);
      setCenter(mapCenter);
      setUploadStep('preview');
      
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_CREATION.SUCCESS,
        event_data: { members_count: parsedMembers.length }
      });
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error instanceof Error ? error.message : 'Failed to process the file');
      
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_CREATION.ERROR,
        event_data: { error: error instanceof Error ? error.message : 'Unknown error' }
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

        // Save map with current settings
        const savedMap = await createMap({
          name: 'My Community Map',
          members,
          center: center || [0, 0],
          zoom: 2,
          settings: {
            ...mapSettings,
            center: center || [0, 0],
            zoom: 2
          }
        });

        setCurrentMapId(savedMap.id);

        // Generate and download HTML
        const mapSettingsToOptions = (settings: MapSettings): MapOptions => ({
          features: {
            enableClustering: settings.features.enableClustering,
            enableFullscreen: settings.features.enableFullscreen,
            enableSharing: settings.features.enableSharing,
            enableSearch: settings.features.enableSearch
          },
          style: {
            id: settings.style.id,
            markerStyle: settings.style.markerStyle,
            popupStyle: settings.style.popupStyle
          },
          customization: {
            markerColor: settings.customization.markerColor,
            clusterColor: settings.customization.clusterColor,
            fontFamily: settings.customization.fontFamily
          },
          zoom: settings.zoom
        });
        const html = await generateStandaloneHtml(members, center || [0, 0], mapSettingsToOptions(mapSettings));
        downloadHtmlFile(html, 'community-map.html');

        // Track successful download
        await trackMapDownload(savedMap.id);
        
        setUploadStep('success');
        setShowFeedback(true);

        await trackEvent({
          event_name: ANALYTICS_EVENTS.MAP_DOWNLOAD.COMPLETED,
          event_data: { map_id: savedMap.id }
        });
      } catch (error) {
        console.error('Error downloading map:', error);
        setError('Failed to download map. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReset = () => {
    setMembers([]);
    setCenter(null);
    setUploadStep('initial');
    setError(null);
    setCurrentMapId(null);
    setShowFeedback(false);
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <LoadingSpinner 
          size="lg"
          message="Processing your data and geocoding locations..."
          className="py-12"
        />
      );
    }

    if (uploadStep === 'initial') {
      return (
        <div className="space-y-6">
          <FileUpload
            onFileSelect={handleFileSelect}
            className="border-2 border-dashed border-accent/20 dark:border-accent-dark/20 hover:border-accent/40 dark:hover:border-accent-dark/40 rounded-xl p-8 transition-colors"
          />

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 text-sm text-tertiary dark:text-dark-tertiary">
            <button 
              onClick={handleDownloadDemo}
              className="hover:text-accent dark:hover:text-accent-dark transition-colors inline-flex items-center gap-1"
            >
              <FileDown className="w-4 h-4" />
              Download sample CSV
            </button>
            <span>·</span>
            <button 
              onClick={() => setShowFormatGuide(true)}
              className="hover:text-accent dark:hover:text-accent-dark transition-colors inline-flex items-center gap-1"
            >
              View formatting guide
            </button>
          </div>
        </div>
      );
    }

    if (uploadStep === 'preview' && members.length > 0 && center) {
      return (
        <div className="space-y-6">
          <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
            <Map
              members={members}
              center={center}
              isLoading={isLoading}
              hideShareButton={true}
              variant="preview"
              settings={mapSettings}
              onSettingsChange={setMapSettings}
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
      );
    }

    if (uploadStep === 'success') {
      return (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-primary dark:text-dark-primary">Your Map is Ready!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your map has been downloaded and is ready to be shared.
            </p>
          </div>
          
          {/* Feedback Form */}
          {currentMapId && (
            <div className="mb-8">
              <FeedbackForm 
                mapId={currentMapId}
                onClose={() => {
                  setShowFeedback(false);
                  handleReset();
                }}
              />
            </div>
          )}

          {/* Share and Reset Buttons */}
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
        </div>
      );
    }
  };

  return (
    <section id="quick-upload">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-primary dark:text-dark-primary">
            Create Your Map in Seconds
          </h2>
          <p className="text-base sm:text-lg text-secondary dark:text-dark-secondary max-w-2xl mx-auto">
            Upload your CSV file and get an interactive map instantly. No sign-up required.
          </p>
        </div>

        <div className="bg-background-white dark:bg-background-dark rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800">
          {/* Progress Steps */}
          <div className="border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-4 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-4">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.key}>
                  <div className="flex items-center gap-2">
                    <div 
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        uploadStep === step.key
                          ? "bg-accent text-white dark:bg-accent-dark"
                          : uploadStep === 'success' || (index < ['initial', 'preview', 'success'].indexOf(uploadStep))
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
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
                          ? "text-accent dark:text-accent-dark"
                          : uploadStep === 'success' || (index < ['initial', 'preview', 'success'].indexOf(uploadStep))
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-400 dark:text-gray-500"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ArrowRight className={cn(
                      "w-4 h-4 hidden sm:block",
                      uploadStep === 'success' || (index < ['initial', 'preview', 'success'].indexOf(uploadStep))
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-300 dark:text-gray-700"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-8">
            {renderContent()}
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
                    <td className="px-4 py-3 text-sm text-gray-500">No</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Decimal latitude (e.g., 51.5074). Will be geocoded if not provided.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">longitude</td>
                    <td className="px-4 py-3 text-sm text-gray-500">No</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Decimal longitude (e.g., -0.1278). Will be geocoded if not provided.</td>
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
            isOpen={showShare}
            mapId={currentMapId}
            onClose={() => setShowShare(false)}
          />
        )}
      </Overlay>
    </section>
  );
}