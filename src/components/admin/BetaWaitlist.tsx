import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { adminStyles as styles } from './styles/adminStyles';
import { Button } from '../ui/Button';

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  lead_type: string;
}

export function BetaWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('map_leads')
        .select('*')
        .eq('lead_type', 'beta_waitlist')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch waitlist');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: WaitlistEntry['status']) => {
    try {
      const { error } = await supabase
        .from('map_leads')
        .update({ status })
        .eq('id', id)
        .eq('lead_type', 'beta_waitlist');

      if (error) throw error;
      await fetchWaitlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading waitlist...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Beta Waitlist</h1>
        <span className="text-sm text-muted-foreground">{entries.length} entries</span>
      </div>

      <div className={styles.panel}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHeaderCell}>Email</th>
              <th className={styles.tableHeaderCell}>Date</th>
              <th className={styles.tableHeaderCell}>Status</th>
              <th className={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className={styles.tableCell}>{entry.email}</td>
                <td className={styles.tableCellSecondary}>
                  {format(new Date(entry.created_at), 'MMM d, yyyy')}
                </td>
                <td className={styles.tableCell}>
                  <span className={cn(styles.badge.base, styles.badge[entry.status])}>
                    {entry.status}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className="flex space-x-2">
                    {entry.status !== 'approved' && (
                      <Button
                        variant="action"
                        size="sm"
                        onClick={() => updateStatus(entry.id, 'approved')}
                      >
                        Approve
                      </Button>
                    )}
                    {entry.status !== 'rejected' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateStatus(entry.id, 'rejected')}
                      >
                        Reject
                      </Button>
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
