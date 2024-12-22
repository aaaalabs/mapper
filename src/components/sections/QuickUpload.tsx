import React, { useState, useEffect } from 'react';
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
import { createMap, trackMapDownload, updateMapName } from '../../services/mapService';
import { ShareModal } from '../ShareModal';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MapSettings } from '../../types/mapSettings';
import { supabase } from '../../lib/supabase';
import { trackErrorWithContext, ErrorSeverity, ErrorCategory } from '../../services/errorTracking';

interface QuickUploadProps {
  onMapCreated: (mapId: string, mapName: string, shareLink: string) => void;
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
    fontFamily: 'Inter',
    showName: true // Enable map name by default
    ,
    showAttribution: false
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
  const [showShare, setShowShare] = useState(false);
  const [mapName, setMapName] = useState<string>('My Community Map');
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
      fontFamily: 'Inter',
      showName: true // Enable map name by default
      ,
      showAttribution: false
    }
  });

  useEffect(() => {
    if (currentMapId) {
      // Subscribe to real-time changes for this map
      const subscription = supabase
        .channel(`map:${currentMapId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'maps',
            filter: `id=eq.${currentMapId}`
          },
          (payload) => {
            // Update the map name if it changed and it's different from our current value
            if (payload.new.name !== mapName) {
              setMapName(payload.new.name);
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentMapId, mapName]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await parseCsvFile(file);
      if (!data.length) {
        throw new Error('No valid data found in the CSV file');
      }

      const newCenter = calculateMapCenter(data);
      if (!newCenter) {
        trackErrorWithContext(new Error('Failed to calculate map center'), {
          category: ErrorCategory.GEOCODING,
          subcategory: 'COORDINATE_LOOKUP',
          severity: ErrorSeverity.HIGH,
          metadata: {
            fileSize: file.size,
            recordCount: data.length,
            hasValidCoordinates: data.some(d => d.latitude && d.longitude)
          }
        });
        throw new Error('Could not determine map center. Please check if your data contains valid coordinates.');
      }

      setMembers(data);
      setCenter(newCenter);
      setUploadStep('preview');

      // Track map creation start
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP.CREATION.STARTED,
        event_data: {
          member_count: data.length,
          has_coordinates: data.some(d => d.latitude && d.longitude)
        }
      });

      // Create map in database
      try {
        const createdMap = await createMap({
          name: mapName,
          settings: mapSettings,
          members: data,
          center: newCenter,
          zoom: 12
        });

        if (!createdMap?.id) {
          throw new Error('Map creation failed: No map ID returned');
        }

        setCurrentMapId(createdMap.id);
        onMapCreated(createdMap.id, mapName, `${window.location.origin}/map/${createdMap.id}`);

        await trackEvent({
          event_name: ANALYTICS_EVENTS.MAP.CREATION.COMPLETED,
          event_data: {
            map_id: createdMap.id,
            member_count: data.length
          }
        });
      } catch (error) {
        console.error('Map creation error:', error);
        await trackEvent({
          event_name: ANALYTICS_EVENTS.MAP.CREATION.ERROR,
          event_data: {
            error: error instanceof Error ? error.message : String(error)
          }
        });
        throw error; // Re-throw to be caught by outer catch block
      }
    } catch (err) {
      trackErrorWithContext(err instanceof Error ? err : new Error('Map generation failed'), {
        category: ErrorCategory.MAP,
        subcategory: 'CREATE',
        severity: ErrorSeverity.HIGH,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          error: err instanceof Error ? err.message : String(err)
        }
      });
      setError(err instanceof Error ? err.message : 'Failed to process the file. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapNameChange = async (name: string) => {
    setMapName(name);
    if (currentMapId) {
      try {
        await updateMapName(currentMapId, name);
      } catch (error) {
        console.error('Error updating map name:', error);
      }
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
        
        // First transition to success step
        setUploadStep('success');
        
        // Then track the event and generate the map
        await trackEvent({
          event_name: ANALYTICS_EVENTS.MAP.DOWNLOADED,
          event_data: { map_id: currentMapId, members_count: members.length }
        });

        // Generate and download HTML
        const mapSettingsToOptions = (settings: MapSettings): MapOptions => ({
          features: {
            enableClustering: settings.features.enableClustering,
            enableFullscreen: settings.features.enableFullscreen,
            enableSharing: settings.features.enableSharing
          },
          enableSearch: settings.features.enableSearch,
          style: {
            id: settings.style.id,
            markerStyle: settings.style.markerStyle || 'pins',
            popupStyle: {
              background: settings.style.popupStyle.background,
              text: settings.style.popupStyle.text,
              border: settings.style.popupStyle.border,
              shadow: settings.style.popupStyle.shadow
            }
          },
          customization: {
            markerColor: settings.customization.markerColor,
            clusterColor: settings.customization.clusterColor,
            fontFamily: settings.customization.fontFamily,
            showName: settings.customization.showName
          },
          title: mapName,
          zoom: settings.zoom
        });
        const html = await generateStandaloneHtml(members, center || [0, 0], mapSettingsToOptions(mapSettings));
        
        // Track successful download
        if (currentMapId) {
          await trackMapDownload(currentMapId, members.length);
        }

        // Finally download the file
        downloadHtmlFile(html, 'community-map.html');
      } catch (error) {
        console.error('Error downloading map:', error);
        setError('Failed to download map. Please try again.');
        // Reset to preview step if there's an error
        setUploadStep('preview');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleShare = async () => {
    if (!currentMapId) {
      console.error('No map ID available for sharing');
      return;
    }
    
    try {
      await trackEvent({
        event_name: ANALYTICS_EVENTS.MAP.SHARED,
        event_data: { 
          map_id: currentMapId, 
          members_count: members.length 
        }
      });
      
      setShowShare(true);
    } catch (error) {
      console.error('Failed to open share modal:', error);
      setError('Failed to open share dialog. Please try again.');
    }
  };

  const handleReset = () => {
    setMembers([]);
    setCenter(null);
    setUploadStep('initial');
    setCurrentMapId(null);
    setShowShare(false);
    setError(null);
    setMapName('My Community Map');
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
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">uid</td>
                    <td className="px-4 py-3 text-sm text-green-600">Yes</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Unique identifier for the community member</td>
                  </tr>
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
            initialMapName={mapName}
          />
        )}
      </Overlay>

      <Overlay isOpen={false} onClose={() => {}}>
        <OverlayContent>
          <FeedbackForm
            mapId={currentMapId || ''}
            onClose={() => {}}
          />
        </OverlayContent>
      </Overlay>
    </section>
  );

  function renderContent() {
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
          <div className="relative w-full aspect-[16/9] min-h-[300px] rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-background-dark/50 flex items-center justify-center z-50">
                <div className="text-white text-lg">Generating Map...</div>
              </div>
            )}
            <Map
              members={members}
              center={center || [0, 0]}
              variant="preview"
              settings={mapSettings}
              onSettingsChange={setMapSettings}
              name={mapName}
              onNameChange={handleMapNameChange}
              mapId={currentMapId || undefined}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              onClick={handleDownloadMap}
              disabled={isLoading}
              className="w-full sm:w-auto sm:min-w-[160px] text-lg"
            >
              {isLoading ? 'Generating Map...' : (
                <div className="flex items-center gap-2">
                  <FileDown className="w-5 h-5" />
                  Download Map
                </div>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={handleShare}
              disabled={isLoading}
              className="w-full sm:w-auto sm:min-w-[160px] text-lg"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Map
              </div>
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
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-primary dark:text-dark-primary">Your Map is Ready!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your map has been downloaded and is ready to be shared.
            </p>
          </div>
          
          {/* Feedback Form */}
          {currentMapId && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h4 className="text-lg font-semibold mb-4 text-primary dark:text-dark-primary">
                How was your experience?
              </h4>
              <FeedbackForm 
                mapId={currentMapId}
                onClose={handleReset}
              />
            </div>
          )}

          {/* Share and Reset Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button 
              variant="primary"
              onClick={handleShare}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Share2 className="w-4 h-4" />
              Share Map
            </Button>
            <Button 
              variant="outline"
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              Create Another Map
            </Button>
          </div>
        </div>
      );
    }
  }
}