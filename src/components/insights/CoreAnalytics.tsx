import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { format, subDays } from 'date-fns';
import { ArrowTrendingUpIcon as TrendingUpIcon, ArrowTrendingDownIcon as TrendingDownIcon, MapIcon, UsersIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../ui/themes/chartThemes';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';

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

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon: Icon, subtitle }) => {
  const trendValue = trend ? Math.round(trend * 10) / 10 : null; // Round to 1 decimal place
  const isPositive = trendValue && trendValue > 0;
  const isNegative = trendValue && trendValue < 0;

  return (
    <div className="p-6 bg-background-white dark:bg-background rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-lg">
            <Icon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-semibold text-primary">{value}</p>
              {subtitle && (
                <span className="text-sm text-muted-foreground">{subtitle}</span>
              )}
            </div>
          </div>
        </div>
        {trendValue !== null && (
          <div className={cn(
            "flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium",
            isPositive && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
            isNegative && "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
            !isPositive && !isNegative && "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
          )}>
            <span className="sr-only">
              {isPositive ? 'Increased by' : 'Decreased by'}
            </span>
            {isPositive ? (
              <TrendingUpIcon className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDownIcon className="h-3 w-3 mr-1" />
            )}
            {Math.abs(trendValue)}%
          </div>
        )}
      </div>
    </div>
  );
};

export function CoreAnalytics({ metrics, isLoading }: CoreAnalyticsProps) {
  const isDark = document.documentElement.classList.contains('dark');
  const chartTheme = isDark ? darkTheme : lightTheme;
  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const formatPercent = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded}%`;
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!metrics || !metrics.daily_metrics || metrics.daily_metrics.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available for the selected date range.</p>
      </div>
    );
  }

  const sortedMetrics = [...metrics.daily_metrics].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const todayMetrics = sortedMetrics[0] || {
    active_users: 0,
    maps_created: 0,
    shares: 0,
    success_rate: 0
  };
  
  const yesterdayMetrics = sortedMetrics[1] || {
    active_users: 0,
    maps_created: 0,
    shares: 0,
    success_rate: 0
  };

  const calculateGrowth = (today: number, yesterday: number) => {
    if (!yesterday) return 0;
    const growth = ((today - yesterday) / yesterday) * 100;
    return Math.round(growth * 10) / 10; // Round to 1 decimal place
  };

  const eventSummaryData = metrics.daily_metrics.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    "Total Events": d.maps_created + d.shares,
    "Unique Sessions": d.active_users
  }));

  const featureUsageData = [
    { feature: "Map Creation", value: metrics.feature_usage.map_creation },
    { feature: "Sharing", value: metrics.feature_usage.sharing },
    { feature: "Editing", value: metrics.feature_usage.editing },
    { feature: "Exporting", value: metrics.feature_usage.exporting }
  ];

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
          icon={ClockIcon}
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercent(metrics.conversion_rate)}
          trend={metrics.conversion_trend}
          icon={ChartBarIcon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background-white dark:bg-background p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-primary">Event Summary</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eventSummaryData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="currentColor" 
                  className="opacity-10"
                />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="currentColor"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="currentColor"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{
                    color: 'var(--foreground)'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    color: 'var(--foreground)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Total Events" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Unique Sessions" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-background-white dark:bg-background p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-primary">Feature Usage</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureUsageData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="currentColor" 
                  className="opacity-10"
                />
                <XAxis 
                  dataKey="feature"
                  tick={{ fontSize: 12 }}
                  stroke="currentColor"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="currentColor"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{
                    color: 'var(--foreground)'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    color: 'var(--foreground)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="currentColor" 
                  className="text-accent"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background-white dark:bg-background p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-primary">Error Analysis</h3>
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
              theme={chartTheme}
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

        <div className="bg-background-white dark:bg-background p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-primary">Performance Metrics</h3>
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
              theme={chartTheme}
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
        <div key={i} className="bg-background-white dark:bg-background rounded-lg shadow-sm p-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);
