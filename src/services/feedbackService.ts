import { supabase } from '../lib/supabase';
import { trackErrorWithContext, ErrorSeverity, ErrorCategory } from './analytics';
import { trackEvent, ANALYTICS_EVENTS } from './analytics';

export interface InitialRating {
  mapId: string;
  rating: number;
  session_id?: string | undefined;
}

export interface DetailedFeedback {
  feedbackId: string;
  feedback?: string;
  painPoint?: string;
  organization?: string;
  email?: string;
  canFeature?: boolean;
  session_id?: string | undefined;
}

export interface FeedbackMetadata {
  email?: string | null;
  useCase?: string | null;
  painPoint?: string | null;
  canFeature?: boolean;
  organization?: string | null;
  initial_submission?: string;
  rating_context?: string;
  last_updated?: string;
}

export const saveInitialRating = async ({ mapId, rating, session_id }: InitialRating) => {
  try {
    const { data, error } = await supabase
      .from('map_feedback')
      .insert({
        map_id: mapId,
        rating,
        session_id,
        status: 'pending',
        metadata: {
          initial_submission: new Date().toISOString(),
          rating_context: 'initial'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      trackErrorWithContext(new Error(`Failed to save initial rating: ${error.message}`), {
        category: ErrorCategory.FEEDBACK,
        subcategory: 'INITIAL_RATING',
        severity: ErrorSeverity.HIGH,
        metadata: {
          mapId,
          rating,
          session_id,
          error: error.message
        }
      });

      await trackEvent({
        event_type: ANALYTICS_EVENTS.FEEDBACK.INITIAL,
        event_data: {
          error: error.message,
          mapId,
          rating
        }
      });

      throw error;
    }

    await trackEvent({
      event_type: ANALYTICS_EVENTS.FEEDBACK.INITIAL,
      event_data: {
        mapId,
        rating,
        feedback_id: data.id
      }
    });

    return data;
  } catch (error) {
    console.error('Error saving initial rating:', error);
    trackErrorWithContext(error instanceof Error ? error : new Error('Failed to save initial rating'), {
      category: ErrorCategory.FEEDBACK,
      subcategory: 'INITIAL_RATING',
      severity: ErrorSeverity.HIGH,
      metadata: {
        mapId,
        rating,
        session_id,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
};

export const updateWithDetailedFeedback = async ({
  feedbackId,
  feedback,
  painPoint,
  organization,
  email,
  canFeature,
  session_id
}: DetailedFeedback) => {
  try {
    const { data, error } = await supabase
      .from('map_feedback')
      .update({
        metadata: {
          email,
          painPoint,
          organization,
          canFeature,
          last_updated: new Date().toISOString()
        },
        session_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) {
      trackErrorWithContext(new Error(`Failed to update feedback: ${error.message}`), {
        category: ErrorCategory.FEEDBACK,
        subcategory: 'DETAILED_FEEDBACK',
        severity: ErrorSeverity.HIGH,
        metadata: {
          feedbackId,
          session_id,
          error: error.message
        }
      });

      await trackEvent({
        event_type: ANALYTICS_EVENTS.FEEDBACK.COMMENT,
        event_data: {
          error: error.message,
          feedbackId,
          has_email: !!email,
          has_pain_point: !!painPoint,
          has_organization: !!organization,
          can_feature: canFeature
        }
      });

      throw error;
    }

    await trackEvent({
      event_type: ANALYTICS_EVENTS.FEEDBACK.COMMENT,
      event_data: {
        feedbackId,
        has_email: !!email,
        has_pain_point: !!painPoint,
        has_organization: !!organization,
        can_feature: canFeature
      }
    });

    return data;
  } catch (error) {
    console.error('Error updating feedback:', error);
    trackErrorWithContext(error instanceof Error ? error : new Error('Failed to update feedback'), {
      category: ErrorCategory.FEEDBACK,
      subcategory: 'DETAILED_FEEDBACK',
      severity: ErrorSeverity.HIGH,
      metadata: {
        feedbackId,
        session_id,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
};