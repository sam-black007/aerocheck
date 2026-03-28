export type AircraftType = 
  | 'fixed-wing' | 'quadcopter' | 'hexacopter' | 'vtol' | 'helicopter'
  | 'sailplane' | 'deltawing' | 'biplane' | 'flyingwing' | 'parkflyer'
  | 'warbird' | 'jet' | 'tricopter' | 'octocopter' | 'hotairballoon';

export interface Motor {
  kv: number;
  maxVoltage: number;
  maxCurrent: number;
  weight: number;
}

export interface Propeller {
  diameter: number;
  pitch: number;
}

export interface Battery {
  cells: number;
  capacity: number;
  dischargeRate: number;
  voltage: number;
}

export interface Aircraft {
  id: string;
  name: string;
  type: AircraftType;
  wingspan: number;
  wingArea: number;
  weight: number;
  motor: Motor;
  prop: Propeller;
  battery: Battery;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherConditions {
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
}

export interface FlightLog {
  id: string;
  aircraftId: string;
  aircraftName: string;
  date: string;
  duration: number;
  location: string;
  weather: WeatherConditions;
  notes: string;
  rating: number;
}

export interface FlightCalculations {
  wingLoading: number;
  thrustToWeight: number;
  powerToWeight: number;
  estimatedSpeed: number;
  flightTime: number;
  takeoffDistance: number;
  maxAltitude: number;
  suitabilityScore: number;
  suitabilityLevel: 'excellent' | 'good' | 'marginal' | 'poor' | 'unsafe';
  warnings: string[];
  recommendations: string[];
}

export interface SimulatedWeather extends WeatherConditions {
  densityAltitude: number;
  trueAirspeed: number;
}

export interface AppSettings {
  units: 'metric' | 'imperial';
  defaultLocation: string;
  theme: 'dark' | 'light';
  windUnit: 'mph' | 'kmh' | 'mps';
  tempUnit: 'C' | 'F';
}

export interface DailyForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  description: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  cloudCover: number;
  visibility: number;
  icon: string;
}

export interface HourlyForecast {
  time: string;
  hour: string;
  temperature: number;
  weatherCode: number;
  description: string;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  cloudCover: number;
  visibility: number;
  icon: string;
}

export interface CloudLayer {
  altitude: number;
  coverage: number;
  type: 'cirrus' | 'cirrostratus' | 'cirrocumulus' | 'altostratus' | 'altocumulus' | 'stratus' | 'cumulus' | 'nimbostratus';
}

export interface WeatherBriefingComplete {
  current: WeatherConditions;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  cloudLayers: CloudLayer[];
  sunTimes: {
    sunrise: string;
    sunset: string;
    dayLength: number;
  };
  alerts: WeatherAlert[];
  aviationData: AviationWeatherData;
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
  headline: string;
  description: string;
  instruction?: string;
  expires?: string;
}

export interface AviationWeatherData {
  metar: string;
  taf: string;
  visibility: number;
  cloudLayers: CloudLayer[];
  densityAltitude: number;
  ceiling: number;
  winds: {
    speed: number;
    direction: number;
    gusts?: number;
  };
}

export interface DetailedFlightInfo {
  id: string;
  callsign: string;
  registration: string;
  aircraftType: string;
  aircraftModel: string;
  operator: string;
  from: {
    icao: string;
    iata: string;
    name: string;
    city: string;
    country: string;
  };
  to: {
    icao: string;
    iata: string;
    name: string;
    city: string;
    country: string;
  };
  route: string[];
  waypoints: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
  }>;
  status: 'scheduled' | 'boarding' | 'departed' | 'en-route' | 'arrived' | 'cancelled';
  position: {
    lat: number;
    lon: number;
    altitude: number;
    speed: number;
    heading: number;
    verticalSpeed: number;
  };
  times: {
    scheduledDeparture: string;
    actualDeparture?: string;
    scheduledArrival: string;
    estimatedArrival?: string;
    flightDuration: number;
  };
  emergency: string;
  squawk: string;
  category: string;
}

