export type FeedbackType = 'positive' | 'negative' | 'neutral';
export type FeedbackStatus = 'pending' | 'contacted' | 'approved' | 'featured' | 'archived';

export interface FeedbackMetadata {
  email: string | null;
  useCase?: string | null;
  company?: string | null;
  position?: string | null;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
  source?: string | null;
  last_updated?: string;
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
