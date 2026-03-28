import type { WeatherConditions } from '../types';
import { fetchNominatim, fetchSunTimes } from './apis';

export interface ResolvedLocation {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}

export interface LiveWeatherResult {
  location: ResolvedLocation;
  weather: WeatherConditions;
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: string;
  headline: string;
  description: string;
  instruction?: string;
  expires?: string;
}

export interface AirQualitySnapshot {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
}

export interface SunSnapshot {
  sunrise: string;
  sunset: string;
  dayLength: number;
}

export interface WeatherBriefing {
  location: ResolvedLocation;
  weather: WeatherConditions;
  source: string;
  sourceDetail: string;
  stationId?: string;
  observedAt?: string;
  airQuality: AirQualitySnapshot | null;
  sunTimes: SunSnapshot | null;
  alerts: WeatherAlert[];
}

type NOAAStationFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    stationIdentifier?: string;
    name?: string;
    distance?: { value?: number | null };
  };
};

type NOAAObservationResponse = {
  properties?: {
    stationId?: string;
    stationName?: string;
    timestamp?: string;
    textDescription?: string;
    icon?: string;
    temperature?: { value?: number | null };
    relativeHumidity?: { value?: number | null };
    windDirection?: { value?: number | null };
    windSpeed?: { value?: number | null };
    barometricPressure?: { value?: number | null };
    visibility?: { value?: number | null };
    precipitationLast3Hours?: { value?: number | null };
    cloudLayers?: Array<{ base?: { value?: number | null } }>;
  };
};

type NOAAStationResponse = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    stationIdentifier?: string;
    name?: string;
  };
};

type WeatherGovPointsResponse = {
  properties?: {
    observationStations?: string;
  };
};

type WeatherGovAlertsResponse = {
  features?: Array<{
    id?: string;
    properties?: {
      event?: string;
      severity?: string;
      headline?: string;
      description?: string;
      instruction?: string;
      expires?: string;
    };
  }>;
};

type OpenMeteoCurrentResponse = {
  current?: Record<string, number | null | undefined>;
};

type OpenMeteoAirQualityResponse = {
  current?: {
    us_aqi?: number | null;
    pm2_5?: number | null;
    pm10?: number | null;
    ozone?: number | null;
    nitrogen_dioxide?: number | null;
  };
};

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

function describeWeatherCode(code: number | undefined): string {
  if (code == null) {
    return 'Unknown conditions';
  }

  return WEATHER_CODE_LABELS[code] ?? 'Variable conditions';
}

function estimateCloudCeiling(cloudCover: number | undefined): number {
  const cover = cloudCover ?? 0;

  if (cover >= 90) return 1200;
  if (cover >= 75) return 2500;
  if (cover >= 50) return 4500;
  if (cover >= 25) return 7000;
  return 10000;
}

function normalizeLocationName(name: string): string {
  return name.split(',').slice(0, 3).join(',').trim();
}

function kmhToMph(value: number | null | undefined): number {
  return Math.round((value ?? 0) * 0.621371);
}

function pascalToHpa(value: number | null | undefined): number {
  return Math.round((value ?? 101300) / 100);
}

function metersToKilometers(value: number | null | undefined): number {
  return Number((((value ?? 10000) as number) / 1000).toFixed(1));
}

function cloudCeilingFromLayers(layers?: Array<{ base?: { value?: number | null } }>): number {
  const validLayers = (layers ?? [])
    .map((layer) => layer.base?.value ?? null)
    .filter((value): value is number => value != null);

  if (validLayers.length === 0) {
    return 10000;
  }

  return Math.max(200, Math.round(Math.min(...validLayers) * 3.28084));
}

function isUSLocation(location: ResolvedLocation): boolean {
  return (location.country ?? '').toLowerCase().includes('united states');
}

function isLikelyUSStationCode(query: string): boolean {
  return /^[A-Za-z]{4}$/.test(query.trim());
}

function transformOpenMeteoResponse(current: Record<string, number | null | undefined>): WeatherConditions {
  const description = describeWeatherCode(current.weather_code ?? undefined);

  return {
    temperature: Math.round(current.temperature_2m ?? 20),
    humidity: Math.round(current.relative_humidity_2m ?? 50),
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    windDirection: Math.round(current.wind_direction_10m ?? 0),
    pressure: Math.round(current.pressure_msl ?? 1013),
    visibility: Math.max(0, Number(((current.visibility ?? 10000) / 1000).toFixed(1))),
    cloudCeiling: estimateCloudCeiling(current.cloud_cover ?? undefined),
    precipitation: Number((current.precipitation ?? 0).toFixed(1)),
    description,
    icon: description.toLowerCase().replace(/\s+/g, '-'),
  };
}

