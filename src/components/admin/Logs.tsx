import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subMinutes, formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ChevronDownIcon,
  ArrowPathIcon,
  UsersIcon,
  MapIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowPathRoundedSquareIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

type EventCategory = 'user' | 'map' | 'error' | 'auth' | 'analytics' | 'system' | 'lead' | 'performance';

interface LogEvent {
  id: string;
  event_name: string;
  session_id: string | null;
  created_at: string;
  timestamp: string | null;
  event_data: Record<string, any>;
  feature_name: string | null;
  feature_metadata: Record<string, any> | null;
  error_type: string | null;
  error_message: string | null;
  performance_data: Record<string, any> | null;
  anonymous_id: string | null;
  user_id: string | null;
}

interface DatabaseLogEvent {
  id: string;
  event_name: string;
  session_id: string | null;
  created_at: string;
  timestamp: string | null;
  event_data: Record<string, any>;
  feature_name: string | null;
  feature_metadata: Record<string, any> | null;
  error_type: string | null;
  error_message: string | null;
  performance_data: Record<string, any> | null;
  anonymous_id: string | null;
  user_id: string | null;
}

const eventCategories: Record<EventCategory, {
  description: string;
  bgColor: string;
  textColor: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
}> = {
  user: {
    description: 'User Activity',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-900 dark:text-blue-100',
    icon: UsersIcon
  },
  map: {
    description: 'Map Interaction',
    bgColor: 'bg-green-100 dark:bg-green-900',
    textColor: 'text-green-900 dark:text-green-100',
    icon: MapIcon
  },
  error: {
    description: 'Error',
    bgColor: 'bg-red-100 dark:bg-red-900',
    textColor: 'text-red-900 dark:text-red-100',
    icon: ExclamationTriangleIcon
  },
  auth: {
    description: 'Authentication',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    textColor: 'text-purple-900 dark:text-purple-100',
    icon: UsersIcon
  },
  analytics: {
    description: 'Analytics',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    textColor: 'text-yellow-900 dark:text-yellow-100',
    icon: ChartBarIcon
  },
  system: {
    description: 'System',
    bgColor: 'bg-gray-100 dark:bg-gray-900',
    textColor: 'text-gray-900 dark:text-gray-100',
    icon: ArrowPathRoundedSquareIcon
  },
  lead: {
    description: 'Lead',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    textColor: 'text-indigo-900 dark:text-indigo-100',
    icon: UsersIcon
  },
  performance: {
    description: 'Performance',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    textColor: 'text-orange-900 dark:text-orange-100',
    icon: ChartBarIcon
  }
};

const getEventCategory = (log: LogEvent) => {
  if (log.error_type || log.error_message) {
    return 'error';
  }
  if (log.performance_data && Object.keys(log.performance_data).length > 0) {
    return 'performance';
  }
  
  // Check event name
  const eventName = log.event_name.toLowerCase();
  if (eventName.includes('map')) return 'map';
  if (eventName.includes('user')) return 'user';
  if (eventName.includes('auth')) return 'auth';
  if (eventName.includes('analytics')) return 'analytics';
  if (eventName.includes('lead')) return 'lead';
  
  return 'system';
};

function QuickStats({ logs }: { logs: LogEvent[] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const fiveMinutesAgo = subMinutes(now, 5);
    const recentLogs = logs.filter(log => new Date(log.created_at) > fiveMinutesAgo);
    
    return {
      total: logs.length,
      recent: recentLogs.length,
      errors: recentLogs.filter(log => getEventCategory(log) === 'error').length,
      sessions: new Set(recentLogs.map(log => log.session_id)).size
    };
  }, [logs]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="p-4 rounded-lg bg-card border">
        <div className="text-2xl font-semibold">{stats.recent}</div>
        <div className="text-sm text-muted-foreground">Events (5m)</div>
      </div>
      <div className="p-4 rounded-lg bg-card border">
        <div className="text-2xl font-semibold">{stats.sessions}</div>
        <div className="text-sm text-muted-foreground">Active Sessions</div>
      </div>
      <div className="p-4 rounded-lg bg-card border">
        <div className="text-2xl font-semibold text-red-500">{stats.errors}</div>
        <div className="text-sm text-muted-foreground">Recent Errors</div>
      </div>
      <div className="p-4 rounded-lg bg-card border">
        <div className="text-2xl font-semibold">{stats.total}</div>
        <div className="text-sm text-muted-foreground">Total Events</div>
      </div>
    </div>
  );
}

