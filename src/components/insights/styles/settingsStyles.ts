export const settingsStyles = {
  container: 'max-w-4xl mx-auto px-4 py-4 sm:p-6 space-y-6 sm:space-y-8',
  title: 'text-xl sm:text-2xl font-bold mb-6 sm:mb-8',
  settingsGrid: 'grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8',
  
  section: 'bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6',
  sectionTitle: 'text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100',
  
  settingItem: 'space-y-2 py-2',
  settingHeader: 'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4',
  settingLabel: 'text-sm font-medium text-gray-700 dark:text-gray-300',
  settingControl: 'w-full sm:w-auto',
  settingDescription: 'text-sm text-gray-500 dark:text-gray-400 mt-1',
  
  loadingContainer: 'flex justify-center items-center h-64',
  errorContainer: 'flex flex-col items-center space-y-4 text-center h-64 justify-center',
  
  savingIndicator: 'fixed bottom-safe right-4 bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg'
} as const;
