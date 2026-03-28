import type { DailyForecast, HourlyForecast, CloudLayer, WeatherBriefingComplete, AviationWeatherData } from '../types';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle',
    55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Rain showers', 81: 'Moderate showers', 82: 'Violent showers',
    85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm',
    96: 'Thunderstorm with hail', 99: 'Severe thunderstorm'
  };
  return descriptions[code] || 'Unknown';
}

function getWeatherIcon(code: number, hour: number): string {
  const isNight = hour < 6 || hour > 20;
  const icons: Record<number, { day: string; night: string }> = {
    0: { day: '☀️', night: '🌙' },
    1: { day: '🌤️', night: '☁️' },
    2: { day: '⛅', night: '☁️' },
    3: { day: '☁️', night: '☁️' },
    45: { day: '🌫️', night: '🌫️' },
    48: { day: '🌫️', night: '🌫️' },
    51: { day: '🌦️', night: '🌧️' },
    53: { day: '🌧️', night: '🌧️' },
    55: { day: '🌧️', night: '🌧️' },
    61: { day: '🌧️', night: '🌧️' },
    63: { day: '🌧️', night: '🌧️' },
    65: { day: '🌧️', night: '🌧️' },
    71: { day: '🌨️', night: '🌨️' },
    73: { day: '❄️', night: '❄️' },
    75: { day: '❄️', night: '❄️' },
    80: { day: '🌦️', night: '🌧️' },
    81: { day: '🌦️', night: '🌧️' },
    82: { day: '⛈️', night: '⛈️' },
    95: { day: '⛈️', night: '⛈️' },
    99: { day: '🌪️', night: '🌪️' },
  };
  const icon = icons[code] || { day: '☁️', night: '☁️' };
  return isNight ? icon.night : icon.day;
}

function estimateCloudLayers(cover: number): CloudLayer[] {
  const layers: CloudLayer[] = [];
  
  if (cover >= 80) {
    layers.push({ altitude: 2500, coverage: 60, type: 'stratus' });
    layers.push({ altitude: 6000, coverage: 40, type: 'altostratus' });
  } else if (cover >= 50) {
    layers.push({ altitude: 3000, coverage: 50, type: 'altocumulus' });
  } else if (cover >= 20) {
    layers.push({ altitude: 8000, coverage: 30, type: 'cirrus' });
  }
  
  return layers;
}

function calculateDensityAltitude(pressure: number, tempC: number, elevationFt: number = 0): number {
  const isaTemp = 15 - (elevationFt / 1000) * 2;
  const pressureAltitude = 145442 * (1 - Math.pow(pressure / 1013.25, 0.1903));
  const densityAltitude = pressureAltitude + (120 * (tempC - isaTemp));
  return Math.round(densityAltitude);
}

export async function fetch7DayForecast(lat: number, lon: number): Promise<{
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  cloudLayers: CloudLayer[];
  sunTimes: { sunrise: string; sunset: string; dayLength: number };
}> {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('daily', [
    'weather_code', 'temperature_2m_max', 'temperature_2m_min',
    'precipitation_sum', 'precipitation_probability_max',
    'wind_speed_10m_max', 'wind_direction_10m_dominant',
    'uv_index_max', 'sunrise', 'sunset', 'daylight_duration'
  ].join(','));
  url.searchParams.set('hourly', [
    'temperature_2m', 'weather_code', 'precipitation', 'precipitation_probability',
    'wind_speed_10m', 'wind_direction_10m', 'relative_humidity_2m',
    'cloud_cover', 'visibility'
  ].join(','));
  url.searchParams.set('current', [
    'temperature_2m', 'relative_humidity_2m', 'precipitation',
    'pressure_msl', 'wind_speed_10m', 'wind_direction_10m',
    'cloud_cover', 'visibility', 'weather_code'
  ].join(','));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Weather forecast fetch failed');
  
  const data = await response.json();
  
  const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => {
    const d = new Date(date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      date,
      dayName,
      weatherCode: data.daily.weather_code[i],
      description: getWeatherDescription(data.daily.weather_code[i]),
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      precipitation: data.daily.precipitation_sum[i] || 0,
      precipitationProbability: data.daily.precipitation_probability_max[i] || 0,
      windSpeed: Math.round(data.daily.wind_speed_10m_max[i] * 0.621371),
      windDirection: data.daily.wind_direction_10m_dominant[i],
      humidity: 55,
      uvIndex: data.daily.uv_index_max[i] || 0,
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
      dayLength: data.daily.daylight_duration[i] || 0,
      cloudCover: 50,
      visibility: 10,
      icon: getWeatherIcon(data.daily.weather_code[i], 12),
    };
  });

  const hourly: HourlyForecast[] = data.hourly.time.slice(0, 168).map((time: string, i: number) => {
    const d = new Date(time);
    return {
      time,
      hour: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      temperature: Math.round(data.hourly.temperature_2m[i]),
      weatherCode: data.hourly.weather_code[i],
      description: getWeatherDescription(data.hourly.weather_code[i]),
      precipitation: data.hourly.precipitation[i] || 0,
      precipitationProbability: data.hourly.precipitation_probability[i] || 0,
      windSpeed: Math.round(data.hourly.wind_speed_10m[i] * 0.621371),
      windDirection: data.hourly.wind_direction_10m[i],
      humidity: Math.round(data.hourly.relative_humidity_2m[i] || 50),
      cloudCover: data.hourly.cloud_cover[i] || 0,
      visibility: Number(((data.hourly.visibility?.[i] || 10000) / 1000).toFixed(1)),
      icon: getWeatherIcon(data.hourly.weather_code[i], d.getHours()),
    };
  });

  const currentCloudCover = data.current?.cloud_cover || 50;
  const cloudLayers = estimateCloudLayers(currentCloudCover);

  const sunrise = daily[0]?.sunrise || new Date().toISOString();
  const sunset = daily[0]?.sunset || new Date().toISOString();
  const dayLength = (new Date(sunset).getTime() - new Date(sunrise).getTime()) / 1000;

  return {
    daily,
    hourly,
    cloudLayers,
    sunTimes: { sunrise, sunset, dayLength },
  };
}

