import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { adminStyles as styles } from './styles/adminStyles';
import type { FeedbackMetadata, FeedbackStatus } from '@/types/feedback';

interface FeedbackEntry {
  id: string;
  created_at: string;
  rating: number;
  feedback_type: string;
  status: FeedbackStatus;
  metadata: FeedbackMetadata;
}

type FilterStatus = 'all' | FeedbackStatus;
type SortField = 'created_at' | 'rating' | 'status';

export function Feedback() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('map_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setFeedback(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: FeedbackStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('map_feedback')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setFeedback(prev => prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredFeedback = feedback.filter(entry => 
    filterStatus === 'all' || entry.status === filterStatus
  );

  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return sortAsc ? -1 : 1;
    if (bValue === null || bValue === undefined) return sortAsc ? 1 : -1;
    
    const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    return sortAsc ? comparison : -comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getMetadataString = (entry: FeedbackEntry) => {
    const metadata = entry.metadata || {};
    return [
      metadata.email && `Email: ${metadata.email}`,
      metadata.name && `Name: ${metadata.name}`,
      metadata.feedback_text && `Feedback: ${metadata.feedback_text}`,
      metadata.location && `Location: ${metadata.location}`,
      metadata.source && `Source: ${metadata.source}`,
      metadata.context && `Context: ${metadata.context}`
    ].filter(Boolean).join('\n');
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={cn(styles.pageHeader, "flex justify-between items-center")}>
        <h1 className={cn(styles.pageTitle, "text-2xl font-bold")}>Feedback</h1>
        <div className="space-x-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className={cn(styles.select, "bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500")}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="approved">Approved</option>
            <option value="featured">Featured</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className={cn(styles.panel, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className={cn(styles.table, "min-w-full divide-y divide-gray-200")}>
            <thead className={cn(styles.tableHeader, "bg-gray-50 dark:bg-gray-800")}>
              <tr>
                <th className={cn(styles.tableHeaderCell, "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider")}>Date</th>
                <th className={cn(styles.tableHeaderCell, "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider")}>Contact</th>
                <th className={cn(styles.tableHeaderCell, "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider")}>Feedback</th>
                <th className={cn(styles.tableHeaderCell, "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider")}>Metadata</th>
                <th 
                  className={cn(styles.tableHeaderCell, "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800")}
                  onClick={() => {
                    toggleSort('status');
                  }}
                >
                  Status {sortField === 'status' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className={cn(styles.tableHeaderCell, "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider")}>Actions</th>
              </tr>
            </thead>
            <tbody className={cn(styles.tableBody, "bg-white divide-y divide-gray-200")}>
              {sortedFeedback.map((entry) => (
                <tr key={entry.id}>
                  <td className={cn(styles.tableCell, "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900")}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className={cn(styles.tableCell, "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900")}>
                    {entry.metadata.email ? (
                      <a 
                        href={`mailto:${entry.metadata.email}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {entry.metadata.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td className={cn(styles.tableCell, "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900")}>
                    {entry.metadata.feedback_text || '-'}
                  </td>
                  <td className={cn(styles.tableCell, "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900")}>
                    <div className="space-y-1">
                      {getMetadataString(entry)}
                    </div>
                  </td>
                  <td className={cn(styles.tableCell, "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900")}>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', {
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': entry.status === 'pending',
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300': entry.status === 'contacted',
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': entry.status === 'approved',
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300': entry.status === 'featured',
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300': entry.status === 'archived'
                    })}>
                      {entry.status}
                    </span>
                  </td>
                  <td className={cn(styles.tableCell, "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900")}>
                    <div className="space-x-2">
                      {entry.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(entry.id, 'contacted')}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Contact
                          </button>
                          <button
                            onClick={() => updateStatus(entry.id, 'approved')}
                            className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Approve
                          </button>
                          {entry.metadata.can_feature && (
                            <button
                              onClick={() => updateStatus(entry.id, 'featured')}
                              className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                              Feature
                            </button>
                          )}
                        </>
                      )}
                      {entry.status !== 'archived' && (
                        <button
                          onClick={() => updateStatus(entry.id, 'archived')}
                          className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
