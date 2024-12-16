import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { format, subDays } from 'date-fns';
import { ArrowTrendingUpIcon as TrendingUpIcon, ArrowTrendingDownIcon as TrendingDownIcon, MapIcon, UsersIcon } from '@heroicons/react/24/solid';

interface CoreMetrics {
  total_maps: number;
  total_users: number;
  total_views: number;
  total_shares: number;
  conversion_rate: number;
  daily_metrics: Array<{
    date: string;
    maps_created: number;
    active_users: number;
    shares: number;
    success_rate: number;
    errors?: number;
    avg_load_time?: number;
  }>;
  avg_session_duration: number;
  engagement_rate: number;
  conversion_trend: number;
  total_conversions: number;
  feature_usage: {
    [key: string]: number;
  };
}

interface CoreAnalyticsProps {
  metrics: CoreMetrics;
  isLoading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon: Icon, subtitle }) => (
  <div className="p-6 bg-white rounded-lg shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUpIcon className="w-4 h-4 mr-1" /> : <TrendingDownIcon className="w-4 h-4 mr-1" />}
          <span className="text-sm font-medium">
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      )}
    </div>
  </div>
);

export function CoreAnalytics({ metrics, isLoading }: CoreAnalyticsProps) {
  const formatNumber = (value: number) => value.toLocaleString();
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const todayMetrics = metrics.daily_metrics[metrics.daily_metrics.length - 1];
  const yesterdayMetrics = metrics.daily_metrics[metrics.daily_metrics.length - 2];
  
  const calculateGrowth = (today: number, yesterday: number) => {
    return yesterday ? ((today - yesterday) / yesterday) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Users"
          value={formatNumber(todayMetrics.active_users)}
          trend={calculateGrowth(todayMetrics.active_users, yesterdayMetrics.active_users)}
          icon={UsersIcon}
          subtitle="Today"
        />
        <MetricCard
          title="Maps Created"
          value={formatNumber(todayMetrics.maps_created)}
          trend={calculateGrowth(todayMetrics.maps_created, yesterdayMetrics.maps_created)}
          icon={MapIcon}
          subtitle="Today"
        />
        <MetricCard
          title="Avg Session Time"
          value={formatDuration(metrics.avg_session_duration)}
          icon={UsersIcon}
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercent(metrics.conversion_rate)}
          trend={metrics.conversion_trend}
          icon={TrendingUpIcon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Event Summary</h3>
          <div className="h-80">
            <ResponsiveLine
              data={[
                {
                  id: "Total Events",
                  data: metrics.daily_metrics.map(d => ({
                    x: d.date,
                    y: d.maps_created + d.shares
                  }))
                },
                {
                  id: "Unique Sessions",
                  data: metrics.daily_metrics.map(d => ({
                    x: d.date,
                    y: d.active_users
                  }))
                }
              ]}
              margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
              xScale={{ type: 'time', format: '%Y-%m-%d' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
              axisBottom={{
                format: '%b %d',
                tickRotation: -45
              }}
              enablePoints={false}
              useMesh={true}
              enableSlices="x"
              curve="monotoneX"
              colors={['#6366f1', '#22c55e']}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Feature Usage</h3>
          <div className="h-80">
            <ResponsiveBar
              data={[
                {
                  feature: "Map Creation",
                  value: metrics.feature_usage.map_creation
                },
                {
                  feature: "Sharing",
                  value: metrics.feature_usage.sharing
                },
                {
                  feature: "Editing",
                  value: metrics.feature_usage.editing
                },
                {
                  feature: "Exporting",
                  value: metrics.feature_usage.exporting
                }
              ]}
              keys={['value']}
              indexBy="feature"
              margin={{ top: 20, right: 20, bottom: 50, left: 100 }}
              padding={0.3}
              colors={['#6366f1']}
              borderRadius={4}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              axisBottom={{
                tickRotation: -45
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Error Analysis</h3>
          <div className="h-80">
            <ResponsiveLine
              data={[
                {
                  id: "Error Count",
                  data: metrics.daily_metrics.map(d => ({
                    x: d.date,
                    y: d.errors || 0
                  }))
                }
              ]}
              margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
              xScale={{ type: 'time', format: '%Y-%m-%d' }}
              yScale={{ type: 'linear', min: 0, max: 'auto' }}
              axisBottom={{
                format: '%b %d',
                tickRotation: -45
              }}
              enablePoints={true}
              pointSize={8}
              pointColor="#ffffff"
              pointBorderWidth={2}
              pointBorderColor="#ef4444"
              enableSlices="x"
              colors={['#ef4444']}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="h-80">
            <ResponsiveLine
              data={[
                {
                  id: "Avg Load Time (ms)",
                  data: metrics.daily_metrics.map(d => ({
                    x: d.date,
                    y: d.avg_load_time || 0
                  }))
                }
              ]}
              margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
              xScale={{ type: 'time', format: '%Y-%m-%d' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
              axisBottom={{
                format: '%b %d',
                tickRotation: -45
              }}
              enablePoints={false}
              enableSlices="x"
              curve="monotoneX"
              colors={['#6366f1']}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="h-8 bg-gray-200 rounded w-32" />
    </div>
    <div className="grid grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);
