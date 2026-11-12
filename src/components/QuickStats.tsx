import React from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityLevel } from '../services/carparkService';

interface QuickStatsProps {
  carparks: Carpark[];
  vehicleType: VehicleType;
  lastUpdated: string;
  source: 'lta-datamall' | 'live-api' | 'live-synthesized';
  hasAccountKey: boolean;
  onOpenTransitModal: () => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  carparks,
  vehicleType,
  lastUpdated,
  source,
  hasAccountKey,
  onOpenTransitModal,
}) => {
  // Aggregate stats
  let totalLots = 0;
  let availableLots = 0;
  let evChargersTotal = 0;
  let evChargersAvailable = 0;
  let criticalCount = 0;

  for (const cp of carparks) {
    const info = cp.lots[vehicleType] || cp.lots.car;
    totalLots += info.total;
    availableLots += info.available;

    if (cp.features.evChargers) {
      evChargersTotal += cp.features.evChargers.total;
      evChargersAvailable += cp.features.evChargers.available;
    }

    const { status } = getAvailabilityLevel(cp, vehicleType);
    if (status === 'critical' || status === 'full') {
      criticalCount++;
    }
  }

  const overallPercent = totalLots > 0 ? Math.round((availableLots / totalLots) * 100) : 0;
  const timeStr = new Date(lastUpdated).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const sourceLabel =
    source === 'lta-datamall'
      ? 'LTA DataMall v2'
      : source === 'live-api'
      ? 'Data.gov.sg'
      : 'Live Sync';

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Metric 1: Total Available Lots */}
          <div className="flex flex-col pt-1 md:pt-0">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Real-Time Available Lots
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {availableLots.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                / {totalLots.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Metric 2: Islandwide Capacity */}
          <div className="flex flex-col pt-2 md:pt-0 md:pl-6">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Island Space Availability
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {overallPercent}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Lots open</span>
            </div>
          </div>

          {/* Metric 3: Monitored Locations */}
          <div className="flex flex-col pt-2 md:pt-0 md:pl-6">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Carparks Monitored
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {carparks.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">HDB, URA &amp; Malls</span>
            </div>
          </div>

          {/* Metric 4: EV Charging Stations */}
          <div className="flex flex-col pt-2 md:pt-0 md:pl-6">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Available EV Chargers
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {evChargersAvailable}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                / {evChargersTotal} plugs
              </span>
            </div>
          </div>

          {/* Metric 5: Live Gov Stream & Transit Feed link */}
          <div className="flex flex-col pt-2 md:pt-0 md:pl-6 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Gov Stream
              </span>
              <button
                onClick={onOpenTransitModal}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Traffic &amp; Bus Hub &rarr;
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {timeStr}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {sourceLabel}
              </span>
            </div>
            {criticalCount > 0 ? (
              <span className="text-[11px] font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
                {criticalCount} locations crowded
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Nominal traffic flow
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
