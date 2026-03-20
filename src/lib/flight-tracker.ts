// Advanced Flight Tracking with GPS, Route, and Analytics

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface GPSPoint {
  lat: number;
  lon: number;
  altitude: number; // feet MSL
  timestamp: number;
  speed: number; // mph
  heading: number; // degrees
}

export interface FlightTrack {
  points: GPSPoint[];
  startTime: number;
  endTime: number;
  totalDistance: number; // miles
  maxAltitude: number;
  avgSpeed: number;
  maxSpeed: number;
}

export interface FlightSession {
  id: string;
  aircraftId: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  track: FlightTrack;
  telemetry: FlightTelemetry;
}

export interface FlightTelemetry {
  batteryStart: number;
  batteryEnd?: number;
  maxGForce: number;
  minGForce: number;
  motorRpm: number[];
  motorTemp: number[];
  currentDraw: number[];
  incidents: string[];
}

interface FlightTrackerDB extends DBSchema {
  sessions: {
    key: string;
    value: FlightSession;
    indexes: { 'by-aircraft': string; 'by-time': number };
  };
  tracks: {
    key: string;
    value: FlightTrack;
  };
}

let db: IDBPDatabase<FlightTrackerDB> | null = null;

async function getTrackerDB(): Promise<IDBPDatabase<FlightTrackerDB>> {
  if (!db) {
    db = await openDB<FlightTrackerDB>('flight-tracker', 1, {
      upgrade(database) {
        const sessionStore = database.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-aircraft', 'aircraftId');
        sessionStore.createIndex('by-time', 'startTime');
        
        database.createObjectStore('tracks', { keyPath: 'id' });
      },
    });
  }
  return db;
}

// ============================================
// GPS Tracking
// ============================================

let watchId: number | null = null;
let currentSession: FlightSession | null = null;

export function startGPSTracking(): Promise<GPSPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point: GPSPoint = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          altitude: position.coords.altitude || 0,
          timestamp: position.timestamp,
          speed: (position.coords.speed || 0) * 2.237, // m/s to mph
          heading: position.coords.heading || 0,
        };
        resolve(point);
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );
  });
}

