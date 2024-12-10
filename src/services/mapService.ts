import { supabase } from '../config/supabase';
import { CommunityMember } from '../types';
import { MapSettings, defaultMapSettings } from '../types/mapSettings';
import { trackEvent } from './analytics';

export interface SavedMap {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  settings: MapSettings;
  members: CommunityMember[];
  center: number[];
  zoom: number;
}

export interface CreateMapInput {
  name: string;
  settings?: MapSettings;
  members: CommunityMember[];
  center: number[];
  zoom: number;
}

interface MapFeedback {
  map_id: string;
  community_type: string;
  satisfaction_rating: number;
  testimonial?: string;
  can_feature: boolean;
  organization?: string;
  email?: string;
}

interface MapAnalytics {
  map_id: string;
  total_members: number;
  unique_locations: number;
  download_count: number;
  share_count: number;
}

interface MapError extends Error {
  code?: string;
}

class MapError extends Error {
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

async function trackMapShare(mapId: string) {
  const { error } = await supabase.rpc('increment_map_shares', {
    map_id: mapId
  });

  if (error) {
    console.error('Failed to track share:', error);
  }
}

async function submitMapFeedback(feedback: MapFeedback) {
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

async function generateMap(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/generate-map', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate map: ${error.message}`);
    }
    throw new Error('Failed to generate map due to an unknown error.');
  }
}

export async function createMap({ 
  name, 
  settings, 
  members, 
  center, 
  zoom 
}: Omit<CreateMapInput, 'description'>): Promise<SavedMap> {
  const { data: map, error } = await supabase
    .from('maps')
    .insert({
      name,
      settings: settings || defaultMapSettings,
      members,
      center,
      zoom
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create map: ${error.message}`);
  }

  if (!map) {
    throw new MapError('Failed to create map', 'CREATE_FAILED');
  }

  // Track map creation
  trackEvent('map_created', {
    total_members: members.length,
    unique_locations: new Set(members.map(m => m.location)).size,
  });

  return map;
}

export async function getMap(id: string): Promise<SavedMap> {
  const { data: map, error } = await supabase
    .from('maps')
    .select(`
      id,
      created_at,
      user_id,
      name,
      settings,
      members,
      center,
      zoom
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to get map: ${error.message}`);
  }

  if (!map) {
    throw new MapError('Map not found', 'NOT_FOUND');
  }

  return map;
}

export async function updateMapSettings(id: string, settings: MapSettings): Promise<void> {
  const { error } = await supabase
    .from('maps')
    .update({ settings })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update map settings: ${error.message}`);
  }

  trackEvent({
    event_name: 'map_settings_updated',
    event_data: { map_id: id }
  });
}

export async function deleteMap(id: string): Promise<void> {
  const { error } = await supabase
    .from('maps')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete map: ${error.message}`);
  }

  trackEvent({
    event_name: 'map_deleted',
    event_data: { map_id: id }
  });
}