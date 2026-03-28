import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Aircraft, FlightLog, AppSettings } from '../types';

interface AeroCheckDB extends DBSchema {
  aircraft: {
    key: string;
    value: Aircraft;
    indexes: { 'by-type': string; 'by-name': string };
  };
  flights: {
    key: string;
    value: FlightLog;
    indexes: { 'by-aircraft': string; 'by-date': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

let dbPromise: Promise<IDBPDatabase<AeroCheckDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<AeroCheckDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AeroCheckDB>('aerocheck-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const aircraftStore = db.createObjectStore('aircraft', { keyPath: 'id' });
          aircraftStore.createIndex('by-type', 'type');
          aircraftStore.createIndex('by-name', 'name');
          
          const flightStore = db.createObjectStore('flights', { keyPath: 'id' });
          flightStore.createIndex('by-aircraft', 'aircraftId');
          flightStore.createIndex('by-date', 'date');
          
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveAircraft(aircraft: Aircraft): Promise<void> {
  const db = await getDB();
  await db.put('aircraft', aircraft);
}

export async function getAircraft(id: string): Promise<Aircraft | undefined> {
  const db = await getDB();
  return db.get('aircraft', id);
}

export async function getAllAircraft(): Promise<Aircraft[]> {
  const db = await getDB();
  return db.getAll('aircraft');
}

export async function deleteAircraft(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('aircraft', id);
}

export async function saveFlight(flight: FlightLog): Promise<void> {
  const db = await getDB();
  await db.put('flights', flight);
}

export async function getFlight(id: string): Promise<FlightLog | undefined> {
  const db = await getDB();
  return db.get('flights', id);
}

export async function getAllFlights(): Promise<FlightLog[]> {
  const db = await getDB();
  const flights = await db.getAll('flights');
  return flights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getFlightsByAircraft(aircraftId: string): Promise<FlightLog[]> {
  const db = await getDB();
  return db.getAllFromIndex('flights', 'by-aircraft', aircraftId);
}

export async function deleteFlight(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('flights', id);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'main' } as AppSettings & { id: string });
}

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  const settings = await db.get('settings', 'main');
  return settings;
}

export async function exportData(): Promise<string> {
  const db = await getDB();
  const aircraft = await db.getAll('aircraft');
  const flights = await db.getAll('flights');
  const settings = await db.get('settings', 'main');
  
  return JSON.stringify({ aircraft, flights, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);
  const db = await getDB();
  
  const tx = db.transaction(['aircraft', 'flights'], 'readwrite');
  
  if (data.aircraft) {
    for (const ac of data.aircraft) {
      await tx.objectStore('aircraft').put(ac);
    }
  }
  
  if (data.flights) {
    for (const flight of data.flights) {
      await tx.objectStore('flights').put(flight);
    }
  }
  
  if (data.settings) {
    await db.put('settings', { ...data.settings, id: 'main' });
  }
  
  await tx.done;
}
