import { CommunityMember } from '../types';

export const demoProfiles: CommunityMember[] = [
  {
    name: "Sarah Chen",
    title: "UX/UI Designer",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Round&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=PastelBlue&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Light",
    longitude: "103.8198",
    latitude: "1.3521",
    location: "Singapore",
    website: "https://sarahchen.design",
    linkedin: "https://linkedin.com/in/sarahchendesign"
  },
  {
    name: "Marcus Schmidt",
    title: "Senior Developer",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortWaved&accessoriesType=Blank&hairColor=BrownDark&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=Hoodie&clotheColor=Gray&eyeType=Happy&eyebrowType=Default&mouthType=Smile&skinColor=Light",
    longitude: "13.4050",
    latitude: "52.5200",
    location: "Berlin, Germany",
    website: "https://schmidt.dev",
    linkedin: "https://linkedin.com/in/marcusschmidt"
  },
  {
    name: "Priya Patel",
    title: "Product Manager",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairBigHair&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=BlazerShirt&clotheColor=PastelRed&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Light",
    longitude: "72.8777",
    latitude: "19.0760",
    location: "Mumbai, India",
    website: "https://priyapatel.co",
    linkedin: "https://linkedin.com/in/priyapatelpm"
  },
  {
    name: "James Wilson",
    title: "DevOps Engineer",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&accessoriesType=Prescription02&hairColor=Brown&facialHairType=BeardMedium&facialHairColor=Brown&clotheType=BlazerSweater&clotheColor=Black&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light",
    longitude: "-0.1276",
    latitude: "51.5074",
    location: "London, UK",
    website: "https://jameswilson.tech",
    linkedin: "https://linkedin.com/in/jameswilsondev"
  },
  {
    name: "Sofia Rodriguez",
    title: "Data Scientist",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight2&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=BlazerShirt&clotheColor=Blue03&eyeType=Happy&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Light",
    longitude: "-46.6333",
    latitude: "-23.5505",
    location: "São Paulo, Brazil",
    website: "https://sofiarodriguez.io",
    linkedin: "https://linkedin.com/in/sofiarodriguezdata"
  },
  {
    name: "Yuki Tanaka",
    title: "Frontend Developer",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairBob&accessoriesType=Prescription01&hairColor=Black&facialHairType=Blank&clotheType=BlazerSweater&clotheColor=PastelGreen&eyeType=Happy&eyebrowType=Default&mouthType=Smile&skinColor=Light",
    longitude: "139.6503",
    latitude: "35.6762",
    location: "Tokyo, Japan",
    website: "https://yukitanaka.dev",
    linkedin: "https://linkedin.com/in/yukitanakadev"
  },
  {
    name: "Alexandre Dubois",
    title: "Blockchain Developer",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=Black&facialHairType=BeardLight&facialHairColor=Brown&clotheType=BlazerShirt&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light",
    longitude: "2.3522",
    latitude: "48.8566",
    location: "Paris, France",
    website: "https://alexandredubois.tech",
    linkedin: "https://linkedin.com/in/alexandreduboisdev"
  },
  {
    name: "Emma Anderson",
    title: "Community Manager",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Kurt&hairColor=Blonde&facialHairType=Blank&clotheType=BlazerShirt&clotheColor=PastelOrange&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Light",
    longitude: "151.2093",
    latitude: "-33.8688",
    location: "Sydney, Australia",
    website: "https://emmaanderson.community",
    linkedin: "https://linkedin.com/in/emmaandersoncomm"
  },
  {
    name: "Mohammed Al-Rashid",
    title: "AI Researcher",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortWaved&accessoriesType=Prescription01&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerSweater&clotheColor=Gray&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light",
    longitude: "55.2708",
    latitude: "25.2048",
    location: "Dubai, UAE",
    website: "https://alrashid.ai",
    linkedin: "https://linkedin.com/in/mohammedalrashidai"
  },
  {
    name: "Lisa Van der Berg",
    title: "Technical Lead",
    image: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairCurly&accessoriesType=Blank&hairColor=Brown&facialHairType=Blank&clotheType=BlazerShirt&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Light",
    longitude: "4.9041",
    latitude: "52.3676",
    location: "Amsterdam, Netherlands",
    website: "https://lisavdberg.dev",
    linkedin: "https://linkedin.com/in/lisavandenberg"
  }
];

export function getDemoProfilesCsv(): string {
  // Use the correct order as specified: name,title,image,longitude,latitude,location,website,linkedin
  const orderedFields = ['name', 'title', 'image', 'longitude', 'latitude', 'location', 'website', 'linkedin'];
  
  const rows = demoProfiles.map(profile => 
    orderedFields.map(field => profile[field as keyof CommunityMember] || '').join(',')
  );
  
  return [orderedFields.join(','), ...rows].join('\n');
}