import React, { useState, useEffect, useRef } from 'react';
import { FileUpload } from '../FileUpload';
import { CommunityMap } from '../CommunityMap';
import { InfoBox } from '../ui/InfoBox';
import { ErrorMessage } from '../ui/ErrorMessage';
import { MapOptions } from '../MapOptions';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { parseCsvFile, calculateMapCenter } from '../../utils/mapUtils';
import { generateStandaloneHtml, downloadHtmlFile } from '../../utils/exportMap';
import { CommunityMember } from '../../types';
import { Download, FileDown, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export function MapDemo() {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [showMapOptions, setShowMapOptions] = useState(false);
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const [mapOptions, setMapOptions] = useState<MapOptions>({
    markerStyle: 'pins',
    enableSearch: false,
    enableFullscreen: true,
    enableSharing: false,
    enableClustering: true
  });

  const handleFileSelect = async (file: File) => {
    try {
      setError(null);
      setIsLoading(true);
      const parsedMembers = await parseCsvFile(file);
      
      if (parsedMembers.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      const hasImages = parsedMembers.some(member => member.image);
      setMapOptions(prev => ({
        ...prev,
        markerStyle: hasImages ? 'photos' : 'pins'
      }));

      const mapCenter = calculateMapCenter(parsedMembers);
      setCenter(mapCenter);
      setMembers(parsedMembers);
      setShowMapOptions(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleDownload = () => {
    if (members.length > 0) {
      const html = generateStandaloneHtml(members, center, mapOptions);
      downloadHtmlFile(html, 'community-map.html');
    }
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="map-upload" ref={uploadSectionRef} className="relative max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {members.length === 0 ? (
            <div className="space-y-6">
              <div className="bg-background-white rounded-lg shadow-soft p-8">
                <FileUpload onFileSelect={handleFileSelect} />
                <InfoBox title="CSV Format Requirements">
                  <p>Include columns: name, location, latitude, longitude, image (optional)</p>
                  <p className="mt-2">
                    <a 
                      href="/sample.csv" 
                      download 
                      className="text-accent hover:text-accent-alt flex items-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      Download Sample CSV
                    </a>
                  </p>
                </InfoBox>
              </div>
              
              <div className="bg-background-white rounded-lg shadow-soft p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-accent/10 p-3 rounded-full shrink-0">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">No CSV available?</h3>
                    <p className="text-secondary">
                      Not a problem! Simply invite us to your Skool community and we'll handle the data extraction for you. 
                      For a one-time fee of 9,90 €, we'll process your community data and deliver it in the required format.
                    </p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => window.location.href = 'mailto:support@voiceloop.io'}
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-background-white rounded-lg shadow-soft p-6">
                <CommunityMap 
                  members={members} 
                  center={center}
                  options={mapOptions}
                />
              </div>
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleDownload}
                  className="group bg-accent hover:bg-accent-alt text-white"
                >
                  <Download className="w-5 h-5 mr-2 group-hover:transform group-hover:-translate-y-1 transition-transform" />
                  Download HTML Map
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToPricing}
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          )}
          {error && <ErrorMessage message={error} />}
        </div>

        <div className={cn(
          "transition-all duration-500 ease-in-out",
          showMapOptions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          {showMapOptions && (
            <MapOptions 
              options={mapOptions}
              onChange={setMapOptions}
              hasImages={members.some(m => m.image)}
            />
          )}
        </div>
      </div>

      {isLoading && (
        <LoadingOverlay onComplete={() => setIsLoading(false)} />
      )}
    </div>
  );
}