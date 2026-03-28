import type { WeatherConditions } from '../types';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function fetchWeatherByLocation(lat: number, lon: number): Promise<WeatherConditions> {
  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const data = await response.json();
  return transformWeatherResponse(data);
}

export async function fetchWeatherByCity(city: string): Promise<WeatherConditions> {
  const url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const data = await response.json();
  return transformWeatherResponse(data);
}

function transformWeatherResponse(data: any): WeatherConditions {
  return {
    temperature: Math.round(data.main.temp),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 2.237), // m/s to mph
    windDirection: data.wind.deg || 0,
    pressure: data.main.pressure,
    visibility: data.visibility / 1000, // m to km
    cloudCeiling: data.clouds.all > 50 ? 3000 : 10000, // Estimate
    precipitation: data.rain?.['1h'] || 0,
    description: data.weather[0]?.description || 'Unknown',
    icon: data.weather[0]?.icon || '01d',
  };
}

export function getWeatherIcon(conditions: WeatherConditions): string {
  if (conditions.precipitation > 0) return '🌧️';
  if (conditions.windSpeed > 25) return '💨';
  if (conditions.cloudCeiling < 1000) return '☁️';
  if (conditions.temperature < 0) return '❄️';
  return '☀️';
}

export function getWindDirectionName(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Default weather for offline/demo mode
export function getDefaultWeather(): WeatherConditions {
  return {
    temperature: 22,
    humidity: 55,
    windSpeed: 8,
    windDirection: 180,
    pressure: 1013,
    visibility: 10,
    cloudCeiling: 10000,
    precipitation: 0,
    description: 'Clear sky',
    icon: '01d',
  };
}
