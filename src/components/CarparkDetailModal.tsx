import React, { useState } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Bookmark,
  Share2,
  Zap,
  ShieldCheck,
  Train,
  Check,
  AlertTriangle,
  Car,
  Bike,
  Truck,
} from 'lucide-react';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityLevel } from '../services/carparkService';
import { ParkingFeeCalculator } from './ParkingFeeCalculator';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (carparkId: string) => void;
  activeVehicleType: VehicleType;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  isFavorite,
  onToggleFavorite,
  activeVehicleType,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>(activeVehicleType);
  const [copied, setCopied] = useState(false);

  if (!carpark) return null;

  const { status, availableLots, totalLots, percentAvailable } = getAvailabilityLevel(
    carpark,
    selectedVehicle
  );

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates[0]},${carpark.coordinates[1]}`;
  const wazeUrl = `https://waze.com/ul?ll=${carpark.coordinates[0]},${carpark.coordinates[1]}&navigate=yes`;

  const handleCopy = () => {
    const text = `${carpark.name} (${carpark.code})\nAddress: ${carpark.address}, Singapore ${carpark.postalCode}\nAvailable Lots: ${availableLots} / ${totalLots}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {carpark.operator}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{carpark.code}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.district}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {carpark.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                {carpark.address}, Singapore {carpark.postalCode}
              </span>
              {carpark.distanceKm !== undefined && (
                <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                  ({carpark.distanceKm} km away)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onToggleFavorite(carpark.id)}
              title={isFavorite ? 'Remove from saved' : 'Save to favorites'}
              className={`p-2 rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-500'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={handleCopy}
              title="Copy details"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Real-Time Availability Gauge */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            {/* Vehicle Selector */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Lot Availability Status
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSelectedVehicle('car')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    selectedVehicle === 'car'
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Car className="w-3 h-3" />
                  <span>Car</span>
                </button>
                {carpark.lots.motorcycle && (
                  <button
                    onClick={() => setSelectedVehicle('motorcycle')}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      selectedVehicle === 'motorcycle'
                        ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Bike className="w-3 h-3" />
                    <span>Bike</span>
                  </button>
                )}
                {carpark.lots.heavy && (
                  <button
                    onClick={() => setSelectedVehicle('heavy')}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      selectedVehicle === 'heavy'
                        ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Truck className="w-3 h-3" />
                    <span>Heavy</span>
                  </button>
                )}
              </div>
            </div>

            {/* Lots numbers */}
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                  {availableLots}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  available of {totalLots} total lots
                </span>
              </div>
              <span className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {Math.round(percentAvailable)}% open
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  status === 'full'
                    ? 'bg-rose-500'
                    : status === 'critical'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, percentAvailable))}%` }}
              />
            </div>
          </div>

          {/* Parking Rates Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Standard Parking Rates
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="p-2.5 flex justify-between bg-white dark:bg-slate-900">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Weekday Daytime ({carpark.rates.weekdayDay.period})
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {carpark.rates.weekdayDay.rate}
                </span>
              </div>
              <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Weekday Night ({carpark.rates.weekdayNight.period})
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {carpark.rates.weekdayNight.rate}
                </span>
              </div>
              <div className="p-2.5 flex justify-between bg-white dark:bg-slate-900">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Saturday ({carpark.rates.saturday.period})
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {carpark.rates.saturday.rate}
                </span>
              </div>
              <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Sunday & Public Holidays ({carpark.rates.sundayPH.period})
                </span>
                <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                  {carpark.rates.sundayPH.rate}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Calculator */}
          <ParkingFeeCalculator carpark={carpark} />

          {/* EV Charging Info (if applicable) */}
          {carpark.features.evChargers && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 text-xs">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  EV Charging Hub ({carpark.features.evChargers.provider})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Available Ports: </span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {carpark.features.evChargers.available} / {carpark.features.evChargers.total}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Charging Speed: </span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {carpark.features.evChargers.speedKw} kW (Fast)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Specifications & Transit info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                Height Clearance
              </span>
              <div className="flex items-center gap-1 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {carpark.features.heightLimitMeters < 2.0 && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{carpark.features.heightLimitMeters}m</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Sheltered</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {carpark.features.isCovered ? 'Covered / MSCP' : 'Open Surface'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Nearest MRT</span>
              <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                <Train className="w-3 h-3 text-slate-400" />
                <span>{carpark.features.nearMrt}</span>
              </span>
            </div>
          </div>

          {carpark.features.nearbyErp && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 p-2.5 bg-slate-100/70 dark:bg-slate-800/50 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Nearby ERP Gantry: <strong className="text-slate-700 dark:text-slate-200">{carpark.features.nearbyErp}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>Last verified via Singapore Open Data API</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Waze</span>
            </a>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
