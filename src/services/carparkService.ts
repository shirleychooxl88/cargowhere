import { Carpark, VehicleType } from '../types/carpark';
import { INITIAL_CARPARKS } from '../data/singaporeCarparks';

export interface LtaBusService {
  ServiceNo: string;
  Operator: string;
  NextBus: {
    EstimatedArrival: string;
    Load: 'SEA' | 'SDA' | 'LSD'; // Seats Available | Standing Available | Limited Standing
    Feature: string;
    Type: 'SD' | 'DD' | 'BD'; // Single Deck | Double Deck | Bendy
  };
  NextBus2?: {
    EstimatedArrival: string;
    Load: string;
    Feature: string;
    Type: string;
  };
  NextBus3?: {
    EstimatedArrival: string;
    Load: string;
    Feature: string;
    Type: string;
  };
}

export interface LtaTrafficIncident {
  Type: string;
  Latitude: number;
  Longitude: number;
  Message: string;
}

export interface LtaTrainAlert {
  Status: number; // 1 = Normal, 2 = Disrupted
  Line?: string;
  Direction?: string;
  Stations?: string;
  FreePublicBus?: string;
  FreeMRTShuttle?: string;
  Message?: string[];
}

export interface LtaStatusResponse {
  hasAccountKey: boolean;
  isConnected: boolean;
  testError: string | null;
  activeEndpoints: string[];
}

/**
 * Haversine formula to compute distance in km
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Fetches real-time carpark availability from the backend LTA DataMall proxy (/api/lta/carparks)
 */
