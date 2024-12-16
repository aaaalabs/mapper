import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { Card } from '../components/ui/Card';

interface AnalyticsSummary {
  day: string;
  event_name: string;
  total_events: number;
  unique_sessions: number;
  error_count: number;
  avg_load_time: number;
}

interface FeatureSummary {
  day: string;
  feature_name: string;
  total_uses: number;
  unique_users: number;
  error_count: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary[];
  features: FeatureSummary[];
}

export const InsightsPage = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        
        if (!user || user.email !== 'admin@libralab.ai') {
          setIsAdmin(false);
          navigate('/', { replace: true });
          return;
        }
        
        setIsAdmin(true);
      } catch (err) {
        console.error('Auth error:', err);
        setIsAdmin(false);
        navigate('/', { replace: true });
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        
        // Fetch analytics summary
        const { data: summary, error: summaryError } = await supabase
          .from('map_analytics_summary')
          .select('*')
          .gte('day', getDateFromRange(timeRange))
          .order('day', { ascending: true });

        if (summaryError) throw summaryError;

        // Fetch feature usage
        const { data: features, error: featuresError } = await supabase
          .from('map_feature_summary')
          .select('*')
          .gte('day', getDateFromRange(timeRange))
          .order('day', { ascending: true });

        if (featuresError) throw featuresError;

        setAnalyticsData({
          summary: summary || [],
          features: features || []
        });
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, isAdmin]);

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return <div className="p-6">Loading...</div>;
  }

  // Redirect non-admin users
  if (isAdmin === false) {
    return null; // Navigate component will handle the redirect
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      {/* Time range selector */}
      <div className="mb-6">
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border rounded p-2"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {loading && <div>Loading analytics...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Summary */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Event Summary</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.summary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_events" 
                    stroke="#8884d8" 
                    name="Total Events" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="unique_sessions" 
                    stroke="#82ca9d" 
                    name="Unique Sessions" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Feature Usage */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Feature Usage</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.features}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="total_uses" 
                    fill="#8884d8" 
                    name="Total Uses" 
                  />
                  <Bar 
                    dataKey="unique_users" 
                    fill="#82ca9d" 
                    name="Unique Users" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Error Analysis */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Error Analysis</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.summary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="error_count" 
                    stroke="#ff8042" 
                    name="Error Count" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.summary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avg_load_time" 
                    stroke="#8884d8" 
                    name="Avg Load Time (ms)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const getDateFromRange = (range: string) => {
  const date = new Date();
  const days = parseInt(range);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
