import supabase from './supabaseClient';

interface GeocodeResponse {
  location: string;
  longitude: string;
  latitude: string;
}

export async function geocodeLocation(location: string): Promise<GeocodeResponse> {
  try {
    console.log(`Making geocoding request for location: ${location}`);
    
    const response = await fetch(`/api/geocode?location=${encodeURIComponent(location)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status ${response.status} for location: ${location}`);
    }
    
    const data = await response.json();
    console.log(`Received geocoding response for ${location}:`, data);
    
    // Validate the response format
    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid response format for location: ${location}`);
    }
    
    if (!data.location || !data.longitude || !data.latitude) {
      throw new Error(`Missing required fields in response for location: ${location}`);
    }
    
    // Validate coordinates
    const longitude = parseFloat(data.longitude);
    const latitude = parseFloat(data.latitude);
    
    if (isNaN(longitude) || isNaN(latitude)) {
      throw new Error(`Invalid coordinates in response for location: ${location}`);
    }
    
    return {
      location: data.location,
      longitude: data.longitude,
      latitude: data.latitude
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}
