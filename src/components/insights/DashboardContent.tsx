import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CoreAnalytics } from './CoreAnalytics';
import { supabase } from '@/lib/supabase';
import { trackEvent, trackError, ERROR_SEVERITY, ERROR_CATEGORY } from '../../services/analytics';
import { ANALYTICS_EVENTS } from '../../services/analytics';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DashboardData {
  created_at: string;
  event_name: string;
  event_data: Record<string, any>;
  error_type?: string;
  error_message?: string;
}

interface CoreMetrics {
  total_maps: number;
  total_users: number;
  total_views: number;
  total_shares: number;
  conversion_rate: number;
  daily_metrics: {
    date: string;
    maps_created: number;
    active_users: number;
    shares: number;
    success_rate: number;
    errors: number;
  }[];
  date: string;
  maps_created: number;
  active_users: number;
  shares: number;
  success_rate: number;
  avg_session_duration: number;
  engagement_rate: number;
  feature_usage: {
    map_creation: number;
    sharing: number;
    editing: number;
    exporting: number;
    [key: string]: number;
  };
  conversion_trend: number;
  total_conversions: number;
}

const DEFAULT_DATE_RANGE = {
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  endDate: new Date()
};

export function DashboardContent() {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);
  const [analyticsData, setAnalyticsData] = useState<DashboardData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (): Promise<DashboardData[]> => {
    try {
      const { data, error } = await supabase
        .from('map_analytics_events')
        .select('*')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      await trackEvent({
        event_name: ANALYTICS_EVENTS.SYSTEM.PERFORMANCE,
        event_data: {
          insights_count: data?.length,
          date_range: {
            start: dateRange.startDate.toISOString(),
            end: dateRange.endDate.toISOString()
          }
        }
      });

      return data || [];
    } catch (error) {
      await trackError(error instanceof Error ? error : new Error('Failed to fetch insights'), {
        category: ERROR_CATEGORY.ANALYTICS,
        severity: ERROR_SEVERITY.HIGH,
        metadata: {
          dateRange: {
            start: dateRange.startDate.toISOString(),
            end: dateRange.endDate.toISOString()
          }
        }
      });
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDashboardData();
        setAnalyticsData(data);
      } catch (error) {
        setError('Failed to load dashboard data');
        await trackError(error instanceof Error ? error : new Error('Failed to load dashboard data'), {
          category: ERROR_CATEGORY.ANALYTICS,
          severity: ERROR_SEVERITY.HIGH
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [dateRange]);

  const handleDateChange = (date: Date | null, isStart: boolean) => {
    if (date) {
      setDateRange(prev => ({
        ...prev,
        [isStart ? 'startDate' : 'endDate']: date
      }));
    }
  };

  const transformToMetrics = (data: DashboardData[]): CoreMetrics => {
    const dailyMetrics = data.reduce((acc, event) => {
      const date = event.created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          maps_created: 0,
          active_users: 0,
          shares: 0,
          success_rate: 0,
          errors: 0,
        };
      }
      
      if (event.event_name === 'map_created') acc[date].maps_created++;
      if (event.event_name === 'user_active') acc[date].active_users++;
      if (event.event_name === 'map_shared') acc[date].shares++;
      if (event.error_type) acc[date].errors++;
      
      return acc;
    }, {} as Record<string, CoreMetrics['daily_metrics'][0]>);

    // Calculate feature usage
    const feature_usage = {
      map_creation: data.filter(event => event.event_name === 'map_created').length,
      sharing: data.filter(event => event.event_name === 'map_shared').length,
      editing: data.filter(event => event.event_name === 'map_edited').length,
      exporting: data.filter(event => event.event_name === 'map_exported').length
    };

    // Calculate conversion trend (simplified)
    const recentData = data.slice(-30); // Last 30 events
    const oldConversion = data.slice(-60, -30).filter(e => !e.error_type).length / 30;
    const newConversion = recentData.filter(e => !e.error_type).length / 30;
    const conversion_trend = oldConversion > 0 ? ((newConversion - oldConversion) / oldConversion) * 100 : 0;

    const metrics: CoreMetrics = {
      total_maps: Object.values(dailyMetrics).reduce((sum, day) => sum + day.maps_created, 0),
      total_users: Object.values(dailyMetrics).reduce((sum, day) => sum + day.active_users, 0),
      total_views: data.filter(event => event.event_name === 'map_viewed').length,
      total_shares: Object.values(dailyMetrics).reduce((sum, day) => sum + day.shares, 0),
      conversion_rate: 0,
      daily_metrics: Object.values(dailyMetrics),
      date: new Date().toISOString(),
      maps_created: 0,
      active_users: 0,
      shares: 0,
      success_rate: 0,
      avg_session_duration: 0,
      engagement_rate: 0,
      feature_usage,
      conversion_trend,
      total_conversions: data.filter(e => !e.error_type).length
    };

    // Calculate conversion rate
    const totalAttempts = data.length;
    const totalErrors = data.filter(event => event.error_type).length;
    metrics.conversion_rate = totalAttempts > 0 ? ((totalAttempts - totalErrors) / totalAttempts) * 100 : 0;

    return metrics;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <DatePicker
            selected={dateRange.startDate}
            onChange={(date: Date | null) => handleDateChange(date, true)}
            selectsStart
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            className="border rounded p-2"
          />
          <DatePicker
            selected={dateRange.endDate}
            onChange={(date: Date | null) => handleDateChange(date, false)}
            selectsEnd
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            minDate={dateRange.startDate}
            className="border rounded p-2"
          />
        </div>
      </div>

      <CoreAnalytics 
        metrics={analyticsData ? transformToMetrics(analyticsData) : {
          total_maps: 0,
          total_users: 0,
          total_views: 0,
          total_shares: 0,
          conversion_rate: 0,
          daily_metrics: [],
          date: new Date().toISOString(),
          maps_created: 0,
          active_users: 0,
          shares: 0,
          success_rate: 0,
          avg_session_duration: 0,
          engagement_rate: 0,
          feature_usage: {
            map_creation: 0,
            sharing: 0,
            editing: 0,
            exporting: 0
          },
          conversion_trend: 0,
          total_conversions: 0
        }} 
        isLoading={isLoading} 
      />
    </div>
  );
}