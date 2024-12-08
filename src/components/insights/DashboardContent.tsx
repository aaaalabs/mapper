import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Calendar, Download, Filter, RefreshCw } from 'lucide-react';
import { InsightsChart } from './InsightsChart';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DashboardData {
  conversionData: any[];
  featureEngagement: any[];
  errorTracking: any[];
  userJourney: any[];
  landingPageMetrics: any[];
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Generate mock data for a specific date range
const generateMockData = (startDate: Date, endDate: Date): DashboardData => {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    conversionData: Array.from({ length: days }, (_, i) => {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      return {
        day: date.toISOString().split('T')[0],
        started: Math.floor(Math.random() * 100) + 50,
        completed: Math.floor(Math.random() * 50) + 20,
        shared: Math.floor(Math.random() * 30) + 10,
        downloaded: Math.floor(Math.random() * 20) + 5,
      };
    }),
    featureEngagement: [
      { feature: 'Map Creation', click_count: Math.floor(Math.random() * 300) + 200, unique_users: Math.floor(Math.random() * 200) + 150, time_spent: Math.floor(Math.random() * 150) + 100 },
      { feature: 'Marker Adding', click_count: Math.floor(Math.random() * 200) + 150, unique_users: Math.floor(Math.random() * 150) + 100, time_spent: Math.floor(Math.random() * 100) + 50 },
      { feature: 'Route Planning', click_count: Math.floor(Math.random() * 150) + 100, unique_users: Math.floor(Math.random() * 100) + 50, time_spent: Math.floor(Math.random() * 50) + 20 },
      { feature: 'Sharing', click_count: Math.floor(Math.random() * 100) + 50, unique_users: Math.floor(Math.random() * 50) + 20, time_spent: Math.floor(Math.random() * 20) + 10 },
    ],
    errorTracking: [
      { error_type: 'Network Error', count: Math.floor(Math.random() * 15) + 5 },
      { error_type: 'Loading Error', count: Math.floor(Math.random() * 10) + 3 },
      { error_type: 'Validation Error', count: Math.floor(Math.random() * 8) + 2 },
      { error_type: 'Other', count: Math.floor(Math.random() * 5) + 1 },
    ],
    userJourney: Array.from({ length: 5 }, (_, i) => ({
      step: `Step ${i + 1}`,
      users: Math.floor(Math.random() * 100) + 50,
    })),
    landingPageMetrics: Array.from({ length: 24 }, (_, i) => ({
      hour: new Date(endDate.getTime() - i * 60 * 60 * 1000).toISOString(),
      views: Math.floor(Math.random() * 50) + 20,
    })),
  };
};

