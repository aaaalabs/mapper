import { supabase } from '../lib/supabase';
import { trackErrorWithContext, ErrorSeverity } from './errorTracking';

interface FeedbackStats {
  totalMaps: number;
  averageRating: number;
  testimonialCount: number;
}

interface SaveRatingParams {
  mapId: string;
  rating: number;
  session_id?: string | null;
  context?: 'download' | 'share';
}

interface UpdateFeedbackParams {
  mapId: string;
  feedback?: string;
  canFeature?: boolean;
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  try {
    // Get total maps
    const { count: totalMaps } = await supabase
      .from('maps')
      .select('*', { count: 'exact', head: true });

    // Get average rating
    const { data: ratingData } = await supabase
      .from('map_feedback')
      .select('rating');
    
    const ratings = ratingData?.map(d => d.rating) || [];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;

    // Get testimonial count
    const { count: testimonialCount } = await supabase
      .from('map_feedback')
      .select('*', { count: 'exact', head: true })
      .not('feedback', 'is', null)
      .eq('can_feature', true);

    return {
      totalMaps: totalMaps || 0,
      averageRating: Number(averageRating.toFixed(1)),
      testimonialCount: testimonialCount || 0
    };
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    trackErrorWithContext(
      error instanceof Error ? error : new Error('Failed to get feedback stats'),
      {
        severity: ErrorSeverity.HIGH,
        category: 'FEEDBACK',
        subcategory: 'VALIDATION',
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    );
    return {
      totalMaps: 0,
      averageRating: 0,
      testimonialCount: 0
    };
  }
}

export async function getRandomTestimonial(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('map_feedback')
      .select('feedback')
      .not('feedback', 'is', null)
      .eq('can_feature', true)
      .order('created_at', { ascending: false })
      .limit(1);

    return data?.[0]?.feedback || null;
  } catch (error) {
    console.error('Error getting testimonial:', error);
    trackErrorWithContext(
      error instanceof Error ? error : new Error('Failed to get testimonial'),
      {
        severity: ErrorSeverity.HIGH,
        category: 'FEEDBACK',
        subcategory: 'VALIDATION',
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    );
    return null;
  }
}

export async function saveInitialRating({ mapId, rating, session_id, context }: SaveRatingParams): Promise<void> {
  try {
    await supabase
      .from('map_feedback')
      .insert({
        map_id: mapId,
        rating,
        session_id,
        context
      });
  } catch (error) {
    console.error('Error saving rating:', error);
    trackErrorWithContext(
      error instanceof Error ? error : new Error('Failed to save rating'),
      {
        severity: ErrorSeverity.HIGH,
        category: 'FEEDBACK',
        subcategory: 'SUBMIT',
        metadata: {
          mapId,
          rating,
          context
        }
      }
    );
  }
}

export async function updateWithDetailedFeedback({ mapId, feedback, canFeature }: UpdateFeedbackParams): Promise<void> {
  try {
    await supabase
      .from('map_feedback')
      .update({
        feedback,
        can_feature: canFeature
      })
      .eq('map_id', mapId);
  } catch (error) {
    console.error('Error updating feedback:', error);
    trackErrorWithContext(
      error instanceof Error ? error : new Error('Failed to update feedback'),
      {
        severity: ErrorSeverity.HIGH,
        category: 'FEEDBACK',
        subcategory: 'SUBMIT',
        metadata: {
          mapId,
          hasFeedback: Boolean(feedback),
          canFeature
        }
      }
    );
  }
}