function transformNOAAObservation(observation: NOAAObservationResponse): {
  weather: WeatherConditions;
  stationId?: string;
  stationName?: string;
  observedAt?: string;
} {
  const properties = observation.properties ?? {};
  const description = properties.textDescription || 'Observed conditions';

  return {
    weather: {
      temperature: Math.round(properties.temperature?.value ?? 20),
      humidity: Math.round(properties.relativeHumidity?.value ?? 50),
      windSpeed: kmhToMph(properties.windSpeed?.value),
      windDirection: Math.round(properties.windDirection?.value ?? 0),
      pressure: pascalToHpa(properties.barometricPressure?.value),
      visibility: metersToKilometers(properties.visibility?.value),
      cloudCeiling: cloudCeilingFromLayers(properties.cloudLayers),
      precipitation: Number(((properties.precipitationLast3Hours?.value ?? 0) as number).toFixed(1)),
      description,
      icon: properties.icon || description.toLowerCase().replace(/\s+/g, '-'),
    },
    stationId: properties.stationId,
    stationName: properties.stationName,
    observedAt: properties.timestamp,
  };
}

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, application/geo+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }

  return response.json();
}

async function fetchNOAAStation(stationId: string): Promise<ResolvedLocation> {
  const data = await fetchJSON<NOAAStationResponse>(`https://api.weather.gov/stations/${stationId.toUpperCase()}`);
  const coordinates = data.geometry?.coordinates ?? [0, 0];

  return {
    name: data.properties?.name || stationId.toUpperCase(),
    lat: coordinates[1] ?? 0,
    lon: coordinates[0] ?? 0,
    country: 'United States',
  };
}

async function fetchNOAAObservationByStation(stationId: string) {
  const observation = await fetchJSON<NOAAObservationResponse>(
    `https://api.weather.gov/stations/${stationId.toUpperCase()}/observations/latest`
  );

  return transformNOAAObservation(observation);
}

async function fetchNearestNOAAObservation(location: ResolvedLocation) {
  const point = await fetchJSON<WeatherGovPointsResponse>(
    `https://api.weather.gov/points/${location.lat.toFixed(4)},${location.lon.toFixed(4)}`
  );

  const stationsUrl = point.properties?.observationStations;
  if (!stationsUrl) {
    throw new Error('Observation stations unavailable for this point');
  }

  const stations = await fetchJSON<{ features?: NOAAStationFeature[] }>(stationsUrl);
  const nearestStation = [...(stations.features ?? [])]
    .sort(
      (left, right) =>
        (left.properties?.distance?.value ?? Number.MAX_SAFE_INTEGER) -
        (right.properties?.distance?.value ?? Number.MAX_SAFE_INTEGER)
    )
    .find((station) => station.properties?.stationIdentifier);

  const stationId = nearestStation?.properties?.stationIdentifier;
  if (!stationId) {
    throw new Error('No nearby NOAA observation station found');
  }

  const observation = await fetchNOAAObservationByStation(stationId);
  return {
    ...observation,
    stationId,
    stationName: nearestStation?.properties?.name || observation.stationName,
  };
}

async function fetchOpenMeteoWeather(lat: number, lon: number): Promise<WeatherConditions> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'cloud_cover',
      'visibility',
      'weather_code',
    ].join(',')
  );
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('timezone', 'auto');

  const data = await fetchJSON<OpenMeteoCurrentResponse>(url.toString());
  return transformOpenMeteoResponse(data.current ?? {});
}

async function fetchAirQualitySnapshot(lat: number, lon: number): Promise<AirQualitySnapshot | null> {
  try {
    const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('current', 'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide');

    const data = await fetchJSON<OpenMeteoAirQualityResponse>(url.toString());
    const current = data.current;
    if (!current) {
      return null;
    }

    return {
      aqi: Math.round(current.us_aqi ?? 0),
      pm25: Number((current.pm2_5 ?? 0).toFixed(1)),
      pm10: Number((current.pm10 ?? 0).toFixed(1)),
      o3: Number((current.ozone ?? 0).toFixed(1)),
      no2: Number((current.nitrogen_dioxide ?? 0).toFixed(1)),
    };
  } catch (error) {
    console.error('Air quality lookup failed', error);
    return null;
  }
}

