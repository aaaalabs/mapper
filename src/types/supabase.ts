export interface Database {
  public: {
    Tables: {
      map_feedback: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          status: 'pending' | 'approved' | 'featured' | 'contacted' | 'archived';
          metadata: {
            email: string | null;
            useCase?: string | null;
            use_case?: string | null;
            painPoint?: string | null;
            canFeature?: boolean;
            can_feature?: boolean;
            feedbackText?: string | null;
            testimonial?: string | null;
            organization: string | null;
            community_type?: string;
            last_updated?: string;
          };
          rating?: number;
          feedback_type?: 'positive' | 'negative' | 'neutral';
          session_id?: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'approved' | 'featured' | 'contacted' | 'archived';
          metadata: {
            email?: string | null;
            useCase?: string | null;
            use_case?: string | null;
            painPoint?: string | null;
            canFeature?: boolean;
            can_feature?: boolean;
            feedbackText?: string | null;
            testimonial?: string | null;
            organization?: string | null;
            community_type?: string;
            last_updated?: string;
          };
          rating?: number;
          feedback_type?: 'positive' | 'negative' | 'neutral';
          session_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'approved' | 'featured' | 'contacted' | 'archived';
          metadata?: {
            email?: string | null;
            useCase?: string | null;
            use_case?: string | null;
            painPoint?: string | null;
            canFeature?: boolean;
            can_feature?: boolean;
            feedbackText?: string | null;
            testimonial?: string | null;
            organization?: string | null;
            community_type?: string;
            last_updated?: string;
          };
          rating?: number;
          feedback_type?: 'positive' | 'negative' | 'neutral';
          session_id?: string | null;
        };
      };
      map_analytics_events: {
        Row: {
          id: string;
          created_at: string;
          event_type: string;
          event_data: Record<string, any>;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          event_type: string;
          event_data?: Record<string, any>;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          event_type?: string;
          event_data?: Record<string, any>;
          session_id?: string | null;
          user_id?: string | null;
        };
      };
      map_settings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          category: string;
          key: string;
          value: any;
          metadata: Record<string, any>;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          category: string;
          key: string;
          value: any;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          category?: string;
          key?: string;
          value?: any;
          metadata?: Record<string, any>;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
