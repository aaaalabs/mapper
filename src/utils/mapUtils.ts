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
          const members = results.data as CommunityMember[];
          console.log('Parsed CSV data:', members);
          
          // Filter out entries without name or any location data
          const validMembers = members.filter(member => 
            member.name && 
            (member.location || (
              member.latitude && 
              member.longitude && 
              !isNaN(parseFloat(member.latitude)) && 
              !isNaN(parseFloat(member.longitude))
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
    member.latitude && 
    member.longitude && 
    !isNaN(parseFloat(member.latitude)) && 
    !isNaN(parseFloat(member.longitude))
  );

  if (validMembers.length === 0) {
    return [0, 0];
  }

  const sumLat = validMembers.reduce((sum, member) => 
    sum + parseFloat(member.latitude), 0
  );
  const sumLng = validMembers.reduce((sum, member) => 
    sum + parseFloat(member.longitude), 0
  );

  return [
    sumLat / validMembers.length,
    sumLng / validMembers.length
  ];
}