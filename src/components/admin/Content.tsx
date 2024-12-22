import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { adminStyles as styles } from './styles/adminStyles';
import type { Database } from '@/types/supabase';

type Report = Database['public']['Tables']['map_reports']['Row'];

const reportTypeColors = {
  inappropriate: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  spam: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  copyright: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
} as const;

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
} as const;

export function Content() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('map_reports')
        .select('*, map:map_id(title, owner_id, created_at)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load content reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: Report['status']) => {
    try {
      const { error: updateError } = await supabase
        .from('map_reports')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reportId);

      if (updateError) throw updateError;
      
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus, updated_at: new Date().toISOString() }
          : report
      ));
    } catch (err) {
      console.error('Error updating report status:', err);
      // You might want to show a toast notification here
    }
  };

  const filteredReports = reports
    .filter(report => {
      const matchesSearch = 
        report.report_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.map?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;

      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesType = typeFilter === 'all' || report.report_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchReports}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Content Moderation</h1>
        <div className="flex flex-col w-full sm:flex-row gap-4">
          <Input
            type="search"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { label: 'All Status', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'Reviewed', value: 'reviewed' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Dismissed', value: 'dismissed' }
            ]}
            className="w-full sm:w-40"
          />
          <Select
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            options={[
              { label: 'All Types', value: 'all' },
              { label: 'Inappropriate', value: 'inappropriate' },
              { label: 'Spam', value: 'spam' },
              { label: 'Copyright', value: 'copyright' },
              { label: 'Other', value: 'other' }
            ]}
            className="w-full sm:w-40"
          />
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            {sortOrder === 'asc' ? '↑ Oldest' : '↓ Latest'}
          </Button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Report</th>
                <th className={styles.tableHeaderCell}>Map</th>
                <th className={styles.tableHeaderCell}>Type</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredReports.map((report) => (
                <tr key={report.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className="space-y-1">
                      <div className="text-sm">{report.report_reason}</div>
                      <div className="text-xs text-muted-foreground">
                        Reported: {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className="space-y-1">
                      <div className="font-medium">{report.map?.title || 'Unknown Map'}</div>
                      <div className="text-xs text-muted-foreground">
                        Created: {report.map?.created_at ? new Date(report.map.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <Badge className={reportTypeColors[report.report_type]}>
                      {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                    </Badge>
                  </td>
                  <td className={styles.tableCell}>
                    <Badge className={statusColors[report.status]}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Badge>
                  </td>
                  <td className={styles.tableCell}>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {report.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReportStatus(report.id, 'reviewed')}
                          >
                            Mark Reviewed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReportStatus(report.id, 'dismissed')}
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                      {report.status === 'reviewed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateReportStatus(report.id, 'resolved')}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No reports found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
