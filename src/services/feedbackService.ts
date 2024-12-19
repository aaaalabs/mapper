import { supabase } from '../config/supabase';
import { findLeadByEmail, associateLeadWithFeedback, trackLeadInteraction } from './leadService';

interface InitialRating {
  mapId: string;
  rating: number;
}

interface DetailedFeedback {
  feedbackText: string;
  useCase?: string;
  painPoint?: string;
  organization?: string;
  email?: string;
  canFeature?: boolean;
}

export async function saveInitialRating({ mapId, rating }: InitialRating) {
  const { data, error } = await supabase
    .from('map_feedback')
    .insert([{
      map_id: mapId,
      satisfaction_rating: rating,
      community_type: 'other',
      status: 'pending',
      created_at: new Date().toISOString(),
      session_id: localStorage.getItem('session_id') // Get session ID if available
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWithDetailedFeedback(feedbackId: string, feedback: DetailedFeedback) {
  // Prepare update data with all available fields
  const updateData = {
    testimonial: feedback.feedbackText || null,
    use_case: feedback.useCase || feedback.painPoint || null, // Store pain point as use case for negative feedback
    community_type: feedback.useCase || 'other',
    organization_name: feedback.organization || null,
    contact_email: feedback.email || null,
    can_feature: feedback.canFeature || false,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('map_feedback')
    .update(updateData)
    .eq('id', feedbackId)
    .select()
    .single();

  if (error) throw error;

  // If email is provided, try to connect with existing lead
  if (feedback.email) {
    try {
      const existingLead = await findLeadByEmail(feedback.email);
      if (existingLead) {
        await associateLeadWithFeedback(existingLead.id!, feedbackId);
        await trackLeadInteraction(feedback.email, 'provided_feedback', {
          feedback_id: feedbackId,
          rating: data.satisfaction_rating,
          use_case: feedback.useCase || feedback.painPoint
        });
      }
    } catch (err) {
      console.error('Error connecting feedback to lead:', err);
      // Don't throw here - we still want to save the feedback even if lead connection fails
    }
  }

  return data;
}