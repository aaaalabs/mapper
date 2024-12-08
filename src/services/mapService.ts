import api from './api';
import { supabase } from '../config/supabase';
import { CommunityMember } from '../types';

export interface SavedMap {
  id: string;
  name: string;
  members: CommunityMember[];
  center: [number, number];
  zoom: number;
  created_at: Date;
  user_id?: string;
}

export interface MapFeedback {
  map_id: string;
  community_type: string;
  satisfaction_rating: number;
  testimonial?: string;
  can_feature: boolean;
  organization?: string;
  email?: string;
}

export interface MapAnalytics {
  map_id: string;
  total_members: number;
  unique_locations: number;
  download_count: number;
  share_count: number;
}

export class MapError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'MapError';
  }
}

async function trackMapAnalytics(mapId: string, members: CommunityMember[]) {
  const uniqueLocations = new Set(
    members.map(m => `${m.latitude},${m.longitude}`)
  ).size;

  const analytics: Omit<MapAnalytics, 'download_count' | 'share_count'> = {
    map_id: mapId,
    total_members: members.length,
    unique_locations: uniqueLocations
  };

  const { error } = await supabase
    .from('map_analytics')
    .insert([analytics]);

  if (error) {
    console.error('Failed to track analytics:', error);
  }
}

export async function trackMapDownload(mapId: string) {
  try {
    const { error } = await supabase.rpc('increment_map_downloads', {
      map_id: mapId
    });

    if (error) {
      console.error('Failed to track download:', error);
      // Don't throw error to avoid interrupting download
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to track download:', error);
    // Don't throw error to avoid interrupting download
    return false;
  }
}

export async function trackMapShare(mapId: string) {
  const { error } = await supabase.rpc('increment_map_shares', {
    map_id: mapId
  });

  if (error) {
    console.error('Failed to track share:', error);
  }
}

export async function submitMapFeedback(feedback: MapFeedback) {
  try {
    const { data, error } = await supabase
      .from('map_feedback')
      .insert([{
        ...feedback,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new MapError(error.message, error.code);
    }

    return data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new MapError('Failed to submit feedback');
  }
}

export async function generateMap(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/generate-map', formData, {
      responseType: 'text',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate map: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while generating the map');
  }
}

export async function saveMap(mapData: Omit<SavedMap, 'id' | 'created_at'>): Promise<SavedMap> {
  try {
    const { data, error } = await supabase
      .from('maps')
      .insert([{
        ...mapData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new MapError(
        error.message,
        error.code
      );
    }

    if (!data) {
      throw new MapError('Failed to save map');
    }

    // Track analytics after successful save
    await trackMapAnalytics(data.id, mapData.members);

    return data;
  } catch (error) {
    if (error instanceof MapError) {
      throw error;
    }
    console.error('Error saving map:', error);
    throw new MapError('An unexpected error occurred while saving the map');
  }
}

export async function getMap(id: string): Promise<SavedMap> {
  if (!id) {
    throw new MapError('Map ID is required');
  }

  try {
    // First try to get the map data
    const { data: mapData, error: mapError } = await supabase
      .from('maps')
      .select(`
        id,
        name,
        members,
        center,
        zoom,
        created_at,
        user_id
      `)
      .eq('id', id)
      .single();

    if (mapError) {
      console.error('Supabase error:', mapError);
      if (mapError.code === 'PGRST116') {
        throw new MapError('Map not found', 'NOT_FOUND');
      }
      throw new MapError(
        mapError.message,
        mapError.code
      );
    }

    if (!mapData) {
      throw new MapError('Map not found', 'NOT_FOUND');
    }

    // Validate the map data structure
    if (!Array.isArray(mapData.members) || !Array.isArray(mapData.center) || typeof mapData.zoom !== 'number') {
      throw new MapError('Invalid map data format');
    }

    return {
      ...mapData,
      created_at: new Date(mapData.created_at)
    };
  } catch (error) {
    if (error instanceof MapError) {
      throw error;
    }
    console.error('Error fetching map:', error);
    throw new MapError('An unexpected error occurred while fetching the map');
  }
}