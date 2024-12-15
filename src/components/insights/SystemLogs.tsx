import React, { useState } from 'react';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: string;
  event_type: string;
  user_id?: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
  component: string;
}

interface SystemLogsProps {
  logs: LogEntry[];
  isLoading: boolean;
}

const LogSeverityBadge = ({ severity }: { severity: LogEntry['severity'] }) => {
  const colors = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[severity]}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
    ))}
  </div>
);

export function SystemLogs({ logs, isLoading }: SystemLogsProps) {
  const [filter, setFilter] = useState<LogEntry['severity'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) return <LoadingSkeleton />;

  const filteredLogs = logs.filter(log => {
    const matchesSeverity = filter === 'all' || log.severity === filter;
    const matchesSearch = searchTerm === '' || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.component.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex space-x-2">
            {['all', 'info', 'warning', 'error'].map((severity) => (
              <button
                key={severity}
                onClick={() => setFilter(severity as typeof filter)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === severity
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-gray-200">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No logs found matching your criteria
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <LogSeverityBadge severity={log.severity} />
                    <span className="text-sm text-gray-500">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {log.component}
                    </span>
                  </div>
                  <h4 className="mt-1 text-sm font-medium text-gray-900">
                    {log.event_type}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                    {log.details}
                  </p>
                  {log.user_id && (
                    <p className="mt-1 text-xs text-gray-500">
                      User ID: {log.user_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
