export interface CurrentLocationSnapshot {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
}

const CURRENT_LOCATION_STORAGE_KEY = 'aerocheck-current-location';
const DEFAULT_CACHE_MAX_AGE_MS = 15 * 60 * 1000;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function hasGeolocationSupport(): boolean {
  return isBrowser() && 'geolocation' in navigator;
}

export function readCachedCurrentLocation(maxAgeMs = DEFAULT_CACHE_MAX_AGE_MS): CurrentLocationSnapshot | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(CURRENT_LOCATION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as CurrentLocationSnapshot;
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > maxAgeMs) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Unable to read cached location', error);
    return null;
  }
}

function cacheCurrentLocation(snapshot: CurrentLocationSnapshot) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(CURRENT_LOCATION_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Unable to cache current location', error);
  }
}

function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location access is blocked in the browser right now.';
    case 2:
      return 'The browser could not determine the current position.';
    case 3:
      return 'The location request timed out before a fix was returned.';
    default:
      return 'The browser could not provide a current location.';
  }
}

export async function requestCurrentLocation(): Promise<CurrentLocationSnapshot> {
  if (!hasGeolocationSupport()) {
    throw new Error('Geolocation is not available in this browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const snapshot: CurrentLocationSnapshot = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp || Date.now(),
        };

        cacheCurrentLocation(snapshot);
        resolve(snapshot);
      },
      (error) => {
        reject(new Error(getGeolocationErrorMessage(error.code)));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}
