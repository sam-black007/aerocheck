import type { Aircraft, WeatherConditions, FlightCalculations, SimulatedWeather } from '../types';

export function calculateWingLoading(weight: number, wingArea: number): number {
  if (wingArea <= 0) return 0;
  return (weight / wingArea) * 144; // Convert to oz/sq ft
}

export function calculateThrust(
  rpm: number,
  propDiameter: number,
  propPitch: number,
  voltage: number,
  kv: number
): number {
  const staticThrust = (kv * voltage * propDiameter * propPitch) / 15000;
  return Math.min(staticThrust, 500); // Cap at reasonable value
}

export function calculateFlightTime(
  weight: number,
  batteryCapacity: number,
  dischargeRate: number,
  currentDraw: number
): number {
  const availableMah = Math.min(batteryCapacity, currentDraw / (dischargeRate / 60));
  return Math.round(availableMah / (currentDraw / 60));
}

export function calculateEstimatedSpeed(
  kv: number,
  voltage: number,
  propPitch: number
): number {
  const rpm = kv * voltage;
  return (rpm * propPitch) / 1056; // Theoretical airspeed in mph
}

export function calculateTakeoffDistance(weight: number, thrust: number): number {
  if (thrust <= weight) return Infinity;
  const excess = thrust / weight;
  return Math.round(50 / excess);
}

export function calculateMaxAltitude(thrust: number, weight: number): number {
  if (thrust <= weight) return 0;
  const ratio = thrust / weight;
  return Math.round(500 * ratio);
}

export function calculateDensityAltitude(
  pressureAlt: number,
  temperature: number,
  pressure: number
): number {
  const isaTemp = 15 - (pressureAlt * 0.00356);
  const tempDiff = temperature - isaTemp;
  return pressureAlt + (120 * tempDiff);
}

export function calculateTrueAirspeed(
  indicatedAirspeed: number,
  densityAlt: number
): number {
  const speedRatio = Math.pow(1 - (densityAlt / 145442), 0.5);
  return Math.round(indicatedAirspeed / speedRatio);
}

export function calculateSuitabilityScore(
  aircraft: Aircraft,
  weather: WeatherConditions
): FlightCalculations {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  const weight = aircraft.weight;
  const wingArea = aircraft.wingArea;
  
  const rpm = aircraft.motor.kv * aircraft.battery.voltage;
  const thrust = calculateThrust(
    rpm,
    aircraft.prop.diameter,
    aircraft.prop.pitch,
    aircraft.battery.voltage,
    aircraft.motor.kv
  );
  
  const wingLoading = calculateWingLoading(weight, wingArea);
  const thrustToWeight = thrust / weight;
  const estimatedSpeed = calculateEstimatedSpeed(
    aircraft.motor.kv,
    aircraft.battery.voltage,
    aircraft.prop.pitch
  );
  const flightTime = calculateFlightTime(
    weight,
    aircraft.battery.capacity,
    aircraft.battery.dischargeRate,
    20
  );
  const takeoffDistance = calculateTakeoffDistance(weight, thrust);
  const maxAltitude = calculateMaxAltitude(thrust, weight);
  
  let score = 50;
  
  // Power-to-weight contribution
  if (thrustToWeight >= 0.5) {
    score += 30;
  } else {
    score += thrustToWeight * 60;
    warnings.push('Low thrust-to-weight ratio - reduced maneuverability');
    recommendations.push('Consider larger prop or higher KV motor');
  }
  
  // Wing loading contribution
  if (wingArea > 0) {
    if (wingLoading <= 20) {
      score += 25;
    } else if (wingLoading <= 35) {
      score += 15;
      recommendations.push('Moderate wing loading - suitable for calm conditions');
    } else {
      score += Math.max(0, 10 - (wingLoading - 35) / 5);
      warnings.push('High wing loading - requires higher airspeed');
      recommendations.push('Fly on calmer days or reduce payload');
    }
  }
  
  // Wind conditions
  const safeWind = aircraft.type === 'fixed-wing' ? 15 : 10;
  if (weather.windSpeed <= safeWind) {
    score += 15;
  } else {
    const windPenalty = Math.min(15, (weather.windSpeed - safeWind));
    score += Math.max(0, 15 - windPenalty);
    warnings.push(`High winds (${weather.windSpeed} mph) - challenging conditions`);
    recommendations.push('Consider waiting for calmer conditions');
  }
  
  // Temperature
  if (temperature >= 10 && temperature <= 35) {
    score += 10;
  } else {
    warnings.push('Temperature outside optimal range');
    recommendations.push('Check battery performance in extreme temperatures');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  let level: FlightCalculations['suitabilityLevel'];
  if (score >= 90) level = 'excellent';
  else if (score >= 75) level = 'good';
  else if (score >= 50) level = 'marginal';
  else if (score >= 25) level = 'poor';
  else level = 'unsafe';
  
  if (score >= 75) {
    recommendations.push('Great conditions for flying!');
  }
  
  return {
    wingLoading,
    thrustToWeight,
    powerToWeight: thrustToWeight,
    estimatedSpeed,
    flightTime,
    takeoffDistance,
    maxAltitude,
    suitabilityScore: score,
    suitabilityLevel: level,
    warnings,
    recommendations,
  };
}

export function simulateWeather(
  baseWeather: WeatherConditions,
  changes: Partial<WeatherConditions>,
  altitude: number = 0
): SimulatedWeather {
  const newWeather = { ...baseWeather, ...changes };
  const densityAlt = calculateDensityAltitude(altitude, newWeather.temperature, newWeather.pressure);
  const trueAirspeed = calculateTrueAirspeed(60, densityAlt);
  
  return {
    ...newWeather,
    densityAltitude: densityAlt,
    trueAirspeed,
  };
}

export function generateAircraftId(): string {
  return `ac_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateFlightId(): string {
  return `flight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function convertWeight(grams: number, toUnit: 'oz' | 'g'): number {
  if (toUnit === 'oz') return grams / 28.3495;
  return grams;
}

export function convertLength(inches: number, toUnit: 'cm' | 'in'): number {
  if (toUnit === 'cm') return inches * 2.54;
  return inches;
}

export function convertTemp(celsius: number, toUnit: 'C' | 'F'): number {
  if (toUnit === 'F') return (celsius * 9/5) + 32;
  return celsius;
}

export function convertWind(mph: number, toUnit: 'mph' | 'kmh' | 'mps'): number {
  switch (toUnit) {
    case 'kmh': return mph * 1.60934;
    case 'mps': return mph * 0.44704;
    default: return mph;
  }
}
