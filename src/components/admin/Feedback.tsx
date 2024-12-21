import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { adminStyles as styles } from './styles/adminStyles';

interface FeedbackMetadata {
  email: string | null;
  useCase?: string | null;
  use_case?: string | null;
  painPoint?: string | null;
  canFeature?: boolean;
  can_feature?: boolean;
  feedbackText?: string | null;
  testimonial?: string | null;
  organization: string | null;
  community_type?: string;
  last_updated?: string;
}

interface FeedbackEntry {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'featured' | 'contacted' | 'archived';
  metadata: FeedbackMetadata;
  rating?: number;
  feedback_type?: 'positive' | 'negative' | 'neutral';
  session_id?: string | null;
}

type FilterStatus = FeedbackEntry['status'] | 'all';
type SortField = 'created_at' | 'rating' | 'status';

export function Feedback() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter, sortField, sortAsc]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('map_feedback')
        .select('*');

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      query = query.order(sortField, { ascending: sortAsc });

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: FeedbackEntry['status']) => {
    try {
      const { error } = await supabase
        .from('map_feedback')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      await fetchFeedback();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const renderStars = (rating: number | undefined) => {
    if (!rating) return null;
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarIconSolid key={star} className="h-4 w-4 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="h-4 w-4 text-muted-foreground" />
          )
        ))}
      </div>
    );
  };

  const getStatusColor = (status: FeedbackEntry['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'featured': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'contacted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getFeedbackContent = (entry: FeedbackEntry) => {
    const metadata = entry.metadata;
    return metadata.feedbackText || metadata.testimonial || '-';
  };

  const getUseCase = (entry: FeedbackEntry) => {
    const metadata = entry.metadata;
    return metadata.useCase || metadata.use_case || '-';
  };

  const getCanFeature = (entry: FeedbackEntry) => {
    const metadata = entry.metadata;
    return metadata.canFeature || metadata.can_feature || false;
  };

  if (loading) {
    return <div className={styles.loading}>Loading feedback...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Feedback Management</h1>
        <div className="flex space-x-4">
          <select
            className={styles.select.base}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="featured">Featured</option>
            <option value="contacted">Contacted</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className={cn(styles.panel, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th 
                  className={cn(styles.tableHeaderCell, "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800")}
                  onClick={() => {
                    if (sortField === 'created_at') {
                      setSortAsc(!sortAsc);
                    } else {
                      setSortField('created_at');
                      setSortAsc(false);
                    }
                  }}
                >
                  Date {sortField === 'created_at' && (
                    <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className={styles.tableHeaderCell}>Contact</th>
                <th className={styles.tableHeaderCell}>Use Case</th>
                <th className={styles.tableHeaderCell}>Feedback</th>
                <th className={styles.tableHeaderCell}>Organization</th>
                <th 
                  className={cn(styles.tableHeaderCell, "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800")}
                  onClick={() => {
                    if (sortField === 'status') {
                      setSortAsc(!sortAsc);
                    } else {
                      setSortField('status');
                      setSortAsc(false);
                    }
                  }}
                >
                  Status {sortField === 'status' && (
                    <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className={styles.tableCell}>
                    {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className={styles.tableCell}>
                    {entry.metadata.email ? (
                      <a 
                        href={`mailto:${entry.metadata.email}`}
                        className="text-accent hover:text-accent/80"
                      >
                        {entry.metadata.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td className={styles.tableCell}>
                    {getUseCase(entry)}
                  </td>
                  <td className={styles.tableCell}>
                    <div className="space-y-1">
                      {entry.rating && renderStars(entry.rating)}
                      <div className="text-sm">{getFeedbackContent(entry)}</div>
                      {entry.metadata.painPoint && (
                        <div className="text-xs text-gray-500">
                          Pain point: {entry.metadata.painPoint}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className="space-y-1">
                      <div>{entry.metadata.organization || '-'}</div>
                      {entry.metadata.community_type && (
                        <div className="text-xs text-gray-500">
                          Type: {entry.metadata.community_type}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(entry.status))}>
                      {entry.status}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <div className="flex flex-col gap-2">
                      {entry.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(entry.id, 'approved')}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Approve
                          </button>
                          {getCanFeature(entry) && (
                            <button
                              onClick={() => updateStatus(entry.id, 'featured')}
                              className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                              Feature
                            </button>
                          )}
                        </>
                      )}
                      {entry.metadata.email && entry.status !== 'contacted' && (
                        <button
                          onClick={() => updateStatus(entry.id, 'contacted')}
                          className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Mark Contacted
                        </button>
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
