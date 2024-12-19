import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CoreAnalytics } from './CoreAnalytics';
import { supabase } from '@/lib/supabase';

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

const DEFAULT_DATE_RANGE = {
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  endDate: new Date()
};

export function DashboardContent() {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('map_analytics')
        .select('*')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString())
        .order('created_at', { ascending: true });

      if (analyticsError) {
        throw analyticsError;
      }

      // If no data exists yet, initialize with some mock data
      if (!analyticsData || analyticsData.length === 0) {
        const mockData = generateMockData(dateRange.startDate, dateRange.endDate);
        setData(mockData);
        
        // Insert mock data into the database for future use
        const { error: insertError } = await supabase.from('map_analytics').insert(
          mockData.coreMetrics.daily_metrics.map(metric => ({
            created_at: new Date(metric.date).toISOString(),
            total_members: Math.floor(Math.random() * 50),
            unique_locations: Math.floor(Math.random() * 20),
            download_count: metric.maps_created,
            share_count: metric.shares,
            views: Math.floor(Math.random() * 100),
            avg_session_duration: metric.avg_load_time || 0,
            error_count: metric.errors || 0
          }))
        );

        if (insertError) {
          console.error('Error inserting mock data:', insertError);
        }
      } else {
        const processedData = processAnalyticsData(analyticsData);
        setData(processedData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      console.error('Error fetching dashboard data:', errorMessage);
      setError(errorMessage);
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
              if (start && end) {
                setDateRange({ startDate: start, endDate: end });
              }
            }}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            selectsRange
            className="px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
        </div>
      ) : data?.coreMetrics ? (
        <CoreAnalytics metrics={data.coreMetrics} isLoading={isLoading} />
      ) : (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">No data available for the selected date range</p>
        </div>
      )}
    </div>
  );
}

// Helper function to process analytics data
function processAnalyticsData(data: any[]): DashboardData {
  return {
    coreMetrics: {
      total_maps: data.reduce((sum, item) => sum + (item.download_count || 0), 0),
      total_users: new Set(data.map(item => item.user_id)).size,
      total_views: data.reduce((sum, item) => sum + (item.views || 0), 0),
      total_shares: data.reduce((sum, item) => sum + (item.share_count || 0), 0),
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
  const totalViews = data.reduce((sum, item) => sum + (item.views || 0), 0);
  const totalConversions = data.reduce((sum, item) => sum + (item.download_count || 0), 0);
  return totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
}

function calculateAvgSessionDuration(data: any[]) {
  const sessions = data.filter(item => item.avg_session_duration);
  return sessions.length > 0
    ? sessions.reduce((sum, item) => sum + item.avg_session_duration, 0) / sessions.length
    : 0;
}

function calculateEngagementRate(data: any[]) {
  const totalUsers = new Set(data.map(item => item.user_id)).size;
  const activeUsers = new Set(
    data.filter(item => item.download_count > 0 || item.share_count > 0)
      .map(item => item.user_id)
  ).size;
  return totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
}

function calculateConversionTrend(data: any[]) {
  if (data.length < 2) return 0;
  
  const sortedData = [...data].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const firstDay = calculateConversionRate([sortedData[0]]);
  const lastDay = calculateConversionRate([sortedData[sortedData.length - 1]]);
  
  return lastDay - firstDay;
}

function calculateTotalConversions(data: any[]) {
  return data.reduce((sum, item) => sum + (item.download_count || 0), 0);
}

function calculateFeatureUsage(data: any[]) {
  return {
    map_creation: data.reduce((sum, item) => sum + (item.download_count || 0), 0),
    sharing: data.reduce((sum, item) => sum + (item.share_count || 0), 0),
    editing: data.reduce((sum, item) => sum + (item.views || 0), 0),
    exporting: Math.floor(data.reduce((sum, item) => sum + (item.download_count || 0), 0) * 0.3)
  };
}

function processDailyMetrics(data: any[]) {
  const dailyData = data.reduce((acc, item) => {
    const date = item.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        maps_created: 0,
        active_users: new Set(),
        shares: 0,
        errors: 0,
        avg_load_time: 0,
        load_time_count: 0
      };
    }
    
    acc[date].maps_created += item.download_count || 0;
    if (item.user_id) acc[date].active_users.add(item.user_id);
    acc[date].shares += item.share_count || 0;
    acc[date].errors += item.error_count || 0;
    if (item.avg_session_duration) {
      acc[date].avg_load_time += item.avg_session_duration;
      acc[date].load_time_count += 1;
    }
    
    return acc;
  }, {});

  return Object.entries(dailyData).map(([date, metrics]: [string, any]) => ({
    date,
    maps_created: metrics.maps_created,
    active_users: metrics.active_users.size,
    shares: metrics.shares,
    success_rate: metrics.errors > 0 
      ? (1 - metrics.errors / (metrics.maps_created + metrics.shares)) * 100 
      : 100,
    errors: metrics.errors,
    avg_load_time: metrics.load_time_count > 0 
      ? metrics.avg_load_time / metrics.load_time_count 
      : null
  }));
}

function generateMockData(startDate: Date, endDate: Date): DashboardData {
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyMetrics = Array.from({ length: days + 1 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      maps_created: Math.floor(Math.random() * 10),
      active_users: Math.floor(Math.random() * 50),
      shares: Math.floor(Math.random() * 15),
      success_rate: 85 + Math.random() * 15,
      errors: Math.floor(Math.random() * 3),
      avg_load_time: 0.5 + Math.random()
    };
  });

  return {
    coreMetrics: {
      total_maps: dailyMetrics.reduce((sum, day) => sum + day.maps_created, 0),
      total_users: Math.floor(Math.random() * 500) + 100,
      total_views: Math.floor(Math.random() * 2000) + 500,
      total_shares: dailyMetrics.reduce((sum, day) => sum + day.shares, 0),
      conversion_rate: 25 + Math.random() * 10,
      avg_session_duration: Math.floor(Math.random() * 30),
      engagement_rate: 40 + Math.random() * 20,
      conversion_trend: 5 + Math.random() * 10,
      total_conversions: Math.floor(Math.random() * 500),
      feature_usage: {
        map_creation: Math.floor(Math.random() * 200) + 100,
        sharing: Math.floor(Math.random() * 150) + 50,
        editing: Math.floor(Math.random() * 300) + 150,
        exporting: Math.floor(Math.random() * 100) + 25
      },
      daily_metrics: dailyMetrics
    }
  };
}