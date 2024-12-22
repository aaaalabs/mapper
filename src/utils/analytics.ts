import { LeadMetrics, AnonymousMetrics, ConversionPath, SessionAnalytics, TimeFilter } from '../types/analytics';
import { Lead } from '../types/lead';
import { DatabaseEvent, AnalyticsEvent } from '../types/events';

export const calculateLeadMetrics = (
  leads: Lead[],
  sessionAnalytics: SessionAnalytics[],
  timeFilter: TimeFilter
): LeadMetrics => {
  const filteredLeads = leads.filter(
    lead => new Date(lead.created_at) >= timeFilter.start && new Date(lead.created_at) <= timeFilter.end
  );

  const totalVisitors = sessionAnalytics.length;
  const conversionRate = totalVisitors ? (filteredLeads.length / totalVisitors) * 100 : 0;

  const byType = filteredLeads.reduce(
    (acc, lead) => {
      acc[lead.lead_type as keyof typeof acc]++;
      return acc;
    },
    { beta_waitlist: 0, data_extraction: 0, feedback: 0 }
  );

  // Calculate average time to convert
  const conversionTimes = sessionAnalytics
    .filter(s => s.converted && s.conversion_time)
    .map(s => new Date(s.conversion_time!).getTime() - new Date(s.first_seen).getTime());

  const avgTimeToConvert = conversionTimes.length
    ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length
    : 0;

  return {
    total_leads: filteredLeads.length,
    by_type: byType,
    conversion_rate: conversionRate,
    avg_time_to_convert: avgTimeToConvert,
  };
};

export const calculateAnonymousMetrics = (
  sessions: SessionAnalytics[],
  timeFilter: TimeFilter
): AnonymousMetrics => {
  const { start, end } = timeFilter;

  // Filter sessions within time range
  const filteredSessions = sessions.filter(session => {
    const sessionTime = new Date(session.first_seen);
    return sessionTime >= start && sessionTime <= end;
  });

  // Get active sessions (activity in last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const activeSessions = filteredSessions.filter(
    session => new Date(session.last_seen) >= oneHourAgo
  );

  // Calculate average session duration
  const avgDuration = filteredSessions.reduce((acc, session) => acc + session.duration, 0) / filteredSessions.length;

  // Calculate top paths
  const pathCounts = filteredSessions
    .flatMap(s => s.paths)
    .reduce((acc: { [key: string]: number }, path: string) => {
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {});

  const topPaths = Object.entries(pathCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([path, count]) => ({ path, count }));

  // Calculate top events
  const eventCounts = filteredSessions
    .flatMap(s => s.event_names)
    .reduce((acc: { [key: string]: number }, event: string) => {
      acc[event] = (acc[event] || 0) + 1;
      return acc;
    }, {});

  const topEvents = Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([event, count]) => ({ event, count }));

  return {
    total_visitors: filteredSessions.length,
    active_sessions: activeSessions.length,
    avg_session_duration: avgDuration,
    top_paths: topPaths,
    top_events: topEvents,
  };
};

export const buildConversionPaths = (
  sessions: SessionAnalytics[],
  timeFilter: TimeFilter
): ConversionPath[] => {
  const { start, end } = timeFilter;

  return sessions
    .filter(session => {
      const sessionTime = new Date(session.first_seen);
      return sessionTime >= start && sessionTime <= end && session.converted;
    })
    .map(session => {
      const startTime = new Date(session.first_seen).getTime();
      
      return {
        session_id: session.session_id,
        events: session.event_names.map((eventName: string, index: number) => ({
          event_name: eventName,
          timestamp: new Date(startTime + index * 1000).toISOString(), // Approximate for now
          path: session.paths[index] || '',
          duration_since_start: index * 1000, // Approximate for now
        })),
        converted_to: session.conversion_type as 'waitlist' | 'extraction' | 'feedback',
        total_duration: session.duration,
      };
    });
};

export const getTimeFilterDates = (filter: TimeFilter['label']): TimeFilter => {
  const now = new Date();
  const end = now;
  let start: Date;

  switch (filter) {
    case '24h':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      throw new Error('Invalid time filter');
  }

  return {
    start,
    end,
    label: filter,
  };
};
