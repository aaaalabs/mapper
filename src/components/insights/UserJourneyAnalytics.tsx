import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { format } from 'date-fns';

interface UserJourneyProps {
  flowData: {
    nodes: Array<{
      id: string;
      nodeColor: string;
    }>;
    links: Array<{
      source: string;
      target: string;
      value: number;
    }>;
  };
  sessionMetrics: {
    avgDuration: number;
    bounceRate: number;
    returnRate: number;
    timeSeriesData: Array<{
      date: string;
      avgDuration: number;
      sessions: number;
    }>;
  };
  isLoading: boolean;
}

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
    <div className="h-64 bg-gray-200 rounded-lg"></div>
  </div>
);

export function UserJourneyAnalytics({ flowData, sessionMetrics, isLoading }: UserJourneyProps) {
  if (isLoading) return <LoadingSkeleton />;

  // Process flow data for visualization
  const flowStages = ['Landing', 'Map View', 'Edit', 'Share', 'Download'];
  const stageColors = {
    Landing: '#6366f1',
    'Map View': '#8b5cf6',
    Edit: '#ec4899',
    Share: '#f43f5e',
    Download: '#f97316'
  };

  return (
    <div className="space-y-6">
      {/* User Flow Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Flow</h3>
        <div className="h-64">
          <div className="flex justify-between items-center h-full">
            {flowStages.map((stage, index) => (
              <div
                key={stage}
                className="flex flex-col items-center"
                style={{ width: `${100 / flowStages.length}%` }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: stageColors[stage] }}
                >
                  {flowData.nodes.find(n => n.id === stage)?.value || 0}
                </div>
                <div className="mt-2 text-sm font-medium text-gray-600">{stage}</div>
                {index < flowStages.length - 1 && (
                  <div className="absolute w-full h-0.5 bg-gray-200" style={{ left: '50%' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500">Avg. Session Duration</h4>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {Math.round(sessionMetrics.avgDuration / 60)}m {Math.round(sessionMetrics.avgDuration % 60)}s
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500">Bounce Rate</h4>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {(sessionMetrics.bounceRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500">Return Rate</h4>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {(sessionMetrics.returnRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Session Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Trends</h3>
        <div className="h-64">
          <ResponsiveLine
            data={[
              {
                id: 'Sessions',
                data: sessionMetrics.timeSeriesData.map(d => ({
                  x: format(new Date(d.date), 'MMM dd'),
                  y: d.sessions
                }))
              },
              {
                id: 'Duration',
                data: sessionMetrics.timeSeriesData.map(d => ({
                  x: format(new Date(d.date), 'MMM dd'),
                  y: Math.round(d.avgDuration / 60)
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
                itemWidth: 80,
                itemHeight: 20,
                symbolSize: 12,
                symbolShape: 'circle'
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
