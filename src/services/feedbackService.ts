import { supabase } from '../config/supabase';
import { findLeadByEmail, associateLeadWithFeedback, trackLeadInteraction, createLead } from './leadService';
import { getSessionId } from './analytics';
import { trackEvent, ANALYTICS_EVENTS } from './analytics';

interface InitialRating {
  mapId: string;
  rating: number;
}

interface DetailedFeedback {
  metadata: {
    feedbackText?: string;
    useCase?: string;
    painPoint?: string;
    organization?: string;
    email?: string;
    canFeature?: boolean;
  };
  feedbackType: 'positive' | 'negative' | 'neutral';
}

export async function saveInitialRating({ mapId, rating }: InitialRating) {
  try {
    const sessionId = await getSessionId();
    
    const newFeedback = {
      map_id: mapId,
      rating,
      feedback_type: rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral',
      metadata: {
        initial_submission: new Date().toISOString(),
        rating_context: 'initial'
      },
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('map_feedback')
      .insert([newFeedback])
      .select('id, map_id, rating, feedback_type, metadata')
      .single();

    if (error) {
      console.error('Supabase error saving initial rating:', error);
      await trackEvent({
        event_name: ANALYTICS_EVENTS.SYSTEM.ERROR,
        event_data: {
          error: error.message,
          code: error.code,
          context: 'save_initial_rating',
          map_id: mapId,
          rating
        }
      });
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    console.error('Error in saveInitialRating:', err);
    throw err;
  }
}

export async function updateWithDetailedFeedback(feedbackId: string, feedback: DetailedFeedback) {
  try {
    // First get the existing feedback to preserve metadata
    const { data: existingFeedback, error: fetchError } = await supabase
      .from('map_feedback')
      .select('metadata')
      .eq('id', feedbackId)
      .single();

    if (fetchError) {
      console.error('Error fetching existing feedback:', fetchError);
      throw new Error(fetchError.message);
    }

    // Clean up metadata values
    const cleanMetadata = {
      ...feedback.metadata,
      feedbackText: feedback.metadata.feedbackText || null,
      useCase: feedback.metadata.useCase || null,
      painPoint: feedback.metadata.painPoint || null,
      organization: feedback.metadata.organization || null,
      email: feedback.metadata.email || null,
      canFeature: feedback.metadata.canFeature || false,
      last_updated: new Date().toISOString()
    };

    // Update the feedback
    const { error: updateError } = await supabase
      .from('map_feedback')
      .update({
        metadata: cleanMetadata,
        feedback_type: feedback.feedbackType,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId);

    if (updateError) {
      console.error('Supabase error updating feedback:', updateError);
      await trackEvent({
        event_name: ANALYTICS_EVENTS.SYSTEM.ERROR,
        event_data: {
          error: updateError.message,
          code: updateError.code,
          context: 'update_detailed_feedback',
          feedback_id: feedbackId
        }
      });
      throw new Error(updateError.message);
    }

    // Then fetch the updated record
    const { data: updatedFeedback, error: finalFetchError } = await supabase
      .from('map_feedback')
      .select('id, map_id, rating, feedback_type, metadata')
      .eq('id', feedbackId)
      .single();

    if (finalFetchError || !updatedFeedback) {
      console.error('Error fetching updated feedback:', finalFetchError);
      throw new Error(finalFetchError?.message || 'Failed to fetch updated feedback');
    }

    // Only try to connect with lead for positive feedback with contact info
    if (feedback.metadata.email && feedback.feedbackType === 'positive') {
      try {
        // First try to find an existing lead
        let lead = await findLeadByEmail(feedback.metadata.email);

        // If no lead exists and we have an organization, create one
        if (!lead && feedback.metadata.organization) {
          lead = await createLead({
            email: feedback.metadata.email,
            name: feedback.metadata.organization,
            lead_type: 'beta_waitlist',
            status: 'pending',
            source: 'feedback',
            event_data: {
              feedback_id: feedbackId,
              feedback_type: feedback.feedbackType,
              can_feature: feedback.metadata.canFeature
            }
          });
        }

        // If we have a lead (existing or new), associate it with the feedback
        if (lead?.id) {
          await associateLeadWithFeedback(lead.id, feedbackId);
          
          // Track the interaction
          await trackLeadInteraction(feedback.metadata.email, 'feedback_submitted', {
            feedback_id: feedbackId,
            feedback_type: feedback.feedbackType,
            can_feature: feedback.metadata.canFeature
          });
        }
      } catch (err) {
        // Log but don't throw - lead association is not critical
        console.warn('Error handling lead association:', err);
      }
    }

    return updatedFeedback;
  } catch (error) {
    console.error('Error in updateWithDetailedFeedback:', error);
    throw error;
  }
}