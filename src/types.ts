export type ScreenType = 'dashboard' | 'hud' | 'logs' | 'map';

export type KpLevel = 'safe' | 'caution' | 'danger';

export interface KpData {
  value: number;
  level: KpLevel;
  badgeText: string;
  description: string;
  timestamp: string;
  isLocalMode: boolean;
}

export type WindLevel = 'safe' | 'caution' | 'danger';

export interface WeatherData {
  temperature: number; // °C
  windSpeed: number; // m/s
  windGusts: number; // m/s
  windDirection: number; // deg
  windDirectionText: string;
  humidity: number; // %
  weatherCode: number;
  weatherDescription: string;
  windLevel: WindLevel;
  windBadgeText: string;
  flightSuitability: string;
  timestamp: string;
  locationName: string;
  latitude: number;
  longitude: number;
  isSimulated?: boolean;
}

export type AirspaceType = 'prohibited' | 'restricted' | 'control_zone' | 'drone_park';

export interface AirspaceZone {
  id: string;
  name: string;
  code: string;
  type: AirspaceType;
  typeLabel: string;
  description: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  permissionRequired: boolean;
  approvalAuthority: string;
  color: string;
}

export interface AirspaceCheckResult {
  isSafe: boolean;
  statusText: string;
  badgeColor: 'safe' | 'caution' | 'danger';
  matchedZone: AirspaceZone | null;
  distanceToZoneKm: number | null;
  details: string;
}

export interface Equipment {
  droneModel: string;
  batteryModel: string;
  batteryCapacityMah: number;
}

export interface FlightLogRecord {
  id: string;
  date: string;
  timestampMs: number;
  droneModel: string;
  batteryModel: string;
  durationSeconds: number;
  durationFormatted: string;
  startBattery: number;
  endBattery: number;
  consumedBattery: number;
  kpValue: number;
  kpStatus: string;
  windSpeed?: number;
  location?: string;
  notes?: string;
}

