// Additional Weather APIs for AeroCheck
// Sources: AVWX, NOAA, AviationWeather, Windy

export interface AviationWeather {
  stationId: string;
  rawMetar: string;
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  visibility: number;
  ceiling: number;
  wind: {
    speed: number;
    gust: number;
    direction: number;
  };
  temperature: number;
  dewpoint: number;
  pressure: number;
  clouds: Array<{
    type: string;
    altitude: number;
  }>;
  rawText: string;
}

export interface ForecastPoint {
  time: string;
  temperature: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  precipitation: number;
  cloudCover: number;
  visibility: number;
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
}

// ============================================
// AVWX API - Aviation Weather
// ============================================

export async function fetchAVWX(icao: string, apiKey?: string): Promise<AviationWeather> {
  // AVWX is free for basic use
  const url = `https://avwx.rest/api/metar/${icao}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': apiKey ? `Bearer ${apiKey}` : '',
    }
  });
  
  if (!response.ok) throw new Error('AVWX API error');
  
  const data = await response.json();
  return transformAVWXResponse(data);
}

function transformAVWXResponse(data: any): AviationWeather {
  const flightCategory = determineFlightCategory(
    data.visibility?.value || 99999,
    data.ceiling || 99999
  );
  
  return {
    stationId: data.station,
    rawMetar: data.raw,
    flightCategory,
    visibility: data.visibility?.value || 99999,
    ceiling: data.ceiling || 99999,
    wind: {
      speed: data.wind_speed?.value || 0,
      gust: data.wind_gust?.value || 0,
      direction: data.wind_direction?.value || 0,
    },
    temperature: data.temperature?.value || 20,
    dewpoint: data.dewpoint?.value || 10,
    pressure: data.altimeter?.value || 1013,
    clouds: data.clouds?.map((c: any) => ({
      type: c.type,
      altitude: c.altitude,
    })) || [],
    rawText: data.raw,
  };
}

// ============================================
// NOAA Aviation Weather
// ============================================

export async function fetchNOAAWeather(icao: string): Promise<AviationWeather> {
  // NOAA has a free API endpoint
  const url = `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('NOAA API error');
  
  const data = await response.json();
  if (!data || data.length === 0) throw new Error('No weather data found');
  
  return transformNOAAResponse(data[0]);
}

function transformNOAAResponse(data: any): AviationWeather {
  const flightCategory = determineFlightCategory(
    data.visib || 99999,
    data.clouds?.[0]?.base || 99999
  );
  
  return {
    stationId: data.stid || '',
    rawMetar: data.rawOb || '',
    flightCategory,
    visibility: data.visib || 99999,
    ceiling: data.clouds?.[0]?.base || 99999,
    wind: {
      speed: data.wspd || 0,
      gust: data.wgst || 0,
      direction: data.wdir || 0,
    },
    temperature: data.temp || 20,
    dewpoint: data.dewp || 10,
    pressure: data.altim || 1013,
    clouds: data.clouds?.map((c: any) => ({
      type: c.cover,
      altitude: c.base,
    })) || [],
    rawText: data.rawOb || '',
  };
}

// ============================================
// Aviation Weather Center (AWC)
// ============================================

export async function fetchAWC(icao: string): Promise<AviationWeather> {
  const url = `https://aviationweather.gov/cgi-bin/data/metar.php?ids=${icao}&format=json&hours=0`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('AWC API error');
  
  const data = await response.json();
  if (!data || data.length === 0) throw new Error('No AWC data found');
  
  return transformAWCResponse(data[0]);
}

function transformAWCResponse(data: any): AviationWeather {
  const flightCategory = determineFlightCategory(
    data.visib || 99999,
    data.cloudBase || 99999
  );
  
  return {
    stationId: data.stationId || '',
    rawMetar: data.rawOb || '',
    flightCategory,
    visibility: data.visib || 99999,
    ceiling: data.cloudBase || 99999,
    wind: {
      speed: data.wspd || 0,
      gust: data.wgst || 0,
      direction: data.wdir || 0,
    },
    temperature: data.temp || 20,
    dewpoint: data.dewp || 10,
    pressure: data.altim || 1013,
    clouds: [],
    rawText: data.rawOb || '',
  };
}

// ============================================
// TAF (Terminal Aerodrome Forecast)
// ============================================

