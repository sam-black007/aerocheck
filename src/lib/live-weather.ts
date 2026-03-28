import type { WeatherConditions } from '../types';
import { fetchNominatim } from './apis';

export interface ResolvedLocation {
  name: string;
  lat: number;
  lon: number;
}

export interface LiveWeatherResult {
  location: ResolvedLocation;
  weather: WeatherConditions;
}

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

export async function fetchLiveWeatherByCoordinates(lat: number, lon: number): Promise<WeatherConditions> {
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

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Open-Meteo weather lookup failed');
  }

  const data = await response.json();
  return transformOpenMeteoResponse(data.current ?? {});
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
  };
}

export async function fetchLiveWeatherByQuery(query: string): Promise<LiveWeatherResult> {
  const location = await resolveLocation(query);
  const weather = await fetchLiveWeatherByCoordinates(location.lat, location.lon);
  return { location, weather };
}
