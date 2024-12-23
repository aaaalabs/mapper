import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { cn } from '@/lib/utils';
import { adminStyles as styles } from './styles/adminStyles';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { FeedbackData, FeedbackStats, FeedbackError } from '@/types/feedback';
import { getFeedbackStats } from '@/services/feedbackService';

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

function ChartErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<EmptyState message="Error loading chart. Please try again later." />}
    >
      {children}
    </ErrorBoundary>
  );
}

export function FeedbackDashboard() {
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchFeedback();
  }, [startDate, endDate]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('map_feedback')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new FeedbackError(
          'Failed to fetch feedback',
          'DATABASE',
          { error: fetchError }
        );
      }

      const typedData = (data || []).map((item): FeedbackData => ({
        id: item.id,
        map_id: item.map_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        feedback_type: item.feedback_type || 'neutral',
        status: item.status || 'pending',
        rating: item.rating,
        session_id: item.session_id || undefined,
        metadata: {
          email: item.metadata?.email || null,
          name: item.metadata?.name || null,
          can_feature: item.metadata?.can_feature || false,
          testimonial: item.metadata?.testimonial || null,
          feedback_text: item.metadata?.feedback_text || null,
          context: item.metadata?.context || null,
          location: item.metadata?.location || null,
          source: item.metadata?.source || null,
          last_updated: item.metadata?.last_updated || new Date().toISOString()
        }
      }));

      setFeedback(typedData);
      const stats = await getFeedbackStats();
      setStats(stats);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err instanceof FeedbackError ? err.message : 'Failed to fetch feedback data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'contacted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'featured': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'neutral': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="m-4">
        {error}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchFeedback()}
          className="mt-2"
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!feedback.length) {
    return (
      <EmptyState message="No feedback data available for the selected date range." />
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Date Range Selector */}
      <div className={cn(styles.panel, "flex gap-4 items-center")}>
        <DatePicker
          date={startDate}
          onChange={date => date && setStartDate(date)}
        />
        <span>to</span>
        <DatePicker
          date={endDate}
          onChange={date => date && setEndDate(date)}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartErrorBoundary>
          {/* Type Distribution */}
          <div className={cn(styles.panel, "h-[300px]")}>
            <h3 className={styles.panelTitle}>Feedback Types</h3>
            <ResponsivePie
              data={Object.entries(stats?.typeDistribution || {}).map(([id, value]) => ({
                id,
                value,
                color: getFeedbackTypeColor(id)
              }))}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ scheme: 'nivo' }}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="var(--foreground)"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              theme={{
                text: {
                  fill: 'var(--foreground)'
                },
                labels: {
                  text: {
                    fill: 'var(--foreground)'
                  }
                },
                legends: {
                  text: {
                    fill: 'var(--foreground)'
                  }
                }
              }}
            />
          </div>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          {/* Rating Distribution */}
          <div className={cn(styles.panel, "h-[300px]")}>
            <h3 className={styles.panelTitle}>Rating Distribution</h3>
            <ResponsiveBar
              data={Object.entries(stats?.ratingDistribution || {}).map(([rating, count]) => ({
                rating,
                count
              }))}
              keys={['count']}
              indexBy="rating"
              margin={{ top: 50, right: 60, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={{ scheme: 'nivo' }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Rating',
                legendPosition: 'middle',
                legendOffset: 32,
                tickValues: [1, 2, 3, 4, 5]
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Count',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              theme={{
                text: {
                  fill: 'var(--foreground)'
                },
                axis: {
                  ticks: {
                    text: {
                      fill: 'var(--foreground)'
                    }
                  },
                  legend: {
                    text: {
                      fill: 'var(--foreground)'
                    }
                  }
                }
              }}
            />
          </div>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          {/* Status Distribution */}
          <div className={cn(styles.panel, "h-[300px]")}>
            <h3 className={styles.panelTitle}>Status Distribution</h3>
            <ResponsivePie
              data={Object.entries(stats?.statusDistribution || {}).map(([id, value]) => ({
                id,
                value,
                color: getStatusColor(id)
              }))}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ scheme: 'nivo' }}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="var(--foreground)"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              theme={{
                text: {
                  fill: 'var(--foreground)'
                },
                labels: {
                  text: {
                    fill: 'var(--foreground)'
                  }
                },
                legends: {
                  text: {
                    fill: 'var(--foreground)'
                  }
                }
              }}
            />
          </div>
        </ChartErrorBoundary>
      </div>

      {/* Feedback Table */}
      <div className={cn(styles.panel, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Date</th>
                <th className={styles.tableHeaderCell}>Rating</th>
                <th className={styles.tableHeaderCell}>Type</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell}>Metadata</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {feedback.map((item) => (
                <tr key={item.id}>
                  <td className={styles.tableCell}>
                    {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className={styles.tableCell}>
                    {item.rating !== null ? `${item.rating} / 5` : 'N/A'}
                  </td>
                  <td className={styles.tableCell}>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getFeedbackTypeColor(item.feedback_type))}>
                      {item.feedback_type}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(item.status))}>
                      {item.status}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(item.metadata, null, 2)}
                    </pre>
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
