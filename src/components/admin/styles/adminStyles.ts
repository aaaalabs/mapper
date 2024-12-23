import { cn } from '@/lib/utils';

export const adminStyles = {
  // Layout
  pageContainer: 'space-y-4 sm:space-y-6',
  pageHeader: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
  pageTitle: 'text-xl sm:text-2xl font-semibold text-foreground',
  
  // Card/Panel styles
  panel: 'bg-card text-card-foreground shadow-sm rounded-lg overflow-hidden',
  panelTitle: "text-lg font-medium mb-4",
  
  // Table styles
  tableContainer: 'overflow-x-auto -mx-4 sm:mx-0',
  table: 'min-w-full divide-y divide-border',
  tableHeader: 'bg-muted',
  tableHeaderCell: 'px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
  tableBody: 'divide-y divide-border bg-background',
  tableRow: 'hover:bg-muted/50 transition-colors',
  tableCell: 'px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-foreground',
  tableCellSecondary: 'px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground',

  // Settings styles
  loadingContainer: 'flex items-center justify-center h-64',
  errorContainer: 'flex flex-col items-center justify-center h-64 space-y-4',
  container: 'space-y-6 sm:space-y-8 p-4 sm:p-6',
  title: 'text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6',
  settingsGrid: 'grid gap-4 sm:gap-6 md:grid-cols-2',
  settingItem: 'bg-card text-card-foreground rounded-lg p-4 space-y-2',
  settingHeader: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4',
  settingDescription: 'text-sm text-muted-foreground',
  savingIndicator: 'fixed bottom-safe right-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg rounded-lg p-2 flex items-center justify-center space-x-2 text-sm text-muted-foreground z-50',
  loading: "flex items-center justify-center p-8 text-muted-foreground",
  error: "flex items-center justify-center p-8 text-red-500",

  // Form styles
  form: {
    group: 'space-y-2 mb-4',
    label: 'block text-sm font-medium text-foreground',
    description: 'text-sm text-muted-foreground mt-1',
    error: 'text-sm text-destructive mt-1',
    required: 'text-destructive',
  },
  input: {
    base: cn(
      'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'min-h-[40px] sm:min-h-[36px]' // Larger touch targets on mobile
    ),
    error: 'border-destructive focus-visible:ring-destructive',
  },
  select: {
    base: cn(
      'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'min-h-[40px] sm:min-h-[36px]' // Larger touch targets on mobile
    ),
    error: 'border-destructive focus-visible:ring-destructive',
  },
  textarea: {
    base: cn(
      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50'
    ),
    error: 'border-destructive focus-visible:ring-destructive',
  },
  searchInput: cn(
    'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mb-4',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'min-h-[40px] sm:min-h-[36px]' // Larger touch targets on mobile
  ),
  datePicker: {
    base: cn(
      'w-full rounded-md border border-input bg-background text-sm text-foreground shadow-sm',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'dark:bg-gray-800 dark:border-gray-700'
    ),
    input: cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'dark:bg-gray-800 dark:border-gray-700',
      'min-h-[40px] sm:min-h-[36px]' // Larger touch targets on mobile
    ),
    calendar: {
      wrapper: 'p-3',
      base: cn(
        'bg-background border border-input rounded-md shadow-md',
        'dark:bg-gray-800 dark:border-gray-700'
      ),
      header: 'px-2 py-3 border-b border-border dark:border-gray-700',
      grid: 'w-full mt-2',
      head: 'text-muted-foreground font-normal text-center',
      row: 'flex',
      cell: cn(
        'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
        'focus-within:relative focus-within:z-20',
        'dark:text-gray-300'
      ),
      day: cn(
        'h-9 w-9 p-0 font-normal',
        'aria-selected:opacity-100',
        'hover:bg-muted hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground focus:opacity-100',
        'disabled:pointer-events-none disabled:opacity-50',
        'dark:hover:bg-gray-700',
        'h-10 w-10 sm:h-9 sm:w-9' // Larger touch targets on mobile
      ),
    },
  },
  button: {
    base: cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'min-h-[40px] sm:min-h-[36px]', // Larger touch targets on mobile
      'px-4 py-2 sm:px-3 sm:py-2' // Larger touch targets on mobile
    ),
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  
  // Badge styles
  badge: {
    base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  },
} as const;