export const AIRCRAFT_DEFAULTS: Record<AircraftType, Partial<Aircraft>> = {
  'fixed-wing': {
    wingspan: 48,
    wingArea: 300,
    weight: 1200,
  },
  'quadcopter': {
    wingspan: 24,
    wingArea: 0,
    weight: 800,
  },
  'hexacopter': {
    wingspan: 30,
    wingArea: 0,
    weight: 1500,
  },
  'vtol': {
    wingspan: 40,
    wingArea: 200,
    weight: 2000,
  },
  'helicopter': {
    wingspan: 0,
    wingArea: 0,
    weight: 500,
  },
  'sailplane': {
    wingspan: 72,
    wingArea: 400,
    weight: 600,
  },
  'deltawing': {
    wingspan: 36,
    wingArea: 250,
    weight: 900,
  },
  'biplane': {
    wingspan: 42,
    wingArea: 350,
    weight: 1400,
  },
  'flyingwing': {
    wingspan: 54,
    wingArea: 280,
    weight: 700,
  },
  'parkflyer': {
    wingspan: 36,
    wingArea: 200,
    weight: 400,
  },
  'warbird': {
    wingspan: 52,
    wingArea: 320,
    weight: 1800,
  },
  'jet': {
    wingspan: 44,
    wingArea: 280,
    weight: 2500,
  },
  'tricopter': {
    wingspan: 18,
    wingArea: 0,
    weight: 400,
  },
  'octocopter': {
    wingspan: 40,
    wingArea: 0,
    weight: 3000,
  },
  'hotairballoon': {
    wingspan: 0,
    wingArea: 0,
    weight: 500,
  },
};

export const WEATHER_ICONS: Record<string, string> = {
  'clear': '☀️',
  'clouds': '☁️',
  'rain': '🌧️',
  'snow': '❄️',
  'thunderstorm': '⛈️',
  'mist': '🌫️',
  'wind': '💨',
};

export const SUITABILITY_COLORS: Record<string, string> = {
  'excellent': 'text-green-400',
  'good': 'text-lime-400',
  'marginal': 'text-amber-400',
  'poor': 'text-orange-400',
  'unsafe': 'text-red-400',
};

export const SUITABILITY_BG: Record<string, string> = {
  'excellent': 'bg-green-500',
  'good': 'bg-lime-500',
  'marginal': 'bg-amber-500',
  'poor': 'bg-orange-500',
  'unsafe': 'bg-red-500',
};

export const AIRCRAFT_CATEGORIES: Record<string, { name: string; icon: string }> = {
  'A1': { name: 'Light', icon: '🛩️' },
  'A2': { name: 'Medium', icon: '✈️' },
  'A3': { name: 'Heavy', icon: '🛫' },
  'A4': { name: 'Helicopter', icon: '🚁' },
  'A5': { name: 'Ultralight', icon: '🪁' },
  'A6': { name: 'Glider', icon: '🪂' },
  'B1': { name: 'Balloon', icon: '🎈' },
  'B2': { name: 'Airship', icon: '🎈' },
  'C1': { name: 'Parachute', icon: '🪂' },
  'C2': { name: 'Hang Glider', icon: '🦅' },
  'C3': { name: 'Para Glider', icon: '🦅' },
  'D1': { name: 'UAV/SUA', icon: '🤖' },
};

export const WEATHER_CODES: Record<number, { description: string; icon: string; nightIcon: string }> = {
  0: { description: 'Clear sky', icon: '☀️', nightIcon: '🌙' },
  1: { description: 'Mainly clear', icon: '🌤️', nightIcon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅', nightIcon: '⛅' },
  3: { description: 'Overcast', icon: '☁️', nightIcon: '☁️' },
  45: { description: 'Fog', icon: '🌫️', nightIcon: '🌫️' },
  48: { description: 'Rime fog', icon: '🌫️', nightIcon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️', nightIcon: '🌧️' },
  53: { description: 'Moderate drizzle', icon: '🌧️', nightIcon: '🌧️' },
  55: { description: 'Dense drizzle', icon: '🌧️', nightIcon: '🌧️' },
  56: { description: 'Freezing drizzle', icon: '🌨️', nightIcon: '🌨️' },
  57: { description: 'Heavy freezing drizzle', icon: '🌨️', nightIcon: '🌨️' },
  61: { description: 'Slight rain', icon: '🌧️', nightIcon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️', nightIcon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️', nightIcon: '🌧️' },
  66: { description: 'Freezing rain', icon: '🌨️', nightIcon: '🌨️' },
  67: { description: 'Heavy freezing rain', icon: '🌨️', nightIcon: '🌨️' },
  71: { description: 'Slight snow', icon: '🌨️', nightIcon: '🌨️' },
  73: { description: 'Moderate snow', icon: '❄️', nightIcon: '❄️' },
  75: { description: 'Heavy snow', icon: '❄️', nightIcon: '❄️' },
  77: { description: 'Snow grains', icon: '❄️', nightIcon: '❄️' },
  80: { description: 'Rain showers', icon: '🌦️', nightIcon: '🌧️' },
  81: { description: 'Moderate showers', icon: '🌦️', nightIcon: '🌧️' },
  82: { description: 'Violent showers', icon: '⛈️', nightIcon: '⛈️' },
  85: { description: 'Snow showers', icon: '🌨️', nightIcon: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '🌨️', nightIcon: '🌨️' },
  95: { description: 'Thunderstorm', icon: '⛈️', nightIcon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️', nightIcon: '⛈️' },
  99: { description: 'Severe thunderstorm', icon: '🌪️', nightIcon: '🌪️' },
};
