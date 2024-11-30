import React, { useState } from 'react';
import { Upload, FileDown, AlertCircle, Table } from 'lucide-react';
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

export function QuickUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      // Parse CSV file
      const parsedMembers = await parseCsvFile(file);
      setMembers(parsedMembers);

      // Calculate map center
      const mapCenter = calculateMapCenter(parsedMembers);
      setCenter(mapCenter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
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

  const handleDownloadMap = () => {
    if (members.length > 0 && center) {
      const html = generateStandaloneHtml(members, center, {
        markerStyle: 'pins',
        enableSearch: false,
        enableFullscreen: true,
        enableSharing: false,
        enableClustering: true
      });
      downloadHtmlFile(html, 'community-map.html');
    }
  };

  return (
    <div className="rounded-xl p-8 mb-12 max-w-2xl mx-auto bg-background-white">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 text-primary">Get Your Map Now</h2>
        <p className="text-secondary">
          Upload your community data to generate a downloadable HTML map instantly
        </p>
      </div>

      {members.length > 0 && center ? (
        <div className="space-y-4">
          <Map 
            members={members}
            center={center}
            isLoading={isLoading}
          />
          <div className="flex justify-center gap-4">
            <Button 
              variant="primary"
              onClick={handleDownloadMap}
            >
              Download Map
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                setMembers([]);
                setCenter(null);
              }}
            >
              Generate Another Map
            </Button>
          </div>
        </div>
      ) : (
        <>
          <FileUpload 
            onFileSelect={handleFileSelect}
            className="border-2 border-dashed border-accent rounded-lg p-8"
          />

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-tertiary">
            <button 
              onClick={handleDownloadDemo}
              className="hover:underline text-accent inline-flex items-center gap-1"
            >
              <FileDown className="w-4 h-4" />
              Download sample CSV
            </button>
            <span>·</span>
            <button 
              onClick={() => setShowFormatGuide(true)}
              className="hover:underline text-accent inline-flex items-center gap-1"
            >
              View formatting guide
            </button>
          </div>
        </>
      )}

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
    </div>
  );
}