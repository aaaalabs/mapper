import { supabase } from '../config/supabase';
import { CommunityMember } from '../types';
import { MapSettings, defaultMapSettings } from '../types/mapSettings';
import { trackEvent, ANALYTICS_EVENTS } from './analytics';

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
  try {
    await trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_INTERACTION.VIEW,
      event_data: {
        map_id: mapId,
        total_members: members.length,
        unique_locations: new Set(members.map(m => m.location)).size
      }
    });
  } catch (error) {
    console.error('Failed to track map analytics:', error);
  }
}

export async function trackMapDownload(mapId: string) {
  try {
    await trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_DOWNLOAD.COMPLETED,
      event_data: { map_id: mapId }
    });
  } catch (error) {
    console.error('Failed to track map download:', error);
  }
}

async function trackMapShare(mapId: string) {
  try {
    await trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_SHARING.COMPLETED,
      event_data: { map_id: mapId }
    });
  } catch (error) {
    console.error('Failed to track map share:', error);
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
  await trackEvent({
    event_name: ANALYTICS_EVENTS.MAP_CREATION.COMPLETE,
    event_data: {
      total_members: members.length,
      unique_locations: new Set(members.map(m => m.location)).size,
    }
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

export async function updateMapName(mapId: string, name: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('maps')
      .update({ name })
      .eq('id', mapId);

    if (error) {
      console.error('Supabase error updating map name:', error);
      throw new MapError(`Failed to update map name: ${error.message}`, error.code);
    }
  } catch (error) {
    console.error('Error updating map name:', error);
    throw error;
  }
}

export async function updateMapNameVisibility(mapId: string, showName: boolean): Promise<void> {
  try {
    const { data: map } = await supabase
      .from('maps')
      .select('settings')
      .eq('id', mapId)
      .single();

    if (!map) {
      throw new MapError('Map not found');
    }

    const settings = map.settings || defaultMapSettings;
    const updatedSettings = {
      ...settings,
      customization: {
        ...settings.customization,
        showName
      }
    };

    await updateMapSettings(mapId, updatedSettings);
  } catch (error) {
    console.error('Error updating map name visibility:', error);
    throw error;
  }
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

export async function migrateShowNameToSettings(): Promise<void> {
  // First, get all maps that have show_name column
  const { data: maps, error: fetchError } = await supabase
    .from('maps')
    .select('id, settings, show_name');

  if (fetchError) {
    throw new Error(`Failed to fetch maps: ${fetchError.message}`);
  }

  // Update each map to move show_name into settings
  for (const map of maps) {
    const settings = {
      ...map.settings,
      customization: {
        ...map.settings?.customization,
        showName: map.show_name ?? true
      }
    };

    const { error: updateError } = await supabase
      .from('maps')
      .update({ settings })
      .eq('id', map.id);

    if (updateError) {
      console.error(`Failed to update map ${map.id}:`, updateError);
    }
  }
}