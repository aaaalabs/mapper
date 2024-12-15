import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Users, MapPin, Activity, TrendingUp, Clock, Download,
  ChevronDown, Search, Calendar, AlertTriangle
} from 'lucide-react';
import { format, startOfDay, subDays } from 'date-fns';
import { Lead, LeadStatus } from '../services/leadService';
import { LeadsTable } from '../components/insights/LeadsTable';

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

interface AnalyticsSummary {
  total_maps: number;
  total_views: number;
  total_downloads: number;
  total_shares: number;
  profile_clicks: {
    website: number;
    linkedin: number;
  };
  daily_views: Array<{
    x: string;
    y: number;
  }>;
  daily_clicks: {
    website: Array<{
      x: string;
      y: number;
    }>;
    linkedin: Array<{
      x: string;
      y: number;
    }>;
  };
}

interface UserJourneyData {
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
}

interface ErrorTrackingData {
  metrics: {
    error_count: number;
    avg_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
    success_rate: number;
    memory_usage: number;
    cpu_usage: number;
  };
  recentErrors: Array<{
    error_type: string;
    error_message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'investigating' | 'resolved';
    timestamp: string;
    count: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    errors: number;
    response_time: number;
    success_rate: number;
  }>;
}

interface SystemLog {
  id: string;
  timestamp: string;
  event_type: string;
  user_id?: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
  component: string;
}

interface MetricsDataRow {
  feature_id: string;
  total_uses: number;
  unique_users: number;
  avg_duration: number;
  success_rate: number;
  map_features: {
    feature_name: string;
  };
}

