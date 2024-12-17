import { supabase } from '../lib/supabase';
import { CommunityMember } from '../types';
import { MapSettings, defaultMapSettings } from '../types/mapSettings';
import { trackEvent, ANALYTICS_EVENTS, getSessionId } from './analytics';

export interface SavedMap {
  id: string;
  created_at: string;
  name: string;
  settings: MapSettings;
  members: CommunityMember[];
  center: [number, number];
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
    // Calculate analytics
    const totalMembers = members.length;
    const uniqueLocations = new Set(members.map(m => `${m.latitude},${m.longitude}`)).size;

    // Get existing analytics
    const { data: existingAnalytics, error: fetchError } = await supabase
      .from('map_analytics')
      .select('*')
      .eq('map_id', mapId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching map analytics:', fetchError);
      return;
    }

    // Track analytics event
    await trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_INTERACTION.VIEW,
      event_data: {
        map_id: mapId,
        total_members: totalMembers,
        unique_locations: uniqueLocations,
        is_update: !!existingAnalytics
      }
    });

    // Update or insert analytics record
    const { error: upsertError } = await supabase
      .from('map_analytics')
      .upsert({
        map_id: mapId,
        total_members: totalMembers,
        unique_locations: uniqueLocations,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error updating map analytics:', upsertError);
    }
  } catch (error) {
    console.error('Error in trackMapAnalytics:', error);
  }
}

export async function trackMapDownload(mapId: string) {
  try {
    await trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_DOWNLOAD.COMPLETE,
      event_data: { map_id: mapId },
      session_id: getSessionId()
    });
  } catch (error) {
    console.error('Failed to track map download:', error);
  }
}

export async function trackMapShare(mapId: string) {
  try {
    await trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_SHARING.COMPLETE,
      event_data: { map_id: mapId },
      session_id: getSessionId()
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
  settings = defaultMapSettings, 
  members, 
  center, 
  zoom
}: Omit<CreateMapInput, 'description'>): Promise<SavedMap> {
  // Ensure settings are properly merged with defaults
  const mergedSettings = {
    ...defaultMapSettings,
    ...settings,
    style: {
      ...defaultMapSettings.style,
      ...settings?.style,
    },
    features: {
      ...defaultMapSettings.features,
      ...settings?.features,
    },
    customization: {
      ...defaultMapSettings.customization,
      ...settings?.customization,
    },
  };

  const { data: map, error } = await supabase
    .from('maps')
    .insert({
      name,
      settings: mergedSettings,
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
    throw new MapError('Map creation failed', 'CREATION_FAILED');
  }

  // Track event creation
  await trackEvent({
    event_name: ANALYTICS_EVENTS.MAP_CREATION.CREATED,
    event_data: { map_id: map.id }
  });

  return map;
}

export async function getMap(id: string): Promise<SavedMap> {
  const { data: map, error } = await supabase
    .from('maps')
    .select(`
      id,
      created_at,
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
  try {
    const { error } = await supabase
      .from('maps')
      .update({ settings })
      .eq('id', id);

    if (error) {
      throw new MapError(error.message, error.code);
    }

    await trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_INTERACTION.SETTINGS_UPDATED,
      event_data: { map_id: id }
    });
  } catch (error) {
    console.error('Error updating map settings:', error);
    throw new MapError('Failed to update map settings');
  }
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
  try {
    const { error } = await supabase
      .from('maps')
      .delete()
      .eq('id', id);

    if (error) {
      throw new MapError(error.message, error.code);
    }

    await trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_INTERACTION.DELETE,
      event_data: { map_id: id }
    });
  } catch (error) {
    console.error('Error deleting map:', error);
    throw new MapError('Failed to delete map');
  }
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