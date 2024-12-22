import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { adminStyles as styles } from './styles/adminStyles';
import type { Database } from '@/types/supabase';

type Map = Database['public']['Tables']['maps']['Row'];

const MAPS_PER_PAGE = 10;

const styleOptions = {
  standard: 'Standard',
  satellite: 'Satellite',
  terrain: 'Terrain',
  dark: 'Dark Mode',
} as const;

export function Maps() {
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [styleFilter, setStyleFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStyleDialog, setShowStyleDialog] = useState(false);
  const [bulkStyle, setBulkStyle] = useState('standard');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMaps();
  }, [page, sortOrder]);

  const fetchMaps = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('maps')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range(page * MAPS_PER_PAGE, (page + 1) * MAPS_PER_PAGE - 1);

      if (fetchError) throw fetchError;
      setHasMore(data && data.length === MAPS_PER_PAGE);
      setMaps(prev => page === 0 ? (data || []) : [...prev, ...(data || [])]);
    } catch (err) {
      console.error('Error fetching maps:', err);
      setError('Failed to load maps');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMaps(new Set(filteredMaps.map(map => map.id)));
    } else {
      setSelectedMaps(new Set());
    }
  };

  const handleSelectMap = (mapId: string, checked: boolean) => {
    const newSelected = new Set(selectedMaps);
    if (checked) {
      newSelected.add(mapId);
    } else {
      newSelected.delete(mapId);
    }
    setSelectedMaps(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('maps')
        .delete()
        .in('id', Array.from(selectedMaps));

      if (error) throw error;

      setSelectedMaps(new Set());
      setShowDeleteDialog(false);
      setPage(0);
      fetchMaps();
    } catch (err) {
      console.error('Error deleting maps:', err);
      setError('Failed to delete maps');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkStyleChange = async () => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('maps')
        .update({
          settings: {
            style: {
              id: bulkStyle,
              popupStyle: {
                text: '#1D3640',
                border: '#E2E8F0',
                shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                background: '#FFFFFF',
              },
              markerStyle: 'pins',
            },
          },
        })
        .in('id', Array.from(selectedMaps));

      if (error) throw error;

      setSelectedMaps(new Set());
      setShowStyleDialog(false);
      setPage(0);
      fetchMaps();
    } catch (err) {
      console.error('Error updating map styles:', err);
      setError('Failed to update map styles');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchMaps();
  };

  const handleStyleChange = (value: string) => {
    setStyleFilter(value);
  };

  const handleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setPage(0);
  };

  const filteredMaps = maps.filter(map => {
    const matchesSearch = 
      map.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStyle = styleFilter === 'all' || 
      map.settings?.style?.id === styleFilter;

    return matchesSearch && matchesStyle;
  });

  const renderBulkActions = () => {
    if (selectedMaps.size === 0) return null;

    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">
          {selectedMaps.size} map{selectedMaps.size > 1 ? 's' : ''} selected
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowStyleDialog(true)}
        >
          Change Style
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete
        </Button>
      </div>
    );
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchMaps}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Generated Maps</h1>
        <div className="flex flex-col w-full gap-4">
          {renderBulkActions()}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="search"
              placeholder="Search maps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full sm:w-64"
            />
            <Select
              value={styleFilter}
              onChange={handleStyleChange}
              options={[
                { label: 'All Styles', value: 'all' },
                { label: 'Standard', value: 'standard' },
                { label: 'Satellite', value: 'satellite' },
                { label: 'Terrain', value: 'terrain' },
                { label: 'Dark Mode', value: 'dark' }
              ]}
              className="w-full sm:w-40"
            />
            <Button
              variant="outline"
              onClick={handleSortOrder}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              {sortOrder === 'asc' ? '↑ Oldest' : '↓ Latest'}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>
                  <Checkbox
                    checked={selectedMaps.size > 0 && selectedMaps.size === filteredMaps.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all maps"
                  />
                </th>
                <th className={styles.tableHeaderCell}>Map</th>
                <th className={styles.tableHeaderCell}>Style</th>
                <th className={styles.tableHeaderCell}>Features</th>
                <th className={styles.tableHeaderCell}>Members</th>
                <th className={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredMaps.map((map) => (
                <tr key={map.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <Checkbox
                      checked={selectedMaps.has(map.id)}
                      onCheckedChange={(checked) => handleSelectMap(map.id, checked)}
                      aria-label={`Select ${map.name}`}
                    />
                  </td>
                  <td className={styles.tableCell}>
                    <div className="space-y-1">
                      <div className="font-medium">{map.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(map.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <Badge variant="outline">
                      {map.settings?.style?.id ? styleOptions[map.settings.style.id as keyof typeof styleOptions] || 'Standard' : 'Standard'}
                    </Badge>
                  </td>
                  <td className={styles.tableCell}>
                    <div className="space-y-1">
                      {map.settings?.features && (
                        <>
                          {map.settings.features.enableClustering && (
                            <Badge className="mr-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Clustering
                            </Badge>
                          )}
                          {map.settings.features.enableSearch && (
                            <Badge className="mr-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Search
                            </Badge>
                          )}
                          {map.settings.features.enableSharing && (
                            <Badge className="mr-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Sharing
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className="text-sm">
                      {map.members?.length || 0} members
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/shared/${map.id}`, '_blank')}
                      >
                        View Map
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMaps.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No maps found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {loading && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}
          {!loading && hasMore && (
            <div className="flex justify-center py-4">
              <Button variant="outline" onClick={() => setPage(p => p + 1)}>
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>

      {showDeleteDialog && (
        <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Maps</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedMaps.size} selected map{selectedMaps.size > 1 ? 's' : ''}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={actionLoading}
              >
                {actionLoading ? <LoadingSpinner /> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showStyleDialog && (
        <Dialog isOpen={showStyleDialog} onClose={() => setShowStyleDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Map Style</DialogTitle>
              <DialogDescription>
                Change the style for {selectedMaps.size} selected map{selectedMaps.size > 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select
                value={bulkStyle}
                onChange={(value: string) => setBulkStyle(value)}
                options={[
                  { label: 'Standard', value: 'standard' },
                  { label: 'Satellite', value: 'satellite' },
                  { label: 'Terrain', value: 'terrain' },
                  { label: 'Dark Mode', value: 'dark' }
                ]}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStyleDialog(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkStyleChange}
                disabled={actionLoading}
              >
                {actionLoading ? <LoadingSpinner /> : 'Update Style'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
