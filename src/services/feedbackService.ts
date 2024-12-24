import { supabase } from '@/lib/supabase';
import {
  FeedbackMetadata,
  FeedbackType,
  FeedbackStats,
  FeedbackError,
  validateRating,
  validateMetadata,
  MetadataUpdate,
  FeedbackData
} from '@/types/feedback';
import { sessionService } from '@/services/sessionService';

/**
 * Updates feedback with detailed metadata
 */
export async function updateWithDetailedFeedback(
  id: string,
  updates: MetadataUpdate
): Promise<void> {
  try {
    console.log('Updating feedback with details:', { id, updates });

    // Validate the ID
    if (!id || typeof id !== 'string') {
      throw new FeedbackError('Invalid feedback ID', 'VALIDATION');
    }

    // Fetch existing feedback
    const { data: existing, error: fetchError } = await supabase
      .from('map_feedback')
      .select('*')  // Select all fields to see complete record
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch existing feedback:', fetchError);
      throw new FeedbackError(
        'Failed to fetch existing feedback',
        'DATABASE',
        { error: fetchError }
      );
    }

    if (!existing) {
      console.error('Feedback not found for ID:', id);
      throw new FeedbackError(
        'Feedback not found',
        'DATABASE'
      );
    }

    console.log('Existing feedback data:', existing);

    // Create new metadata object with ALL fields from existing
    const updatedMetadata: FeedbackMetadata = {
      ...existing.metadata, // Preserve all existing fields
      email: updates.email ?? existing.metadata.email ?? null,
      name: updates.name ?? existing.metadata.name ?? null,
      can_feature: updates.can_feature ?? existing.metadata.can_feature ?? false,
      testimonial: updates.testimonial ?? existing.metadata.testimonial ?? null,
      feedback_text: updates.feedback_text ?? existing.metadata.feedback_text ?? null,
      context: updates.context ?? existing.metadata.context ?? null,
      location: existing.metadata.location ?? null,
      source: existing.metadata.source ?? null,
      last_updated: new Date().toISOString()
    };

    console.log('Updated metadata:', updatedMetadata);

    // Validate the metadata
    validateMetadata(updatedMetadata);

    const updateData: Partial<FeedbackData> = {
      metadata: updatedMetadata,
      updated_at: new Date().toISOString(),
      status: updates.testimonial && updates.can_feature ? 'pending' : existing.status // Preserve existing status if not changing
    };

    console.log('Sending update with data:', updateData);

    // Update the feedback with session_id check
    const query = supabase
      .from('map_feedback')
      .update(updateData)
      .eq('id', id);

    // Only add session_id check if it exists
    if (existing.session_id) {
      query.eq('session_id', existing.session_id);
    }

    const { data: updateResult, error: updateError } = await query.select('*');

    if (updateError) {
      console.error('Failed to update feedback:', updateError);
      throw new FeedbackError(
        'Failed to update feedback',
        'DATABASE',
        { error: updateError }
      );
    }

    if (!updateResult?.length) {
      console.error('No rows updated. Session mismatch?', {
        feedbackId: id,
        sessionId: existing.session_id
      });
      throw new FeedbackError(
        'Unable to update feedback - session mismatch',
        'DATABASE'
      );
    }

    console.log('Update result:', updateResult);
    console.log('Successfully updated feedback:', id);
  } catch (err) {
    console.error('Error in updateWithDetailedFeedback:', err);
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
 * Saves the initial rating feedback without detailed metadata
 */
export async function saveInitialRating(
  map_id: string,
  rating: number,
  session_id: string | null,
  context?: 'download' | 'share'
): Promise<string> {
  try {
    // Validate inputs
    validateRating(rating);
    if (!map_id) {
      throw new FeedbackError('Map ID is required', 'VALIDATION');
    }

    // If no session_id provided, create a new session
    let validSessionId = session_id;
    if (!validSessionId) {
      try {
        const newSession = await sessionService.createSession({
          source: typeof window !== 'undefined' ? window.location.pathname : null,
          context: context || null
        });
        validSessionId = newSession.id;
      } catch (sessionError) {
        console.error('Failed to create session:', sessionError);
        // Continue without session if creation fails
        validSessionId = null;
      }
    } else {
      // Verify the session exists
      try {
        const existingSession = await sessionService.getSession(validSessionId);
        if (!existingSession) {
          // Session doesn't exist, create a new one
          const newSession = await sessionService.createSession({
            source: typeof window !== 'undefined' ? window.location.pathname : null,
            context: context || null
          });
          validSessionId = newSession.id;
        }
      } catch (sessionError) {
        console.error('Failed to verify session:', sessionError);
        // Continue without session if verification fails
        validSessionId = null;
      }
    }

    const feedback_type: FeedbackType = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
    const initialMetadata: FeedbackMetadata = {
      email: null,
      name: null,
      can_feature: false,
      testimonial: null,
      feedback_text: null,
      context: context || null,
      location: Intl.DateTimeFormat().resolvedOptions().timeZone,
      source: typeof window !== 'undefined' ? window.location.pathname : null,
      last_updated: new Date().toISOString()
    };

    // Try to get existing feedback first
    let existingFeedback = null;
    if (validSessionId) {
      const { data } = await supabase
        .from('map_feedback')
        .select('id')
        .eq('map_id', map_id)
        .eq('session_id', validSessionId)
        .maybeSingle();
      existingFeedback = data;
    }

    // If feedback exists, update it
    if (existingFeedback?.id) {
      console.log('Updating existing feedback:', existingFeedback.id);
      const { error: updateError } = await supabase
        .from('map_feedback')
        .update({
          rating,
          feedback_type,
          metadata: initialMetadata
        })
        .eq('id', existingFeedback.id);

      if (updateError) {
        console.error('Error updating feedback:', updateError);
        throw new FeedbackError(
          'Failed to update existing rating',
          'DATABASE',
          { error: updateError }
        );
      }

      return existingFeedback.id;
    }

    // If no existing feedback, create new
    console.log('Creating new feedback for map:', map_id, 'session:', validSessionId);
    const { data: newFeedback, error: insertError } = await supabase
      .from('map_feedback')
      .insert({
        map_id,
        rating,
        session_id: validSessionId,
        metadata: initialMetadata,
        status: 'pending',
        feedback_type
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      throw new FeedbackError(
        'Failed to save initial rating',
        'DATABASE',
        { error: insertError }
      );
    }

    if (!newFeedback?.id) {
      throw new FeedbackError(
        'Failed to get feedback ID',
        'DATABASE'
      );
    }

    return newFeedback.id;
  } catch (err) {
    console.error('Error in saveInitialRating:', err);
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

    if (!data) {
      throw new FeedbackError(
        'No feedback data found',
        'DATABASE'
      );
    }

    // Calculate statistics
    const totalCount = data.length;
    const totalRating = data.reduce((sum, item) => sum + (item.rating || 0), 0);
    const averageRating = totalCount > 0 ? totalRating / totalCount : 0;

    // Calculate distributions
    const typeDistribution: Record<string, number> = {};
    const ratingDistribution: Record<number, number> = {};
    const statusDistribution: Record<string, number> = {};

    data.forEach(item => {
      // Type distribution
      if (item.feedback_type) {
        typeDistribution[item.feedback_type] = (typeDistribution[item.feedback_type] || 0) + 1;
      }

      // Rating distribution
      if (item.rating) {
        ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1;
      }

      // Status distribution
      if (item.status) {
        statusDistribution[item.status] = (statusDistribution[item.status] || 0) + 1;
      }
    });

    return {
      totalCount,
      averageRating,
      typeDistribution,
      ratingDistribution,
      statusDistribution
    };
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
      .limit(10);

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

    const randomIndex = Math.floor(Math.random() * data.length);
    const testimonial = data[randomIndex];

    if (!testimonial.metadata?.feedback_text) {
      return null;
    }

    return {
      feedback_text: testimonial.metadata.feedback_text,
      rating: testimonial.rating
    };
  } catch (err) {
    console.error('Error fetching testimonial:', err);
    return null;
  }
}