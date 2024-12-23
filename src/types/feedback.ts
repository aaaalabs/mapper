export type FeedbackType = 'positive' | 'negative' | 'neutral' | 'initial';
export type FeedbackStatus = 'pending' | 'contacted' | 'approved' | 'featured' | 'archived';

export interface FeedbackMetadata {
  email: string | null;
  name: string | null;
  can_feature: boolean;
  testimonial: string | null;
  feedback_text: string | null;
  context: 'download' | 'share' | null;
  location: string | null;
  source: string | null;
  last_updated: string;
}

// New type for metadata updates to ensure type safety
export interface MetadataUpdate {
  email?: string | null;
  name?: string | null;
  feedback_text?: string | null;
  can_feature?: boolean;
  testimonial?: string | null;
  context?: 'download' | 'share' | null;
  location?: string | null;
  source?: string | null;
}

export interface FeedbackData {
  id: string;
  map_id: string;
  created_at: string;
  updated_at: string;
  feedback_type: FeedbackType;
  rating: number;
  metadata: FeedbackMetadata;
  status: FeedbackStatus;
  session_id?: string;
}

export interface AnalyticsEvent {
  id?: string;
  created_at?: string;
  session_id: string | null;
  event_name: string;
  event_data?: Record<string, any>;
  feature_metadata?: Record<string, any>;
  error_type?: string;
  error_message?: string;
  performance_data?: Record<string, any>;
}

export interface FeedbackStats {
  totalCount: number;
  averageRating: number;
  typeDistribution: Record<string, number>;
  ratingDistribution: Record<number, number>;
  statusDistribution: Record<string, number>;
}

export class FeedbackError extends Error {
  readonly type: 'VALIDATION' | 'DATABASE' | 'NETWORK';
  readonly details?: unknown;

  constructor(
    message: string,
    type: 'VALIDATION' | 'DATABASE' | 'NETWORK',
    details?: unknown
  ) {
    super(message);
    this.name = 'FeedbackError';
    this.type = type;
    this.details = details;
  }
}

export function validateRating(rating: number): void {
  if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new FeedbackError(
      'Rating must be an integer between 1 and 5',
      'VALIDATION'
    );
  }
}

export function validateMetadata(metadata: Partial<FeedbackMetadata>): void {
  if (!metadata || typeof metadata !== 'object') {
    throw new FeedbackError(
      'Invalid metadata format',
      'VALIDATION'
    );
  }

  // Validate email if provided
  if ('email' in metadata && metadata.email !== null && typeof metadata.email !== 'string') {
    throw new FeedbackError(
      'Email must be a string or null',
      'VALIDATION'
    );
  }

  // Validate name if provided
  if ('name' in metadata && metadata.name !== null && typeof metadata.name !== 'string') {
    throw new FeedbackError(
      'Name must be a string or null',
      'VALIDATION'
    );
  }

  // Validate can_feature if provided
  if ('can_feature' in metadata && typeof metadata.can_feature !== 'boolean') {
    throw new FeedbackError(
      'can_feature must be a boolean',
      'VALIDATION'
    );
  }

  // Validate testimonial if provided
  if ('testimonial' in metadata && metadata.testimonial !== null && typeof metadata.testimonial !== 'string') {
    throw new FeedbackError(
      'Testimonial must be a string or null',
      'VALIDATION'
    );
  }

  // Validate feedback_text if provided
  if ('feedback_text' in metadata && metadata.feedback_text !== null && typeof metadata.feedback_text !== 'string') {
    throw new FeedbackError(
      'Feedback text must be a string or null',
      'VALIDATION'
    );
  }

  // Validate context if provided
  if ('context' in metadata && metadata.context !== null && metadata.context !== undefined && !['download', 'share'].includes(metadata.context)) {
    throw new FeedbackError(
      'Context must be either "download", "share", or null',
      'VALIDATION'
    );
  }

  // Validate location if provided
  if ('location' in metadata && metadata.location !== null && typeof metadata.location !== 'string') {
    throw new FeedbackError(
      'Location must be a string or null',
      'VALIDATION'
    );
  }

  // Validate source if provided
  if ('source' in metadata && metadata.source !== null && typeof metadata.source !== 'string') {
    throw new FeedbackError(
      'Source must be a string or null',
      'VALIDATION'
    );
  }
}

export function validateFeedbackType(type: unknown): asserts type is FeedbackType {
  if (typeof type !== 'string' || !['positive', 'negative', 'neutral', 'initial'].includes(type)) {
    throw new FeedbackError(
      'Invalid feedback type',
      'VALIDATION'
    );
  }
}

export function validateFeedbackStatus(status: unknown): asserts status is FeedbackStatus {
  if (typeof status !== 'string' || !['pending', 'contacted', 'approved', 'featured', 'archived'].includes(status)) {
    throw new FeedbackError(
      'Invalid feedback status',
      'VALIDATION'
    );
  }
}
