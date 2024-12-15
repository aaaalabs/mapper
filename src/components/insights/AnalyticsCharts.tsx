import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { format } from 'date-fns';

interface TimeSeriesData {
  id: string;
  data: Array<{
    x: string;
    y: number;
  }>;
}

interface AnalyticsChartsProps {
  dailyViews: TimeSeriesData[];
  dailyClicks: TimeSeriesData[];
}

export function AnalyticsCharts({ dailyViews, dailyClicks }: AnalyticsChartsProps) {
  const commonProperties = {
    margin: { top: 20, right: 20, bottom: 60, left: 80 },
    animate: true,
    enableSlices: 'x',
    enablePoints: false,
    useMesh: true,
    theme: {
      axis: {
        ticks: {
          text: {
            fontSize: 12,
          },
        },
        legend: {
          text: {
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
      },
      grid: {
        line: {
          stroke: '#ddd',
          strokeWidth: 1,
        },
      },
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      legend: 'Count',
      legendOffset: -60,
      legendPosition: 'middle',
    },
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: -45,
      legend: 'Date',
      legendOffset: 50,
      legendPosition: 'middle',
      format: (value: string) => format(new Date(value), 'MMM d'),
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Map Views</h3>
        <div className="h-80">
          <ResponsiveLine
            data={dailyViews}
            {...commonProperties}
            curve="monotoneX"
            colors={['#4f46e5']}
            margin={{ ...commonProperties.margin, left: 70 }}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Profile Link Clicks</h3>
        <div className="h-80">
          <ResponsiveLine
            data={dailyClicks}
            {...commonProperties}
            curve="monotoneX"
            colors={['#10b981', '#ec4899']}
          />
        </div>
      </div>
    </div>
  );
}
