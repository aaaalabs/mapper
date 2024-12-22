export interface LeadMetrics {
  total_leads: number;
  by_type: {
    beta_waitlist: number;
    data_extraction: number;
    feedback: number;
  };
  conversion_rate: number;
  avg_time_to_convert: number;
}

export interface AnonymousMetrics {
  total_visitors: number;
  active_sessions: number;
  avg_session_duration: number;
  top_paths: Array<{path: string; count: number}>;
  top_events: Array<{event: string; count: number}>;
}

export interface ConversionPath {
  session_id: string;
  events: Array<{
    event_name: string;
    timestamp: string;
    path: string;
    duration_since_start: number;
  }>;
  converted_to?: 'waitlist' | 'extraction' | 'feedback';
  total_duration: number;
}

export interface TimeFilter {
  start: Date;
  end: Date;
  label: '24h' | '7d' | '30d' | 'custom';
}

export interface SessionAnalytics {
  session_id: string;
  first_seen: string;
  last_seen: string;
  total_events: number;
  paths: string[];
  event_names: string[];
  duration: number;
  converted: boolean;
  conversion_type?: string;
  conversion_time?: string;
}
