// AeroCheck API Integration Library
// Sources: public-apis.github.io and aviation APIs

import type { WeatherConditions } from '../types';

// ============================================
// WEATHER APIs
// ============================================

export interface WeatherAPIResponse {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  cloudCeiling: number;
  precipitation: number;
  description: string;
  icon: string;
  uvIndex?: number;
  dewPoint?: number;
}

// OpenWeatherMap - Current Weather
export async function fetchOpenWeather(lat: number, lon: number, apiKey: string): Promise<WeatherAPIResponse> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('OpenWeather API error');
  const data = await response.json();
  return transformOWResponse(data);
}

function transformOWResponse(data: any): WeatherAPIResponse {
  return {
    temperature: Math.round(data.main.temp),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 2.237), // m/s to mph
    windDirection: data.wind.deg || 0,
    pressure: data.main.pressure,
    visibility: (data.visibility || 10000) / 1000,
    cloudCeiling: data.clouds.all > 50 ? 3000 : 10000,
    precipitation: data.rain?.['1h'] || 0,
    description: data.weather[0]?.description || 'Unknown',
    icon: data.weather[0]?.icon || '01d',
  };
}

// WeatherAPI - Better weather data with aviation support
export async function fetchWeatherAPI(city: string, apiKey: string): Promise<WeatherAPIResponse> {
  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('WeatherAPI error');
  const data = await response.json();
  return transformWeatherAPIResponse(data);
}

function transformWeatherAPIResponse(data: any): WeatherAPIResponse {
  return {
    temperature: Math.round(data.current.temp_c),
    humidity: data.current.humidity,
    windSpeed: Math.round(data.current.wind_mph),
    windDirection: data.current.wind_degree,
    pressure: data.current.pressure_mb,
    visibility: data.current.vis_km,
    cloudCeiling: data.current.cloud < 50 ? 10000 : 5000,
    precipitation: data.current.precip_mm,
    description: data.current.condition.text,
    icon: data.current.condition.icon,
    uvIndex: data.current.uv,
    dewPoint: data.current.dewpoint_c,
  };
}

// Tomorrow.io - Hyper-local weather
export async function fetchTomorrowAPI(lat: number, lon: number, apiKey: string): Promise<WeatherAPIResponse> {
  const url = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Tomorrow.io API error');
  const data = await response.json();
  return transformTomorrowResponse(data);
}

function transformTomorrowResponse(data: any): WeatherAPIResponse {
  const current = data.data.values;
  return {
    temperature: Math.round(current.temperature),
    humidity: current.humidity,
    windSpeed: Math.round(current.windSpeed * 2.237),
    windDirection: current.windDirection,
    pressure: current.pressureSurfaceLevel,
    visibility: current.visibility / 1000,
    cloudCeiling: current.cloudBase || 10000,
    precipitation: current.precipitation || 0,
    description: data.data.time || 'Unknown',
    icon: '01d',
  };
}

// ============================================
// AVIATION APIs
// ============================================

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  elevation: number;
}

export interface FlightInfo {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  status: string;
  departureTime: string;
  arrivalTime: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
}

// Aviationstack - Real-time flight data
export async function fetchAviationStackFlight(flightNumber: string, apiKey: string): Promise<FlightInfo> {
  const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${encodeURIComponent(flightNumber)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('AviationStack API error');
  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('Flight not found');
  }
  
  const flight = data.data[0];
  return {
    flightNumber: flight.flight.iata || flight.flight.icao,
    airline: flight.airline.name,
    origin: flight.departure.iata,
    destination: flight.arrival.iata,
    status: flight.flight_status,
    departureTime: flight.departure.scheduled,
    arrivalTime: flight.arrival.scheduled,
    latitude: flight.live?.latitude,
    longitude: flight.live?.longitude,
    altitude: flight.live?.altitude,
    speed: flight.live?.speed,
  };
}

// AeroDataBox - Aviation data
export async function fetchAeroDataBoxAirport(icao: string, apiKey: string): Promise<Airport> {
  const url = `https://aerodatabox.p.rapidapi.com/airports/icao/${icao}`;
  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
    }
  });
  if (!response.ok) throw new Error('AeroDataBox API error');
  const data = await response.json();
  return {
    icao: data.icao,
    iata: data.iata || '',
    name: data.name,
    country: data.country,
    lat: data.position.latitude,
    lon: data.position.longitude,
    elevation: data.elevation?.value || 0,
  };
}

