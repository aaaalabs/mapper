import React, { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { format } from 'date-fns';

export interface FeatureMetrics {
  feature_name: string;
  total_uses: number;
  unique_users: number;
  avg_duration: number;
  success_rate: number;
}

interface TimeOfDayData {
  hour: number;
  day: string;
  value: number;
}

interface FeatureEngagementProps {
  metrics: FeatureMetrics[];
  timeOfDayData: TimeOfDayData[];
  topFeatures: Array<{
    feature: string;
    count: number;
  }>;
  isLoading: boolean;
}

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-64 bg-gray-200 rounded-lg"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-64 bg-gray-200 rounded-lg"></div>
      <div className="h-64 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

const FeatureMetricCard = ({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h4 className="text-sm font-medium text-gray-500">{title}</h4>
    <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
  </div>
);

export const FeatureEngagement = () => {
  const [metrics, setMetrics] = useState<FeatureMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('map_feature_summary')
          .select('*')
          .gte('day', getDateFromRange(timeRange))
          .order('day', { ascending: true });

        if (error) throw error;

        // Process and aggregate metrics by feature
        const featureMap = new Map<string, FeatureMetrics>();
        
        data?.forEach(row => {
          const current = featureMap.get(row.feature_name) || {
            feature_name: row.feature_name,
            total_uses: 0,
            unique_users: 0,
            avg_duration: 0,
            success_rate: 0,
            days: 0
          };

          current.total_uses += row.total_uses;
          current.unique_users += row.unique_users;
          current.avg_duration += row.avg_duration;
          current.success_rate += row.success_rate;
          current.days += 1;

          featureMap.set(row.feature_name, current);
        });

        // Calculate averages
        const aggregatedMetrics = Array.from(featureMap.values()).map(metric => ({
          ...metric,
          avg_duration: metric.avg_duration / metric.days,
          success_rate: metric.success_rate / metric.days
        }));

        setMetrics(aggregatedMetrics);
      } catch (err) {
        console.error('Failed to fetch feature metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

  if (loading) return <div>Loading feature metrics...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div>
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

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map(metric => (
          <div key={metric.feature_name} className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">{metric.feature_name}</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Uses</dt>
                <dd className="font-medium">{metric.total_uses}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Unique Users</dt>
                <dd className="font-medium">{metric.unique_users}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Avg Duration</dt>
                <dd className="font-medium">{metric.avg_duration.toFixed(2)}s</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Success Rate</dt>
                <dd className="font-medium">{(metric.success_rate * 100).toFixed(1)}%</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
};

const getDateFromRange = (range: string) => {
  const date = new Date();
  const days = parseInt(range);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
