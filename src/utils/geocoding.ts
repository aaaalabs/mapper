import { CommunityMember } from '../types';
import { geocodeLocation } from '../services/geocodingService';

export async function enrichMemberWithGeocoding(member: CommunityMember): Promise<CommunityMember> {
  // Skip if no location or already has valid coordinates
  if (!member.location || 
      (member.latitude && member.longitude && 
       !isNaN(parseFloat(member.latitude)) && 
       !isNaN(parseFloat(member.longitude)))) {
    return member;
  }

  try {
    console.log(`Geocoding location for member ${member.name}: ${member.location}`);
    const geocodeData = await geocodeLocation(member.location);
    
    // Validate the geocoding response
    if (!geocodeData.latitude || !geocodeData.longitude || 
        isNaN(parseFloat(geocodeData.latitude)) || 
        isNaN(parseFloat(geocodeData.longitude))) {
      console.error(`Invalid geocoding response for ${member.name}:`, geocodeData);
      return member;
    }

    console.log(`Successfully geocoded ${member.name}'s location:`, geocodeData);
    return {
      ...member,
      location: geocodeData.location,
      latitude: geocodeData.latitude,
      longitude: geocodeData.longitude,
    };
  } catch (error) {
    console.error(`Failed to geocode member ${member.name}:`, error);
    return member;
  }
}

export async function enrichMembersWithGeocoding(members: CommunityMember[]): Promise<CommunityMember[]> {
  const enrichedMembers: CommunityMember[] = [];
  
  for (const member of members) {
    // Process one member at a time
    const enrichedMember = await enrichMemberWithGeocoding(member);
    
    // Only include members with valid coordinates
    if (enrichedMember.latitude && 
        enrichedMember.longitude && 
        !isNaN(parseFloat(enrichedMember.latitude)) && 
        !isNaN(parseFloat(enrichedMember.longitude))) {
      enrichedMembers.push(enrichedMember);
    } else {
      console.warn(`Skipping member ${member.name} due to missing or invalid coordinates`);
    }
  }
  
  return enrichedMembers;
}
