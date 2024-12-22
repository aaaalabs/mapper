interface TimeFilterProps {
  selected: '24h' | '7d' | '30d';
  onChange: (filter: '24h' | '7d' | '30d') => void;
}

export function TimeFilter({ selected, onChange }: TimeFilterProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg mb-4">
      <div className="sm:hidden">
        <select
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          value={selected}
          onChange={(e) => onChange(e.target.value as '24h' | '7d' | '30d')}
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>
      <div className="hidden sm:block">
        <nav className="flex space-x-4" aria-label="Time filter">
          {[
            { id: '24h', name: 'Last 24 hours' },
            { id: '7d', name: 'Last 7 days' },
            { id: '30d', name: 'Last 30 days' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => onChange(filter.id as '24h' | '7d' | '30d')}
              className={`${
                selected === filter.id
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-100'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
              } px-3 py-2 font-medium text-sm rounded-md`}
            >
              {filter.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
