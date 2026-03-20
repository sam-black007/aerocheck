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