async function fetchAlertsForLocation(location: ResolvedLocation): Promise<WeatherAlert[]> {
  if (!isUSLocation(location)) {
    return [];
  }

  try {
    const data = await fetchJSON<WeatherGovAlertsResponse>(
      `https://api.weather.gov/alerts/active?point=${location.lat.toFixed(4)},${location.lon.toFixed(4)}`
    );

    return (data.features ?? []).slice(0, 4).map((feature) => ({
      id: feature.id || crypto.randomUUID(),
      event: feature.properties?.event || 'Weather alert',
      severity: feature.properties?.severity || 'Unknown',
      headline: feature.properties?.headline || 'Weather alert in effect',
      description: feature.properties?.description || 'No description provided.',
      instruction: feature.properties?.instruction || undefined,
      expires: feature.properties?.expires || undefined,
    }));
  } catch (error) {
    console.error('Weather alert lookup failed', error);
    return [];
  }
}

async function fetchSunSnapshot(lat: number, lon: number): Promise<SunSnapshot | null> {
  try {
    const times = await fetchSunTimes(lat, lon);
    const dayLength =
      typeof times.dayLength === 'number'
        ? times.dayLength
        : times.dayLength.includes(':')
          ? times.dayLength
              .split(':')
              .map((part) => Number(part))
              .reduce((total, value, index) => total + value * [3600, 60, 1][index], 0)
          : Number(times.dayLength);

    return {
      sunrise: times.sunrise,
      sunset: times.sunset,
      dayLength,
    };
  } catch (error) {
    console.error('Sun times lookup failed', error);
    return null;
  }
}

export async function resolveLocation(query: string): Promise<ResolvedLocation> {
  const results = await fetchNominatim(query);
  if (results.length === 0) {
    throw new Error('Location not found');
  }

  const first = results[0];
  return {
    name: normalizeLocationName(first.name),
    lat: first.lat,
    lon: first.lon,
    country: first.country,
    state: first.state,
  };
}

export async function fetchLiveWeatherByCoordinates(lat: number, lon: number): Promise<WeatherConditions> {
  return fetchOpenMeteoWeather(lat, lon);
}

export async function fetchLocationBriefing(query: string): Promise<WeatherBriefing> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    throw new Error('Location query is required');
  }

  let location: ResolvedLocation;
  let source = 'Open-Meteo';
  let sourceDetail = 'Global forecast grid';
  let stationId: string | undefined;
  let observedAt: string | undefined;
  let weather: WeatherConditions;

  if (isLikelyUSStationCode(trimmedQuery)) {
    try {
      const stationLocation = await fetchNOAAStation(trimmedQuery);
      const observation = await fetchNOAAObservationByStation(trimmedQuery);
      location = stationLocation;
      weather = observation.weather;
      stationId = observation.stationId;
      observedAt = observation.observedAt;
      source = 'NOAA station observation';
      sourceDetail = observation.stationName || trimmedQuery.toUpperCase();
    } catch (error) {
      console.warn('Station lookup fallback engaged', error);
      location = await resolveLocation(trimmedQuery);
      if (isUSLocation(location)) {
        const observation = await fetchNearestNOAAObservation(location);
        weather = observation.weather;
        stationId = observation.stationId;
        observedAt = observation.observedAt;
        source = 'NOAA station observation';
        sourceDetail = observation.stationName || observation.stationId || 'Nearest NOAA station';
      } else {
        weather = await fetchOpenMeteoWeather(location.lat, location.lon);
      }
    }
  } else {
    location = await resolveLocation(trimmedQuery);

    if (isUSLocation(location)) {
      try {
        const observation = await fetchNearestNOAAObservation(location);
        weather = observation.weather;
        stationId = observation.stationId;
        observedAt = observation.observedAt;
        source = 'NOAA station observation';
        sourceDetail = observation.stationName || observation.stationId || 'Nearest NOAA station';
      } catch (error) {
        console.warn('NOAA lookup fallback engaged', error);
        weather = await fetchOpenMeteoWeather(location.lat, location.lon);
      }
    } else {
      weather = await fetchOpenMeteoWeather(location.lat, location.lon);
    }
  }

  const [airQuality, sunTimes, alerts] = await Promise.all([
    fetchAirQualitySnapshot(location.lat, location.lon),
    fetchSunSnapshot(location.lat, location.lon),
    fetchAlertsForLocation(location),
  ]);

  return {
    location,
    weather,
    source,
    sourceDetail,
    stationId,
    observedAt,
    airQuality,
    sunTimes,
    alerts,
  };
}

export async function fetchLiveWeatherByQuery(query: string): Promise<LiveWeatherResult> {
  const briefing = await fetchLocationBriefing(query);
  return {
    location: briefing.location,
    weather: briefing.weather,
  };
}
