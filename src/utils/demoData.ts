import { CommunityMember } from '../types';
import { getRandomLocation, formatCsvRow } from './locationData';
import { 
  firstNames, 
  lastNames, 
  roles, 
  getRandomElement, 
  generateUsername, 
  generateAvatarUrl, 
  generateWebsite, 
  generateLinkedIn 
} from './demoUtils';

export function generateDemoMembers(count: number = 50): CommunityMember[] {
  const members: CommunityMember[] = [];
  const usedNames = new Set();

  while (members.length < count) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;

    if (usedNames.has(fullName)) continue;
    usedNames.add(fullName);

    const role = getRandomElement(roles);
    const username = generateUsername(firstName, lastName);
    const location = getRandomLocation();

    members.push({
      name: fullName,
      title: role,
      image: generateAvatarUrl(fullName),
      longitude: location.longitude,
      latitude: location.latitude,
      location: location.formatted,
      website: generateWebsite(username),
      linkedin: generateLinkedIn(username),
      updated_at: new Date().toISOString()
    });
  }

  return members;
}

export function generateDemoCsv(): string {
  const members = generateDemoMembers(50);
  const headers = ['name', 'title', 'image', 'longitude', 'latitude', 'location', 'website', 'linkedin'];
  
  const rows = members.map(member => 
    formatCsvRow(headers.map(header => member[header as keyof CommunityMember] || ''))
  );
  
  return [formatCsvRow(headers), ...rows].join('\n');
}