export function stopGPSTracking(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

// ============================================
// Flight Session Management
// ============================================

export async function startFlightSession(aircraftId: string): Promise<FlightSession> {
  const session: FlightSession = {
    id: `session_${Date.now()}`,
    aircraftId,
    startTime: Date.now(),
    isActive: true,
    track: {
      points: [],
      startTime: Date.now(),
      endTime: 0,
      totalDistance: 0,
      maxAltitude: 0,
      avgSpeed: 0,
      maxSpeed: 0,
    },
    telemetry: {
      batteryStart: 100,
      motorRpm: [],
      motorTemp: [],
      currentDraw: [],
      maxGForce: 1,
      minGForce: 1,
      incidents: [],
    },
  };

  currentSession = session;
  
  // Start GPS tracking
  startGPSTracking().then(point => {
    if (currentSession && currentSession.isActive) {
      currentSession.track.points.push(point);
      updateTrackMetrics(currentSession);
    }
  }).catch(console.error);

  // Save to DB
  const database = await getTrackerDB();
  await database.put('sessions', session);

  return session;
}

export async function endFlightSession(): Promise<FlightSession | null> {
  if (!currentSession) return null;

  stopGPSTracking();

  currentSession.endTime = Date.now();
  currentSession.isActive = false;
  currentSession.track.endTime = Date.now();

  // Finalize track metrics
  finalizeTrackMetrics(currentSession);

  // Save to DB
  const database = await getTrackerDB();
  await database.put('sessions', currentSession);
  await database.put('tracks', { ...currentSession.track, id: currentSession.id } as any);

  const session = currentSession;
  currentSession = null;

  return session;
}

export function getCurrentSession(): FlightSession | null {
  return currentSession;
}

// ============================================
// Track Metrics
// ============================================

function updateTrackMetrics(session: FlightSession): void {
  const points = session.track.points;
  if (points.length === 0) return;

  const lastPoint = points[points.length - 1];
  
  // Max altitude
  if (lastPoint.altitude > session.track.maxAltitude) {
    session.track.maxAltitude = lastPoint.altitude;
  }

  // Max speed
  if (lastPoint.speed > session.track.maxSpeed) {
    session.track.maxSpeed = lastPoint.speed;
  }
}

function finalizeTrackMetrics(session: FlightSession): void {
  const points = session.track.points;
  if (points.length < 2) return;

  let totalDistance = 0;
  let totalSpeed = 0;

  for (let i = 1; i < points.length; i++) {
    totalDistance += haversineDistance(
      points[i - 1].lat, points[i - 1].lon,
      points[i].lat, points[i].lon
    );
    totalSpeed += points[i].speed;
  }

  session.track.totalDistance = Math.round(totalDistance * 100) / 100;
  session.track.avgSpeed = Math.round((totalSpeed / points.length) * 10) / 10;
}

// Haversine formula for distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

// ============================================
// Session Storage
// ============================================

export async function getFlightSessions(aircraftId?: string): Promise<FlightSession[]> {
  const database = await getTrackerDB();
  
  if (aircraftId) {
    return database.getAllFromIndex('sessions', 'by-aircraft', aircraftId);
  }
  
  return database.getAll('sessions');
}

export async function getFlightSession(id: string): Promise<FlightSession | undefined> {
  const database = await getTrackerDB();
  return database.get('sessions', id);
}

export async function getFlightTrack(sessionId: string): Promise<FlightTrack | undefined> {
  const database = await getTrackerDB();
  const track = await database.get('tracks', sessionId);
  return track as FlightTrack | undefined;
}

export async function deleteFlightSession(id: string): Promise<void> {
  const database = await getTrackerDB();
  await database.delete('sessions', id);
  await database.delete('tracks', id);
}

// ============================================
// Flight Analytics
// ============================================

export interface FlightAnalytics {
  totalFlights: number;
  totalFlightTime: number;
  totalDistance: number;
  avgFlightDuration: number;
  avgDistance: number;
  longestFlight: FlightSession | null;
  highestAltitude: number;
  fastestSpeed: number;
  mostFlownAircraft: string;
  flightsThisMonth: number;
  favoriteLocation: { lat: number; lon: number; count: number } | null;
}

export async function calculateAnalytics(): Promise<FlightAnalytics> {
  const sessions = await getFlightSessions();
  const completedSessions = sessions.filter(s => !s.isActive);

  if (completedSessions.length === 0) {
    return {
      totalFlights: 0,
      totalFlightTime: 0,
      totalDistance: 0,
      avgFlightDuration: 0,
      avgDistance: 0,
      longestFlight: null,
      highestAltitude: 0,
      fastestSpeed: 0,
      mostFlownAircraft: '',
      flightsThisMonth: 0,
      favoriteLocation: null,
    };
  }

  const totalFlightTime = completedSessions.reduce(
    (sum, s) => sum + ((s.endTime || s.startTime) - s.startTime), 0
  );
  
  const totalDistance = completedSessions.reduce(
    (sum, s) => sum + s.track.totalDistance, 0
  );

  const longestFlight = completedSessions.reduce((longest, s) => {
    const duration = (s.endTime || s.startTime) - s.startTime;
    const longestDuration = (longest?.endTime || longest?.startTime || 0) - (longest?.startTime || 0);
    return duration > longestDuration ? s : longest;
  }, completedSessions[0]);

  const highestAltitude = Math.max(
    ...completedSessions.map(s => s.track.maxAltitude)
  );

  const fastestSpeed = Math.max(
    ...completedSessions.map(s => s.track.maxSpeed)
  );

  // Most flown aircraft
  const aircraftCounts: Record<string, number> = {};
  completedSessions.forEach(s => {
    aircraftCounts[s.aircraftId] = (aircraftCounts[s.aircraftId] || 0) + 1;
  });
  const mostFlownAircraft = Object.entries(aircraftCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  // Flights this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const flightsThisMonth = completedSessions.filter(
    s => s.startTime >= startOfMonth
  ).length;

  return {
    totalFlights: completedSessions.length,
    totalFlightTime: Math.round(totalFlightTime / 60000), // minutes
    totalDistance: Math.round(totalDistance * 10) / 10,
    avgFlightDuration: Math.round(totalFlightTime / completedSessions.length / 60000),
    avgDistance: Math.round(totalDistance / completedSessions.length * 10) / 10,
    longestFlight,
    highestAltitude,
    fastestSpeed: Math.round(fastestSpeed),
    mostFlownAircraft,
    flightsThisMonth,
    favoriteLocation: null, // Would require clustering
  };
}

// ============================================
// Export Functions
// ============================================

export async function exportFlightData(sessionId: string): Promise<string> {
  const session = await getFlightSession(sessionId);
  if (!session) throw new Error('Session not found');

  return JSON.stringify(session, null, 2);
}

export async function exportAllFlightData(): Promise<string> {
  const sessions = await getFlightSessions();
  const analytics = await calculateAnalytics();

  return JSON.stringify({
    sessions,
    analytics,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

// ============================================
// G-Force Tracking (for advanced telemetry)
// ============================================

let motionInterval: number | null = null;

export function startMotionTracking(
  onUpdate: (x: number, y: number, z: number) => void
): void {
  if (!window.DeviceMotionEvent) {
    console.warn('DeviceMotion not supported');
    return;
  }

  motionInterval = window.setInterval(() => {
    const acc = (window as any).DeviceMotionEvent?.accelerationIncludingGravity;
    if (acc) {
      const gForce = Math.sqrt(
        acc.x * acc.x + acc.y * acc.y + acc.z * acc.z
      ) / 9.81;
      
      if (currentSession) {
        if (gForce > currentSession.telemetry.maxGForce) {
          currentSession.telemetry.maxGForce = Math.round(gForce * 100) / 100;
        }
        if (gForce < currentSession.telemetry.minGForce) {
          currentSession.telemetry.minGForce = Math.round(gForce * 100) / 100;
        }
      }
      
      onUpdate(acc.x || 0, acc.y || 0, acc.z || 0);
    }
  }, 100) as unknown as number;
}

export function stopMotionTracking(): void {
  if (motionInterval) {
    clearInterval(motionInterval);
    motionInterval = null;
  }
}
