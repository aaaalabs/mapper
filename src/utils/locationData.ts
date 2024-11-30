import { CommunityMember } from '../types';

// Structured location data with clean formatting
const locations = [
  { city: "New York", region: "NY", country: "USA", coords: [40.7128, -74.0060] },
  { city: "London", region: "England", country: "UK", coords: [51.5074, -0.1278] },
  { city: "Tokyo", region: "Kanto", country: "Japan", coords: [35.6762, 139.6503] },
  { city: "Berlin", region: "Berlin", country: "Germany", coords: [52.5200, 13.4050] },
  { city: "Sydney", region: "NSW", country: "Australia", coords: [-33.8688, 151.2093] },
  { city: "Toronto", region: "ON", country: "Canada", coords: [43.6532, -79.3832] },
  { city: "Singapore", region: "", country: "Singapore", coords: [1.3521, 103.8198] },
  { city: "Amsterdam", region: "NH", country: "Netherlands", coords: [52.3676, 4.9041] },
  { city: "Stockholm", region: "", country: "Sweden", coords: [59.3293, 18.0686] },
  { city: "Dubai", region: "Dubai", country: "UAE", coords: [25.2048, 55.2708] },
  { city: "Seoul", region: "", country: "South Korea", coords: [37.5665, 126.9780] },
  { city: "Mumbai", region: "Maharashtra", country: "India", coords: [19.0760, 72.8777] },
  { city: "São Paulo", region: "SP", country: "Brazil", coords: [-23.5505, -46.6333] },
  { city: "Cape Town", region: "WC", country: "South Africa", coords: [-33.9249, 18.4241] },
  { city: "Oslo", region: "", country: "Norway", coords: [59.9139, 10.7522] }
];

function formatLocation(location: typeof locations[0]): string {
  if (location.region) {
    return `${location.city} - ${location.country}`;
  }
  return `${location.city} - ${location.country}`;
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function getRandomLocation() {
  const location = locations[Math.floor(Math.random() * locations.length)];
  return {
    formatted: formatLocation(location),
    latitude: location.coords[0].toString(),
    longitude: location.coords[1].toString()
  };
}

export function formatCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(',');
}

export function validateCsvData(data: string): boolean {
  try {
    const rows = data.split('\n');
    const headers = rows[0].split(',');
    const expectedHeaders = ['name', 'title', 'image', 'longitude', 'latitude', 'location', 'website', 'linkedin'];
    
    return headers.every((header, index) => header === expectedHeaders[index]);
  } catch (error) {
    return false;
  }
}