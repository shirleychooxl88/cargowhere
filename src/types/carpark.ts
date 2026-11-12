export type VehicleType = 'car' | 'motorcycle' | 'heavy';

export type CarparkOperator = 'HDB' | 'URA' | 'Mall / Commercial' | 'Changi Airport';

export type District =
  | 'All Singapore'
  | 'Marina Bay & CBD'
  | 'Orchard & Tanglin'
  | 'Central (Bishan/Toa Payoh)'
  | 'East (Tampines/Changi)'
  | 'West (Jurong/Clementi)'
  | 'North (Woodlands/Yishun)'
  | 'North-East (Serangoon/Punggol)';

export interface LotAvailability {
  total: number;
  available: number;
}

export interface EVChargerInfo {
  total: number;
  available: number;
  provider: 'SP Mobility' | 'Shell Recharge' | 'CDG ENGIE' | 'Tesla Supercharger' | 'Charge+';
  speedKw: number;
}

export interface ParkingRateRule {
  period: string;
  rate: string;
  remarks?: string;
}

export interface Carpark {
  id: string; // e.g. "HE12", "ACB", "MBS", "ION"
  code: string; // Official gov or commercial code
  name: string;
  operator: CarparkOperator;
  address: string;
  postalCode: string;
  district: District;
  coordinates: [number, number]; // [lat, lng]
  distanceKm?: number;
  lots: {
    car: LotAvailability;
    motorcycle?: LotAvailability;
    heavy?: LotAvailability;
  };
  rates: {
    weekdayDay: ParkingRateRule;
    weekdayNight: ParkingRateRule;
    saturday: ParkingRateRule;
    sundayPH: ParkingRateRule;
    gracePeriodMinutes: number;
  };
  features: {
    heightLimitMeters: number;
    isCovered: boolean;
    hasHandicapLots: boolean;
    evChargers?: EVChargerInfo;
    paymentMethods: string[];
    nearMrt: string;
    nearbyErp?: string;
  };
  lastUpdated: string;
}

export interface FilterOptions {
  searchQuery: string;
  district: District;
  vehicleType: VehicleType;
  operator: 'All' | CarparkOperator;
  onlyWithEV: boolean;
  minLotsAvailable: number;
  tallVehiclesOnly: boolean; // > 2.0m
  favoritesOnly: boolean;
  sortBy: 'lots-desc' | 'lots-asc' | 'capacity-asc' | 'nearest' | 'name';
}
