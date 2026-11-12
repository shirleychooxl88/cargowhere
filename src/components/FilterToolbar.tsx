import React from 'react';
import { Search, Car, Bike, Truck, Zap, ArrowUpDown, X, SlidersHorizontal } from 'lucide-react';
import { District, CarparkOperator, VehicleType, FilterOptions } from '../types/carpark';

interface FilterToolbarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  totalResults: number;
  hasLocation: boolean;
}

const DISTRICTS: District[] = [
  'All Singapore',
  'Marina Bay & CBD',
  'Orchard & Tanglin',
  'Central (Bishan/Toa Payoh)',
  'East (Tampines/Changi)',
  'West (Jurong/Clementi)',
  'North (Woodlands/Yishun)',
  'North-East (Serangoon/Punggol)',
];

const OPERATORS: Array<'All' | CarparkOperator> = [
  'All',
  'HDB',
  'URA',
  'Mall / Commercial',
  'Changi Airport',
];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  setFilters,
  totalResults,
  hasLocation,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleVehicleChange = (type: VehicleType) => {
    setFilters((prev) => ({ ...prev, vehicleType: type }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      district: 'All Singapore',
      vehicleType: 'car',
      operator: 'All',
      onlyWithEV: false,
      minLotsAvailable: 0,
      tallVehiclesOnly: false,
      favoritesOnly: false,
      sortBy: hasLocation ? 'nearest' : 'lots-desc',
    });
  };

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.district !== 'All Singapore' ||
    filters.operator !== 'All' ||
    filters.onlyWithEV ||
    filters.tallVehiclesOnly ||
    filters.minLotsAvailable > 0 ||
    filters.favoritesOnly;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 transition-colors">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Row 1: Search, Vehicle Type Segmented Control, and Quick Actions */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search carpark, mall, HDB code (e.g. ION, HE12, VivoCity, 018956)..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Vehicle Type Segmented Control (Interactive button tab group) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 self-start md:self-auto">
            <button
              onClick={() => handleVehicleChange('car')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                filters.vehicleType === 'car'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Cars</span>
            </button>
            <button
              onClick={() => handleVehicleChange('motorcycle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                filters.vehicleType === 'motorcycle'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Motorcycles</span>
            </button>
            <button
              onClick={() => handleVehicleChange('heavy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                filters.vehicleType === 'heavy'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Heavy / Lorries</span>
            </button>
          </div>

          {/* Advanced toggle & Filter count */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                showAdvanced || isFiltered
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter & Sort</span>
            </button>

            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 whitespace-nowrap shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Row 2: District Horizontal Chips & Result counter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
            District:
          </span>
          {DISTRICTS.map((dist) => (
            <button
              key={dist}
              onClick={() => setFilters((prev) => ({ ...prev, district: dist }))}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 font-medium ${
                filters.district === dist
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {dist}
            </button>
          ))}
        </div>

        {/* Expandable Advanced Filter Panel */}
        {showAdvanced && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Operator Filter */}
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Operator / Agency
              </label>
              <select
                value={filters.operator}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, operator: e.target.value as any }))
                }
                className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op === 'All' ? 'All Operators' : op}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Sort Carparks By
              </label>
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))
                  }
                  className="w-full py-1.5 pl-2 pr-7 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="lots-desc">Most Lots Available</option>
                  <option value="lots-asc">Least Lots Available (Crowded)</option>
                  <option value="capacity-asc">Highest % Available</option>
                  {hasLocation && <option value="nearest">Distance (Nearest First)</option>}
                  <option value="name">Alphabetical (A - Z)</option>
                </select>
                <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Minimum lots slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  Min Available Lots:
                </span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white font-semibold">
                  {filters.minLotsAvailable > 0 ? `${filters.minLotsAvailable}+ lots` : 'Any'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="25"
                value={filters.minLotsAvailable}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, minLotsAvailable: Number(e.target.value) }))
                }
                className="w-full accent-emerald-600"
              />
            </div>

            {/* Feature Toggles */}
            <div className="flex flex-col justify-end gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyWithEV}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, onlyWithEV: e.target.checked }))
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Has EV Charging (SP / Shell / CDG)
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.tallVehiclesOnly}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, tallVehiclesOnly: e.target.checked }))
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  High Clearance (&gt; 2.0m Clearance)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Active Result Count & Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
              {totalResults}
            </span>
            <span>locations in Singapore</span>
            {filters.district !== 'All Singapore' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {filters.district}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
