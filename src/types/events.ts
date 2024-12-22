export interface DatabaseEvent {
  id: string;
  created_at: string;
  session_id: string | null;
  event_name: string;
  event_data: Record<string, any>;
  feature_metadata?: Record<string, any>;
  error_type?: string;
  error_message?: string;
  performance_data?: Record<string, any>;
  anonymous_id?: string;
  user_id?: string | null;
  path?: string;
}

export interface AnalyticsEvent extends DatabaseEvent {
  type: string;
  metadata: Record<string, any>;
  timestamp: string;
}
