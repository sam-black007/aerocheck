import { resolveLocation, type ResolvedLocation } from './live-weather';

type AirplanesLiveRecord = {
  hex?: string;
  flight?: string;
  r?: string;
  t?: string;
  desc?: string;
  ownOp?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | 'ground' | string;
  gs?: number;
  true_heading?: number;
  track?: number;
  nav_heading?: number;
  emergency?: string;
  squawk?: string;
  dst?: number;
  dir?: number;
  seen?: number;
  seen_pos?: number;
  category?: string;
};

type AirplanesLiveResponse = {
  ac?: AirplanesLiveRecord[];
  now?: number;
  total?: number;
};

export interface LiveTrafficFlight {
  id: string;
  hex: string;
  callsign: string;
  registration: string;
  aircraftType: string;
  description: string;
  operator: string;
  latitude: number;
  longitude: number;
  altitudeFeet: number | null;
  speedKnots: number;
  heading: number;
  distanceNm: number;
  relativeDirection: number;
  lastSeenSeconds: number;
  lastPositionSeconds: number;
  emergency: string;
  squawk: string;
  category: string;
  isOnGround: boolean;
}

export interface LiveTrafficSnapshot {
  center: ResolvedLocation;
  radiusNm: number;
  flights: LiveTrafficFlight[];
  total: number;
  source: string;
  updatedAt: string;
}

export interface RadarPoint {
  x: number;
  y: number;
  visible: boolean;
}

function normalizeAltitude(value: AirplanesLiveRecord['alt_baro']): number | null {
  if (value == null || value === 'ground') {
    return null;
  }

  if (typeof value === 'number') {
    return Math.round(value);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function normalizeFlight(record: AirplanesLiveRecord): LiveTrafficFlight | null {
  if (record.lat == null || record.lon == null || !record.hex) {
    return null;
  }

  const altitudeFeet = normalizeAltitude(record.alt_baro);

  return {
    id: record.hex,
    hex: record.hex,
    callsign: record.flight?.trim() || record.r || record.hex.toUpperCase(),
    registration: record.r || 'Unknown',
    aircraftType: record.t || 'Unknown',
    description: record.desc || 'Aircraft',
    operator: record.ownOp || 'Unknown operator',
    latitude: record.lat,
    longitude: record.lon,
    altitudeFeet,
    speedKnots: Math.round(record.gs ?? 0),
    heading: Math.round(record.true_heading ?? record.track ?? record.nav_heading ?? 0),
    distanceNm: Number((record.dst ?? 0).toFixed(1)),
    relativeDirection: Math.round(record.dir ?? 0),
    lastSeenSeconds: Number((record.seen ?? 0).toFixed(1)),
    lastPositionSeconds: Number((record.seen_pos ?? 0).toFixed(1)),
    emergency: record.emergency || 'none',
    squawk: record.squawk || '----',
    category: record.category || 'Unknown',
    isOnGround: altitudeFeet == null || altitudeFeet <= 25,
  };
}

function sortFlights(flights: LiveTrafficFlight[]): LiveTrafficFlight[] {
  return [...flights].sort((left, right) => {
    if (left.isOnGround !== right.isOnGround) {
      return left.isOnGround ? 1 : -1;
    }

    if (left.distanceNm !== right.distanceNm) {
      return left.distanceNm - right.distanceNm;
    }

    return right.speedKnots - left.speedKnots;
  });
}

export async function fetchTrafficByCoordinates(center: ResolvedLocation, radiusNm: number): Promise<LiveTrafficSnapshot> {
  const clampedRadius = Math.max(10, Math.min(250, Math.round(radiusNm)));
  const url = `https://api.airplanes.live/v2/point/${center.lat.toFixed(4)}/${center.lon.toFixed(4)}/${clampedRadius}`;
  const data = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!data.ok) {
    throw new Error('Live traffic lookup failed');
  }

  const payload = (await data.json()) as AirplanesLiveResponse;
  const flights = sortFlights((payload.ac ?? []).map(normalizeFlight).filter((flight): flight is LiveTrafficFlight => flight != null));

  return {
    center,
    radiusNm: clampedRadius,
    flights,
    total: payload.total ?? flights.length,
    source: 'airplanes.live ADS-B network',
    updatedAt: new Date(payload.now ?? Date.now()).toISOString(),
  };
}

export async function fetchTrafficByQuery(query: string, radiusNm: number): Promise<LiveTrafficSnapshot> {
  const center = await resolveLocation(query);
  return fetchTrafficByCoordinates(center, radiusNm);
}

export function projectFlightToRadar(
  center: ResolvedLocation,
  flight: LiveTrafficFlight,
  radiusNm: number
): RadarPoint {
  const latScale = 60;
  const lonScale = Math.cos((center.lat * Math.PI) / 180) * 60;
  const xNm = (flight.longitude - center.lon) * lonScale;
  const yNm = (flight.latitude - center.lat) * latScale;

  const normalizedX = xNm / radiusNm;
  const normalizedY = yNm / radiusNm;
  const visible = Math.hypot(normalizedX, normalizedY) <= 1;

  return {
    x: 50 + normalizedX * 42,
    y: 50 - normalizedY * 42,
    visible,
  };
}
