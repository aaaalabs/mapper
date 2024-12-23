import { supabase } from '../lib/supabase';
import { trackEvent, trackError, ERROR_CATEGORY, getSessionId } from './analytics';
import { ANALYTICS_EVENTS } from './analytics';
import type { FeedbackData, FeedbackMetadata } from '../types/feedback';
import type { Database } from '../types/supabase';

type FeedbackInsert = Database['public']['Tables']['map_feedback']['Insert'];
type FeedbackUpdate = Database['public']['Tables']['map_feedback']['Update'];

interface FeedbackStats {
  totalMaps: number;
  averageRating: number;
  testimonialCount: number;
}

interface SaveRatingParams {
  map_id: string;  // UUID
  rating: number;
  session_id?: string | null;  // UUID
  context?: 'download' | 'share';
}

interface UpdateFeedbackParams {
  map_id: string;  // UUID
  feedback?: string;
  canFeature?: boolean;
  email?: string | null;
  company?: string | null;
  industry?: string | null;
  position?: string | null;
  size?: string | null;
  location?: string | null;
}

const DEFAULT_METADATA: FeedbackMetadata = {
  email: null,
  useCase: null,
  company: null,
  position: null,
  industry: null,
  size: null,
  location: null,
  source: null,
  last_updated: new Date().toISOString()
};

async function ensureSession(session_id: string | null): Promise<string | null> {
  if (!session_id) return null;

  try {
    // Check if session exists
    const { data: existingSession, error: checkError } = await supabase
      .from('map_sessions')
      .select('id, status')
      .eq('id', session_id)
      .maybeSingle();

    if (checkError) throw checkError;

    // If session exists and is active, return it
    if (existingSession?.status === 'active') {
      return session_id;
    }

    // If session doesn't exist or is not active, create a new one
    const { data: newSession, error: insertError } = await supabase
      .from('map_sessions')
      .insert({
        id: session_id,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return newSession.id;
  } catch (error) {
    console.error('Failed to ensure session:', error);
    return null;
  }
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  try {
    // Get total maps
    const { count: totalMaps, error: totalMapsError } = await supabase
      .from('maps')
      .select('*', { count: 'exact', head: true });

    if (totalMapsError) {
      throw totalMapsError;
    }

    // Get average rating
    const { data: ratingData, error: ratingDataError } = await supabase
      .from('map_feedback')
      .select('rating');

    if (ratingDataError) {
      throw ratingDataError;
    }
    
    const ratings = ratingData?.map(d => d.rating) || [];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;

    // Get testimonial count
    const { count: testimonialCount, error: testimonialCountError } = await supabase
      .from('map_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'featured');

    if (testimonialCountError) {
      throw testimonialCountError;
    }

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
    const { data, error } = await supabase
      .from('map_feedback')
      .select('metadata')
      .eq('status', 'featured')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

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
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Ensure session exists
    const validatedSessionId = await ensureSession(session_id || getSessionId());

    // First check if feedback exists
    const { data: existingFeedback, error: existingError } = await supabase
      .from('map_feedback')
      .select('id, metadata')
      .eq('map_id', map_id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingFeedback?.id) {
      // Update existing feedback
      const { error: updateError } = await supabase
        .from('map_feedback')
        .update({
          rating,
          feedback_type: rating >= 4 ? 'positive' : rating >= 2 ? 'neutral' : 'negative',
          metadata: {
            ...DEFAULT_METADATA,
            ...existingFeedback.metadata
          },
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeedback.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new feedback
      const { error: insertError } = await supabase
        .from('map_feedback')
        .insert({
          map_id,
          rating,
          feedback_type: rating >= 4 ? 'positive' : rating >= 2 ? 'neutral' : 'negative',
          metadata: DEFAULT_METADATA,
          session_id: validatedSessionId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        throw insertError;
      }
    }

    await trackEvent(ANALYTICS_EVENTS.FEEDBACK.SUBMITTED, { rating, context });
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to save rating'), {
      category: ERROR_CATEGORY.FEEDBACK,
      severity: 'medium',
      componentName: 'FeedbackService',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        map_id,
        rating
      }
    });
    throw error; // Re-throw to handle in UI
  }
}

export async function updateWithDetailedFeedback({ 
  map_id, 
  feedback, 
  canFeature,
  email,
  company,
  industry,
  position,
  size,
  location
}: UpdateFeedbackParams): Promise<void> {
  try {
    // First check if feedback exists
    const { data: existingFeedback, error: existingFeedbackError } = await supabase
      .from('map_feedback')
      .select('metadata')
      .eq('map_id', map_id)
      .maybeSingle();

    if (existingFeedbackError) {
      throw existingFeedbackError;
    }

    const updateData: FeedbackUpdate = {
      metadata: {
        ...DEFAULT_METADATA,
        ...(existingFeedback?.metadata || {}),
        email: email ?? existingFeedback?.metadata?.email ?? null,
        useCase: feedback || null,
        company: company ?? existingFeedback?.metadata?.company ?? null,
        industry: industry ?? existingFeedback?.metadata?.industry ?? null,
        position: position ?? existingFeedback?.metadata?.position ?? null,
        size: size ?? existingFeedback?.metadata?.size ?? null,
        location: location ?? existingFeedback?.metadata?.location ?? null,
        last_updated: new Date().toISOString()
      },
      status: canFeature ? 'featured' : 'pending',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('map_feedback')
      .update(updateData)
      .eq('map_id', map_id);

    if (error) {
      throw error;
    }
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to update feedback'), {
      category: ERROR_CATEGORY.FEEDBACK,
      severity: 'medium',
      componentName: 'FeedbackService',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        map_id
      }
    });
    throw error; // Re-throw to handle in UI
  }
}

export async function submitFeedback(feedback: FeedbackData): Promise<void> {
  try {
    if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // First check if feedback exists
    const { data: existingFeedback, error: existingError } = await supabase
      .from('map_feedback')
      .select('id, metadata')
      .eq('map_id', feedback.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const metadata = {
      ...DEFAULT_METADATA,
      ...(existingFeedback?.metadata || {}),
      email: feedback.metadata.email,
      useCase: feedback.content || null,
      company: feedback.metadata.company || null,
      industry: feedback.metadata.industry || null,
      position: feedback.metadata.position || null,
      size: feedback.metadata.size || null,
      location: feedback.metadata.location || null,
      last_updated: new Date().toISOString()
    };

    if (existingFeedback?.id) {
      // Update existing feedback
      const { error: updateError } = await supabase
        .from('map_feedback')
        .update({
          rating: feedback.rating,
          feedback_type: feedback.feedback_type,
          metadata,
          status: feedback.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeedback.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new feedback
      const validatedSessionId = await ensureSession(getSessionId());
      const { error: insertError } = await supabase
        .from('map_feedback')
        .insert({
          map_id: feedback.id,
          rating: feedback.rating,
          feedback_type: feedback.feedback_type,
          metadata,
          status: feedback.status,
          session_id: validatedSessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        throw insertError;
      }
    }

    await trackEvent(ANALYTICS_EVENTS.FEEDBACK.SUBMITTED, {
      rating: feedback.rating,
      type: feedback.feedback_type
    });
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to submit feedback'), {
      category: ERROR_CATEGORY.FEEDBACK,
      severity: 'medium',
      componentName: 'FeedbackService',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        feedback_id: feedback.id
      }
    });
    throw error; // Re-throw to handle in UI
  }
}