import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subMonths, subWeeks, subYears, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { adminStyles as styles } from './styles/adminStyles';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  ChevronDownIcon,
  ArrowPathIcon,
  FunnelIcon,
  ClockIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface LogEvent {
  id: string;
  event_name: string;
  event_data: string;
  session_id: string;
  timestamp: string;
  created_at: string;
}

type TimeFilter = '1w' | '2w' | '1m' | '2m' | '1y' | 'all';
type TopLevelCategory = 'business' | 'technical' | 'user' | 'system';
type EntryLimit = 25 | 50 | 100 | 500 | 1000;

const timeFilterOptions: Record<TimeFilter, { label: string; getDate: () => Date }> = {
  '1w': { label: '1 Week', getDate: () => subWeeks(new Date(), 1) },
  '2w': { label: '2 Weeks', getDate: () => subWeeks(new Date(), 2) },
  '1m': { label: '1 Month', getDate: () => subMonths(new Date(), 1) },
  '2m': { label: '2 Months', getDate: () => subMonths(new Date(), 2) },
  '1y': { label: '1 Year', getDate: () => subYears(new Date(), 1) },
  'all': { label: 'All Time', getDate: () => new Date(0) }
};

const eventCategories = {
  auth: { 
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    icon: '🔐',
    description: 'Authentication',
    topLevel: 'technical' as TopLevelCategory
  },
  error: { 
    color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    icon: '⚠️',
    description: 'Errors',
    topLevel: 'technical' as TopLevelCategory
  },
  payment: { 
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    icon: '💳',
    description: 'Payments',
    topLevel: 'business' as TopLevelCategory
  },
  order: {
    color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
    icon: '📦',
    description: 'Orders',
    topLevel: 'business' as TopLevelCategory
  },
  analytics: { 
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    icon: '📊',
    description: 'Analytics',
    topLevel: 'technical' as TopLevelCategory
  },
  map: { 
    color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    icon: '🗺️',
    description: 'Map Events',
    topLevel: 'user' as TopLevelCategory
  },
  user: { 
    color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20',
    icon: '👤',
    description: 'User Events',
    topLevel: 'user' as TopLevelCategory
  },
  system: { 
    color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
    icon: '🔧',
    description: 'System',
    topLevel: 'system' as TopLevelCategory
  }
};

const topLevelCategories: Record<TopLevelCategory, { icon: string; color: string; description: string }> = {
  business: {
    icon: '💼',
    color: 'text-emerald-600 dark:text-emerald-400',
    description: 'Business Events'
  },
  technical: {
    icon: '⚙️',
    color: 'text-blue-600 dark:text-blue-400',
    description: 'Technical Events'
  },
  user: {
    icon: '👥',
    color: 'text-violet-600 dark:text-violet-400',
    description: 'User Events'
  },
  system: {
    icon: '🖥️',
    color: 'text-gray-600 dark:text-gray-400',
    description: 'System Events'
  }
};

const ENTRY_LIMITS: EntryLimit[] = [25, 50, 100, 500, 1000];
const DEFAULT_ENTRY_LIMIT: EntryLimit = 25;

