/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Carpark, FilterOptions, VehicleType } from './types/carpark';
import { fetchLiveCarparks, getAvailabilityLevel } from './services/carparkService';
import { Header } from './components/Header';
import { QuickStats } from './components/QuickStats';
import { FilterToolbar } from './components/FilterToolbar';
import { CarparkMap } from './components/CarparkMap';
import { CarparkList } from './components/CarparkList';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { MapPin, Navigation, Compass, Bookmark, Clock, RefreshCw } from 'lucide-react';

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [source, setSource] = useState<'live-api' | 'live-synthesized'>('live-synthesized');

  // View state: 'map' | 'list' | 'favorites'
  const [activeView, setActiveView] = useState<'map' | 'list' | 'favorites'>('map');

  // Selected Carpark for Detailed Modal
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);

  // User GPS Location Coordinates [lat, lng]
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_carpark_favorites');
      return saved ? JSON.parse(saved) : ['MBS', 'ION', 'TP1'];
    } catch {
      return ['MBS', 'ION', 'TP1'];
    }
  });

  // Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    district: 'All Singapore',
    vehicleType: 'car',
    operator: 'All',
    onlyWithEV: false,
    minLotsAvailable: 0,
    tallVehiclesOnly: false,
    favoritesOnly: false,
    sortBy: 'lots-desc',
  });

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Persist favorites
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('sg_carpark_favorites', JSON.stringify(next));
      return next;
    });
  };

  // Fetch live carpark lots
  const loadCarparkData = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const data = await fetchLiveCarparks(userCoords);
      setCarparks(data.carparks);
      setLastUpdated(data.lastUpdated);
      setSource(data.source);
    } catch (err) {
      console.error('Failed to load carparks:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [userCoords]);

  // Initial load
  useEffect(() => {
    loadCarparkData(false);
  }, [loadCarparkData]);

  // Auto-refresh timer every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadCarparkData(false);
    }, 60000);
    return () => clearInterval(timer);
  }, [loadCarparkData]);

  // Locate User via GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setIsLocating(false);
        // Switch sorting to nearest
        setFilters((prev) => ({ ...prev, sortBy: 'nearest' }));
        // Refresh carparks with distance calculation
        fetchLiveCarparks(coords).then((res) => {
          setCarparks(res.carparks);
        });
      },
      (err) => {
        setIsLocating(false);
        // Fallback default: Orchard Road area
        setUserCoords([1.304, 103.832]);
        setLocationError('Unable to retrieve your location. Showing central Singapore.');
        setTimeout(() => setLocationError(null), 4000);
      },
      { timeout: 8000 }
    );
  };

  // Filtered & Sorted carparks
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Favorites view check
        if (activeView === 'favorites' && !favorites.includes(cp.id)) {
          return false;
        }

        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchName = cp.name.toLowerCase().includes(q);
          const matchCode = cp.code.toLowerCase().includes(q);
          const matchAddress = cp.address.toLowerCase().includes(q);
          const matchPostal = cp.postalCode.includes(q);
          if (!matchName && !matchCode && !matchAddress && !matchPostal) {
            return false;
          }
        }

        // District
        if (filters.district !== 'All Singapore' && cp.district !== filters.district) {
          return false;
        }

        // Operator
        if (filters.operator !== 'All' && cp.operator !== filters.operator) {
          return false;
        }

        // Minimum Available lots for vehicle type
        const info = cp.lots[filters.vehicleType] || cp.lots.car;
        if (info.available < filters.minLotsAvailable) {
          return false;
        }

        // EV Charger filter
        if (filters.onlyWithEV && (!cp.features.evChargers || cp.features.evChargers.available <= 0)) {
          return false;
        }

        // Tall vehicles (> 2.0m height clearance)
        if (filters.tallVehiclesOnly && cp.features.heightLimitMeters <= 2.0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aInfo = a.lots[filters.vehicleType] || a.lots.car;
        const bInfo = b.lots[filters.vehicleType] || b.lots.car;

        if (filters.sortBy === 'lots-desc') {
          return bInfo.available - aInfo.available;
        }
        if (filters.sortBy === 'lots-asc') {
          return aInfo.available - bInfo.available;
        }
        if (filters.sortBy === 'capacity-asc') {
          const aCap = aInfo.total > 0 ? aInfo.available / aInfo.total : 0;
          const bCap = bInfo.total > 0 ? bInfo.available / bInfo.total : 0;
          return bCap - aCap;
        }
        if (filters.sortBy === 'nearest') {
          return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        }
        if (filters.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [carparks, activeView, favorites, filters]);

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
      sortBy: userCoords ? 'nearest' : 'lots-desc',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar Header strictly conforming to Top Bar Contract */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        favoritesCount={favorites.length}
        isRefreshing={isRefreshing}
        onRefresh={() => loadCarparkData(true)}
        lastUpdated={lastUpdated}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        hasLocation={userCoords !== null}
      />

      {/* Quick KPI Telemetry Strip */}
      <QuickStats
        carparks={carparks}
        vehicleType={filters.vehicleType}
        lastUpdated={lastUpdated}
        source={source}
      />

      {/* Filter and Search Bar */}
      <FilterToolbar
        filters={filters}
        setFilters={setFilters}
        totalResults={filteredCarparks.length}
        hasLocation={userCoords !== null}
      />

      {/* Location Toast Notification */}
      {locationError && (
        <div className="max-w-7xl mx-auto px-4 w-full mt-2">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-center justify-between">
            <span>{locationError}</span>
            <button onClick={() => setLocationError(null)} className="font-bold underline ml-2">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Syncing real-time Singapore carpark availability...
            </span>
          </div>
        ) : activeView === 'map' ? (
          /* Map View: Desktop 2-column Split (Interactive Map + Live Quick Feed Sidebar) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-270px)] min-h-[580px]">
            {/* Left/Center: Interactive Map */}
            <div className="lg:col-span-8 h-full min-h-[420px] rounded-xl overflow-hidden">
              <CarparkMap
                carparks={filteredCarparks}
                vehicleType={filters.vehicleType}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(cp) => setSelectedCarpark(cp)}
                userCoords={userCoords}
              />
            </div>

            {/* Right: Real-time Quick Card Sidebar */}
            <div className="lg:col-span-4 h-full flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Lot Availability
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click pin or card to check rates
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('list')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  View All ({filteredCarparks.length})
                </button>
              </div>

              {/* Scrollable Mini List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1 mt-2 space-y-1">
                {filteredCarparks.slice(0, 15).map((cp) => {
                  const { status, availableLots, totalLots, percentAvailable } =
                    getAvailabilityLevel(cp, filters.vehicleType);
                  const isSelected = selectedCarpark?.id === cp.id;

                  return (
                    <div
                      key={cp.id}
                      onClick={() => setSelectedCarpark(cp)}
                      className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {cp.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                            {cp.district}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-extrabold font-mono tabular-nums ${
                              status === 'full'
                                ? 'text-rose-600'
                                : status === 'critical'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {availableLots}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            /{totalLots}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono tabular-nums">{cp.rates.weekdayDay.rate}</span>
                        {cp.features.evChargers && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono tabular-nums">
                            {cp.features.evChargers.available} EV Lots
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* List or Favorites View */
          <div className="space-y-4">
            {activeView === 'favorites' && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Saved Carpark Lots ({favorites.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quickly check live lot vacancies for your regular home, work, and mall destinations.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('list')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Browse All Carparks
                </button>
              </div>
            )}

            <CarparkList
              carparks={filteredCarparks}
              vehicleType={filters.vehicleType}
              onSelectCarpark={(cp) => setSelectedCarpark(cp)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onResetFilters={handleResetFilters}
            />
          </div>
        )}
      </main>

      {/* Carpark Detail & Rates Drawer Modal */}
      <CarparkDetailModal
        carpark={selectedCarpark}
        onClose={() => setSelectedCarpark(null)}
        isFavorite={selectedCarpark ? favorites.includes(selectedCarpark.id) : false}
        onToggleFavorite={toggleFavorite}
        activeVehicleType={filters.vehicleType}
      />

      {/* Clean Footer conforming to Anti-Slop Cleanliness */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              SG Carpark Live
            </span>
            <span aria-hidden="true">·</span>
            <span>Singapore Real-Time Parking &amp; Lots Availability</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>HDB Electronic Parking Scheme</span>
            <span aria-hidden="true">·</span>
            <span>LTA DataMall &amp; Data.gov.sg API</span>
            <span aria-hidden="true">·</span>
            <span>All Rates in SGD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
