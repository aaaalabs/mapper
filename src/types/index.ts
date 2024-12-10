export interface CommunityMember {
  id: string;
  name?: string;
  image?: string;
  latitude: number;
  longitude: number;
  location?: string;
  description?: string;
  website?: string;
  title?: string;
  linkedin?: string;
}

export interface MapMarker {
  id: string;
  position: [number, number];
  member: CommunityMember;
}

export * from './mapSettings';