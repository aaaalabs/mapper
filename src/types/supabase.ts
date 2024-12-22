export interface Database {
  public: {
    Tables: {
      map_leads: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          name: string;
          community_link: string | null;
          lead_type: 'beta_waitlist' | 'data_extraction';
          status: 'pending' | 'contacted' | 'converted' | 'rejected';
          map_id: string | null;
          feedback_id: string | null;
          notes: string | null;
          metadata: Record<string, any>;
          last_contacted_at: string | null;
          next_followup_at: string | null;
          source: string | null;
          event_data: Record<string, any> | null;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          name: string;
          community_link?: string | null;
          lead_type: 'beta_waitlist' | 'data_extraction';
          status?: 'pending' | 'contacted' | 'converted' | 'rejected';
          map_id?: string | null;
          feedback_id?: string | null;
          notes?: string | null;
          metadata?: Record<string, any>;
          last_contacted_at?: string | null;
          next_followup_at?: string | null;
          source?: string | null;
          event_data?: Record<string, any> | null;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          name?: string;
          community_link?: string | null;
          lead_type?: 'beta_waitlist' | 'data_extraction';
          status?: 'pending' | 'contacted' | 'converted' | 'rejected';
          map_id?: string | null;
          feedback_id?: string | null;
          notes?: string | null;
          metadata?: Record<string, any>;
          last_contacted_at?: string | null;
          next_followup_at?: string | null;
          source?: string | null;
          event_data?: Record<string, any> | null;
          session_id?: string | null;
        };
      };
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
          session_id: string | null;
          event_name: string;
          event_data: Record<string, any>;
          feature_metadata?: Record<string, any>;
          error_type?: string;
          error_message?: string;
          performance_data?: Record<string, any>;
        };
        Insert: {
          id?: string;
          created_at?: string;
          session_id?: string | null;
          event_name: string;
          event_data?: Record<string, any>;
          feature_metadata?: Record<string, any>;
          error_type?: string;
          error_message?: string;
          performance_data?: Record<string, any>;
        };
        Update: {
          id?: string;
          created_at?: string;
          session_id?: string | null;
          event_name?: string;
          event_data?: Record<string, any>;
          feature_metadata?: Record<string, any>;
          error_type?: string;
          error_message?: string;
          performance_data?: Record<string, any>;
        };
      };
      map_settings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          settings: Record<string, any>;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          settings: Record<string, any>;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          settings?: Record<string, any>;
          user_id?: string | null;
        };
      };
      map_sessions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          status: 'active' | 'completed' | 'expired';
          user_id: string | null;
          metadata: Record<string, any>;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'completed' | 'expired';
          user_id?: string | null;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'completed' | 'expired';
          user_id?: string | null;
          metadata?: Record<string, any>;
        };
      };
      map_payment_orders: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          revolut_order_id: string;
          merchant_order_ref: string;
          amount: number;
          currency: string;
          metadata: Record<string, any>;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          revolut_order_id: string;
          merchant_order_ref: string;
          amount: number;
          currency: string;
          metadata?: Record<string, any>;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          revolut_order_id?: string;
          merchant_order_ref?: string;
          amount?: number;
          currency?: string;
          metadata?: Record<string, any>;
          session_id?: string | null;
        };
      };
      map_admin_settings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string | null;
          settings: {
            paymentEnvironment: 'sandbox' | 'production';
            enablePaymentLogging: boolean;
            analyticsDisplayLevel: 'minimal' | 'conversion' | 'detailed';
            conversionGoalValue: number;
            cookieSettings: {
              enableCookieBanner: boolean;
              allowAnalyticsCookies: boolean;
              cookieExpiryDays: number;
            };
            socialProof: {
              enableTestimonialToasts: boolean;
              showPurchaseNotifications: boolean;
            };
            maxMarkersPerMap: number;
            requestsPerMinuteLimit: number;
            mapCacheDurationMinutes: number;
          };
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          settings: {
            paymentEnvironment: 'sandbox' | 'production';
            enablePaymentLogging: boolean;
            analyticsDisplayLevel: 'minimal' | 'conversion' | 'detailed';
            conversionGoalValue: number;
            cookieSettings: {
              enableCookieBanner: boolean;
              allowAnalyticsCookies: boolean;
              cookieExpiryDays: number;
            };
            socialProof: {
              enableTestimonialToasts: boolean;
              showPurchaseNotifications: boolean;
            };
            maxMarkersPerMap: number;
            requestsPerMinuteLimit: number;
            mapCacheDurationMinutes: number;
          };
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          settings?: {
            paymentEnvironment?: 'sandbox' | 'production';
            enablePaymentLogging?: boolean;
            analyticsDisplayLevel?: 'minimal' | 'conversion' | 'detailed';
            conversionGoalValue?: number;
            cookieSettings?: {
              enableCookieBanner?: boolean;
              allowAnalyticsCookies?: boolean;
              cookieExpiryDays?: number;
            };
            socialProof?: {
              enableTestimonialToasts?: boolean;
              showPurchaseNotifications?: boolean;
            };
            maxMarkersPerMap?: number;
            requestsPerMinuteLimit?: number;
            mapCacheDurationMinutes?: number;
          };
        };
      };
      maps: {
        Row: {
          id: string;
          name: string;
          members: any[];
          center: number[];
          zoom: number;
          created_at: string;
          settings: {
            style: {
              id: string;
              popupStyle: {
                text: string;
                border: string;
                shadow: string;
                background: string;
              };
              markerStyle: string;
            };
            features: {
              enableSearch: boolean;
              enableSharing: boolean;
              enableClustering: boolean;
              enableFullscreen: boolean;
            };
            customization: {
              fontFamily: string;
              markerColor: string;
              clusterColor: string;
            };
          } | null;
        };
        Insert: {
          id?: string;
          name: string;
          members?: any[];
          center: number[];
          zoom: number;
          created_at?: string;
          settings?: {
            style: {
              id: string;
              popupStyle: {
                text: string;
                border: string;
                shadow: string;
                background: string;
              };
              markerStyle: string;
            };
            features: {
              enableSearch: boolean;
              enableSharing: boolean;
              enableClustering: boolean;
              enableFullscreen: boolean;
            };
            customization: {
              fontFamily: string;
              markerColor: string;
              clusterColor: string;
            };
          } | null;
        };
        Update: {
          id?: string;
          name?: string;
          members?: any[];
          center?: number[];
          zoom?: number;
          created_at?: string;
          settings?: {
            style?: {
              id?: string;
              popupStyle?: {
                text?: string;
                border?: string;
                shadow?: string;
                background?: string;
              };
              markerStyle?: string;
            };
            features?: {
              enableSearch?: boolean;
              enableSharing?: boolean;
              enableClustering?: boolean;
              enableFullscreen?: boolean;
            };
            customization?: {
              fontFamily?: string;
              markerColor?: string;
              clusterColor?: string;
            };
          } | null;
        };
      };
      map_reports: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
          report_type: 'inappropriate' | 'spam' | 'copyright' | 'other';
          report_reason: string;
          reporter_session_id: string | null;
          map_id: string;
          map: {
            title: string;
            owner_id: string;
            created_at: string;
          };
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
          report_type: 'inappropriate' | 'spam' | 'copyright' | 'other';
          report_reason: string;
          reporter_session_id?: string | null;
          map_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
          report_type?: 'inappropriate' | 'spam' | 'copyright' | 'other';
          report_reason?: string;
          reporter_session_id?: string | null;
          map_id?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
