import React from 'react';
import { Navigation, RefreshCw, Sun, Moon, MapPin } from 'lucide-react';

interface HeaderProps {
  activeView: 'map' | 'list' | 'favorites';
  setActiveView: (view: 'map' | 'list' | 'favorites') => void;
  favoritesCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
  hasLocation: boolean;
  onOpenTransitModal: () => void;
  hasAccountKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  favoritesCount,
  isRefreshing,
  onRefresh,
  lastUpdated,
  isDarkMode,
  onToggleDarkMode,
  onLocateMe,
  isLocating,
  hasLocation,
  onOpenTransitModal,
  hasAccountKey,
}) => {
  const formattedTime = new Date(lastUpdated).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              P
            </div>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('map');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              SG Carpark Live
            </a>
          </div>

          {/* Zone 2: 4 clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setActiveView('map')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeView === 'map'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 font-semibold'
                  : ''
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeView === 'list'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 font-semibold'
                  : ''
              }`}
            >
              All Carparks & Rates
            </button>
            <button
              onClick={() => setActiveView('favorites')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 flex items-center gap-1.5 ${
                activeView === 'favorites'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 font-semibold'
                  : ''
              }`}
            >
              <span>Saved Lots</span>
              {favoritesCount > 0 && (
                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  ({favoritesCount})
                </span>
              )}
            </button>
            <button
              onClick={onOpenTransitModal}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
            >
              <span>LTA Transit &amp; Traffic</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            </button>
          </nav>

          {/* Zone 3: Primary action + quick utility actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* GPS Locate Me Button */}
            <button
              onClick={onLocateMe}
              disabled={isLocating}
              title={hasLocation ? 'GPS Location active' : 'Find carparks near your current GPS location'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                hasLocation
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{hasLocation ? 'Nearby Active' : 'Near Me'}</span>
            </button>

            {/* Refresh Live Lots Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title={`Last updated at ${formattedTime}. Click to refresh live availability.`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm disabled:opacity-75"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Lots</span>
            </button>

            {/* Dark / Light Mode Switch */}
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveView('map')}
            className={`py-1 px-2 ${
              activeView === 'map'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Map View
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`py-1 px-2 ${
              activeView === 'list'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Carparks
          </button>
          <button
            onClick={() => setActiveView('favorites')}
            className={`py-1 px-2 ${
              activeView === 'favorites'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Saved Lots {favoritesCount > 0 ? `(${favoritesCount})` : ''}
          </button>
        </div>
      </div>
    </header>
  );
};
