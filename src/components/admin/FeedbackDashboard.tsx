import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { format } from 'date-fns';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { cn } from '@/lib/utils';
import { adminStyles as styles } from './styles/adminStyles';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { FeedbackData, FeedbackStats } from '@/types/feedback';

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
      const { data, error: fetchError } = await supabase
        .from('map_feedback')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const typedData = (data || []).map((item): FeedbackData => ({
        ...item,
        feedback_type: item.feedback_type || 'neutral',
        status: item.status || 'pending',
        metadata: {
          email: item.metadata?.email || null,
          useCase: item.metadata?.useCase || null,
          company: item.metadata?.company || null,
          position: item.metadata?.position || null,
          industry: item.metadata?.industry || null,
          size: item.metadata?.size || null,
          location: item.metadata?.location || null,
          source: item.metadata?.source || null,
          last_updated: item.metadata?.last_updated
        }
      }));

      setFeedback(typedData);
      calculateStats(typedData);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to fetch feedback data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: FeedbackData[]) => {
    const stats: FeedbackStats = {
      totalCount: data.length,
      averageRating: 0,
      typeDistribution: {},
      ratingDistribution: {},
      statusDistribution: {}
    };

    let totalRating = 0;
    let ratingCount = 0;

    data.forEach(item => {
      // Type distribution
      stats.typeDistribution[item.feedback_type] = (stats.typeDistribution[item.feedback_type] || 0) + 1;

      // Status distribution
      stats.statusDistribution[item.status] = (stats.statusDistribution[item.status] || 0) + 1;

      // Rating distribution
      if (item.rating) {
        stats.ratingDistribution[item.rating] = (stats.ratingDistribution[item.rating] || 0) + 1;
        totalRating += item.rating;
        ratingCount++;
      }
    });

    stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    setStats(stats);
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
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-50 dark:bg-red-900/20">
        {error}
      </div>
    );
  }

  const pieData = Object.entries(stats?.typeDistribution || {}).map(([type, value]) => ({
    id: type,
    label: type,
    value,
  }));

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Feedback Dashboard</h1>
        <div className="flex space-x-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <DatePicker date={startDate} onChange={setStartDate} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <DatePicker date={endDate} onChange={setEndDate} />
          </div>
          <Button onClick={fetchFeedback} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={cn(styles.panel, "p-4")}>
            <h3 className="text-sm font-medium text-muted-foreground">Total Feedback</h3>
            <p className="text-2xl font-semibold mt-1">{stats.totalCount}</p>
          </div>
          <div className={cn(styles.panel, "p-4")}>
            <h3 className="text-sm font-medium text-muted-foreground">Average Rating</h3>
            <p className="text-2xl font-semibold mt-1">{stats.averageRating} / 5</p>
          </div>
          <div className={cn(styles.panel, "p-4")}>
            <h3 className="text-sm font-medium text-muted-foreground">Positive Feedback</h3>
            <p className="text-2xl font-semibold mt-1">
              {stats.typeDistribution.positive || 0}
              <span className="text-sm text-muted-foreground ml-1">
                ({Math.round(((stats.typeDistribution.positive || 0) / stats.totalCount) * 100)}%)
              </span>
            </p>
          </div>
          <div className={cn(styles.panel, "p-4")}>
            <h3 className="text-sm font-medium text-muted-foreground">Pending Review</h3>
            <p className="text-2xl font-semibold mt-1">{stats.statusDistribution.pending || 0}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Rating Distribution */}
        <div className={cn(styles.panel, "p-4")}>
          <h3 className="text-lg font-medium mb-4">Rating Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveBar
              data={Object.entries(stats?.ratingDistribution || {}).map(([rating, count]) => ({
                rating,
                count,
              }))}
              keys={['count']}
              indexBy="rating"
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              colors={{ scheme: 'nivo' }}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Rating',
                legendPosition: 'middle',
                legendOffset: 32,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Count',
                legendPosition: 'middle',
                legendOffset: -40,
              }}
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fill: '#888888',
                    },
                  },
                  legend: {
                    text: {
                      fill: '#888888',
                    },
                  },
                },
                grid: {
                  line: {
                    stroke: '#dddddd',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Feedback Type Distribution */}
        <div className={cn(styles.panel, "p-4")}>
          <h3 className="text-lg font-medium mb-4">Feedback Type Distribution</h3>
          <div className="h-[300px]">
            <ResponsivePie
              data={pieData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              colors={{ scheme: 'nivo' }}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            />
          </div>
        </div>
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
