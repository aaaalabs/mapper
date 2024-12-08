export interface CommunityMember {
  name: string;
  location: string;
  latitude: string;
  longitude: string;
  role?: string;
  profileImage?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
  };
}

export interface MapMarker {
  id: string;
  position: [number, number];
  member: CommunityMember;
}