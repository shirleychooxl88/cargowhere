import React, { useState } from 'react';
import { Calculator, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Carpark } from '../types/carpark';
import { estimateParkingFee } from '../services/carparkService';

interface ParkingFeeCalculatorProps {
  carpark: Carpark;
}

export const ParkingFeeCalculator: React.FC<ParkingFeeCalculatorProps> = ({ carpark }) => {
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sundayPH'>('weekday');
  const [arrivalHour, setArrivalHour] = useState<number>(14); // 2 PM default
  const [durationMinutes, setDurationMinutes] = useState<number>(120); // 2 hours default

  const calculation = estimateParkingFee(carpark, dayType, arrivalHour, durationMinutes);

  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMins = durationMinutes % 60;
  const durationText =
    durationHours > 0
      ? `${durationHours} hr${durationHours > 1 ? 's' : ''} ${
          remainingMins > 0 ? `${remainingMins} mins` : ''
        }`
      : `${remainingMins} mins`;

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Parking Fee Estimator (SGD)
        </h4>
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Day Selector */}
        <div>
          <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
            Select Day of Week
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-lg">
            <button
              onClick={() => setDayType('weekday')}
              className={`py-1.5 rounded-md font-medium transition-colors ${
                dayType === 'weekday'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Weekday
            </button>
            <button
              onClick={() => setDayType('saturday')}
              className={`py-1.5 rounded-md font-medium transition-colors ${
                dayType === 'saturday'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Saturday
            </button>
            <button
              onClick={() => setDayType('sundayPH')}
              className={`py-1.5 rounded-md font-medium transition-colors ${
                dayType === 'sundayPH'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sunday / PH
            </button>
          </div>
        </div>

        {/* Arrival Time Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Arrival Time</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
              {formatHour(arrivalHour)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="23"
            value={arrivalHour}
            onChange={(e) => setArrivalHour(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
        </div>

        {/* Duration selector & Quick Presets */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Stay</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
              {durationText}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="480"
            step="15"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full accent-emerald-600 mb-2"
          />

          <div className="flex flex-wrap gap-1">
            {[15, 30, 60, 120, 180, 240, 360].map((mins) => (
              <button
                key={mins}
                onClick={() => setDurationMinutes(mins)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums transition-colors ${
                  durationMinutes === mins
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white font-medium'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
              </button>
            ))}
          </div>
        </div>

        {/* Calculated Results Box */}
        <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-baseline justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Estimated Parking Charge:
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {calculation.totalFee === 0 ? 'FREE' : `$${calculation.totalFee.toFixed(2)}`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {calculation.breakdownText}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Grace Period: {carpark.rates.gracePeriodMinutes} mins</span>
            <span>Electronic Parking (EPS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