export async function fetchAirQualityData(lat: number, lon: number) {
  const url = new URL(AIR_QUALITY_BASE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide');

  const response = await fetch(url.toString());
  if (!response.ok) return null;
  
  const data = await response.json();
  return data.current;
}

export function generateMetar(weather: {
  temperature: number;
  dewpoint?: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  cloudCover: number;
}): string {
  const windDir = String(Math.round(weather.windDirection / 10) * 10).padStart(3, '0');
  const windSpd = Math.round(weather.windSpeed * 0.868976);
  const vis = weather.visibility >= 10 ? '9999' : String(Math.round(weather.visibility * 5280 / 100) * 100).padStart(4, '0');
  const temp = Math.round(weather.temperature);
  const dew = weather.dewpoint ?? Math.round(weather.temperature - 5);
  const press = String(Math.round(weather.pressure)).padStart(4, '0');
  
  let sky = 'CLR';
  if (weather.cloudCover > 0 && weather.cloudCover <= 25) sky = 'FEW';
  else if (weather.cloudCover > 25 && weather.cloudCover <= 50) sky = 'SCT';
  else if (weather.cloudCover > 50 && weather.cloudCover <= 85) sky = 'BKN';
  else if (weather.cloudCover > 85) sky = 'OVC';

  return `METAR ${new Date().toISOString().slice(0, 13).replace('T', ' ').replace(/-/g, '')}Z ${windDir}${windSpd}KT ${vis} ${sky} ${temp}/${dew} A${press.slice(0, 2)}.${press.slice(2)}`;
}

export function generateTaf(hourly: HourlyForecast[]): string {
  const validHours = hourly.slice(0, 24);
  let taf = `TAF AMD `;
  taf += new Date().toISOString().slice(0, 11).replace('T', '').replace(/-/g, '') + 'Z ';

  const periods = [];
  let currentPeriod = { change: 'BECMG', from: 0, to: 6, temp: 20, wind: 10, vis: 10, sky: 'SCT' };

  for (let i = 0; i < validHours.length; i += 3) {
    const h = validHours[i];
    if (h.temperature > currentPeriod.temp + 3 || h.temperature < currentPeriod.temp - 3) {
      if (currentPeriod.to > currentPeriod.from) {
        periods.push(currentPeriod);
      }
      currentPeriod = { ...currentPeriod, from: i, to: i + 6, temp: h.temperature };
    }
    if (i === 0) {
      currentPeriod.temp = h.temperature;
      currentPeriod.wind = h.windSpeed;
      currentPeriod.vis = h.visibility;
      currentPeriod.sky = h.cloudCover > 70 ? 'BKN' : h.cloudCover > 40 ? 'SCT' : 'FEW';
    }
  }
  if (currentPeriod.to > currentPeriod.from) {
    periods.push(currentPeriod);
  }

  periods.forEach(p => {
    const fromHH = String(p.from).padStart(2, '0');
    const toHH = String(Math.min(p.to, 24)).padStart(2, '0');
    taf += `${fromHH}/${toHH} ${p.change} `;
    taf += `${p.wind > 0 ? `${String(Math.round(p.wind / 10) * 10).padStart(3, '0')}${Math.round(p.wind * 0.868976)}KT` : '00000KT'} `;
    taf += `${p.vis >= 10 ? '9999' : String(Math.round(p.vis * 5280 / 100) * 100).padStart(4, '0')} `;
    taf += `${p.sky} ${p.temp}/${p.temp - 5} `;
  });

  return taf.trim();
}

export async function fetchCompleteWeatherBriefing(lat: number, lon: number): Promise<WeatherBriefingComplete> {
  const [forecast, airQuality] = await Promise.all([
    fetch7DayForecast(lat, lon),
    fetchAirQualityData(lat, lon),
  ]);

  const current = forecast.hourly[0];
  const aviationData: AviationWeatherData = {
    metar: generateMetar({
      temperature: current.temperature,
      pressure: 1013,
      windSpeed: current.windSpeed,
      windDirection: current.windDirection,
      visibility: current.visibility,
      cloudCover: current.cloudCover,
    }),
    taf: generateTaf(forecast.hourly),
    visibility: current.visibility,
    cloudLayers: forecast.cloudLayers,
    densityAltitude: calculateDensityAltitude(1013, current.temperature),
    ceiling: current.cloudCover > 80 ? 2500 : current.cloudCover > 50 ? 5000 : 10000,
    winds: {
      speed: Math.round(current.windSpeed * 0.868976),
      direction: current.windDirection,
    },
  };

  return {
    current: {
      temperature: current.temperature,
      humidity: current.humidity,
      windSpeed: current.windSpeed,
      windDirection: current.windDirection,
      pressure: 1013,
      visibility: current.visibility,
      cloudCeiling: aviationData.ceiling,
      precipitation: current.precipitation,
      description: current.description,
      icon: current.icon,
    },
    hourly: forecast.hourly,
    daily: forecast.daily,
    cloudLayers: forecast.cloudLayers,
    sunTimes: forecast.sunTimes,
    alerts: [],
    aviationData,
  };
}
