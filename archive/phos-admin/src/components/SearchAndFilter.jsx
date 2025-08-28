import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';

export default function SearchAndFilter({
  onSearch,
  onFilter,
  filterOptions,
  filterLabel = 'Filter',
  placeholder = 'Search...',
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term) => {
      onSearch(term);
    }, 300),
    [onSearch]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSelectedFilter(value);
    onFilter(value);
  };

  // Clear search and filter
  const handleClear = () => {
    setSearchTerm('');
    setSelectedFilter('');
    onSearch('');
    onFilter('');
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      {/* Search Input */}
      <div className="flex-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600 dark:text-white sm:text-sm"
          />
        </div>
      </div>

      {/* Filter Dropdown */}
      <div className="w-full sm:w-48">
        <select
          value={selectedFilter}
          onChange={handleFilterChange}
          className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm rounded-md"
        >
          <option value="">All {filterLabel}s</option>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Button */}
      {(searchTerm || selectedFilter) && (
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
        >
          Clear
        </button>
      )}
    </div>
  );
}
