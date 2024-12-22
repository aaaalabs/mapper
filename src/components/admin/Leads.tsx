import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { trackEvent, trackErrorWithContext, ErrorCategory, ErrorSeverity } from '../../services/analytics';
import { Lead } from '../../types/lead';
import { DatabaseEvent, AnalyticsEvent } from '../../types/events';
import { SessionAnalytics, TimeFilter, LeadMetrics, AnonymousMetrics, ConversionPath } from '../../types/analytics';
import { calculateLeadMetrics, calculateAnonymousMetrics, buildConversionPaths, getTimeFilterDates } from '../../utils/analytics';
import { MetricCard } from './dashboard/MetricCard';
import { TimeFilter as TimeFilterComponent } from './dashboard/TimeFilter';

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sessions, setSessions] = useState<SessionAnalytics[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(getTimeFilterDates('24h'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'anonymous' | 'conversions'>('overview');
  const [metrics, setMetrics] = useState<{
    leads: LeadMetrics;
    anonymous: AnonymousMetrics;
    conversions: ConversionPath[];
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch events
      const { data: events, error: eventsError } = await supabase
        .from('map_analytics_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('map_leads')
        .select('*');

      if (leadsError) throw leadsError;

      // Group events by session
      const sessionMap = new Map<string, DatabaseEvent[]>();
      events?.forEach((event: DatabaseEvent) => {
        if (event.session_id) {
          const events = sessionMap.get(event.session_id) || [];
          const analyticsEvent: AnalyticsEvent = {
            ...event,
            type: event.event_name, // Set type to match event_name
            metadata: event.event_data, // Map event_data to metadata
            timestamp: event.created_at,
          };
          events.push(analyticsEvent);
          sessionMap.set(event.session_id, events);
        }
      });

      // Process each session's events
      const sessions = Array.from(sessionMap.entries()).map(([sessionId, events]) => {
        // Sort events by timestamp to ensure correct order
        const sortedEvents = events.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        const duration = new Date(lastEvent.created_at).getTime() - new Date(firstEvent.created_at).getTime();
        
        const paths = [...new Set(events.map(e => e.event_data?.path || '').filter(Boolean))];
        const eventNames = [...new Set(events.map(e => e.event_name))];
        
        const lead = (leadsData as Lead[]).find(l => l.session_id === sessionId);
        
        return {
          session_id: sessionId,
          first_seen: firstEvent.created_at,
          last_seen: lastEvent.created_at,
          total_events: events.length,
          paths,
          event_names: eventNames,
          duration,
          converted: !!lead,
          conversion_type: lead?.lead_type,
          conversion_time: lead?.created_at,
          events: sortedEvents
        };
      });

      setLeads(leadsData as Lead[]);
      setSessions(sessions);

      // Calculate metrics
      const leadMetrics = calculateLeadMetrics(leadsData as Lead[], sessions, timeFilter);
      const anonymousMetrics = calculateAnonymousMetrics(sessions, timeFilter);
      const conversionPaths = buildConversionPaths(sessions, timeFilter);

      setMetrics({
        leads: leadMetrics,
        anonymous: anonymousMetrics,
        conversions: conversionPaths
      });

      await trackEvent({
        event_name: 'admin.leads.viewed',
        event_data: {
          leads_count: leadMetrics.total_leads,
          anonymous_sessions: anonymousMetrics.total_visitors,
          conversion_rate: leadMetrics.conversion_rate
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch data';
      setError(message);
      trackErrorWithContext(error instanceof Error ? error : new Error(message), {
        category: ErrorCategory.LEAD,
        subcategory: 'FETCH',
        severity: ErrorSeverity.HIGH,
        metadata: { error: message }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading data</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Filter */}
        <TimeFilterComponent
          selected={timeFilter.label as '24h' | '7d' | '30d'}
          onChange={(filter) => setTimeFilter(getTimeFilterDates(filter))}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Leads"
            value={metrics?.leads.total_leads || 0}
            icon={
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Conversion Rate"
            value={`${(metrics?.leads.conversion_rate || 0).toFixed(1)}%`}
            icon={
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <MetricCard
            title="Active Sessions"
            value={metrics?.anonymous.active_sessions || 0}
            icon={
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
          <MetricCard
            title="Avg Time to Convert"
            value={`${Math.round((metrics?.leads.avg_time_to_convert || 0) / 1000 / 60)}m`}
            icon={
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="sm:hidden">
            <select
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
            >
              <option value="overview">Overview</option>
              <option value="leads">Leads</option>
              <option value="anonymous">Anonymous</option>
              <option value="conversions">Conversions</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'leads', name: 'Leads' },
                { id: 'anonymous', name: 'Anonymous' },
                { id: 'conversions', name: 'Conversions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-100'
                      : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
                  } px-3 py-2 font-medium text-sm rounded-md`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Lead Types Distribution */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Lead Types</h3>
                <div className="space-y-4">
                  {Object.entries(metrics?.leads.by_type || {}).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-300 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Paths */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Popular Paths</h3>
                <div className="space-y-4">
                  {metrics?.anonymous.top_paths.map(({ path, count }) => (
                    <div key={path} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-300 truncate max-w-[200px]">
                        {path}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="flow-root">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leads.map((lead) => (
                    <li key={lead.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {lead.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-300">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                            {lead.lead_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'anonymous' && (
            <div className="space-y-6">
              {sessions
                .filter(session => !session.converted)
                .map((session) => (
                  <div key={session.session_id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Session {session.session_id.slice(-6)}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {new Date(session.first_seen).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">Paths Visited</h5>
                        <div className="flex flex-wrap gap-2">
                          {session.paths.map((path) => (
                            <span
                              key={path}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            >
                              {path}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">Events</h5>
                        <div className="flex flex-wrap gap-2">
                          {session.event_names.map((event) => (
                            <span
                              key={event}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'conversions' && (
            <div className="space-y-6">
              {metrics?.conversions.map((path) => (
                <div key={path.session_id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {path.converted_to?.replace('_', ' ')} Conversion
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-300">
                      {Math.round(path.total_duration / 1000 / 60)}m journey
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    <ul className="space-y-4 relative">
                      {path.events.map((event, index) => (
                        <li key={index} className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {event.event_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-300">
                              {event.path} • {Math.round(event.duration_since_start / 1000)}s
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