function LogEntry({ log }: { log: LogEvent }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const eventCategory = getEventCategory(log);
  const Icon = eventCategories[eventCategory].icon;
  
  const eventInfo = useMemo(() => {
    try {
      if (log.error_message) {
        return log.error_message;
      }

      const data = typeof log.event_data === 'string' ? JSON.parse(log.event_data) : log.event_data;
      
      if (eventCategory === 'error') {
        return data.error?.message || data.message || 'Unknown error';
      }
      
      if (eventCategory === 'map') {
        if (data.total_members) {
          return `Map created with ${data.total_members} members`;
        }
        return data.action || 'Map interaction';
      }
      
      if (eventCategory === 'lead') {
        return data.email || data.rating ? `Feedback rating: ${data.rating}` : 'Lead action';
      }
      
      if (eventCategory === 'performance') {
        const duration = data.metadata?.duration || data.duration;
        return duration ? `Performance event (${duration}ms)` : 'Performance event';
      }

      return log.event_name.replace(/_/g, ' ');
    } catch (e) {
      return log.event_name.replace(/_/g, ' ');
    }
  }, [log, eventCategory]);

  const eventDetails = useMemo(() => {
    try {
      const data = typeof log.event_data === 'string' ? JSON.parse(log.event_data) : log.event_data;
      return Object.entries(data).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      }));
    } catch (e) {
      return [];
    }
  }, [log.event_data]);

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "transition-all duration-200 ease-in-out",
        "rounded-lg border cursor-pointer",
        isExpanded ? "bg-muted" : "hover:bg-muted/50",
        eventCategory === 'error' && "border-red-500/50"
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <div className={cn("p-2 rounded-full bg-muted", eventCategories[eventCategory].bgColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {eventInfo}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
            {log.session_id && (
              <span>Session: {log.session_id.slice(0, 6)}</span>
            )}
          </div>
        </div>
        <ChevronDownIcon 
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} 
        />
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t mt-2 pt-3">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Event Type:</span>
              <span className="font-mono break-all">{log.event_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Timestamp:</span>
              <span className="font-mono">{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss.SSS')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Session ID:</span>
              <span className="font-mono break-all">{log.session_id}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Event Data:</div>
            <div className="bg-muted rounded-md p-2 overflow-x-auto">
              <pre className="text-xs break-all whitespace-pre-wrap">
                {eventDetails.map(({ key, value }) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-blue-500 dark:text-blue-400">{key}:</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Logs(): JSX.Element {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h' | '24h'>('15m');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
    const channel = setupRealtimeSubscription();

    return () => {
      channel.unsubscribe();
    };
  }, [timeRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const timeFilter = {
        '5m': 5,
        '15m': 15,
        '1h': 60,
        '24h': 1440
      }[timeRange];

      const { data, error: fetchError } = await supabase
        .from('map_analytics_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - timeFilter * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;
      
      // Transform the data to match our LogEvent interface
      const transformedData: LogEvent[] = (data as DatabaseLogEvent[] || []).map(item => ({
        ...item
      }));

      setLogs(transformedData);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    return supabase
      .channel('analytics_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'map_analytics_events'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as DatabaseLogEvent;
            setLogs(prev => [newEvent, ...prev].slice(0, 500));
          }
        }
      )
      .subscribe();
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (activeCategory && getEventCategory(log) !== activeCategory) {
        return false;
      }
      
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const eventData = typeof log.event_data === 'string' 
          ? log.event_data 
          : JSON.stringify(log.event_data);
          
        return (
          log.event_name?.toLowerCase().includes(searchLower) ||
          eventData.toLowerCase().includes(searchLower) ||
          log.session_id?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [logs, activeCategory, searchQuery]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Live Activity</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs}
            className="p-2 hover:bg-muted rounded-lg"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <QuickStats logs={logs} />

      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['5m', '15m', '1h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                  timeRange === range 
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 font-medium" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                Last {range}
              </button>
            ))}
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 rounded-full bg-gray-100 text-gray-900 placeholder:text-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
              !activeCategory 
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 font-medium"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            )}
          >
            All Events
          </button>
          {Object.entries(eventCategories).map(([key, { description }]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key as EventCategory)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                activeCategory === key 
                  ? cn(
                      eventCategories[key as EventCategory].bgColor,
                      eventCategories[key as EventCategory].textColor,
                      "font-medium"
                    )
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              {description}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No logs found</div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
