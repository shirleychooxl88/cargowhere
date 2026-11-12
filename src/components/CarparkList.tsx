import React, { useState } from 'react';
import {
  MapPin,
  Bookmark,
  Zap,
  ArrowRight,
  LayoutGrid,
  List,
  Navigation,
  AlertTriangle,
} from 'lucide-react';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityLevel } from '../services/carparkService';

interface CarparkListProps {
  carparks: Carpark[];
  vehicleType: VehicleType;
  onSelectCarpark: (carpark: Carpark) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onResetFilters: () => void;
}

export const CarparkList: React.FC<CarparkListProps> = ({
  carparks,
  vehicleType,
  onSelectCarpark,
  favorites,
  onToggleFavorite,
  onResetFilters,
}) => {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');

  if (carparks.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 my-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          No matching carparks found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
          Try loosening your filter criteria, resetting vehicle clearance, or clearing search query.
        </p>
        <button
          onClick={onResetFilters}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg transition-colors"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Layout toggle header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span>Displaying </span>
          <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
            {carparks.length}
          </span>
          <span> carparks</span>
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setLayoutMode('grid')}
            title="Grid view"
            className={`p-1.5 rounded-md transition-colors ${
              layoutMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayoutMode('table')}
            title="Compact table view"
            className={`p-1.5 rounded-md transition-colors ${
              layoutMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {layoutMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carparks.map((cp) => {
            const { status, availableLots, totalLots, percentAvailable } = getAvailabilityLevel(
              cp,
              vehicleType
            );
            const isFav = favorites.includes(cp.id);

            return (
              <div
                key={cp.id}
                onClick={() => onSelectCarpark(cp)}
                className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all p-4 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top unboxed metadata line */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {cp.operator}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{cp.code}</span>
                      {cp.distanceKm !== undefined && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                            {cp.distanceKm} km
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(cp.id);
                      }}
                      title={isFav ? 'Remove from saved' : 'Save carpark'}
                      className={`p-1 rounded-md transition-colors ${
                        isFav
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                      }`}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Carpark title */}
                  <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {cp.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {cp.address}
                  </p>

                  {/* Lots Counter & Bar */}
                  <div className="mt-3.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                          {availableLots}
                        </span>
                        <span className="text-xs text-slate-400 font-mono tabular-nums">
                          / {totalLots} lots
                        </span>
                      </div>
                      <span
                        className={`text-xs font-mono tabular-nums font-bold ${
                          status === 'full'
                            ? 'text-rose-600 dark:text-rose-400'
                            : status === 'critical'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {status === 'full'
                          ? 'FULL'
                          : status === 'critical'
                          ? 'LOW CAPACITY'
                          : `${Math.round(percentAvailable)}% open`}
                      </span>
                    </div>

                    {/* Capacity bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          status === 'full'
                            ? 'bg-rose-500'
                            : status === 'critical'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(3, percentAvailable))}%` }}
                      />
                    </div>
                  </div>

                  {/* Rates and Features summary */}
                  <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Day Rate:</span>
                      <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                        {cp.rates.weekdayDay.rate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Sunday/PH:</span>
                      <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                        {cp.rates.sundayPH.rate.includes('Free') ? 'Free Parking' : cp.rates.sundayPH.rate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom tags & Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    {cp.features.evChargers && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>{cp.features.evChargers.available} EV</span>
                      </span>
                    )}
                    <span>Clearance {cp.features.heightLimitMeters}m</span>
                  </div>

                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Rates</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Carpark / Location</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4 text-right">Available Lots</th>
                <th className="py-3 px-4 text-right">Capacity</th>
                <th className="py-3 px-4">Weekday Rate</th>
                <th className="py-3 px-4">EV Charging</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {carparks.map((cp) => {
                const { status, availableLots, totalLots, percentAvailable } = getAvailabilityLevel(
                  cp,
                  vehicleType
                );
                const isFav = favorites.includes(cp.id);

                return (
                  <tr
                    key={cp.id}
                    onClick={() => onSelectCarpark(cp)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(cp.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isFav ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <div>
                          <div>{cp.name}</div>
                          <div className="text-[11px] font-normal text-slate-400">
                            {cp.address} {cp.distanceKm !== undefined && `(${cp.distanceKm} km)`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{cp.operator}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{cp.district}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                      {availableLots}{' '}
                      <span className="text-xs font-normal text-slate-400">/ {totalLots}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          status === 'full'
                            ? 'text-rose-600'
                            : status === 'critical'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {Math.round(percentAvailable)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                      {cp.rates.weekdayDay.rate}
                    </td>
                    <td className="py-3 px-4">
                      {cp.features.evChargers ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>
                            {cp.features.evChargers.available} / {cp.features.evChargers.total}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCarpark(cp);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-md transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
