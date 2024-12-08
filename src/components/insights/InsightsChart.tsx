import React from 'react';
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

interface ChartData {
  [key: string]: string | number;
}

interface InsightsChartProps {
  data: ChartData[];
  type: 'line' | 'bar';
  dataKeys: string[];
  xAxisKey: string;
  title: string;
  height?: number;
  colors?: string[];
}

export function InsightsChart({
  data,
  type,
  dataKeys,
  xAxisKey,
  title,
  height = 300,
  colors = ['#0070F3', '#F99D7C', '#A3A692']
}: InsightsChartProps) {
  const Chart = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <DataComponent
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                strokeWidth={type === 'line' ? 2 : 0}
              />
            ))}
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 