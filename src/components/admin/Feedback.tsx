import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface FeedbackEntry {
  id: string;
  map_id: string;
  satisfaction_rating: number;
  testimonial: string | null;
  use_case: string | null;
  community_type: string;
  organization_name: string | null;
  contact_email: string | null;
  can_feature: boolean;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'reviewed' | 'contacted' | 'archived';
  session_id: string | null;
}

type FilterStatus = FeedbackEntry['status'] | 'all';
type SortField = 'created_at' | 'satisfaction_rating' | 'status';

export function Feedback() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter, ratingFilter, sortField, sortAsc]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('map_feedback')
        .select('*');

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (ratingFilter) {
        query = query.eq('satisfaction_rating', ratingFilter);
      }

      // Apply sorting
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
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchFeedback();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarIconSolid key={star} className="h-4 w-4 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="h-4 w-4 text-gray-300 dark:text-gray-600" />
          )
        ))}
      </div>
    );
  };

  const getStatusColor = (status: FeedbackEntry['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'contacted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading feedback...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-8">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Feedback</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="contacted">Contacted</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={ratingFilter || 'all'}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? null : Number(e.target.value))}
              className="rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">All Ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>{rating} Stars</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{entries.length} entries</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  if (sortField === 'created_at') {
                    setSortAsc(!sortAsc);
                  } else {
                    setSortField('created_at');
                    setSortAsc(false);
                  }
                }}
              >
                Date
                {sortField === 'created_at' && (
                  <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  if (sortField === 'satisfaction_rating') {
                    setSortAsc(!sortAsc);
                  } else {
                    setSortField('satisfaction_rating');
                    setSortAsc(false);
                  }
                }}
              >
                Rating
                {sortField === 'satisfaction_rating' && (
                  <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Testimonial
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Use Case
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Organization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  if (sortField === 'status') {
                    setSortAsc(!sortAsc);
                  } else {
                    setSortField('status');
                    setSortAsc(false);
                  }
                }}
              >
                Status
                {sortField === 'status' && (
                  <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(entry.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStars(entry.satisfaction_rating)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-md">
                  <div className="line-clamp-2">{entry.testimonial || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {entry.use_case || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col">
                    <span>{entry.organization_name || '-'}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{entry.community_type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {entry.contact_email ? (
                    <a 
                      href={`mailto:${entry.contact_email}`}
                      className="text-accent hover:text-accent/80"
                    >
                      {entry.contact_email}
                    </a>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    getStatusColor(entry.status)
                  )}>
                    {entry.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex gap-2">
                    {entry.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(entry.id, 'reviewed')}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Review
                      </button>
                    )}
                    {(entry.status === 'pending' || entry.status === 'reviewed') && entry.contact_email && (
                      <button
                        onClick={() => updateStatus(entry.id, 'contacted')}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                      >
                        Contact
                      </button>
                    )}
                    {entry.status !== 'archived' && (
                      <button
                        onClick={() => updateStatus(entry.id, 'archived')}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
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
  );
}