export function DashboardContent() {
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<string>('7');
  const [featureMetric, setFeatureMetric] = useState<string>('clicks');
  const [selectedMetrics, setSelectedMetrics] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState<number>(300000); // 5 minutes
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate mock data based on date range
  const fetchData = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(generateMockData(startDate, endDate));
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update date range when time range changes
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(timeRange));
    setStartDate(start);
    setEndDate(end);
  }, [timeRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [startDate, endDate, selectedMetrics, refreshInterval]);

  // Handle direct date selection
  const handleDateChange = (dates: [Date, Date]) => {
    const [start, end] = dates;
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
      // Calculate and set the time range based on the selected dates
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTimeRange(diffDays.toString());
    }
  };

  // Filter data based on selected metrics
  const filteredData = useMemo(() => {
    if (!data) return null;

    if (selectedMetrics === 'all') return data;

    const filtered: DashboardData = {
      conversionData: [],
      featureEngagement: [],
      errorTracking: [],
      userJourney: [],
      landingPageMetrics: []
    };
    
    switch (selectedMetrics) {
      case 'conversion':
        filtered.conversionData = data.conversionData;
        break;
      case 'engagement':
        filtered.featureEngagement = data.featureEngagement;
        filtered.userJourney = data.userJourney;
        break;
      case 'errors':
        filtered.errorTracking = data.errorTracking;
        break;
    }

    return filtered;
  }, [data, selectedMetrics]);

  // Calculate metrics with null checks
  const metrics = useMemo(() => {
    if (!filteredData) return null;

    const totalCompleted = filteredData.conversionData?.reduce((acc, d) => acc + (d.completed || 0), 0) || 0;
    const totalStarted = filteredData.conversionData?.reduce((acc, d) => acc + (d.started || 0), 0) || 0;
    const successRate = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;
    const errorRate = filteredData.userJourney.length > 0 
      ? Math.round((filteredData.errorTracking.length / filteredData.userJourney.length) * 100)
      : 0;

    return {
      totalCompleted,
      activeSessions: filteredData.userJourney.length,
      successRate,
      errorRate
    };
  }, [filteredData]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = () => {
    if (!filteredData) return;
    
    const prepareDataForExport = (data: DashboardData) => {
      const rows: any[] = [];
      
      // Add conversion data
      if (data.conversionData) {
        data.conversionData.forEach(d => {
          rows.push({
            date: d.day,
            metric: 'Conversion',
            started: d.started,
            completed: d.completed,
            shared: d.shared,
            downloaded: d.downloaded
          });
        });
      }

      // Add feature engagement
      if (data.featureEngagement) {
        data.featureEngagement.forEach(d => {
          rows.push({
            metric: 'Feature Engagement',
            feature: d.feature,
            clicks: d.click_count
          });
        });
      }

      // Add error tracking
      if (data.errorTracking) {
        data.errorTracking.forEach(d => {
          rows.push({
            metric: 'Error',
            type: d.error_type,
            count: d.count
          });
        });
      }

      return rows;
    };

    const exportData = prepareDataForExport(filteredData);
    const headers = Object.keys(exportData[0]);
    const csvContent = "data:text/csv;charset=utf-8," + 
      [
        headers.join(','),
        ...exportData.map(row => headers.map(header => row[header]).join(','))
      ].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics-export-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !filteredData) {
    return (
      <div className="text-center text-red-500 py-8">
        {error || 'Failed to load dashboard data'}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Dashboard Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <DatePicker
              selected={startDate}
              onChange={handleDateChange}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              dateFormat="MMM d, yyyy"
              maxDate={new Date()}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="px-3 py-2 border rounded-md text-sm"
              value={selectedMetrics}
              onChange={(e) => setSelectedMetrics(e.target.value)}
            >
              <option value="all">All Metrics</option>
              <option value="conversion">Conversion</option>
              <option value="engagement">Engagement</option>
              <option value="errors">Errors</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-500" />
            <select
              className="px-3 py-2 border rounded-md text-sm"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value="60000">1 minute</option>
              <option value="300000">5 minutes</option>
              <option value="900000">15 minutes</option>
              <option value="3600000">1 hour</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-medium text-gray-500">Total Maps Created</h3>
          <p className="text-3xl font-semibold mt-2">{metrics?.totalCompleted || 0}</p>
          <div className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <span>↑ 12%</span>
            <span className="text-gray-500">vs. previous period</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-medium text-gray-500">Active Sessions</h3>
          <p className="text-3xl font-semibold mt-2">{metrics?.activeSessions || 0}</p>
          <div className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <span>↑ 8%</span>
            <span className="text-gray-500">vs. previous period</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
          <p className="text-3xl font-semibold mt-2">
            {metrics?.successRate || 0}%
          </p>
          <div className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <span>↑ 5%</span>
            <span className="text-gray-500">vs. previous period</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
          <p className="text-3xl font-semibold mt-2">
            {metrics?.errorRate || 0}%
          </p>
          <div className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <span>↓ 3%</span>
            <span className="text-gray-500">vs. previous period</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {(selectedMetrics === 'all' || selectedMetrics === 'conversion') && filteredData?.conversionData && (
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Conversion Funnel</h3>
              <select
                className="px-2 py-1 text-sm border rounded"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            <InsightsChart
              title=""
              type="line"
              data={filteredData.conversionData}
              xAxisKey="day"
              dataKeys={['started', 'completed', 'shared', 'downloaded']}
            />
          </div>
        )}
        
        {(selectedMetrics === 'all' || selectedMetrics === 'engagement') && filteredData?.featureEngagement && (
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Feature Engagement</h3>
              <select
                className="px-2 py-1 text-sm border rounded"
                value={featureMetric}
                onChange={(e) => setFeatureMetric(e.target.value)}
              >
                <option value="clicks">Click Count</option>
                <option value="users">Unique Users</option>
                <option value="time">Time Spent</option>
              </select>
            </div>
            <InsightsChart
              title=""
              type="bar"
              data={filteredData.featureEngagement}
              xAxisKey="feature"
              dataKeys={[featureMetric === 'clicks' ? 'click_count' : 
                        featureMetric === 'users' ? 'unique_users' : 
                        'time_spent']}
              tooltipFormatter={(value, name) => {
                if (featureMetric === 'time') {
                  return `${value} minutes`;
                }
                return value.toString();
              }}
            />
          </div>
        )}
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Detailed Metrics</h3>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search metrics..."
              className="px-3 py-1 text-sm border rounded"
            />
            <select className="px-2 py-1 text-sm border rounded">
              <option value="all">All Categories</option>
              <option value="maps">Maps</option>
              <option value="users">Users</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Metric ↓
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Today
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  This Week
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Map Views</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">245</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,234</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↑ 15%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Marker Clicks</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">89</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">567</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↑ 8%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Downloads</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">34</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">189</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↑ 12%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Shares</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">78</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↑ 20%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}