export async function fetchLiveCarparks(userCoords?: [number, number] | null): Promise<{
  carparks: Carpark[];
  lastUpdated: string;
  source: 'lta-datamall' | 'live-api' | 'live-synthesized';
  hasAccountKey: boolean;
}> {
  let source: 'lta-datamall' | 'live-api' | 'live-synthesized' = 'live-synthesized';
  let timestamp = new Date().toISOString();
  let hasAccountKey = false;
  const ltaLotMap = new Map<string, { available: number; lotType: string }>();

  try {
    const res = await fetch('/api/lta/carparks');
    if (res.ok) {
      const data = await res.json();
      hasAccountKey = Boolean(data.hasAccountKey);

      if (data.source === 'lta-datamall' && Array.isArray(data.value)) {
        source = 'lta-datamall';
        // Parse LTA DataMall v2 format: { CarParkID, Area, Development, Location, AvailableLots, LotType, Agency }
        for (const item of data.value) {
          const id = (item.CarParkID || '').toString().toUpperCase();
          const dev = (item.Development || '').toString().toLowerCase();
          const lots = Number(item.AvailableLots) || 0;
          const lotType = (item.LotType || 'C').toUpperCase();

          ltaLotMap.set(id, { available: lots, lotType });
          if (dev) {
            ltaLotMap.set(dev, { available: lots, lotType });
          }
        }
      } else if (data.source === 'datagovsg-fallback' && Array.isArray(data.value)) {
        source = 'live-api';
        timestamp = data.timestamp || timestamp;
        // Parse Data.gov.sg format: { carpark_number, carpark_info: [ { lot_type, lots_available, total_lots } ] }
        for (const item of data.value) {
          const id = (item.carpark_number || '').toString().toUpperCase();
          const carInfo = item.carpark_info?.find((i: any) => i.lot_type === 'C') || item.carpark_info?.[0];
          if (carInfo) {
            ltaLotMap.set(id, {
              available: parseInt(carInfo.lots_available, 10) || 0,
              lotType: carInfo.lot_type || 'C',
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn('Backend proxy fetch failed, falling back to local synthesizer:', e);
  }

  // Merge into initial curated dataset
  const updatedCarparks: Carpark[] = INITIAL_CARPARKS.map((cp) => {
    const updated = { ...cp, lots: { ...cp.lots } };
    const devKey = cp.name.toLowerCase();
    const ltaMatch =
      ltaLotMap.get(cp.code.toUpperCase()) ||
      ltaLotMap.get(cp.id.toUpperCase()) ||
      ltaLotMap.get(devKey);

    if (ltaMatch) {
      const total = updated.lots.car.total;
      updated.lots.car = {
        total,
        available: Math.min(ltaMatch.available, total),
      };
    } else {
      // Natural slight drift simulation (+/- 1 to 3 lots)
      const currentAvail = updated.lots.car.available;
      const maxLots = updated.lots.car.total;
      const delta = Math.floor(Math.random() * 5) - 2;
      const nextAvail = Math.max(2, Math.min(maxLots - 5, currentAvail + delta));
      updated.lots.car = { ...updated.lots.car, available: nextAvail };
    }

    if (userCoords) {
      updated.distanceKm = calculateDistanceKm(
        userCoords[0],
        userCoords[1],
        cp.coordinates[0],
        cp.coordinates[1]
      );
    }

    updated.lastUpdated = timestamp;
    return updated;
  });

  return {
    carparks: updatedCarparks,
    lastUpdated: timestamp,
    source,
    hasAccountKey,
  };
}

/**
 * Fetches Next Buses from /api/lta/bus-arrival (LTA DataMall v3 BusArrival)
 */
export async function fetchLtaBusArrival(busStopCode = '04121', serviceNo = ''): Promise<{
  services: LtaBusService[];
  busStopCode: string;
  source: string;
}> {
  const params = new URLSearchParams();
  if (busStopCode) params.append('BusStopCode', busStopCode);
  if (serviceNo) params.append('ServiceNo', serviceNo);

  const res = await fetch(`/api/lta/bus-arrival?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch bus arrival data');
  const json = await res.json();

  return {
    services: json.data?.Services || [],
    busStopCode: json.data?.BusStopCode || busStopCode,
    source: json.source || 'simulated',
  };
}

/**
 * Fetches expressway incidents from /api/lta/traffic-incidents
 */
export async function fetchLtaTrafficIncidents(): Promise<{
  incidents: LtaTrafficIncident[];
  source: string;
}> {
  const res = await fetch('/api/lta/traffic-incidents');
  if (!res.ok) throw new Error('Failed to fetch traffic incidents');
  const json = await res.json();
  return {
    incidents: json.value || [],
    source: json.source || 'simulated',
  };
}

/**
 * Fetches train alerts from /api/lta/train-alerts
 */
export async function fetchLtaTrainAlerts(): Promise<{
  alert: LtaTrainAlert;
  source: string;
}> {
  const res = await fetch('/api/lta/train-alerts');
  if (!res.ok) throw new Error('Failed to fetch train alerts');
  const json = await res.json();
  return {
    alert: json.data || { Status: 1, Message: [] },
    source: json.source || 'simulated',
  };
}

/**
 * Checks LTA DataMall connection status
 */
export async function checkLtaStatus(): Promise<LtaStatusResponse> {
  const res = await fetch('/api/lta/status');
  if (!res.ok) throw new Error('Failed to check LTA status');
  return res.json();
}

/**
 * Calculates estimated parking fee in Singapore Dollars (SGD)
 */
export function estimateParkingFee(
  carpark: Carpark,
  dayType: 'weekday' | 'saturday' | 'sundayPH',
  arrivalHour: number,
  durationMinutes: number
): { totalFee: number; breakdownText: string; isWithinGrace: boolean } {
  const graceMinutes = carpark.rates.gracePeriodMinutes || 10;
  if (durationMinutes <= graceMinutes) {
    return {
      totalFee: 0,
      breakdownText: `Free (${durationMinutes} mins within ${graceMinutes}-min grace period)`,
      isWithinGrace: true,
    };
  }

  const isNight = arrivalHour >= 18 || arrivalHour < 7;
  let estimated = 0;
  let breakdown = '';

  if (carpark.operator === 'HDB') {
    const isCentral = carpark.district === 'Marina Bay & CBD' || carpark.district === 'Orchard & Tanglin';
    const ratePer30 = isCentral ? 1.2 : 0.6;
    if (dayType === 'sundayPH') {
      estimated = 0;
      breakdown = 'HDB Free Parking Scheme on Sundays & Public Holidays (7am - 10:30pm)';
    } else {
      const intervals = Math.ceil(durationMinutes / 30);
      estimated = intervals * ratePer30;
      if (isNight && estimated > 5.0) {
        estimated = 5.0;
        breakdown = `${intervals} × 30-min block capped at night maximum of $5.00`;
      } else {
        breakdown = `${intervals} × 30-min blocks @ $${ratePer30.toFixed(2)}/block`;
      }
    }
  } else if (carpark.operator === 'URA') {
    const intervals = Math.ceil(durationMinutes / 30);
    const rate = 1.4;
    estimated = intervals * rate;
    breakdown = `${intervals} × 30-min blocks @ $1.40/block (Central Area)`;
  } else {
    const hours = durationMinutes / 60;
    if (isNight) {
      estimated = 3.5;
      breakdown = 'Night entry flat rate $3.50';
    } else {
      const firstHour = 2.6;
      const sub15 = 0.6;
      if (hours <= 1) {
        estimated = firstHour;
        breakdown = '1st hour standard rate $2.60';
      } else {
        const subMinutes = durationMinutes - 60;
        const sub15Blocks = Math.ceil(subMinutes / 15);
        estimated = firstHour + sub15Blocks * sub15;
        breakdown = `$2.60 (1st hr) + ${sub15Blocks} × $0.60 (subsequent 15-min blocks)`;
      }
    }
  }

  return {
    totalFee: Math.round(estimated * 100) / 100,
    breakdownText: breakdown,
    isWithinGrace: false,
  };
}

export function getAvailabilityLevel(
  carpark: Carpark,
  vehicleType: VehicleType = 'car'
): {
  status: 'high' | 'moderate' | 'critical' | 'full';
  percentAvailable: number;
  availableLots: number;
  totalLots: number;
  label: string;
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
} {
  const info = carpark.lots[vehicleType] || carpark.lots.car;
  const availableLots = info.available;
  const totalLots = info.total;
  const percentAvailable = totalLots > 0 ? (availableLots / totalLots) * 100 : 0;

  if (availableLots === 0) {
    return {
      status: 'full',
      percentAvailable: 0,
      availableLots: 0,
      totalLots,
      label: 'CARPARK FULL',
      colorClass: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/50',
      badgeBorder: 'border-rose-200 dark:border-rose-800',
      badgeText: 'text-rose-700 dark:text-rose-300',
    };
  }

  if (percentAvailable < 12 || availableLots < 25) {
    return {
      status: 'critical',
      percentAvailable,
      availableLots,
      totalLots,
      label: 'CRITICAL LOW',
      colorClass: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
      badgeBorder: 'border-amber-200 dark:border-amber-800',
      badgeText: 'text-amber-700 dark:text-amber-300',
    };
  }

  if (percentAvailable < 35 || availableLots < 70) {
    return {
      status: 'moderate',
      percentAvailable,
      availableLots,
      totalLots,
      label: 'MODERATE',
      colorClass: 'text-emerald-700 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      badgeText: 'text-emerald-800 dark:text-emerald-300',
    };
  }

  return {
    status: 'high',
    percentAvailable,
    availableLots,
    totalLots,
    label: 'AVAILABLE',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  };
}
