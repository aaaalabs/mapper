import { supabase } from '../config/supabase';
import { findLeadByEmail, associateLeadWithFeedback, trackLeadInteraction } from './leadService';

interface InitialRating {
  mapId: string;
  rating: number;
}

interface DetailedFeedback {
  feedbackText: string;
  useCase?: string;
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
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWithDetailedFeedback(feedbackId: string, feedback: DetailedFeedback) {
  const { data, error } = await supabase
    .from('map_feedback')
    .update({
      testimonial: feedback.feedbackText,
      use_case: feedback.useCase,
      community_type: feedback.useCase || 'other',
      organization_name: feedback.organization,
      contact_email: feedback.email,
      can_feature: feedback.canFeature,
      updated_at: new Date().toISOString()
    })
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
          use_case: feedback.useCase
        });
      }
    } catch (err) {
      console.error('Error connecting feedback to lead:', err);
      // Don't throw here - we still want to save the feedback even if lead connection fails
    }
  }

  return data;
}