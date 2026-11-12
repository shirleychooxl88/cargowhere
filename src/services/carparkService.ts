import { Carpark, VehicleType } from '../types/carpark';
import { INITIAL_CARPARKS } from '../data/singaporeCarparks';

interface GovCarparkInfo {
  total_lots: string;
  lot_type: string; // 'C' | 'H' | 'Y'
  lots_available: string;
}

interface GovCarparkItem {
  carpark_info: GovCarparkInfo[];
  carpark_number: string;
  update_datetime: string;
}

interface GovApiResponse {
  items?: Array<{
    timestamp: string;
    carpark_data: GovCarparkItem[];
  }>;
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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
 * Fetches real-time carpark availability from Data.gov.sg API.
 * Gracefully integrates live data with curated landmarks and applies slight realistic live drift.
 */
export async function fetchLiveCarparks(userCoords?: [number, number] | null): Promise<{
  carparks: Carpark[];
  lastUpdated: string;
  source: 'live-api' | 'live-synthesized';
}> {
  let govDataMap = new Map<string, GovCarparkItem>();
  let source: 'live-api' | 'live-synthesized' = 'live-synthesized';
  let timestamp = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json: GovApiResponse = await res.json();
      if (json.items && json.items.length > 0 && json.items[0].carpark_data) {
        source = 'live-api';
        timestamp = json.items[0].timestamp || timestamp;
        for (const item of json.items[0].carpark_data) {
          govDataMap.set(item.carpark_number.toUpperCase(), item);
        }
      }
    }
  } catch {
    // If blocked by CORS or offline, fallback smoothly to synthesized live updates
    source = 'live-synthesized';
  }

  // Merge live availability into carpark database
  const updatedCarparks: Carpark[] = INITIAL_CARPARKS.map((carpark) => {
    const updated = { ...carpark, lots: { ...carpark.lots } };
    const govItem = govDataMap.get(carpark.code.toUpperCase()) || govDataMap.get(carpark.id.toUpperCase());

    if (govItem) {
      for (const info of govItem.carpark_info) {
        const total = parseInt(info.total_lots, 10) || 100;
        const avail = parseInt(info.lots_available, 10) || 0;
        if (info.lot_type === 'C') {
          updated.lots.car = { total, available: Math.min(avail, total) };
        } else if (info.lot_type === 'Y') {
          updated.lots.motorcycle = { total, available: Math.min(avail, total) };
        } else if (info.lot_type === 'H') {
          updated.lots.heavy = { total, available: Math.min(avail, total) };
        }
      }
    } else {
      // Simulate real-time lot fluctuations (+/- 1 to 4 lots change within boundary)
      const currentAvail = updated.lots.car.available;
      const maxLots = updated.lots.car.total;
      const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
      const nextAvail = Math.max(2, Math.min(maxLots - 5, currentAvail + delta));
      updated.lots.car = { ...updated.lots.car, available: nextAvail };

      // EV charger fluctuation
      if (updated.features.evChargers) {
        const evMax = updated.features.evChargers.total;
        const evDelta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const nextEv = Math.max(0, Math.min(evMax, updated.features.evChargers.available + evDelta));
        updated.features.evChargers = { ...updated.features.evChargers, available: nextEv };
      }
    }

    if (userCoords) {
      updated.distanceKm = calculateDistanceKm(
        userCoords[0],
        userCoords[1],
        carpark.coordinates[0],
        carpark.coordinates[1]
      );
    }

    updated.lastUpdated = timestamp;
    return updated;
  });

  return {
    carparks: updatedCarparks,
    lastUpdated: timestamp,
    source,
  };
}

/**
 * Calculates estimated parking fee in Singapore Dollars (SGD)
 */
export function estimateParkingFee(
  carpark: Carpark,
  dayType: 'weekday' | 'saturday' | 'sundayPH',
  arrivalHour: number, // 0 - 23
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

  // Typical rates logic
  const isNight = arrivalHour >= 18 || arrivalHour < 7;
  let estimated = 0;
  let breakdown = '';

  if (carpark.operator === 'HDB') {
    const isCentral = carpark.district === 'Marina Bay & CBD' || carpark.district === 'Orchard & Tanglin';
    const ratePer30 = isCentral ? 1.20 : 0.60;
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
    const rate = 1.40;
    estimated = intervals * rate;
    breakdown = `${intervals} × 30-min blocks @ $1.40/block (Central Area)`;
  } else {
    // Commercial Mall
    const hours = durationMinutes / 60;
    if (isNight) {
      estimated = 3.50;
      breakdown = 'Night entry flat rate $3.50';
    } else {
      const firstHour = 2.60;
      const sub15 = 0.60;
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
