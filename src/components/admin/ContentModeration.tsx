import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EyeIcon, FlagIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { adminStyles as styles } from './styles/adminStyles';

interface Report {
  id: string;
  map_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  map: {
    title: string;
    owner_id: string;
    created_at: string;
  };
}

export function ContentModeration() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('map_reports')
        .select(`
          *,
          map:map_id (
            title,
            owner_id,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    try {
      const { error } = await supabase
        .from('map_reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
      await fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report status');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading reports...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Content Moderation</h1>
        <div className="flex items-center space-x-2">
          <span className={cn(styles.badge.base, styles.badge.pending)}>
            <FlagIcon className="h-4 w-4 mr-1" />
            {reports.filter(r => r.status === 'pending').length} pending
          </span>
        </div>
      </div>

      <div className={styles.panel}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHeaderCell}>Map</th>
              <th className={styles.tableHeaderCell}>Reason</th>
              <th className={styles.tableHeaderCell}>Status</th>
              <th className={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {reports.map((report) => (
              <tr key={report.id}>
                <td className={styles.tableCell}>
                  <div className="flex flex-col">
                    <span>{report.map.title}</span>
                    <span className="text-sm text-muted-foreground">
                      Created {format(new Date(report.map.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  <div className="max-w-md">
                    <p className="line-clamp-2">{report.reason}</p>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  <span className={cn(styles.badge.base, styles.badge[report.status])}>
                    {report.status}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className="flex space-x-2">
                    <button
                      className={cn(styles.button.base, styles.button.ghost)}
                      onClick={() => setSelectedReport(report)}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                    {report.status === 'pending' && (
                      <>
                        <button
                          className={cn(styles.button.base, styles.button.primary)}
                          onClick={() => updateReportStatus(report.id, 'resolved')}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Resolve
                        </button>
                        <button
                          className={cn(styles.button.base, styles.button.danger)}
                          onClick={() => updateReportStatus(report.id, 'dismissed')}
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className={cn(styles.panel, "max-w-2xl w-full p-6")}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">Report Details</h2>
              <button
                className={cn(styles.button.base, styles.button.ghost)}
                onClick={() => setSelectedReport(null)}
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Map Information</h3>
                <p className="text-foreground">{selectedReport.map.title}</p>
                <p className="text-sm text-muted-foreground">
                  Created {format(new Date(selectedReport.map.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Report Reason</h3>
                <p className="text-foreground">{selectedReport.reason}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Status</h3>
                <span className={cn(styles.badge.base, styles.badge[selectedReport.status])}>
                  {selectedReport.status}
                </span>
              </div>
              {selectedReport.status === 'pending' && (
                <div className="flex space-x-2 mt-6">
                  <button
                    className={cn(styles.button.base, styles.button.primary)}
                    onClick={() => {
                      updateReportStatus(selectedReport.id, 'resolved');
                      setSelectedReport(null);
                    }}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Resolve Report
                  </button>
                  <button
                    className={cn(styles.button.base, styles.button.danger)}
                    onClick={() => {
                      updateReportStatus(selectedReport.id, 'dismissed');
                      setSelectedReport(null);
                    }}
                  >
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Dismiss Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
