export type AircraftType = 
  | 'fixed-wing' | 'quadcopter' | 'hexacopter' | 'vtol' | 'helicopter'
  | 'sailplane' | 'deltawing' | 'biplane' | 'flyingwing' | 'parkflyer'
  | 'warbird' | 'jet' | 'tricopter' | 'octocopter' | 'hotairballoon'
  | 'rocket' | 'blimp' | 'pylon' | 'ornithopter'
  | '3d-printed';

export type FlightRemark = 
  | 'perfect-flight'
  | 'safe-takeoff'
  | 'safe-landing'
  | 'turbulent-flight'
  | 'partial-crash'
  | 'crash-landed'
  | 'total-crash'
  | 'motor-issue'
  | 'radio-glitch'
  | 'battery-failure'
  | 'lost-model'
  | 'first-flight'
  | 'maintenance-done'
  | 'upgrade-done';

export type FlightStatus = 
  | 'planned'
  | 'completed'
  | 'aborted'
  | 'crashed';

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
  manufacturer?: string;
  wingspan: number;
  wingArea: number;
  weight: number;
  motor: Motor;
  prop: Propeller;
  battery: Battery;
  is3DPrinted: boolean;
  printTime?: number;
  filamentUsed?: number;
  notes: string;
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
  departureTime: string;
  arrivalTime?: string;
  duration: number;
  location: string;
  lat?: number;
  lon?: number;
  weather: WeatherConditions;
  remarks: FlightRemark[];
  status: FlightStatus;
  rating: number;
  notes: string;
  maxAltitude?: number;
  maxSpeed?: number;
  flightCount: number;
  createdAt: string;
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  pilotLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  totalFlights: number;
  totalFlightTime: number;
  favoriteLocation: string;
  createdAt: string;
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
  type: string;
}

export const REMARK_LABELS: Record<FlightRemark, { label: string; color: string; icon: string }> = {
  'perfect-flight': { label: 'Perfect Flight', color: 'text-emerald-400', icon: '✨' },
  'safe-takeoff': { label: 'Safe Takeoff', color: 'text-green-400', icon: '🚀' },
  'safe-landing': { label: 'Safe Landing', color: 'text-green-400', icon: '🛬' },
  'turbulent-flight': { label: 'Turbulent', color: 'text-amber-400', icon: '💨' },
  'partial-crash': { label: 'Partial Crash', color: 'text-orange-400', icon: '⚠️' },
  'crash-landed': { label: 'Crash Landed', color: 'text-red-400', icon: '💥' },
  'total-crash': { label: 'Total Loss', color: 'text-red-600', icon: '🔥' },
  'motor-issue': { label: 'Motor Issue', color: 'text-amber-400', icon: '⚡' },
  'radio-glitch': { label: 'Radio Glitch', color: 'text-yellow-400', icon: '📡' },
  'battery-failure': { label: 'Battery Issue', color: 'text-orange-400', icon: '🔋' },
  'lost-model': { label: 'Lost Model', color: 'text-red-500', icon: '❓' },
  'first-flight': { label: 'First Flight', color: 'text-sky-400', icon: '🌟' },
  'maintenance-done': { label: 'Maintenance', color: 'text-blue-400', icon: '🔧' },
  'upgrade-done': { label: 'Upgraded', color: 'text-purple-400', icon: '⬆️' },
};

export const STATUS_COLORS: Record<FlightStatus, { bg: string; text: string; border: string }> = {
  'planned': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  'completed': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  'aborted': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  'crashed': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
};

export const AIRCRAFT_DEFAULTS: Record<AircraftType, Partial<Aircraft>> = {
  'fixed-wing': { wingspan: 48, wingArea: 300, weight: 1200 },
  'quadcopter': { wingspan: 24, wingArea: 0, weight: 800 },
  'hexacopter': { wingspan: 30, wingArea: 0, weight: 1500 },
  'vtol': { wingspan: 40, wingArea: 200, weight: 2000 },
  'helicopter': { wingspan: 0, wingArea: 0, weight: 500 },
  'sailplane': { wingspan: 72, wingArea: 400, weight: 600 },
  'deltawing': { wingspan: 36, wingArea: 250, weight: 900 },
  'biplane': { wingspan: 42, wingArea: 350, weight: 1400 },
  'flyingwing': { wingspan: 54, wingArea: 280, weight: 700 },
  'parkflyer': { wingspan: 36, wingArea: 200, weight: 400 },
  'warbird': { wingspan: 52, wingArea: 320, weight: 1800 },
  'jet': { wingspan: 44, wingArea: 280, weight: 2500 },
  'tricopter': { wingspan: 18, wingArea: 0, weight: 400 },
  'octocopter': { wingspan: 40, wingArea: 0, weight: 3000 },
  'hotairballoon': { wingspan: 0, wingArea: 0, weight: 500 },
  'rocket': { wingspan: 10, wingArea: 50, weight: 500 },
  'blimp': { wingspan: 36, wingArea: 0, weight: 100 },
  'pylon': { wingspan: 36, wingArea: 100, weight: 800 },
  'ornithopter': { wingspan: 24, wingArea: 150, weight: 300 },
  '3d-printed': { wingspan: 24, wingArea: 100, weight: 150 },
};

export const SUITABILITY_COLORS: Record<string, string> = {
  'excellent': 'text-emerald-400',
  'good': 'text-lime-400',
  'marginal': 'text-amber-400',
  'poor': 'text-orange-400',
  'unsafe': 'text-red-400',
};

export const SUITABILITY_BG: Record<string, string> = {
  'excellent': 'bg-emerald-500',
  'good': 'bg-lime-500',
  'marginal': 'bg-amber-500',
  'poor': 'bg-orange-500',
  'unsafe': 'bg-red-500',
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