export async function fetchTAF(icao: string): Promise<ForecastPoint[]> {
  const url = `https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('TAF API error');
  
  const data = await response.json();
  if (!data || data.length === 0) throw new Error('No TAF data found');
  
  return transformTAFResponse(data[0]);
}

function transformTAFResponse(data: any): ForecastPoint[] {
  const forecasts: ForecastPoint[] = [];
  
  if (data.forecast) {
    for (const fcst of data.forecast) {
      forecasts.push({
        time: fcst.fcstTime_from || '',
        temperature: fcst.temp || 20,
        windSpeed: fcst.wspd || 0,
        windGust: fcst.wgst || 0,
        windDirection: fcst.wdir || 0,
        precipitation: fcst.precip || 0,
        cloudCover: fcst.sky?.find((s: any) => s.cover === 'CLR' || s.cover === 'SCT' || s.cover === 'BKN' || s.cover === 'OVC')?.base || 0,
        visibility: fcst.visib || 10,
        flightCategory: determineFlightCategory(fcst.visib || 99999, 99999),
      });
    }
  }
  
  return forecasts;
}

// ============================================
// Helper Functions
// ============================================

export function determineFlightCategory(
  visibility: number, // statute miles
  ceiling: number // feet AGL
): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' {
  if (visibility < 3 || ceiling < 500) return 'LIFR';
  if (visibility < 5 || ceiling < 1000) return 'IFR';
  if (visibility < 10 || ceiling < 3000) return 'MVFR';
  return 'VFR';
}

export function getFlightCategoryColor(category: string): string {
  switch (category) {
    case 'VFR': return 'green';
    case 'MVFR': return 'blue';
    case 'IFR': return 'red';
    case 'LIFR': return 'purple';
    default: return 'gray';
  }
}

export function getFlightCategoryAdvice(category: string): string {
  switch (category) {
    case 'VFR':
      return 'Excellent flying conditions. Visual flight rules apply.';
    case 'MVFR':
      return 'Marginal VFR. Cloud ceilings between 1000-3000 ft.';
    case 'IFR':
      return 'Instrument flight rules required. Low visibility.';
    case 'LIFR':
      return 'Very poor conditions. Flight not recommended.';
    default:
      return 'Conditions unknown.';
  }
}

// ============================================
// Windy.com API (via proxy recommended for production)
// ============================================

export async function fetchWindyData(lat: number, lon: number): Promise<{
  windSpeed: number;
  windDirection: number;
  gust: number;
  pressure: number;
}> {
  // Note: Windy API requires a key. This is a placeholder.
  // In production, use a backend proxy to hide the API key.
  const API_KEY = import.meta.env.VITE_WINDY_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Windy API key not configured');
  }
  
  const url = `https://api.windy.com/api/point-forecast/v2/post`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lat,
      lon,
      key: API_KEY,
      model: 'gfs',
      parameters: ['wind', 'windGust', 'pressure'],
      levels: ['surface'],
    }),
  });
  
  if (!response.ok) throw new Error('Windy API error');
  
  const data = await response.json();
  
  return {
    windSpeed: data.wind?.[0]?.[0] || 0,
    windDirection: data.wind?.[1]?.[0] || 0,
    gust: data.windGust?.[0]?.[0] || 0,
    pressure: data.pressure?.[0]?.[0] || 1013,
  };
}

// ============================================
// Weather Alerts
// ============================================

export interface WeatherAlert {
  type: 'wind' | 'rain' | 'temperature' | 'visibility' | 'storm';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  message: string;
  threshold: number;
  current: number;
}

export function checkWeatherAlerts(weather: AviationWeather): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  
  // Wind alert
  if (weather.wind.speed > 25) {
    alerts.push({
      type: 'wind',
      severity: weather.wind.speed > 35 ? 'extreme' : weather.wind.speed > 30 ? 'high' : 'medium',
      message: `Wind speed ${weather.wind.speed} mph exceeds safe limit`,
      threshold: 25,
      current: weather.wind.speed,
    });
  }
  
  // Wind gust alert
  if (weather.wind.gust > 30) {
    alerts.push({
      type: 'wind',
      severity: 'high',
      message: `Wind gusts ${weather.wind.gust} mph - avoid flight`,
      threshold: 30,
      current: weather.wind.gust,
    });
  }
  
  // Visibility alert
  if (weather.visibility < 5) {
    alerts.push({
      type: 'visibility',
      severity: weather.visibility < 2 ? 'high' : 'medium',
      message: `Visibility ${weather.visibility} mi is below safe minimum`,
      threshold: 5,
      current: weather.visibility,
    });
  }
  
  // Temperature extreme
  if (weather.temperature < 0 || weather.temperature > 40) {
    alerts.push({
      type: 'temperature',
      severity: 'medium',
      message: `Temperature ${weather.temperature}°C - check battery performance`,
      threshold: weather.temperature < 0 ? 0 : 40,
      current: weather.temperature,
    });
  }
  
  // IFR conditions
  if (weather.flightCategory === 'IFR' || weather.flightCategory === 'LIFR') {
    alerts.push({
      type: 'visibility',
      severity: 'high',
      message: `${weather.flightCategory} conditions - instrument rated pilots only`,
      threshold: 5,
      current: weather.visibility,
    });
  }
  
  return alerts;
}
