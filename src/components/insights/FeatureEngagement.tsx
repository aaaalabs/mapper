import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { format } from 'date-fns';

interface FeatureMetrics {
  feature_id: string;
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

export function FeatureEngagement({ metrics, timeOfDayData, topFeatures, isLoading }: FeatureEngagementProps) {
  if (isLoading) return <LoadingSkeleton />;

  // Process time of day data for line chart
  const timeSeriesData = Array.from({ length: 24 }, (_, hour) => {
    const totalForHour = timeOfDayData
      .filter(d => d.hour === hour)
      .reduce((sum, d) => sum + d.value, 0);
    
    return {
      x: `${hour}:00`,
      y: totalForHour
    };
  });

  const fetchFeatureMetrics = async () => {
    try {
      const today = startOfDay(new Date());
      const thirtyDaysAgo = subDays(today, 30);

      const { data, error } = await supabase
        .from('map_feature_metrics')
        .select(`
          feature_id,
          total_uses,
          unique_users,
          avg_duration,
          success_rate,
          map_features (
            feature_name
          )
        `)
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: false });

      if (error) throw error;

      // Process and aggregate metrics
      const aggregatedMetrics = data?.reduce((acc, metric) => {
        const featureName = metric.map_features?.feature_name;
        if (!featureName) return acc;

        if (!acc[featureName]) {
          acc[featureName] = {
            total_uses: 0,
            unique_users: 0,
            avg_duration: 0,
            success_rate: 0,
            count: 0
          };
        }

        acc[featureName].total_uses += metric.total_uses;
        acc[featureName].unique_users = Math.max(acc[featureName].unique_users, metric.unique_users);
        acc[featureName].avg_duration += metric.avg_duration || 0;
        acc[featureName].success_rate += metric.success_rate || 0;
        acc[featureName].count++;

        return acc;
      }, {} as Record<string, any>);

      // Calculate averages and format data
      const formattedMetrics = Object.entries(aggregatedMetrics || {}).map(([feature, metrics]: [string, any]) => ({
        feature,
        total_uses: metrics.total_uses,
        unique_users: metrics.unique_users,
        avg_duration: metrics.avg_duration / metrics.count,
        success_rate: metrics.success_rate / metrics.count
      }));

      setFeatureMetrics(formattedMetrics);
    } catch (err) {
      console.error('Error fetching feature metrics:', err);
      setError('Failed to fetch feature metrics');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Features Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Most Used Features</h3>
        <div className="h-64">
          <ResponsiveBar
            data={topFeatures}
            keys={['count']}
            indexBy="feature"
            margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            colors={{ scheme: 'nivo' }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Performance</h3>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.feature_id} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{metric.feature_name}</h4>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Uses</p>
                    <p className="font-medium">{metric.total_uses}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Unique Users</p>
                    <p className="font-medium">{metric.unique_users}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Success Rate</p>
                    <p className="font-medium">{(metric.success_rate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage by Time Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage by Time of Day</h3>
          <div className="h-64">
            <ResponsiveLine
              data={[
                {
                  id: 'Usage',
                  data: timeSeriesData
                }
              ]}
              margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
              xScale={{
                type: 'point'
              }}
              yScale={{
                type: 'linear',
                min: 'auto',
                max: 'auto'
              }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45
              }}
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
