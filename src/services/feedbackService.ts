import { supabase } from '../lib/supabase';
import { trackEvent, trackError, ERROR_CATEGORY } from './analytics';
import { ANALYTICS_EVENTS } from './analytics';
import type { FeedbackData } from '../types/feedback';
import type { Database } from '../types/supabase';

type FeedbackRow = Database['public']['Tables']['map_feedback']['Row'];
type FeedbackInsert = Database['public']['Tables']['map_feedback']['Insert'];

interface FeedbackStats {
  totalMaps: number;
  averageRating: number;
  testimonialCount: number;
}

interface SaveRatingParams {
  map_id: string;
  rating: number;
  session_id?: string | null;
  context?: 'download' | 'share';
}

interface UpdateFeedbackParams {
  map_id: string;
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
      .eq('status', 'featured');

    return {
      totalMaps: totalMaps || 0,
      averageRating: Number(averageRating.toFixed(1)),
      testimonialCount: testimonialCount || 0
    };
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to get feedback stats'), {
      category: ERROR_CATEGORY.FEEDBACK,
      severity: 'medium',
      componentName: 'FeedbackService'
    });
    return { totalMaps: 0, averageRating: 0, testimonialCount: 0 };
  }
}

export async function getRandomTestimonial(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('map_feedback')
      .select('metadata')
      .eq('status', 'featured')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.metadata?.useCase || null;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to get testimonial'), {
      category: ERROR_CATEGORY.FEEDBACK,
      severity: 'low',
      componentName: 'FeedbackService'
    });
    return null;
  }
}

export async function saveInitialRating({ map_id, rating, session_id, context }: SaveRatingParams): Promise<void> {
  try {
    const feedbackData: FeedbackInsert = {
      map_id,
      rating,
      feedback_type: rating >= 4 ? 'positive' : rating >= 2 ? 'neutral' : 'negative',
      metadata: { email: null },
      session_id,
      status: 'pending'
    };

    await supabase.from('map_feedback').insert(feedbackData);
    await trackEvent(ANALYTICS_EVENTS.FEEDBACK.SUBMITTED, { rating, context });
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to save rating'), {
      category: ERROR_CATEGORY.FEEDBACK,
      severity: 'medium',
      componentName: 'FeedbackService'
    });
  }
}

export async function updateWithDetailedFeedback({ map_id, feedback, canFeature }: UpdateFeedbackParams): Promise<void> {
  try {
    const updateData: Partial<FeedbackRow> = {
      metadata: { email: null, useCase: feedback },
      status: canFeature ? 'featured' : 'pending'
    };

    await supabase
      .from('map_feedback')
      .update(updateData)
      .eq('map_id', map_id);
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to update feedback'), {
      category: ERROR_CATEGORY.FEEDBACK,
      severity: 'medium',
      componentName: 'FeedbackService'
    });
  }
}

export async function submitFeedback(feedback: FeedbackData): Promise<void> {
  try {
    const feedbackData: FeedbackInsert = {
      map_id: feedback.id,
      rating: feedback.rating || 0,
      feedback_type: feedback.feedback_type,
      metadata: {
        email: feedback.metadata.email,
        useCase: feedback.content || null
      },
      status: feedback.status,
      session_id: localStorage.getItem('session_id')
    };

    const { error } = await supabase.from('map_feedback').insert(feedbackData);

    if (error) {
      throw error;
    }

    await trackEvent(ANALYTICS_EVENTS.FEEDBACK.SUBMITTED, {
      rating: feedback.rating,
      type: feedback.feedback_type
    });
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to submit feedback'), {
      category: ERROR_CATEGORY.FEEDBACK,
      severity: 'medium',
      componentName: 'FeedbackService'
    });
  }
}