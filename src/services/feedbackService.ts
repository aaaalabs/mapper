import { supabase } from '../config/supabase';

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
  const { error } = await supabase
    .from('map_feedback')
    .update({
      testimonial: feedback.feedbackText,
      use_case: feedback.useCase,
      community_type: feedback.useCase || 'other',
      organization_name: feedback.organization,
      contact_email: feedback.email,
      can_feature: feedback.canFeature
    })
    .eq('id', feedbackId);

  if (error) throw error;
}