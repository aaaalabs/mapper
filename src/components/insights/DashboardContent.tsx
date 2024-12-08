import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { InsightsChart } from './InsightsChart';
import { Loader2 } from 'lucide-react';

interface DashboardData {
  conversionData: any[];
  featureEngagement: any[];
  errorTracking: any[];
  userJourney: any[];
  landingPageMetrics: any[];
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        { data: conversionData },
        { data: featureEngagement },
        { data: errorTracking },
        { data: userJourney },
        { data: landingPageMetrics }
      ] = await Promise.all([
        supabase
          .from('map_analytics_conversion_funnel')
          .select('*')
          .order('day', { ascending: false })
          .limit(7),
        supabase
          .from('map_analytics_feature_engagement')
          .select('*')
          .order('click_count', { ascending: false }),
        supabase
          .from('map_analytics_error_tracking')
          .select('*')
          .order('hour', { ascending: false })
          .limit(10),
        supabase
          .from('map_analytics_user_journey')
          .select('*')
          .order('session_start', { ascending: false })
          .limit(7),
        supabase
          .from('map_analytics_landing_page_engagement')
          .select('*')
          .order('hour', { ascending: false })
          .limit(24)
      ]);

      setData({
        conversionData: conversionData || [],
        featureEngagement: featureEngagement || [],
        errorTracking: errorTracking || [],
        userJourney: userJourney || [],
        landingPageMetrics: landingPageMetrics || []
      });
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-red-500 py-8">
        {error || 'Failed to load dashboard data'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Conversion Funnel */}
      <div className="grid gap-8 md:grid-cols-2">
        <InsightsChart
          title="Conversion Funnel (Last 7 Days)"
          type="line"
          data={data.conversionData}
          xAxisKey="day"
          dataKeys={['started', 'completed', 'shared', 'downloaded']}
        />
        
        <InsightsChart
          title="Conversion Rates"
          type="bar"
          data={data.conversionData}
          xAxisKey="day"
          dataKeys={['completion_rate', 'share_rate', 'download_rate']}
        />
      </div>

      {/* Feature Engagement */}
      <InsightsChart
        title="Feature Engagement"
        type="bar"
        data={data.featureEngagement}
        xAxisKey="feature_name"
        dataKeys={['hover_count', 'click_count', 'unique_users']}
        height={400}
      />

      {/* Landing Page Performance */}
      <div className="grid gap-8 md:grid-cols-2">
        <InsightsChart
          title="Landing Page Engagement (24h)"
          type="line"
          data={data.landingPageMetrics}
          xAxisKey="hour"
          dataKeys={['demo_interactions', 'cta_clicks']}
        />
        
        <InsightsChart
          title="Scroll Depth"
          type="line"
          data={data.landingPageMetrics}
          xAxisKey="hour"
          dataKeys={['reached_25_percent', 'reached_50_percent', 'reached_75_percent']}
        />
      </div>

      {/* Error Tracking */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Errors</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users Affected</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.errorTracking.map((error, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(error.hour).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {error.error_message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {error.error_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {error.affected_users}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Journey Stats */}
      <div className="grid gap-8 md:grid-cols-3">
        {data.userJourney.slice(0, 1).map((journey, index) => (
          <React.Fragment key={index}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Session Duration</h4>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(journey.avg_session_duration_seconds / 60)} min
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Events per Session</h4>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(journey.avg_events_per_session)}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Sessions Today</h4>
              <p className="text-2xl font-bold text-gray-900">
                {journey.total_sessions}
              </p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
} 