import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Bus,
  Train,
  ShieldCheck,
  RefreshCw,
  Clock,
  Radio,
  ExternalLink,
} from 'lucide-react';
import {
  fetchLtaBusArrival,
  fetchLtaTrafficIncidents,
  fetchLtaTrainAlerts,
  checkLtaStatus,
  LtaBusService,
  LtaTrafficIncident,
  LtaTrainAlert,
  LtaStatusResponse,
} from '../services/carparkService';

interface LtaTransitAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasAccountKey: boolean;
}

const COMMON_BUS_STOPS = [
  { code: '04121', name: 'Bras Basah Rd / City Hall Stn' },
  { code: '09048', name: 'Orchard Stn / Lucky Plaza' },
  { code: '03211', name: 'Suntec City / Temasek Blvd' },
  { code: '14009', name: 'HarbourFront Stn / VivoCity' },
  { code: '81111', name: 'Changi Airport PTB1 / Jewel' },
  { code: '28009', name: 'Jurong East Int / Westgate' },
];

export const LtaTransitAlertsModal: React.FC<LtaTransitAlertsModalProps> = ({
  isOpen,
  onClose,
  hasAccountKey,
}) => {
  const [activeTab, setActiveTab] = useState<'buses' | 'traffic' | 'trains' | 'endpoints'>('buses');

  // Bus Arrival state
  const [busStopCode, setBusStopCode] = useState('04121');
  const [serviceFilter, setServiceFilter] = useState('');
  const [busServices, setBusServices] = useState<LtaBusService[]>([]);
  const [isBusLoading, setIsBusLoading] = useState(false);
  const [busLastRefresh, setBusLastRefresh] = useState(new Date());

  // Traffic Incidents state
  const [incidents, setIncidents] = useState<LtaTrafficIncident[]>([]);
  const [isIncidentsLoading, setIsIncidentsLoading] = useState(false);

  // Train Alerts state
  const [trainAlert, setTrainAlert] = useState<LtaTrainAlert | null>(null);

  // LTA Status state
  const [ltaStatus, setLtaStatus] = useState<LtaStatusResponse | null>(null);

  // Fetch Bus Arrival
  const loadBuses = async (code = busStopCode, service = serviceFilter) => {
    setIsBusLoading(true);
    try {
      const res = await fetchLtaBusArrival(code, service);
      setBusServices(res.services);
      setBusLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setIsBusLoading(false);
    }
  };

  // Fetch Incidents
  const loadIncidents = async () => {
    setIsIncidentsLoading(true);
    try {
      const res = await fetchLtaTrafficIncidents();
      setIncidents(res.incidents);
    } catch (e) {
      console.error(e);
    } finally {
      setIsIncidentsLoading(false);
    }
  };

  // Fetch Train Alerts
  const loadTrainAlerts = async () => {
    try {
      const res = await fetchLtaTrainAlerts();
      setTrainAlert(res.alert);
    } catch (e) {
      console.error(e);
    }
  };

  // Check LTA Status
  const loadStatus = async () => {
    try {
      const status = await checkLtaStatus();
      setLtaStatus(status);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBuses();
      loadIncidents();
      loadTrainAlerts();
      loadStatus();
    }
  }, [isOpen]);

  // Auto-refresh bus arrivals every 20 seconds (per LTA spec)
  useEffect(() => {
    if (!isOpen || activeTab !== 'buses') return;
    const timer = setInterval(() => {
      loadBuses(busStopCode, serviceFilter);
    }, 20000);
    return () => clearInterval(timer);
  }, [isOpen, activeTab, busStopCode, serviceFilter]);

  if (!isOpen) return null;

  const calculateMinutes = (isoString?: string) => {
    if (!isoString) return null;
    const diffMs = new Date(isoString).getTime() - new Date().getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins <= 0) return 'Arr';
    return `${diffMins}m`;
  };

  const getLoadBadge = (load?: string) => {
    if (load === 'SEA') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium">
          Seats Available
        </span>
      );
    }
    if (load === 'SDA') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium">
          Standing Available
        </span>
      );
    }
    if (load === 'LSD') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-medium">
          Limited Standing
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                LTA DataMall v2/v3
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Live Singapore Transport Feed</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              Transit &amp; Traffic Hub
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <button
            onClick={() => setActiveTab('buses')}
            className={`pb-2.5 px-3 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'buses'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Bus Arrivals (v3)</span>
          </button>

          <button
            onClick={() => setActiveTab('traffic')}
            className={`pb-2.5 px-3 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'traffic'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Traffic Incidents ({incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trains')}
            className={`pb-2.5 px-3 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'trains'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>MRT &amp; LRT Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('endpoints')}
            className={`pb-2.5 px-3 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'endpoints'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>API Status</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          {/* TAB 1: Next buses at a stop (v3) */}
          {activeTab === 'buses' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between text-xs">
                  {/* Bus Stop Selector */}
                  <div className="flex-1">
                    <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                      Select Transit Bus Stop
                    </label>
                    <select
                      value={busStopCode}
                      onChange={(e) => {
                        setBusStopCode(e.target.value);
                        loadBuses(e.target.value, serviceFilter);
                      }}
                      className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                    >
                      {COMMON_BUS_STOPS.map((stop) => (
                        <option key={stop.code} value={stop.code}>
                          {stop.code} - {stop.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Service No (e.g. &ServiceNo=7) */}
                  <div className="w-full sm:w-36">
                    <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                      Service No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7, 14, 106"
                      value={serviceFilter}
                      onChange={(e) => {
                        setServiceFilter(e.target.value);
                        loadBuses(busStopCode, e.target.value);
                      }}
                      className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>

                  <div className="self-end pb-0.5">
                    <button
                      onClick={() => loadBuses(busStopCode, serviceFilter)}
                      disabled={isBusLoading}
                      className="p-2 rounded-lg bg-slate-900 text-white dark:bg-emerald-600 hover:bg-slate-800 transition-colors"
                      title="Refresh bus arrivals (refreshes every 20 seconds)"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isBusLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Auto-refreshes every 20 seconds</span>
                  </div>
                  <span>
                    Endpoint: <code className="font-mono">v3/BusArrival?BusStopCode={busStopCode}</code>
                  </span>
                </div>
              </div>

              {/* Bus Services List */}
              <div className="space-y-2">
                {busServices.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No services found for this stop code.
                  </div>
                ) : (
                  busServices.map((svc) => (
                    <div
                      key={svc.ServiceNo}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-sm font-mono tabular-nums">
                          {svc.ServiceNo}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            Operated by {svc.Operator}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {svc.NextBus?.Type === 'DD' ? 'Double Deck' : 'Single Deck'}
                            {svc.NextBus?.Feature === 'WAB' ? ' · Wheelchair Accessible' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Arrivals (NextBus, NextBus2, NextBus3) */}
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                            {calculateMinutes(svc.NextBus?.EstimatedArrival) || '—'}
                          </div>
                          {getLoadBadge(svc.NextBus?.Load)}
                        </div>

                        {svc.NextBus2 && (
                          <div className="hidden sm:block text-slate-400 font-mono text-xs tabular-nums">
                            <div>{calculateMinutes(svc.NextBus2.EstimatedArrival) || '—'}</div>
                            <span className="text-[10px]">2nd bus</span>
                          </div>
                        )}

                        {svc.NextBus3 && (
                          <div className="hidden sm:block text-slate-400 font-mono text-xs tabular-nums">
                            <div>{calculateMinutes(svc.NextBus3.EstimatedArrival) || '—'}</div>
                            <span className="text-[10px]">3rd bus</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Traffic Incidents */}
          {activeTab === 'traffic' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Expressway Accidents, Roadworks &amp; Breakdowns</span>
                <button
                  onClick={loadIncidents}
                  className="flex items-center gap-1 text-emerald-600 hover:underline"
                >
                  <RefreshCw className={`w-3 h-3 ${isIncidentsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Incidents</span>
                </button>
              </div>

              {incidents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No active traffic incidents reported on Singapore expressways.
                </div>
              ) : (
                incidents.map((inc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {inc.Type}
                        </span>
                        {inc.Latitude && inc.Longitude && (
                          <span className="text-[10px] font-mono text-slate-400">
                            ({inc.Latitude.toFixed(3)}, {inc.Longitude.toFixed(3)})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {inc.Message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Train Service Alerts */}
          {activeTab === 'trains' && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Train className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      MRT / LRT Line Status
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                      trainAlert?.Status === 1
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    }`}
                  >
                    {trainAlert?.Status === 1 ? 'Normal Service' : 'Service Disrupted'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {trainAlert?.Status === 1
                    ? 'All Singapore MRT and LRT lines (North-South, East-West, Circle, Downtown, Thomson-East Coast, North-East) are operating regularly with no reported service delays.'
                    : trainAlert?.Message?.join(' ') || 'Service disruptions reported.'}
                </p>

                {trainAlert?.FreePublicBus && (
                  <div className="text-xs p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-800 dark:text-amber-300">
                    <strong>Free Bus Bridging:</strong> {trainAlert.FreePublicBus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LTA DataMall Endpoints & Key Status */}
          {activeTab === 'endpoints' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    LTA DataMall AccountKey:
                  </span>
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded font-semibold ${
                      ltaStatus?.hasAccountKey
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {ltaStatus?.hasAccountKey ? 'Configured in Backend' : 'Not Set (Using Live Fallback)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Configure <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">LTA_ACCOUNT_KEY</code> in your environment or Secrets panel to connect your personal Land Transport Authority developer credentials.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-3 bg-white dark:bg-slate-900">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    1. CarParkAvailabilityv2
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 break-all">
                    https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    2. Next buses at a stop (v3)
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 break-all">
                    https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121&amp;ServiceNo=7
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    3. Traffic Incidents
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 break-all">
                    https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    4. Train Service Alerts
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 break-all">
                    https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Singapore Land Transport Authority (LTA) DataMall</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-emerald-600 font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