// Aviation Edge - Airport database
export async function fetchAviationEdgeAirport(icao: string, key: string): Promise<Airport> {
  const url = `https://aviation-edge.com/v2/public/airportDatabase?key=${key}&codeIcaoAirport=${icao}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Aviation Edge API error');
  const data = await response.json();
  
  if (!data || data.length === 0) throw new Error('Airport not found');
  const airport = data[0];
  return {
    icao: airport.codeIcaoAirport,
    iata: airport.codeIataAirport,
    name: airport.nameAirport,
    country: airport.nameCountry,
    lat: airport.latitudeAirport,
    lon: airport.longitudeAirport,
    elevation: airport.elevationAirport,
  };
}

// ============================================
// GEOCODING APIs
// ============================================

export interface GeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

// Nominatim - OpenStreetMap geocoding
export async function fetchNominatim(query: string): Promise<GeocodingResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'AeroCheck/1.0' }
  });
  if (!response.ok) throw new Error('Nominatim API error');
  const data = await response.json();
  return data.map((r: any) => ({
    name: r.display_name,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    country: r.address?.country || '',
    state: r.address?.state,
  }));
}

// Geapify - Geocoding (free tier)
export async function fetchGeocodeify(query: string, apiKey: string): Promise<GeocodingResult[]> {
  const url = `https://api.geocodeify.com/search?address=${encodeURIComponent(query)}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Geocodeify API error');
  const data = await response.json();
  return data.results?.map((r: any) => ({
    name: r.formatted,
    lat: r.latitude,
    lon: r.longitude,
    country: r.country,
  })) || [];
}

// ============================================
// ENVIRONMENT APIs
// ============================================

export interface AirQuality {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
}

// OpenAQ - Air quality data
export async function fetchOpenAQ(lat: number, lon: number): Promise<AirQuality> {
  const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('OpenAQ API error');
  const data = await response.json();
  
  const results = data.results?.[0]?.measurements || [];
  
  const getValue = (parameter: string) => 
    results.find((m: any) => m.parameter === parameter)?.value || 0;
  
  return {
    aqi: Math.round(getValue('us-epa-index') || getValue('aqi')),
    pm25: getValue('pm25'),
    pm10: getValue('pm10'),
    o3: getValue('o3'),
    no2: getValue('no2'),
  };
}

// ============================================
// ASTRONOMY APIs
// ============================================

export interface SunTimes {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayLength: number | string;
}

// Sunrise-Sunset API
export async function fetchSunTimes(lat: number, lon: number, date?: string): Promise<SunTimes> {
  const dateParam = date ? `&date=${date}` : '';
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}${dateParam}&formatted=0`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Sunrise-Sunset API error');
  const data = await response.json();
  
  if (data.status !== 'OK') throw new Error('Sunrise-Sunset API error');
  
  return {
    sunrise: data.results.sunrise,
    sunset: data.results.sunset,
    solarNoon: data.results.solar_noon,
    dayLength: data.results.day_length,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getWindDirectionName(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export function getWeatherIcon(conditions: WeatherConditions | WeatherAPIResponse): string {
  if (conditions.precipitation > 0) return '🌧️';
  if ((conditions as any).windSpeed > 25) return '💨';
  if ((conditions as any).cloudCeiling < 1000) return '☁️';
  if ((conditions as any).temperature < 0) return '❄️';
  return '☀️';
}

export function convertWindDirection(degrees: number): string {
  return getWindDirectionName(degrees);
}

// AQI Interpretation
export function getAQIDescription(aqi: number): { level: string; color: string; advice: string } {
  if (aqi <= 50) return { level: 'Good', color: 'green', advice: 'Great for outdoor flying!' };
  if (aqi <= 100) return { level: 'Moderate', color: 'yellow', advice: 'Acceptable conditions' };
  if (aqi <= 150) return { level: 'Unhealthy for Sensitive', color: 'orange', advice: 'Limit extended flights' };
  if (aqi <= 200) return { level: 'Unhealthy', color: 'red', advice: 'Not recommended for flying' };
  return { level: 'Hazardous', color: 'purple', advice: 'Stay indoors' };
}
