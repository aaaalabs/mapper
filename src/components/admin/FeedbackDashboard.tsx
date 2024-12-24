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
import { FeedbackData, FeedbackStats, FeedbackError, FeedbackStatus, FeedbackType } from '@/types/feedback';
import { getFeedbackStats } from '@/services/feedbackService';
import { ChevronDown, ChevronUp, Filter, RefreshCw, Star as StarIcon, StarOff, Mail, MapPin, Calendar } from 'lucide-react';

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= rating ? (
            <StarIcon size={16} className="text-yellow-400 fill-current" />
          ) : (
            <StarOff size={16} className="text-gray-300 dark:text-gray-600" />
          )}
        </span>
      ))}
    </div>
  );
}

export function FeedbackDashboard() {
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showCharts, setShowCharts] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredFeedback = feedback.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (typeFilter !== 'all' && item.feedback_type !== typeFilter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.metadata.feedback_text?.toLowerCase().includes(searchLower) ||
        item.metadata.name?.toLowerCase().includes(searchLower) ||
        item.metadata.email?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
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

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <DatePicker
            date={startDate}
            onChange={date => date && setStartDate(date)}
          />
          <span>to</span>
          <DatePicker
            date={endDate}
            onChange={date => date && setEndDate(date)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFeedback()}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'all')}
            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="approved">Approved</option>
            <option value="featured">Featured</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FeedbackType | 'all')}
            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="all">All Types</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-2"
          >
            {showCharts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Charts
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={cn(styles.panel, "p-4")}>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Feedback</div>
          <div className="text-2xl font-semibold">{filteredFeedback.length}</div>
        </div>
        <div className={cn(styles.panel, "p-4")}>
          <div className="text-sm text-gray-500 dark:text-gray-400">Average Rating</div>
          <div className="text-2xl font-semibold flex items-center gap-2">
            {stats?.averageRating.toFixed(1)}
            <StarIcon size={24} className="text-yellow-400 fill-current" />
          </div>
        </div>
        <div className={cn(styles.panel, "p-4")}>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
          <div className="text-2xl font-semibold">{feedback.filter(f => f.status === 'pending').length}</div>
        </div>
        <div className={cn(styles.panel, "p-4")}>
          <div className="text-sm text-gray-500 dark:text-gray-400">Featured</div>
          <div className="text-2xl font-semibold">{feedback.filter(f => f.status === 'featured').length}</div>
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ChartErrorBoundary>
            {/* Type Distribution */}
            <div className={cn(styles.panel, "h-[250px] md:h-[300px]")}>
              <h3 className={styles.panelTitle}>Feedback Types</h3>
              <ResponsivePie
                data={Object.entries(stats?.typeDistribution || {}).map(([id, value]) => ({
                  id,
                  value,
                  color: getFeedbackTypeColor(id)
                }))}
                margin={{ top: 20, right: 60, bottom: 60, left: 60 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ scheme: 'nivo' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                enableArcLinkLabels={false}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 50,
                    itemsSpacing: 0,
                    itemWidth: 75,
                    itemHeight: 18,
                    itemTextColor: 'var(--foreground)',
                    itemDirection: 'left-to-right',
                    symbolSize: 12,
                    symbolShape: 'circle'
                  }
                ]}
                theme={{
                  text: { fill: 'var(--foreground)' },
                  labels: { text: { fill: 'var(--foreground)' }},
                  legends: { text: { fill: 'var(--foreground)' }}
                }}
              />
            </div>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            {/* Rating Distribution */}
            <div className={cn(styles.panel, "h-[250px] md:h-[300px]")}>
              <h3 className={styles.panelTitle}>Rating Distribution</h3>
              <ResponsiveBar
                data={Object.entries(stats?.ratingDistribution || {}).map(([rating, count]) => ({
                  rating,
                  count
                }))}
                keys={['count']}
                indexBy="rating"
                margin={{ top: 20, right: 60, bottom: 60, left: 60 }}
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
                  text: { fill: 'var(--foreground)' },
                  axis: {
                    ticks: {
                      text: { fill: 'var(--foreground)' }
                    },
                    legend: {
                      text: { fill: 'var(--foreground)' }
                    }
                  }
                }}
              />
            </div>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            {/* Status Distribution */}
            <div className={cn(styles.panel, "h-[250px] md:h-[300px]")}>
              <h3 className={styles.panelTitle}>Status Distribution</h3>
              <ResponsivePie
                data={Object.entries(stats?.statusDistribution || {}).map(([id, value]) => ({
                  id,
                  value,
                  color: getStatusColor(id)
                }))}
                margin={{ top: 20, right: 60, bottom: 60, left: 60 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ scheme: 'nivo' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                enableArcLinkLabels={false}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 50,
                    itemsSpacing: 0,
                    itemWidth: 75,
                    itemHeight: 18,
                    itemTextColor: 'var(--foreground)',
                    itemDirection: 'left-to-right',
                    symbolSize: 12,
                    symbolShape: 'circle'
                  }
                ]}
                theme={{
                  text: { fill: 'var(--foreground)' },
                  labels: { text: { fill: 'var(--foreground)' }},
                  legends: { text: { fill: 'var(--foreground)' }}
                }}
              />
            </div>
          </ChartErrorBoundary>
        </div>
      )}

      {/* Feedback Cards */}
      <div className="space-y-4">
        {filteredFeedback.map((item) => {
          const isExpanded = expandedCards.has(item.id);
          
          return (
            <div key={item.id} className={cn(styles.panel, "p-4")}>
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={item.rating || 0} />
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getFeedbackTypeColor(item.feedback_type))}>
                    {item.feedback_type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value as FeedbackStatus;
                      const metadata = ['approved', 'featured'].includes(newStatus) && 
                        !item.metadata.testimonial && 
                        item.metadata.feedback_text ? 
                          {
                            ...item.metadata,
                            testimonial: item.metadata.feedback_text,
                            can_feature: true,
                            last_updated: new Date().toISOString()
                          } : 
                          item.metadata;

                      const { error } = await supabase
                        .from('map_feedback')
                        .update({ 
                          status: newStatus,
                          metadata
                        })
                        .eq('id', item.id);
                      
                      if (error) {
                        console.error('Error updating status:', error);
                      } else {
                        fetchFeedback();
                      }
                    }}
                    className={cn(
                      'text-xs rounded-lg border-0 py-1 pl-2 pr-8',
                      getStatusColor(item.status),
                      'bg-opacity-100 dark:bg-opacity-100',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="approved">Approved</option>
                    <option value="featured">Featured</option>
                    <option value="archived">Archived</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpansion(item.id)}
                    className="p-1"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                {item.metadata.email && (
                  <a 
                    href={`mailto:${item.metadata.email}`}
                    className="flex items-center gap-1 hover:text-blue-500"
                  >
                    <Mail size={14} />
                    {item.metadata.name || item.metadata.email}
                  </a>
                )}
                {item.metadata.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {item.metadata.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                </span>
              </div>

              {/* Feedback Text */}
              <div className="mb-4">
                <p className="whitespace-pre-wrap text-sm">{item.metadata.feedback_text}</p>
              </div>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Testimonial Editor */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Testimonial</h4>
                    <textarea
                      value={item.metadata.testimonial || ''}
                      onChange={async (e) => {
                        const { error } = await supabase
                          .from('map_feedback')
                          .update({
                            metadata: {
                              ...item.metadata,
                              testimonial: e.target.value,
                              last_updated: new Date().toISOString()
                            }
                          })
                          .eq('id', item.id);
                        
                        if (error) {
                          console.error('Error updating testimonial:', error);
                        } else {
                          fetchFeedback();
                        }
                      }}
                      placeholder="Edit testimonial text here..."
                      className="w-full min-h-[80px] p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Additional Metadata */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.metadata.context && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                        Context: {item.metadata.context}
                      </span>
                    )}
                    {item.metadata.source && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                        Source: {item.metadata.source}
                      </span>
                    )}
                  </div>

                  {/* Feature Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.metadata.can_feature}
                        onChange={async (e) => {
                          const { error } = await supabase
                            .from('map_feedback')
                            .update({
                              metadata: {
                                ...item.metadata,
                                can_feature: e.target.checked,
                                last_updated: new Date().toISOString()
                              }
                            })
                            .eq('id', item.id);
                          
                          if (error) {
                            console.error('Error updating feedback:', error);
                          } else {
                            fetchFeedback();
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="text-sm">Can Feature</span>
                    </label>

                    <span className="text-xs text-gray-500">
                      Last updated: {format(new Date(item.metadata.last_updated), 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
