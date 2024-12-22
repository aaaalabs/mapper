import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { trackEvent, trackErrorWithContext, ErrorSeverity, ErrorCategory } from '../../services/analytics';

interface DatabaseEvent {
  id: string;
  created_at: string;
  event_type: string;
  event_data: Record<string, any>;
  feature_metadata: Record<string, any> | null;
  error_type: string | null;
  error_message: string | null;
  performance_data: Record<string, any> | null;
  anonymous_id: string | null;
  session_id: string | null;
  user_id: string | null;
}

interface AnalyticsEvent {
  id: string;
  created_at: string;
  event_type: string;
  event_data: Record<string, any>;
  feature_metadata?: Record<string, any>;
  error_type?: string;
  error_message?: string;
  performance_data?: Record<string, any>;
  anonymous_id?: string;
  session_id: string | null;
  user_id: string | null;
}

interface AnonymousSession {
  session_id: string;
  events: AnalyticsEvent[];
  first_seen: string;
  last_seen: string;
  total_events: number;
  event_types: string[];
  paths: string[];
}

interface Lead {
  id: string;
  created_at: string;
  email: string;
  name: string;
  lead_type: string;
  status: 'pending' | 'converted' | 'rejected';
  session_id: string;
  event_data?: Record<string, any>;
  community_link?: string;
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [anonymousSessions, setAnonymousSessions] = useState<AnonymousSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      // First get all leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('map_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) {
        setError(leadsError.message);
        trackErrorWithContext(leadsError, {
          category: ErrorCategory.LEAD,
          subcategory: 'FETCH',
          severity: ErrorSeverity.HIGH,
          metadata: { error: leadsError.message }
        });
        return;
      }

      // Then get all analytics events
      const { data: eventsData, error: eventsError } = await supabase
        .from('map_analytics_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) {
        setError(eventsError.message);
        trackErrorWithContext(eventsError, {
          category: ErrorCategory.LEAD,
          subcategory: 'FETCH_EVENTS',
          severity: ErrorSeverity.HIGH,
          metadata: { error: eventsError.message }
        });
        return;
      }

      // Group events by session
      const sessionMap = new Map<string, AnalyticsEvent[]>();
      (eventsData as DatabaseEvent[] || []).forEach(event => {
        if (event.session_id) {
          const events = sessionMap.get(event.session_id) || [];
          events.push({
            id: event.id,
            created_at: event.created_at,
            event_type: event.event_type,
            event_data: event.event_data || {},
            feature_metadata: event.feature_metadata || undefined,
            error_type: event.error_type || undefined,
            error_message: event.error_message || undefined,
            performance_data: event.performance_data || undefined,
            anonymous_id: event.anonymous_id || undefined,
            session_id: event.session_id,
            user_id: event.user_id
          });
          sessionMap.set(event.session_id, events);
        }
      });

      // Create anonymous sessions
      const sessions: AnonymousSession[] = Array.from(sessionMap.entries()).map(([sessionId, events]) => {
        const eventTypes = [...new Set(events.map(e => e.event_type))];
        const paths = [...new Set(events.map(e => e.event_data.path || '').filter(Boolean))];
        
        return {
          session_id: sessionId,
          events,
          first_seen: events[events.length - 1].created_at,
          last_seen: events[0].created_at,
          total_events: events.length,
          event_types: eventTypes,
          paths
        };
      });

      setLeads(leadsData as Lead[] || []);
      setAnonymousSessions(sessions);

      await trackEvent({
        event_type: 'admin.leads.viewed',
        event_data: {
          leads_count: leadsData?.length || 0,
          anonymous_sessions: sessions.length,
          anonymous_leads: sessions.filter(session => !leadsData?.some(lead => lead.session_id === session.session_id)).length
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch leads';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white dark:bg-gray-800 shadow-lg sm:rounded-3xl sm:p-20">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
            <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Loading leads...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white dark:bg-gray-800 shadow-lg sm:rounded-3xl sm:p-20">
            <div className="flex justify-center text-red-500">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Total Leads
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {leads.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Converted Leads
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {leads.filter(lead => lead.status === 'converted').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Total Sessions
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {anonymousSessions.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Anonymous Leads
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {anonymousSessions.filter(session => !leads.some(lead => lead.session_id === session.session_id)).length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anonymous Sessions Overview */}
        {anonymousSessions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Anonymous Sessions Overview
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
                Sessions without associated leads
              </p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:px-6">
                <div className="space-y-4">
                  {anonymousSessions
                    .filter(session => !leads.some(lead => lead.session_id === session.session_id))
                    .map(session => (
                      <div key={session.session_id} className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                          <h4 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                            Session ID: {session.session_id}
                          </h4>
                          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">First Seen</p>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {new Date(session.first_seen).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Last Seen</p>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {new Date(session.last_seen).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Events</p>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">{session.total_events}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Event Types</p>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {session.event_types.join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Paths Visited</p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {session.paths.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leads List */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-xl sm:rounded-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Leads Dashboard</h2>
            
            <div className="space-y-8">
              {leads.map((lead) => (
                <div key={lead.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        {lead.name}
                      </h3>
                      <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-300">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {lead.email}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
                        lead.status === 'converted'
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : lead.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-white dark:bg-gray-600 overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Lead Type
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {lead.lead_type}
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-600 overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Created At
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {new Date(lead.created_at).toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>

                  {lead.event_data && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300">Event Data</h4>
                      <pre className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600 rounded p-2 overflow-x-auto">
                        {JSON.stringify(lead.event_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {anonymousSessions.find(session => session.session_id === lead.session_id) && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300">Session Activity</h4>
                      <div className="mt-2 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                              <thead>
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">Event Type</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Timestamp</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Details</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {anonymousSessions
                                  .find(session => session.session_id === lead.session_id)
                                  ?.events.map((event) => (
                                    <tr key={event.id}>
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">{event.event_type}</td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{new Date(event.created_at).toLocaleString()}</td>
                                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                        <pre className="whitespace-pre-wrap">
                                          {JSON.stringify(event.event_data, null, 2)}
                                        </pre>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
