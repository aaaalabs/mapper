export interface CommunityMember {
  name: string;
  title?: string;
  image?: string;
  longitude: string;
  latitude: string;
  location: string;
  website?: string;
  linkedin?: string;
  updated_at?: string;
}

export interface MapMarker {
  id: string;
  position: [number, number];
  member: CommunityMember;
}