export function InsightsPage() {
  const [timeframe, setTimeframe] = useState('monthly');
  const [showFilters, setShowFilters] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    total_maps: 0,
    total_views: 0,
    total_downloads: 0,
    total_shares: 0,
    profile_clicks: {
      website: 0,
      linkedin: 0
    },
    daily_views: [],
    daily_clicks: {
      website: [],
      linkedin: []
    }
  });
  const [coreMetrics, setCoreMetrics] = useState<CoreMetrics>({
    total_maps: 0,
    total_views: 0,
    total_downloads: 0,
    daily_active_users: 0,
    conversion_rate: 0,
    daily_metrics: []
  });
  const [userJourneyData, setUserJourneyData] = useState<UserJourneyData>({
    flowData: {
      nodes: [],
      links: []
    },
    sessionMetrics: {
      avgDuration: 0,
      bounceRate: 0,
      returnRate: 0,
      timeSeriesData: []
    }
  });
  const [errorTracking, setErrorTracking] = useState<ErrorTrackingData>({
    metrics: {
      error_count: 0,
      avg_response_time: 0,
      p95_response_time: 0,
      p99_response_time: 0,
      success_rate: 1,
      memory_usage: 0,
      cpu_usage: 0
    },
    recentErrors: [],
    timeSeriesData: []
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!session || !user || user.email !== 'admin@libralab.ai') {
          const pwd = prompt('Please enter the admin password:');
          if (!pwd) {
            navigate('/');
            return;
          }

          const { error } = await supabase.auth.signInWithPassword({
            email: 'admin@libralab.ai',
            password: pwd
          });

          if (error) {
            alert('Invalid password');
            navigate('/');
            return;
          }
        }

        setCurrentUser(user);
        setIsAdmin(true);

        // Only start fetching data after auth is confirmed
        await fetchData();
      } catch (err) {
        console.error('Auth error:', err);
        navigate('/');
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch your existing data here
      const today = startOfDay(new Date());
      const thirtyDaysAgo = subDays(today, 30);

      // Fetch map view events
      const { data: viewEvents } = await supabase
        .from('map_analytics_events')
        .select('created_at')
        .eq('event_name', 'map_viewed')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch download events
      const { data: downloadEvents } = await supabase
        .from('map_analytics_events')
        .select('created_at')
        .eq('event_name', 'map_download_completed')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch sharing events
      const { data: sharingEvents } = await supabase
        .from('map_analytics_events')
        .select('created_at')
        .eq('event_name', 'map_sharing_completed')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch website clicks
      const { data: websiteClicks } = await supabase
        .from('map_profile_link_clicks')
        .select('created_at')
        .eq('link_type', 'website')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch LinkedIn clicks
      const { data: linkedinClicks } = await supabase
        .from('map_profile_link_clicks')
        .select('created_at')
        .eq('link_type', 'linkedin')
        .gte('created_at', thirtyDaysAgo.toISOString());

      setAnalytics({
        total_maps: 0,
        total_views: viewEvents?.length || 0,
        total_downloads: downloadEvents?.length || 0,
        total_shares: sharingEvents?.length || 0,
        profile_clicks: {
          website: websiteClicks?.length || 0,
          linkedin: linkedinClicks?.length || 0
        },
        daily_views: [],
        daily_clicks: {
          website: [],
          linkedin: []
        }
      });

      // Fetch core metrics
      const [
        { count: totalMaps },
        { count: totalViews },
        { count: totalDownloads },
        { data: dailyEvents },
        { data: conversionData }
      ] = await Promise.all([
        supabase.from('maps').select('*', { count: 'exact', head: true }),
        supabase.from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_name', 'map_viewed'),
        supabase.from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_name', 'map_download_completed'),
        supabase.from('map_analytics_events')
          .select('event_name, session_id, timestamp')
          .gte('timestamp', thirtyDaysAgo.toISOString()),
        supabase.from('map_analytics_conversion_funnel')
          .select('*')
          .gte('day', thirtyDaysAgo.toISOString())
          .order('day', { ascending: false })
      ]);

      // Process daily metrics
      const dailyMetricsMap = new Map();
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        dailyMetricsMap.set(date, {
          date,
          maps_created: 0,
          active_users: 0,
          success_rate: 0
        });
      }

      // Calculate daily active users
      const todayEvents = dailyEvents?.filter(event => 
        format(new Date(event.timestamp), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      );
      const uniqueTodayUsers = new Set(todayEvents?.map(event => event.session_id)).size;

      // Process conversion funnel data
      const latestConversion = conversionData?.[0];
      const conversionRate = latestConversion 
        ? (latestConversion.completed / latestConversion.started) * 100 
        : 0;

      // Update daily metrics
      conversionData?.forEach(day => {
        const date = format(new Date(day.day), 'yyyy-MM-dd');
        if (dailyMetricsMap.has(date)) {
          dailyMetricsMap.set(date, {
            date,
            maps_created: day.completed || 0,
            active_users: day.started || 0,
            success_rate: day.completion_rate || 0
          });
        }
      });

      setCoreMetrics({
        total_maps: totalMaps || 0,
        total_views: totalViews || 0,
        total_downloads: totalDownloads || 0,
        daily_active_users: uniqueTodayUsers || 0,
        conversion_rate: conversionRate,
        daily_metrics: Array.from(dailyMetricsMap.values()).reverse()
      });

      // Fetch user journey data
      const { data: flowData } = await supabase
        .from('map_user_journey_flow')
        .select('*')
        .gte('timestamp', thirtyDaysAgo.toISOString());

      // Fetch session data
      const { data: sessionData } = await supabase
        .from('map_user_sessions')
        .select('*')
        .gte('start_time', thirtyDaysAgo.toISOString());

      // Process flow data
      const nodes = new Set<string>();
      const linkMap = new Map<string, number>();

      flowData?.forEach(flow => {
        nodes.add(flow.source_page);
        nodes.add(flow.target_page);
        const key = `${flow.source_page}-${flow.target_page}`;
        linkMap.set(key, (linkMap.get(key) || 0) + 1);
      });

      // Process session metrics
      const totalSessions = sessionData?.length || 0;
      const totalDuration = sessionData?.reduce((sum, session) => 
        sum + (session.duration || 0), 0) || 0;
      const bounceSessions = sessionData?.filter(s => s.is_bounce).length || 0;
      const returningSessions = sessionData?.filter(s => s.is_returning).length || 0;

      // Process daily metrics
      const dailyMetrics = new Map();
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        dailyMetrics.set(date, {
          date,
          avgDuration: 0,
          sessions: 0
        });
      }

      sessionData?.forEach(session => {
        const date = format(new Date(session.start_time), 'yyyy-MM-dd');
        if (dailyMetrics.has(date)) {
          const metrics = dailyMetrics.get(date);
          metrics.sessions += 1;
          metrics.avgDuration += session.duration || 0;
        }
      });

      // Calculate averages for daily metrics
      dailyMetrics.forEach(metrics => {
        if (metrics.sessions > 0) {
          metrics.avgDuration /= metrics.sessions;
        }
      });

      setUserJourneyData({
        flowData: {
          nodes: Array.from(nodes).map(id => ({
            id,
            nodeColor: '#4f46e5'
          })),
          links: Array.from(linkMap.entries()).map(([key, value]) => {
            const [source, target] = key.split('-');
            return { source, target, value };
          })
        },
        sessionMetrics: {
          avgDuration: totalSessions ? totalDuration / totalSessions : 0,
          bounceRate: totalSessions ? bounceSessions / totalSessions : 0,
          returnRate: totalSessions ? returningSessions / totalSessions : 0,
          timeSeriesData: Array.from(dailyMetrics.values())
        }
      });

      // Fetch error tracking data
      const { data: healthData } = await supabase
        .from('map_system_health_metrics')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: true });

      // Fetch recent errors
      const { data: errorData } = await supabase
        .from('map_error_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      // Process error data
      const errorCounts = new Map();
      errorData?.forEach(error => {
        const key = `${error.error_type}-${error.error_message}`;
        const count = (errorCounts.get(key)?.count || 0) + 1;
        errorCounts.set(key, {
          ...error,
          count
        });
      });

      // Get latest metrics
      const latestMetrics = healthData?.[healthData.length - 1] || {
        error_count: 0,
        avg_response_time: 0,
        p95_response_time: 0,
        p99_response_time: 0,
        success_rate: 1,
        memory_usage: 0,
        cpu_usage: 0
      };

      setErrorTracking({
        metrics: latestMetrics,
        recentErrors: Array.from(errorCounts.values()),
        timeSeriesData: healthData?.map(d => ({
          date: d.date,
          errors: d.error_count,
          response_time: d.avg_response_time,
          success_rate: d.success_rate
        })) || []
      });

      // Fetch leads
      const { data, error } = await supabase
        .from('map_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    }
  };

  // Transform data for charts
  const journeyFlowData = userJourneyData.flowData.nodes.map(node => ({
    step: node.id,
    users: userJourneyData.flowData.links.find(link => link.target === node.id)?.value || 0
  }));

  const featureUsageData = analytics.daily_views.map(view => ({
    feature: 'Map View',
    total: view.y,
    success: view.y
  }));

  const healthData = errorTracking.timeSeriesData.map(data => ({
    date: format(new Date(data.date), 'MMM yyyy'),
    errors: data.errors,
    responseTime: data.response_time,
    successRate: data.success_rate
  }));

  const navigate = useNavigate();

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const { error } = await supabase
        .from('map_leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Section */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Map Analytics Dashboard</h1>
          
          <div className="flex items-center gap-4">
            {/* Time Frame Selector */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4" />
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showFilters && (
                <div className="absolute top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-10">
                  {['daily', 'weekly', 'monthly'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setTimeframe(option);
                        setShowFilters(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded"
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Maps */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Maps</p>
                <p className="text-2xl font-bold">{coreMetrics.total_maps.toLocaleString()}</p>
                <p className="text-sm text-green-600">+12% from last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{coreMetrics.daily_active_users.toLocaleString()}</p>
                <p className="text-sm text-green-600">+8% from last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <p className="text-2xl font-bold">{errorTracking.metrics.success_rate.toFixed(1)}%</p>
                <p className="text-sm text-green-600">Excellent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Average Session Duration */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Session</p>
                <p className="text-2xl font-bold">
                  {Math.floor(userJourneyData.sessionMetrics.avgDuration / 60)}m {Math.floor(userJourneyData.sessionMetrics.avgDuration % 60)}s
                </p>
                <p className="text-sm text-green-600">+30s from last month</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* User Journey Flow */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">User Journey Flow</h3>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={journeyFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Feature Usage Stats */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Feature Usage</h3>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#8884d8" name="Total Attempts" />
                  <Bar dataKey="success" fill="#82ca9d" name="Successful" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* System Health Metrics */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">System Health Trends</h3>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#8884d8" 
                    name="Response Time (ms)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="successRate" 
                    stroke="#82ca9d" 
                    name="Success Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Error Monitoring */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Error Monitoring</h3>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="errors" fill="#ff8042" name="Error Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent System Alerts */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Recent System Alerts</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {errorTracking.recentErrors.map((error, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <AlertTriangle className={`h-5 w-5 ${
                  error.severity === 'critical' ? 'text-red-500' :
                  error.severity === 'high' ? 'text-orange-500' :
                  error.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{error.error_message}</p>
                  <p className="text-sm text-gray-500">{format(new Date(error.timestamp), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Recent Leads</h3>
        </div>
        <div className="p-6">
          <LeadsTable leads={leads} onStatusChange={handleStatusChange} />
        </div>
      </div>
    </div>
  );
}
