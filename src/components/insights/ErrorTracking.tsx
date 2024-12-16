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
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'investigating' | 'resolved';
  timestamp: string;
  count: number;
  details?: string;
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
                <h4 className="mt-2 text-sm font-medium text-gray-900">{error.type}</h4>
                <p className="mt-1 text-sm text-gray-500">{error.message}</p>
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

  const getHealthStatus = (errorCount: number, successRate: number) => {
    if (errorCount > 100 || successRate < 0.95) return { status: 'critical', color: 'text-red-500' };
    if (errorCount > 50 || successRate < 0.98) return { status: 'warning', color: 'text-yellow-500' };
    return { status: 'good', color: 'text-green-500' };
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const errorsByType = recentErrors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const healthStatus = getHealthStatus(metrics.error_count, metrics.success_rate);

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">System Health</h3>
              <div className="mt-1 flex items-baseline">
                <p className={`text-2xl font-semibold ${healthStatus.color}`}>
                  {(metrics.success_rate * 100).toFixed(1)}%
                </p>
                <p className="ml-2 text-sm text-gray-500">success rate</p>
              </div>
            </div>
            <div className={`p-2 rounded-full ${
              healthStatus.status === 'good' ? 'bg-green-100' :
              healthStatus.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {/* ActivityIcon */}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              {metrics.error_count} errors in last 24h
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDuration(metrics.avg_response_time)}
                </p>
                <p className="ml-2 text-sm text-gray-500">average</p>
              </div>
            </div>
            <div className="p-2 rounded-full bg-blue-100">
              {/* ClockIcon */}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              P95: {formatDuration(metrics.p95_response_time)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {((1 - metrics.success_rate) * 100).toFixed(2)}%
                </p>
                <p className="ml-2 text-sm text-gray-500">of requests</p>
              </div>
            </div>
            <div className="p-2 rounded-full bg-red-100">
              {/* AlertTriangleIcon */}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              Top type: {Object.entries(errorsByType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Resource Usage</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics.memory_usage.toFixed(1)}%
                </p>
                <p className="ml-2 text-sm text-gray-500">memory</p>
              </div>
            </div>
            <div className="p-2 rounded-full bg-purple-100">
              {/* CpuIcon */}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              CPU: {metrics.cpu_usage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance Trends</h3>
        <div className="h-64">
          <ResponsiveLine
            data={[
              {
                id: 'Success Rate',
                data: timeSeriesData.map(d => ({
                  x: format(new Date(d.date), 'MMM dd'),
                  y: d.success_rate * 100
                }))
              },
              {
                id: 'Response Time',
                data: timeSeriesData.map(d => ({
                  x: format(new Date(d.date), 'MMM dd'),
                  y: d.response_time
                }))
              }
            ]}
            margin={{ top: 20, right: 120, bottom: 40, left: 60 }}
            xScale={{
              type: 'point'
            }}
            yScale={{
              type: 'linear',
              min: 'auto',
              max: 'auto',
              stacked: false
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45
            }}
            pointSize={8}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            useMesh={true}
            curve="monotoneX"
            colors={['#10b981', '#6366f1']}
            enableArea={true}
            areaOpacity={0.1}
            crosshairType="cross"
            legends={[
              {
                anchor: 'right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
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

      {/* Recent Errors List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Errors
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentErrors.slice(0, 5).map((error, index) => (
            <div key={index} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* AlertCircleIcon */}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {error.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {error.message}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(error.timestamp), 'MMM d, HH:mm')}
                </div>
              </div>
              {error.details && (
                <div className="mt-2">
                  <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {error.details}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