function LogEntry({ log }: { log: LogEvent }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const category = getEventCategory(log.event_name);
  const topLevel = eventCategories[category].topLevel;
  
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(log.event_data);
    } catch {
      return {};
    }
  }, [log.event_data]);

  // Extract detailed information based on event type
  const details = useMemo(() => {
    const info: { label: string; value: string | number; type?: 'status' | 'error' | 'info' }[] = [];
    
    if (log.event_name === 'error') {
      // Enhanced error display
      info.push(
        { 
          label: 'Category',
          value: `${parsedData.category}${parsedData.subcategory ? ` / ${parsedData.subcategory}` : ''}`,
          type: 'info'
        },
        { 
          label: 'Severity',
          value: parsedData.severity || 'unknown',
          type: 'error'
        },
        { 
          label: 'Message',
          value: parsedData.error?.message || 'No message',
          type: 'error'
        }
      );

      // Add recovery action if present
      if (parsedData.recoveryAction) {
        info.push({
          label: 'Recovery',
          value: `${parsedData.recoveryAction.type}: ${parsedData.recoveryAction.description}`,
          type: 'info'
        });
      }

      // Add component info if present
      if (parsedData.componentName) {
        info.push({
          label: 'Component',
          value: parsedData.componentName,
          type: 'info'
        });
      }

    } else if (log.event_name === 'error_recovery') {
      info.push(
        {
          label: 'Status',
          value: parsedData.successful ? 'Recovered' : 'Failed',
          type: 'status'
        },
        {
          label: 'Method',
          value: parsedData.recovery_method,
          type: 'info'
        }
      );
    } else if (category === 'order') {
      info.push(
        {
          label: 'Status',
          value: parsedData.status || 'Unknown',
          type: 'status'
        },
        {
          label: 'Amount',
          value: parsedData.amount ? `$${parsedData.amount}` : 'N/A',
          type: 'info'
        },
        {
          label: 'Customer',
          value: parsedData.customer?.email || 'Anonymous',
          type: 'info'
        }
      );
    } else if (category === 'payment') {
      info.push(
        {
          label: 'Status',
          value: parsedData.status || 'Unknown',
          type: 'status'
        },
        {
          label: 'Amount',
          value: parsedData.amount ? `$${parsedData.amount}` : 'N/A',
          type: 'info'
        },
        {
          label: 'Method',
          value: parsedData.method || 'N/A',
          type: 'info'
        }
      );
    } else if (category === 'user') {
      info.push(
        {
          label: 'Action',
          value: parsedData.action || 'Unknown',
          type: 'info'
        },
        {
          label: 'Page',
          value: parsedData.page || 'N/A',
          type: 'info'
        }
      );
    } else if (category === 'map') {
      info.push(
        {
          label: 'Action',
          value: parsedData.action || 'View',
          type: 'info'
        },
        {
          label: 'Zoom',
          value: parsedData.zoom || 'N/A',
          type: 'info'
        }
      );
    }

    return info;
  }, [parsedData, category, log.event_name]);

  return (
    <div 
      className={cn(
        "group px-3 py-2 hover:bg-muted/50 border-l-2 cursor-pointer",
        isExpanded ? "border-l-accent bg-muted/30" : "border-transparent"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-base">
          <span className="opacity-70" role="img" aria-label={topLevelCategories[topLevel].description}>
            {topLevelCategories[topLevel].icon}
          </span>
          <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
          <span className="opacity-70" role="img" aria-label={category}>
            {eventCategories[category].icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "px-1.5 py-0.5 rounded-sm text-xs font-medium",
              eventCategories[category].color
            )}>
              {log.event_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
            </span>
            <span className="text-xs text-muted-foreground/70">
              ID: {log.session_id.slice(0, 6)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {details.map((detail, i) => (
              <span 
                key={i} 
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
                  detail.type === 'status' && parsedData.status === 'error' && "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                  detail.type === 'status' && parsedData.status === 'success' && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                  detail.type === 'status' && parsedData.status === 'pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
                  detail.type === 'error' && "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                  detail.type === 'info' && "bg-muted text-muted-foreground"
                )}
              >
                <span className="font-medium">{detail.label}:</span>
                <span>{detail.value}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(log.event_data);
            }}
            className="p-1 hover:bg-accent/10 rounded"
            title="Copy data"
          >
            <DocumentDuplicateIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-2 pl-6">
          <pre className="p-2 rounded bg-muted text-xs overflow-auto">
            <code>{JSON.stringify(parsedData, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function FilterBar({
  timeFilter,
  setTimeFilter,
  activeFilters,
  eventTypes,
  toggleFilter,
  onRefresh,
  entryLimit,
  setEntryLimit
}: {
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
  activeFilters: Set<string>;
  eventTypes: Map<string, number>;
  toggleFilter: (type: string) => void;
  onRefresh: () => void;
  entryLimit: EntryLimit;
  setEntryLimit: (limit: EntryLimit) => void;
}) {
  const [openCategory, setOpenCategory] = useState<TopLevelCategory | null>(null);
  const [showLimitDropdown, setShowLimitDropdown] = useState(false);

  const categorizedEvents = useMemo(() => {
    const categories = new Map<TopLevelCategory, { types: string[]; count: number }>();
    
    for (const [type, count] of eventTypes.entries()) {
      const category = eventCategories[getEventCategory(type)].topLevel;
      const existing = categories.get(category) || { types: [], count: 0 };
      existing.types.push(type);
      existing.count += count;
      categories.set(category, existing);
    }

    return categories;
  }, [eventTypes]);

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b border-border">
      <div className="p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {Object.entries(timeFilterOptions).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setTimeFilter(key as TimeFilter)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-sm transition-colors",
                      timeFilter === key 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowLimitDropdown(!showLimitDropdown)}
                className={cn(
                  "px-2 py-1 text-xs rounded-sm transition-colors flex items-center gap-1",
                  showLimitDropdown ? "bg-muted" : "hover:bg-muted/50"
                )}
              >
                {entryLimit} entries
                <ChevronDownIcon 
                  className={cn(
                    "h-3 w-3 transition-transform",
                    showLimitDropdown ? "rotate-180" : ""
                  )}
                />
              </button>
              {showLimitDropdown && (
                <div className="absolute top-full left-0 mt-1 py-1 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/85 rounded-sm border shadow-md min-w-[100px] z-50">
                  {ENTRY_LIMITS.map(limit => (
                    <button
                      key={limit}
                      onClick={() => {
                        setEntryLimit(limit);
                        setShowLimitDropdown(false);
                      }}
                      className={cn(
                        "w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center justify-between",
                        entryLimit === limit && "text-accent"
                      )}
                    >
                      {limit} entries
                      {entryLimit === limit && (
                        <span className="text-accent">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="p-1.5 hover:bg-accent/10 rounded transition-colors"
            title="Refresh logs"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            {(Object.keys(topLevelCategories) as TopLevelCategory[]).map(category => {
              const events = categorizedEvents.get(category);
              if (!events) return null;

              return (
                <div key={category} className="relative">
                  <button
                    onClick={() => setOpenCategory(openCategory === category ? null : category)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-sm transition-colors flex items-center gap-1",
                      openCategory === category ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <span className="opacity-70">{topLevelCategories[category].icon}</span>
                    <span className={topLevelCategories[category].color}>
                      {events.count}
                    </span>
                    <ChevronDownIcon 
                      className={cn(
                        "h-3 w-3 transition-transform",
                        openCategory === category ? "rotate-180" : ""
                      )}
                    />
                  </button>
                  {openCategory === category && (
                    <div className="absolute top-full left-0 mt-1 py-1 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/85 rounded-sm border shadow-md min-w-[120px] z-50">
                      {events.types.map(type => (
                        <button
                          key={type}
                          onClick={() => toggleFilter(type)}
                          className={cn(
                            "w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2",
                            activeFilters.has(type) && eventCategories[getEventCategory(type)].color
                          )}
                        >
                          <span className="opacity-70">
                            {eventCategories[getEventCategory(type)].icon}
                          </span>
                          <span className="flex-1">{type}</span>
                          <span className="text-muted-foreground">
                            {eventTypes.get(type)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {activeFilters.size > 0 && (
            <button
              onClick={() => activeFilters.forEach(f => toggleFilter(f))}
              className="p-1 hover:bg-accent/10 rounded transition-colors"
              title="Clear filters"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getEventCategory(eventName: string): keyof typeof eventCategories {
  const type = eventName.toLowerCase();
  if (type.includes('error')) return 'error';
  if (type.includes('auth') || type.includes('login')) return 'auth';
  if (type.includes('payment')) return 'payment';
  if (type.includes('order')) return 'order';
  if (type.includes('analytics')) return 'analytics';
  if (type.includes('map')) return 'map';
  if (type.includes('user')) return 'user';
  return 'system';
}

/**
 * Admin Logs Component
 * Displays real-time analytics events with filtering and error highlighting
 */
export function Logs(): JSX.Element {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [eventTypes, setEventTypes] = useState<Map<string, number>>(new Map());
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1w');
  const [entryLimit, setEntryLimit] = useState<EntryLimit>(DEFAULT_ENTRY_LIMIT);

  useEffect(() => {
    fetchLogs();
    const channel = setupRealtimeSubscription();
    setSubscription(channel);

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [timeFilter, entryLimit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('map_analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .not('event_name', 'like', '%admin%')  // Filter out admin events
        .limit(entryLimit);

      if (fetchError) throw fetchError;

      const events = data || [];
      setLogs(events);
      updateEventTypes(events);
    } catch (err) {
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
          table: 'map_analytics_events',
          filter: 'event_name!like=%admin%'  // Filter out admin events
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLogs(prev => [payload.new as LogEvent, ...prev].slice(0, entryLimit));
            updateEventTypes([payload.new as LogEvent]);
          }
        }
      )
      .subscribe();
  };

  const updateEventTypes = (events: LogEvent[]) => {
    const types = new Map<string, number>();
    
    events.forEach(event => {
      const baseType = event.event_name.split('.')[0];
      types.set(baseType, (types.get(baseType) || 0) + 1);
    });

    setEventTypes(new Map([...types.entries()].sort()));
  };

  const toggleFilter = (type: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setActiveFilters(newFilters);
  };

  const getFilteredLogs = () => {
    const cutoffDate = timeFilterOptions[timeFilter].getDate();
    
    return logs.filter(log => {
      const passesTimeFilter = isAfter(new Date(log.timestamp), cutoffDate);
      if (!passesTimeFilter) return false;
      
      if (activeFilters.size === 0) return true;
      const baseType = log.event_name.split('.')[0];
      return activeFilters.has(baseType);
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading logs...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  const filteredLogs = getFilteredLogs();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>System Logs</h1>
      </div>

      <FilterBar
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        activeFilters={activeFilters}
        eventTypes={eventTypes}
        toggleFilter={toggleFilter}
        onRefresh={fetchLogs}
        entryLimit={entryLimit}
        setEntryLimit={setEntryLimit}
      />

      <div className="mt-4 space-y-2 p-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No logs found for the selected filters
          </div>
        ) : (
          filteredLogs.map(log => (
            <LogEntry key={log.id} log={log} />
          ))
        )}
      </div>
    </div>
  );
}
