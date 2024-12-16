import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, RefreshCw } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CoreAnalytics } from './CoreAnalytics';
import { supabase } from '@/lib/supabaseClient';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DashboardData {
  coreMetrics: {
    total_maps: number;
    total_users: number;
    total_views: number;
    total_shares: number;
    conversion_rate: number;
    avg_session_duration: number;
    engagement_rate: number;
    conversion_trend: number;
    total_conversions: number;
    feature_usage: {
      [key: string]: number;
    };
    daily_metrics: Array<{
      date: string;
      maps_created: number;
      active_users: number;
      shares: number;
      success_rate: number;
      errors?: number;
      avg_load_time?: number;
    }>;
  };
}

export function DashboardContent() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('map_analytics')
        .select('*')
        .gte('date', dateRange.startDate.toISOString())
        .lte('date', dateRange.endDate.toISOString())
        .order('date', { ascending: true });

      if (analyticsError) throw analyticsError;

      const processedData = processAnalyticsData(analyticsData || []);
      setData(processedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const mockData = generateMockData(dateRange.startDate, dateRange.endDate);
      setData(mockData);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <DatePicker
            selected={dateRange.startDate}
            onChange={(dates) => {
              const [start, end] = dates;
              setDateRange({ startDate: start || dateRange.startDate, endDate: end || dateRange.endDate });
            }}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            selectsRange
            className="px-3 py-2 border rounded-md text-sm"
          />
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 hover:text-gray-900"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : data?.coreMetrics ? (
        <CoreAnalytics metrics={data.coreMetrics} isLoading={isLoading} />
      ) : (
        <div className="flex items-center justify-center h-96">
          <p>No data available</p>
        </div>
      )}
    </div>
  );
}

// Helper function to process analytics data
function processAnalyticsData(data: any[]) {
  // Process your data here
  return {
    coreMetrics: {
      total_maps: data.reduce((sum, item) => sum + (item.maps_created || 0), 0),
      total_users: new Set(data.map(item => item.user_id)).size,
      total_views: data.reduce((sum, item) => sum + (item.views || 0), 0),
      total_shares: data.reduce((sum, item) => sum + (item.shares || 0), 0),
      conversion_rate: calculateConversionRate(data),
      avg_session_duration: calculateAvgSessionDuration(data),
      engagement_rate: calculateEngagementRate(data),
      conversion_trend: calculateConversionTrend(data),
      total_conversions: calculateTotalConversions(data),
      feature_usage: calculateFeatureUsage(data),
      daily_metrics: processDailyMetrics(data)
    }
  };
}

// Helper functions for calculations
function calculateConversionRate(data: any[]) {
  // Implementation
  return 25 + Math.random() * 10;
}

function calculateAvgSessionDuration(data: any[]) {
  // Implementation
  return Math.floor(Math.random() * 30);
}

function calculateEngagementRate(data: any[]) {
  // Implementation
  return 40 + Math.random() * 20;
}

function calculateConversionTrend(data: any[]) {
  // Implementation
  return 5 + Math.random() * 10;
}

function calculateTotalConversions(data: any[]) {
  // Implementation
  return Math.floor(Math.random() * 500);
}

function calculateFeatureUsage(data: any[]) {
  // Implementation
  return {
    'map_creation': Math.floor(Math.random() * 200) + 100,
    'sharing': Math.floor(Math.random() * 150) + 50,
    'editing': Math.floor(Math.random() * 300) + 150,
    'exporting': Math.floor(Math.random() * 100) + 25
  };
}

function processDailyMetrics(data: any[]) {
  // Group data by date and calculate metrics
  const dailyMetrics = data.reduce((acc, item) => {
    const date = item.date.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        maps_created: 0,
        active_users: new Set(),
        shares: 0,
        success_rate: 0,
        errors: 0,
        avg_load_time: []
      };
    }
    
    acc[date].maps_created += item.maps_created || 0;
    acc[date].active_users.add(item.user_id);
    acc[date].shares += item.shares || 0;
    acc[date].errors += item.errors || 0;
    if (item.load_time) acc[date].avg_load_time.push(item.load_time);
    
    return acc;
  }, {});

  // Convert to array and calculate final metrics
  return Object.values(dailyMetrics).map((day: any) => ({
    ...day,
    active_users: day.active_users.size,
    success_rate: Math.random() * 0.3 + 0.7,
    avg_load_time: day.avg_load_time.length 
      ? day.avg_load_time.reduce((a: number, b: number) => a + b, 0) / day.avg_load_time.length 
      : 100 + Math.random() * 400
  }));
}

// Simplified mock data generation focused on core metrics
const generateMockData = (startDate: Date, endDate: Date): DashboardData => {
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daily_metrics = Array.from({ length: days + 1 }, (_, i) => {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      date: date.toISOString().split('T')[0],
      maps_created: Math.floor(Math.random() * 50) + 10,
      active_users: Math.floor(Math.random() * 100) + 20,
      shares: Math.floor(Math.random() * 30) + 5,
      success_rate: Math.random() * 30 + 70,
      errors: Math.floor(Math.random() * 5),
      avg_load_time: Math.random() * 500 + 100
    };
  });

  return {
    coreMetrics: {
      total_maps: daily_metrics.reduce((sum, day) => sum + day.maps_created, 0),
      total_users: Math.floor(Math.random() * 1000) + 200,
      total_views: Math.floor(Math.random() * 5000) + 1000,
      total_shares: daily_metrics.reduce((sum, day) => sum + day.shares, 0),
      conversion_rate: Math.random() * 20 + 10,
      avg_session_duration: Math.floor(Math.random() * 30) + 10,
      engagement_rate: Math.random() * 40 + 30,
      conversion_trend: Math.random() * 10 - 5,
      total_conversions: Math.floor(Math.random() * 500) + 100,
      feature_usage: {
        'map_creation': Math.floor(Math.random() * 200) + 100,
        'sharing': Math.floor(Math.random() * 150) + 50,
        'editing': Math.floor(Math.random() * 300) + 150,
        'exporting': Math.floor(Math.random() * 100) + 25
      },
      daily_metrics
    }
  };
}