import { CommunityMember } from '../types';

// Helper functions for generating random data
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateUsername(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}`;
}

// Data pools for random generation
const firstNames = [
  "Sarah", "Marcus", "Priya", "James", "Maria", "Lisa", "Alex", "Emma", "Carlos",
  "Nina", "David", "Yuki", "Isabella", "Pierre", "Olivia", "Michael", "Sophie",
  "Raj", "Anna", "Luis", "Elena", "Thomas", "Mei", "Ahmed", "Zara"
];

const lastNames = [
  "Chen", "Weber", "Patel", "Wilson", "Garcia", "Chang", "Kim", "Brown",
  "Rodriguez", "Larsson", "Thompson", "Tanaka", "Costa", "Dubois", "Anderson",
  "Silva", "Kumar", "Lee", "Martinez", "Popov", "Müller", "Zhang", "Ali", "Sato"
];

const cities = [
  { name: "San Francisco, USA", lat: 37.7749, lng: -122.4194 },
  { name: "Berlin, Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Bangalore, India", lat: 12.9716, lng: 77.5946 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Toronto, Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708 }
];

const roles = [
  "Software Engineer", "Product Designer", "Data Scientist", "Product Manager",
  "UX Researcher", "Marketing Lead", "Community Manager", "Content Strategist",
  "Business Developer", "Operations Lead", "Technical Writer", "DevOps Engineer",
  "AI Researcher", "Growth Hacker", "UI Designer"
];

// Example communities with curated members
const techCommunity: CommunityMember[] = [
  {
    name: "Sarah Chen",
    location: "San Francisco, USA",
    latitude: "37.7749",
    longitude: "-122.4194",
    title: "Software Engineer",
    image: "https://i.pravatar.cc/150?u=sarahchen",
    linkedin: "https://linkedin.com/in/sarahchen",
    website: "https://sarahchen.dev"
  },
  // ... keep existing tech community members ...
];

// ... keep other community definitions ...

export const communityExamples = [
  {
    name: "Tech Innovators Network",
    description: "Global tech professionals collaborating on cutting-edge projects",
    members: techCommunity,
  },
  // ... keep other community examples ...
];

export function generateDemoMembers(count: number = 50): CommunityMember[] {
  const members: CommunityMember[] = [];
  const usedNames = new Set();

  while (members.length < count) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;

    if (usedNames.has(fullName)) continue;
    usedNames.add(fullName);

    const city = getRandomElement(cities);
    const username = generateUsername(firstName, lastName);

    members.push({
      name: fullName,
      location: city.name,
      latitude: city.lat.toString(),
      longitude: city.lng.toString(),
      title: getRandomElement(roles),
      image: `https://i.pravatar.cc/150?u=${username}`,
      linkedin: `https://linkedin.com/in/${username}`,
      website: `https://${username}.dev`
    });
  }

  return members;
}

export function generateDemoCsv(): string {
  const members = generateDemoMembers(10); // Use 10 members for the demo CSV
  const headers = ['name', 'location', 'latitude', 'longitude', 'title', 'image', 'linkedin', 'website'];
  
  const rows = members.map(member => {
    return [
      member.name,
      member.location,
      member.latitude,
      member.longitude,
      member.title || '',
      member.image || '',
      member.linkedin || '',
      member.website || ''
    ].map(value => `"${value}"`).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}