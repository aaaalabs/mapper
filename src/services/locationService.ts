import { supabase } from '../lib/supabase';
import { trackError, ERROR_CATEGORY } from './analytics';

export async function getLocationFromIP(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_client_location');
    
    if (error) {
      await trackError(error, {
        category: ERROR_CATEGORY.ANALYTICS,
        severity: 'low',
        metadata: {
          message: error.message,
          code: error.code
        }
      });
      return null;
    }

    const { city, country, region } = data || {};
    
    // Format location string based on available data
    if (city && country) {
      return `${city}, ${country}`;
    } else if (region && country) {
      return `${region}, ${country}`;
    } else if (country) {
      return country;
    }

    return null;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to get location'), {
      category: ERROR_CATEGORY.ANALYTICS,
      severity: 'low',
      metadata: {
        message: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : 'Unknown'
      }
    });
    return null;
  }
}
