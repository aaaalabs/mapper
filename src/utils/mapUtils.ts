import Papa from 'papaparse';
import { CommunityMember } from '../types';

export async function parseCsvFile(file: File): Promise<CommunityMember[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const members = results.data as CommunityMember[];
        resolve(members.filter(member => 
          member.name && 
          member.latitude && 
          member.longitude && 
          !isNaN(parseFloat(member.latitude)) && 
          !isNaN(parseFloat(member.longitude))
        ));
      },
      error: (error) => {
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