import { supabase } from '@/lib/supabase';
import {
  FeedbackMetadata,
  FeedbackType,
  FeedbackStatus,
  FeedbackError,
  FeedbackData,
  FeedbackStats,
  MetadataUpdate,
  AnalyticsEvent,
  validateRating,
  validateMetadata,
  validateFeedbackType,
  validateFeedbackStatus
} from '@/types/feedback';

// Event types for feedback tracking
const FEEDBACK_EVENTS = {
  SUBMITTED: 'feedback_submitted',
  UPDATED: 'feedback_updated',
  DELETED: 'feedback_deleted'
} as const;

/**
 * Merges existing metadata with new updates, preserving non-null values
 */
function mergeMetadata(existing: FeedbackMetadata, updates: MetadataUpdate): FeedbackMetadata {
  return {
    ...existing,
    ...updates,
    last_updated: new Date().toISOString()
  };
}

/**
 * Updates feedback with detailed metadata
 */
export async function updateWithDetailedFeedback(
  id: string,
  updates: MetadataUpdate
): Promise<void> {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('map_feedback')
      .select('metadata')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new FeedbackError(
        'Failed to fetch existing feedback',
        'DATABASE',
        { error: fetchError }
      );
    }

    if (!existing) {
      throw new FeedbackError(
        'Feedback not found',
        'DATABASE'
      );
    }

    const updatedMetadata = mergeMetadata(existing.metadata, updates);
    validateMetadata(updatedMetadata);

    const { error: updateError } = await supabase
      .from('map_feedback')
      .update({ metadata: updatedMetadata })
      .eq('id', id);

    if (updateError) {
      throw new FeedbackError(
        'Failed to update feedback',
        'DATABASE',
        { error: updateError }
      );
    }
  } catch (err) {
    if (err instanceof FeedbackError) {
      throw err;
    }
    throw new FeedbackError(
      'Failed to update feedback',
      'DATABASE',
      { error: err }
    );
  }
}

/**
 * Submits new feedback
 */
export async function submitFeedback(
  map_id: string,
  feedback_type: FeedbackType,
  rating: number,
  metadata: MetadataUpdate
): Promise<string> {
  try {
    validateFeedbackType(feedback_type);
    validateRating(rating);
    validateMetadata(metadata);

    const feedbackMetadata: FeedbackMetadata = {
      email: metadata.email ?? null,
      name: metadata.name ?? null,
      can_feature: metadata.can_feature ?? false,
      testimonial: metadata.testimonial ?? null,
      feedback_text: metadata.feedback_text ?? null,
      context: metadata.context ?? null,
      location: metadata.location ?? null,
      source: metadata.source ?? null,
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('map_feedback')
      .insert({
        map_id,
        feedback_type,
        rating,
        status: 'pending' as const,
        metadata: feedbackMetadata
      })
      .select('id')
      .single();

    if (error) {
      throw new FeedbackError(
        'Failed to submit feedback',
        'DATABASE',
        { error }
      );
    }

    if (!data?.id) {
      throw new FeedbackError(
        'Failed to get feedback ID',
        'DATABASE'
      );
    }

    return data.id;
  } catch (err) {
    if (err instanceof FeedbackError) {
      throw err;
    }
    throw new FeedbackError(
      'Failed to submit feedback',
      'DATABASE',
      { error: err }
    );
  }
}

/**
 * Saves the initial rating feedback without detailed metadata
 */
export async function saveInitialRating(
  map_id: string,
  rating: number,
  session_id: string
): Promise<string> {
  try {
    validateRating(rating);

    const { data, error } = await supabase
      .from('map_feedback')
      .insert({
        map_id,
        rating,
        feedback_type: 'initial' as const,
        status: 'pending' as const,
        session_id,
        metadata: {
          email: null,
          name: null,
          can_feature: false,
          testimonial: null,
          feedback_text: null,
          context: null,
          location: null,
          source: null,
          last_updated: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (error) {
      throw new FeedbackError(
        'Failed to save initial rating',
        'DATABASE',
        { error }
      );
    }

    if (!data?.id) {
      throw new FeedbackError(
        'Failed to get feedback ID',
        'DATABASE'
      );
    }

    // Track the feedback event
    const analyticsEvent: AnalyticsEvent = {
      session_id,
      event_name: FEEDBACK_EVENTS.SUBMITTED,
      event_data: {
        feedback_id: data.id,
        rating,
        map_id
      }
    };

    const { error: analyticsError } = await supabase
      .from('map_analytics_events')
      .insert(analyticsEvent);

    if (analyticsError) {
      console.error('Failed to track feedback event:', analyticsError);
    }

    return data.id;
  } catch (err) {
    if (err instanceof FeedbackError) {
      throw err;
    }
    throw new FeedbackError(
      'Failed to save initial rating',
      'DATABASE',
      { error: err }
    );
  }
}

/**
 * Retrieves feedback statistics from the database
 */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  try {
    const { data, error } = await supabase
      .from('map_feedback')
      .select('rating, feedback_type, status');

    if (error) {
      throw new FeedbackError(
        'Failed to fetch feedback stats',
        'DATABASE',
        { error }
      );
    }

    const stats: FeedbackStats = {
      totalCount: data.length,
      averageRating: 0,
      typeDistribution: {},
      ratingDistribution: {},
      statusDistribution: {}
    };

    if (data.length > 0) {
      // Calculate average rating
      const totalRating = data.reduce((sum, item) => sum + (item.rating || 0), 0);
      stats.averageRating = totalRating / data.length;

      // Calculate distributions
      data.forEach(item => {
        // Type distribution
        if (item.feedback_type) {
          stats.typeDistribution[item.feedback_type] = (stats.typeDistribution[item.feedback_type] || 0) + 1;
        }

        // Rating distribution
        if (item.rating) {
          stats.ratingDistribution[item.rating] = (stats.ratingDistribution[item.rating] || 0) + 1;
        }

        // Status distribution
        if (item.status) {
          stats.statusDistribution[item.status] = (stats.statusDistribution[item.status] || 0) + 1;
        }
      });
    }

    return stats;
  } catch (err) {
    if (err instanceof FeedbackError) {
      throw err;
    }
    throw new FeedbackError(
      'Failed to get feedback stats',
      'DATABASE',
      { error: err }
    );
  }
}

/**
 * Retrieves a random approved testimonial from feedback
 */
export async function getRandomTestimonial(): Promise<{ feedback_text: string; rating: number; } | null> {
  try {
    const { data, error } = await supabase
      .from('map_feedback')
      .select('metadata, rating')
      .eq('status', 'approved')
      .not('metadata->feedback_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new FeedbackError(
        'Failed to fetch testimonials',
        'DATABASE',
        { error }
      );
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Filter testimonials with valid feedback_text and rating
    const validTestimonials = data.filter(item => 
      item.metadata?.feedback_text && 
      typeof item.rating === 'number'
    );

    if (validTestimonials.length === 0) {
      return null;
    }

    // Select a random testimonial
    const randomIndex = Math.floor(Math.random() * validTestimonials.length);
    const selected = validTestimonials[randomIndex];

    return {
      feedback_text: selected.metadata.feedback_text!,
      rating: selected.rating
    };
  } catch (err) {
    if (err instanceof FeedbackError) {
      throw err;
    }
    throw new FeedbackError(
      'Failed to get random testimonial',
      'DATABASE',
      { error: err }
    );
  }
}