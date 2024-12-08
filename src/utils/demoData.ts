import { CommunityMember } from '../types';

// Helper functions for generating random data
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateUsername(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}`;
}

// Data pools for random generation
const maleFirstNames = [
  "Marcus", "James", "Alex", "Carlos", "David", "Michael", "Raj", "Luis",
  "Thomas", "Ahmed", "Pierre", "Daniel", "William", "Richard", "John"
];

const femaleFirstNames = [
  "Sarah", "Priya", "Maria", "Lisa", "Emma", "Nina", "Yuki", "Isabella",
  "Olivia", "Sophie", "Anna", "Elena", "Mei", "Zara", "Laura"
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

// Profile image URLs from Unsplash (professional headshots)
const maleProfileImages = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop", // Male professional 1
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop", // Male professional 2
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop", // Male professional 3
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop", // Male professional 4
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"  // Male professional 5
];

const femaleProfileImages = [
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop", // Female professional 1
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop", // Female professional 2
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop", // Female professional 3
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop", // Female professional 4
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop"     // Female professional 5
];

const domains = [
  ".dev",
  ".design",
  ".me",
  ".io",
  ".tech",
  ".ai",
  ".co",
  ".digital",
  ".studio",
  ".work"
];

export function generateDemoMembers(): CommunityMember[] {
  const members: CommunityMember[] = [];
  const count = 20; // Fixed number of demo members

  for (let i = 0; i < count; i++) {
    // Randomly choose gender and corresponding first name and image
    const isMale = Math.random() < 0.5;
    const firstName = getRandomElement(isMale ? maleFirstNames : femaleFirstNames);
    const lastName = getRandomElement(lastNames);
    const city = getRandomElement(cities);
    const role = getRandomElement(roles);
    const domain = getRandomElement(domains);
    const username = generateUsername(firstName, lastName);

    members.push({
      name: `${firstName} ${lastName}`,
      location: city.name,
      latitude: city.lat.toString(),
      longitude: city.lng.toString(),
      title: role,
      image: getRandomElement(isMale ? maleProfileImages : femaleProfileImages),
      website: `https://${username}${domain}`,
      linkedin: `https://linkedin.com/in/${username}`
    });
  }

  return members;
}

export const demoMembers: CommunityMember[] = generateDemoMembers();

export function generateDemoCsv(): string {
  const header = 'name,title,location,latitude,longitude,image,website,linkedin';
  const rows = demoMembers.map(member => 
    `${member.name},${member.title || ''},"${member.location}",${member.latitude},${member.longitude},${member.image || ''},${member.website || ''},${member.linkedin || ''}`
  );
  return [header, ...rows].join('\n');
}

export const communityExamples = [
  {
    name: "Tech Innovators Network",
    description: "Global tech professionals collaborating on cutting-edge projects",
    members: demoMembers,
  }
];