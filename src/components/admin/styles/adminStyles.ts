import { cn } from '@/lib/utils';

export const adminStyles = {
  // Layout
  pageContainer: 'space-y-6',
  pageHeader: 'flex justify-between items-center',
  pageTitle: 'text-2xl font-semibold text-foreground',
  
  // Card/Panel styles
  panel: 'bg-card text-card-foreground shadow-sm rounded-lg overflow-hidden',
  
  // Table styles
  table: 'min-w-full divide-y divide-border',
  tableHeader: 'bg-muted',
  tableHeaderCell: 'px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
  tableBody: 'divide-y divide-border bg-background',
  tableCell: 'px-6 py-4 whitespace-nowrap text-sm text-foreground',
  tableCellSecondary: 'px-6 py-4 whitespace-nowrap text-sm text-muted-foreground',

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
      'disabled:cursor-not-allowed disabled:opacity-50'
    ),
    error: 'border-destructive focus-visible:ring-destructive',
  },
  select: {
    base: cn(
      'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50'
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
  
  // Date Picker styles
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
      'dark:bg-gray-800 dark:border-gray-700'
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
        'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        'dark:hover:bg-gray-700 dark:hover:text-white'
      ),
      today: 'bg-accent/50 text-accent-foreground dark:bg-gray-600 dark:text-gray-200',
      selected: cn(
        'bg-primary text-primary-foreground',
        'hover:bg-primary hover:text-primary-foreground',
        'focus:bg-primary focus:text-primary-foreground',
        'dark:bg-blue-600 dark:text-white'
      ),
      adjacent: 'text-muted-foreground opacity-50 dark:text-gray-500',
      weekNumber: 'text-muted-foreground opacity-50 font-normal dark:text-gray-500',
    },
    monthSelect: cn(
      'flex h-10 items-center justify-between rounded-md border border-input bg-background px-3',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
    ),
    yearSelect: cn(
      'flex h-10 items-center justify-between rounded-md border border-input bg-background px-3',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
    ),
    navigationButton: cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'hover:bg-accent hover:text-accent-foreground',
      'dark:hover:bg-gray-700 dark:text-gray-200'
    ),
  },
  
  // Status badges
  badge: {
    base: 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    contacted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  },

  // Button styles
  button: {
    base: cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50'
    ),
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    action: 'bg-blue-500 text-white dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 dark:text-white',
    sizes: {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    },
    loading: 'opacity-80 pointer-events-none',
  },

  // Alert styles
  alert: {
    base: 'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
    error: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    warning: 'border-warning/50 text-warning dark:border-warning [&>svg]:text-warning',
    success: 'border-success/50 text-success dark:border-success [&>svg]:text-success',
  },

  // Loading and error states
  loading: 'flex items-center justify-center py-8 text-muted-foreground',
  error: 'text-destructive py-8',

  // Utility classes
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  iconButton: 'p-2 rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
};
