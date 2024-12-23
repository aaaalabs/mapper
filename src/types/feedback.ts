export type FeedbackType = 'positive' | 'negative' | 'neutral';
export type FeedbackStatus = 'pending' | 'contacted' | 'approved' | 'featured' | 'archived';

export interface FeedbackMetadata {
  email: string | null;
  use_case: string | null;
  can_feature: boolean;
  testimonial: string | null;
  organization: string | null;
  community_type: string | null;
  name: string | null;
  feedback_text: string | null;
  context: 'download' | 'share' | null;
  last_updated: string;
}

export interface FeedbackData {
  id: string;
  created_at: string;
  updated_at: string;
  feedback_type: FeedbackType;
  content?: string | null;
  rating?: number | null;
  is_testimonial?: boolean;
  testimonial_approved?: boolean;
  metadata: FeedbackMetadata;
  status: FeedbackStatus;
}

export interface FeedbackStats {
  totalCount: number;
  averageRating: number;
  typeDistribution: Record<string, number>;
  ratingDistribution: Record<number, number>;
  statusDistribution: Record<string, number>;
}
