import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { format } from 'date-fns';

interface ErrorMetrics {
  error_count: number;
  avg_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  success_rate: number;
  memory_usage: number;
  cpu_usage: number;
}

interface ErrorEvent {
  error_type: string;
  error_message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'investigating' | 'resolved';
  timestamp: string;
  count: number;
}

interface TimeSeriesData {
  date: string;
  errors: number;
  response_time: number;
  success_rate: number;
}

interface ErrorTrackingProps {
  metrics: ErrorMetrics;
  recentErrors: ErrorEvent[];
  timeSeriesData: TimeSeriesData[];
  isLoading: boolean;
}

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
    <div className="h-64 bg-gray-200 rounded-lg"></div>
    <div className="h-96 bg-gray-200 rounded-lg"></div>
  </div>
);

const MetricCard = ({ title, value, trend, status }: { title: string; value: string | number; trend?: string; status?: 'good' | 'warning' | 'critical' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        {status && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      {trend && (
        <p className="mt-1 text-sm text-gray-500">{trend}</p>
      )}
    </div>
  );
};

const ErrorList = ({ errors }: { errors: ErrorEvent[] }) => {
  const getSeverityColor = (severity: ErrorEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: ErrorEvent['status']) => {
    switch (status) {
      case 'new':
        return 'bg-purple-100 text-purple-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Errors</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {errors.map((error, index) => (
          <div key={index} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(error.severity)}`}>
                    {error.severity}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(error.status)}`}>
                    {error.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(error.timestamp), 'MMM dd, HH:mm')}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-medium text-gray-900">{error.error_type}</h4>
                <p className="mt-1 text-sm text-gray-500">{error.error_message}</p>
              </div>
              <div className="ml-6 text-sm text-gray-500">
                {error.count} occurrences
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function ErrorTracking({ metrics, recentErrors, timeSeriesData, isLoading }: ErrorTrackingProps) {
  if (isLoading) return <LoadingSkeleton />;

  const getHealthStatus = () => {
    if (metrics.error_count > 100 || metrics.success_rate < 0.95) return 'critical';
    if (metrics.error_count > 50 || metrics.success_rate < 0.98) return 'warning';
    return 'good';
  };

  const getResponseTimeStatus = () => {
    if (metrics.p95_response_time > 1000) return 'critical';
    if (metrics.p95_response_time > 500) return 'warning';
    return 'good';
  };

  return (
    <div className="space-y-6">
      {/* System Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="System Health"
          value={`${(metrics.success_rate * 100).toFixed(2)}%`}
          status={getHealthStatus()}
          trend={`${metrics.error_count} errors today`}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.avg_response_time.toFixed(0)}ms`}
          status={getResponseTimeStatus()}
          trend={`P95: ${metrics.p95_response_time.toFixed(0)}ms`}
        />
        <MetricCard
          title="Memory Usage"
          value={`${metrics.memory_usage.toFixed(1)}%`}
          status={metrics.memory_usage > 90 ? 'critical' : metrics.memory_usage > 70 ? 'warning' : 'good'}
        />
        <MetricCard
          title="CPU Usage"
          value={`${metrics.cpu_usage.toFixed(1)}%`}
          status={metrics.cpu_usage > 90 ? 'critical' : metrics.cpu_usage > 70 ? 'warning' : 'good'}
        />
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance Trends</h3>
        <div className="h-64">
          <ResponsiveLine
            data={[
              {
                id: 'Errors',
                data: timeSeriesData.map(d => ({
                  x: format(new Date(d.date), 'MMM dd'),
                  y: d.errors
                }))
              },
              {
                id: 'Response Time',
                data: timeSeriesData.map(d => ({
                  x: format(new Date(d.date), 'MMM dd'),
                  y: d.response_time
                }))
              },
              {
                id: 'Success Rate',
                data: timeSeriesData.map(d => ({
                  x: format(new Date(d.date), 'MMM dd'),
                  y: d.success_rate * 100
                }))
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
            legends={[
              {
                anchor: 'top-right',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: -20,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 100,
                itemHeight: 20,
                symbolSize: 12,
                symbolShape: 'circle'
              }
            ]}
          />
        </div>
      </div>

      {/* Error List */}
      <ErrorList errors={recentErrors} />
    </div>
  );
}
