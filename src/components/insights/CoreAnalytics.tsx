import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { format, subDays } from 'date-fns';

interface CoreMetrics {
  total_maps: number;
  total_views: number;
  total_downloads: number;
  daily_active_users: number;
  conversion_rate: number;
  daily_metrics: Array<{
    date: string;
    maps_created: number;
    active_users: number;
    success_rate: number;
  }>;
}

interface CoreAnalyticsProps {
  metrics: CoreMetrics;
  isLoading: boolean;
  dateRange: number; // number of days to show
}

export function CoreAnalytics({ metrics, isLoading, dateRange }: CoreAnalyticsProps) {
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  // Prepare data for the line chart
  const chartData = [
    {
      id: 'Maps Created',
      data: metrics.daily_metrics.map(d => ({
        x: d.date,
        y: d.maps_created
      }))
    },
    {
      id: 'Active Users',
      data: metrics.daily_metrics.map(d => ({
        x: d.date,
        y: d.active_users
      }))
    },
    {
      id: 'Success Rate',
      data: metrics.daily_metrics.map(d => ({
        x: d.date,
        y: d.success_rate
      }))
    }
  ];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Maps</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(metrics.total_maps)}</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-500">↑</span>
            <span className="ml-1 text-gray-600">From last {dateRange} days</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Daily Active Users</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(metrics.daily_active_users)}</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-500">↑</span>
            <span className="ml-1 text-gray-600">Active today</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Map Views</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(metrics.total_views)}</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-500">↑</span>
            <span className="ml-1 text-gray-600">Total views</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatPercent(metrics.conversion_rate)}</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-blue-500">↔</span>
            <span className="ml-1 text-gray-600">Start to finish</span>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trends ({dateRange} Days)</h3>
        <div className="h-96">
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            xScale={{
              type: 'time',
              format: '%Y-%m-%d',
              useUTC: false,
              precision: 'day',
            }}
            xFormat="time:%Y-%m-%d"
            yScale={{
              type: 'linear',
              min: 0,
              max: 'auto',
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Count',
              legendOffset: -40,
              legendPosition: 'middle'
            }}
            axisBottom={{
              format: '%b %d',
              tickRotation: -45,
              legend: 'Date',
              legendOffset: 40,
              legendPosition: 'middle'
            }}
            pointSize={4}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
              {
                anchor: 'top-right',
                direction: 'column',
                justify: false,
                translateX: 0,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                symbolSize: 12,
                symbolShape: 'circle',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemBackground: 'rgba(0, 0, 0, .03)',
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
