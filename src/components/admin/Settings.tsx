import React from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { AdminTable } from '@/components/ui/AdminTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { adminStyles as styles } from './styles/adminStyles';

interface Setting {
  id: string;
  name: string;
  value: string;
  category: 'general' | 'security' | 'notifications' | 'analytics';
  description: string;
  updated_at: string;
}

interface SettingCategory {
  name: string;
  icon: React.ElementType;
  description: string;
}

interface TableColumn {
  header: string;
  cell: (row: Setting) => React.ReactNode;
}

const categories: Record<string, SettingCategory> = {
  general: {
    name: 'General',
    icon: Cog6ToothIcon,
    description: 'Basic application settings'
  },
  security: {
    name: 'Security',
    icon: ShieldCheckIcon,
    description: 'Security and access control'
  },
  notifications: {
    name: 'Notifications',
    icon: BellIcon,
    description: 'Notification preferences'
  },
  analytics: {
    name: 'Analytics',
    icon: GlobeAltIcon,
    description: 'Analytics and tracking settings'
  }
};

/**
 * Admin Settings Component
 * Manages application-wide settings and configurations
 */
export function Settings(): JSX.Element {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('map_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  const columns: TableColumn[] = [
    {
      header: 'Name',
      cell: (row: Setting) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.name}</span>
        </div>
      )
    },
    {
      header: 'Value',
      cell: (row: Setting) => (
        <Badge variant="outline">
          {row.value}
        </Badge>
      )
    },
    {
      header: 'Description',
      cell: (row: Setting) => (
        <span className="text-sm text-muted-foreground">
          {row.description}
        </span>
      )
    }
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          className="gap-2"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {Object.entries(categories).map(([key, category]) => {
          const categorySettings = settings.filter(s => s.category === key);
          
          return (
            <div key={key} className={cn(styles.panel, "p-6")}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-lg">
                  <category.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {category.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>

              <AdminTable
                data={categorySettings}
                columns={columns}
              />
            </div>
          );
        })}
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Error Tracking</h2>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => {
                throw new Error("Test error from Settings page");
              }}
              variant="outline"
            >
              Test Runtime Error
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tests error boundary and Sentry capture
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => {
                console.error("Test console error");
                // This will be captured by Sentry
              }}
              variant="outline"
            >
              Test Console Error
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tests console error capture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
