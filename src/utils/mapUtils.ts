import Papa from 'papaparse';
import { CommunityMember } from '../types';
import { enrichMembersWithGeocoding } from './geocoding';

export async function parseCsvFile(file: File): Promise<CommunityMember[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const members = results.data.map((data: any) => {
            const latitude = data.latitude ? parseFloat(data.latitude) : 0;
            const longitude = data.longitude ? parseFloat(data.longitude) : 0;
            
            return {
              ...data,
              id: crypto.randomUUID(),
              latitude: !isNaN(latitude) ? latitude : 0,
              longitude: !isNaN(longitude) ? longitude : 0
            };
          }) as CommunityMember[];
          console.log('Parsed CSV data:', members);
          
          // Filter out entries without name or any location data
          const validMembers = members.filter(member => 
            member.name && 
            (member.location || (
              member.latitude !== 0 && 
              member.longitude !== 0
            ))
          );

          console.log('Valid members before geocoding:', validMembers.length);

          if (validMembers.length === 0) {
            reject(new Error('No valid members found in CSV. Each member must have a name and either a location or coordinates.'));
            return;
          }

          // Enrich members with geocoding data if needed
          const enrichedMembers = await enrichMembersWithGeocoding(validMembers);
          console.log('Members after geocoding:', enrichedMembers.length);
          
          if (enrichedMembers.length === 0) {
            reject(new Error('No valid members found after geocoding. Please check the location data.'));
            return;
          }

          resolve(enrichedMembers);
        } catch (error) {
          console.error('Error processing CSV:', error);
          reject(error);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

export function calculateMapCenter(members: CommunityMember[]): [number, number] {
  const validMembers = members.filter(member => 
    member.latitude !== 0 && 
    member.longitude !== 0 &&
    !isNaN(member.latitude) && 
    !isNaN(member.longitude)
  );

  if (validMembers.length === 0) {
    // Default to a central position if no valid coordinates
    return [20, 0];  // This provides a reasonable default view of the world map
  }

  const sumLat = validMembers.reduce((sum, member) => 
    sum + (member.latitude || 0), 0
  );
  const sumLng = validMembers.reduce((sum, member) => 
    sum + (member.longitude || 0), 0
  );

  const centerLat = sumLat / validMembers.length;
  const centerLng = sumLng / validMembers.length;

  // Final safety check to ensure we don't return NaN
  return [
    !isNaN(centerLat) ? centerLat : 20,
    !isNaN(centerLng) ? centerLng : 0
  ];
}

export function getMarkerIcon(markerStyle: "pins" | "photos", member: CommunityMember): string {
  switch (markerStyle) {
    case "photos":
      return member.image || "/images/default-avatar.png";
    case "pins":
    default:
      return "/images/leaflet/marker-icon.png";
  }
}