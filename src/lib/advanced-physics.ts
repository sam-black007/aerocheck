// Advanced Physics Engine for AeroCheck

import type { Aircraft, WeatherConditions } from '../types';

export interface AdvancedPhysics {
  // Lift & Drag
  liftForce: number;
  dragForce: number;
  liftCoefficient: number;
  dragCoefficient: number;
  liftToDrag: number;
  
  // Performance
  stallSpeed: number;
  cruiseSpeed: number;
  maxSpeed: number;
  rateOfClimb: number;
  descentRate: number;
  ceiling: number;
  
  // Maneuvering
  turnRadius: number;
  turnRate: number;
  bankAngle: number;
  
  // Stability
  stabilityFactor: number;
  cgPosition: number;
  momentCoefficient: number;
  
  // Efficiency
  glideRatio: number;
  efficiency: number;
  range: number;
  endurance: number;
  
  // Battery
  currentDraw: number;
  motorEfficiency: number;
  propEfficiency: number;
}

// Constants
const AIR_DENSITY_SEA_LEVEL = 0.0023769; // slugs/ft³
const GRAVITY = 32.174; // ft/s²
const PREFIX_LBS_TO_OZ = 16;

// Air density calculation based on altitude and temperature
export function calculateAirDensity(
  altitude: number, // feet
  temperature: number // °C
): number {
  const tempRankine = (temperature * 9/5) + 491.67;
  const seaLevelTemp = 518.67; // Rankine
  const pressureRatio = Math.pow(1 - 0.0000068754 * altitude, 5.2559);
  const tempRatio = tempRankine / seaLevelTemp;
  return AIR_DENSITY_SEA_LEVEL * pressureRatio / tempRatio;
}

// Calculate lift coefficient based on aircraft type and configuration
export function calculateLiftCoefficient(
  aircraft: Aircraft,
  angleOfAttack: number = 5 // degrees
): number {
  const baseCl = 0.5 + (angleOfAttack * 0.1);
  const reynoldsFactor = Math.min(1.2, 1 + (aircraft.wingspan / 100));
  return baseCl * reynoldsFactor;
}

// Calculate drag coefficient
export function calculateDragCoefficient(
  aircraft: Aircraft,
  parasiticDrag: number = 0.03,
  inducedDragFactor: number = 0.02
): number {
  const aspectRatio = aircraft.wingspan / Math.sqrt(aircraft.wingArea || 1);
  const cd = parasiticDrag + (inducedDragFactor / aspectRatio);
  return cd;
}

// Calculate lift force
export function calculateLiftForce(
  airDensity: number,
  velocity: number, // ft/s
  wingArea: number, // ft²
  liftCoefficient: number
): number {
  return 0.5 * airDensity * velocity * velocity * wingArea * liftCoefficient;
}

// Calculate drag force
export function calculateDragForce(
  airDensity: number,
  velocity: number, // ft/s
  wingArea: number, // ft²
  dragCoefficient: number
): number {
  return 0.5 * airDensity * velocity * velocity * wingArea * dragCoefficient;
}

// Calculate stall speed
export function calculateStallSpeed(
  weight: number, // grams
  wingArea: number, // in²
  maxLiftCoefficient: number = 1.5,
  altitude: number = 0,
  temperature: number = 20
): number {
  const weightLbs = weight / 453.592;
  const wingAreaFt2 = wingArea / 144;
  const rho = calculateAirDensity(altitude, temperature);
  
  const velocitySquared = (2 * weightLbs * GRAVITY) / (rho * wingAreaFt2 * maxLiftCoefficient);
  const velocityMph = Math.sqrt(velocitySquared) * 0.681818;
  
  return Math.round(velocityMph);
}

// Calculate cruise speed
export function calculateCruiseSpeed(
  aircraft: Aircraft,
  throttle: number = 0.75 // 75%
): number {
  const maxRpm = aircraft.motor.kv * aircraft.battery.voltage;
  const cruiseRpm = maxRpm * throttle;
  const pitchSpeed = (cruiseRpm * aircraft.prop.pitch) / 1056;
  return Math.round(pitchSpeed * 0.85); // Account for inefficiencies
}

// Calculate rate of climb
export function calculateRateOfClimb(
  thrust: number, // grams
  weight: number, // grams
  drag: number, // grams
  velocity: number // ft/s
): number {
  const excessPower = ((thrust - drag) * velocity) / weight;
  const roc = excessPower * 60; // fpm
  return Math.round(Math.max(0, roc));
}

// Calculate descent rate (gliding)
export function calculateDescentRate(
  aircraft: Aircraft,
  glideAngle: number = 8 // degrees
): number {
  const sinkRate = Math.tan(glideAngle * Math.PI / 180) * 88; // fpm per mph
  const cruiseSpeed = calculateCruiseSpeed(aircraft, 0.3);
  return Math.round(cruiseSpeed * sinkRate);
}

// Calculate turn radius
export function calculateTurnRadius(
  velocity: number, // mph
  bankAngle: number // degrees
): number {
  const vfps = velocity * 1.467;
  const bankRad = bankAngle * Math.PI / 180;
  const g = 32.174;
  return Math.round((vfps * vfps) / (g * Math.tan(bankRad)) / 12); // feet
}

// Calculate turn rate
export function calculateTurnRate(
  velocity: number, // mph
  turnRadius: number // feet
): number {
  const vfps = velocity * 1.467;
  const turnRateRad = vfps / turnRadius;
  return Math.round(turnRateRad * 60 * 180 / Math.PI); // degrees per minute
}

// Calculate glide ratio
export function calculateGlideRatio(
  liftCoefficient: number,
  dragCoefficient: number
): number {
  return Math.round((liftCoefficient / dragCoefficient) * 10) / 10;
}

// Calculate stability factor
export function calculateStabilityFactor(
  cgPosition: number, // % from leading edge
  wingArea: number,
  tailArea: number,
  tailMomentArm: number
): number {
  const staticMargin = (tailArea * tailMomentArm) / (wingArea * cgPosition);
  return Math.round(staticMargin * 100) / 100;
}

// Calculate CG position
export function calculateCGPosition(
  wingChord: number,
  wingPosition: number, // % from nose
  tailPosition: number // % from nose
): number {
  return (wingPosition + tailPosition) / 2;
}

// Calculate motor efficiency
export function calculateMotorEfficiency(
  current: number, // amps
  voltage: number, // volts
  resistance: number = 0.1 // ohms
): number {
  const inputPower = current * voltage;
  const copperLoss = current * current * resistance;
  const efficiency = ((inputPower - copperLoss) / inputPower) * 100;
  return Math.round(Math.min(95, Math.max(50, efficiency)));
}

// Calculate propeller efficiency
export function calculatePropEfficiency(
  advanceRatio: number,
  bladeAngle: number
): number {
  const baseEfficiency = 0.7;
  const advancePenalty = Math.abs(advanceRatio - 0.5) * 0.3;
  const angleBonus = (bladeAngle / 45) * 0.1;
  return Math.round(Math.min(0.85, baseEfficiency - advancePenalty + angleBonus) * 100);
}

// Main advanced physics calculation
export function calculateAdvancedPhysics(
  aircraft: Aircraft,
  weather: WeatherConditions,
  throttle: number = 0.75
): AdvancedPhysics {
  const altitude = 0;
  const rho = calculateAirDensity(altitude, weather.temperature);
  const weightLbs = aircraft.weight / 453.592;
  
  // Lift coefficient
  const cl = calculateLiftCoefficient(aircraft);
  
  // Drag coefficient
  const cd = calculateDragCoefficient(aircraft);
  
  // Wing area in ft²
  const wingAreaFt2 = aircraft.wingArea / 144;
  
  // Calculate thrust (simplified)
  const maxRpm = aircraft.motor.kv * aircraft.battery.voltage;
  const thrust = (maxRpm * aircraft.prop.pitch) / 500; // Simplified thrust in grams
  
  // Velocities
  const cruiseSpeed = calculateCruiseSpeed(aircraft, throttle);
  const cruiseVfps = cruiseSpeed * 1.467;
  
  // Lift and drag forces
  const liftForce = calculateLiftForce(rho, cruiseVfps, wingAreaFt2, cl);
  const dragForce = calculateDragForce(rho, cruiseVfps, wingAreaFt2, cd);
  
  // Stall speed
  const stallSpeed = calculateStallSpeed(
    aircraft.weight,
    aircraft.wingArea,
    cl * 1.5,
    altitude,
    weather.temperature
  );
  
  // Rates
  const rateOfClimb = calculateRateOfClimb(thrust, aircraft.weight, dragForce * 453.592, cruiseVfps);
  const descentRate = calculateDescentRate(aircraft);
  
  // Turn performance
  const bankAngle = 30; // degrees
  const turnRadius = calculateTurnRadius(cruiseSpeed, bankAngle);
  const turnRate = calculateTurnRate(cruiseSpeed, turnRadius);
  
  // Efficiency metrics
  const glideRatio = calculateGlideRatio(cl, cd);
  const motorEfficiency = calculateMotorEfficiency(
    aircraft.battery.capacity / 1000,
    aircraft.battery.voltage
  );
  const propEfficiency = calculatePropEfficiency(0.5, 30);
  const efficiency = (motorEfficiency * propEfficiency) / 100;
  
  // Range and endurance
  const currentDraw = (aircraft.battery.capacity / 1000) * throttle;
  const endurance = Math.round((aircraft.battery.capacity / currentDraw) * 60);
  const range = Math.round(cruiseSpeed * (endurance / 60));
  
  return {
    liftForce: Math.round(liftForce),
    dragForce: Math.round(dragForce),
    liftCoefficient: Math.round(cl * 100) / 100,
    dragCoefficient: Math.round(cd * 1000) / 1000,
    liftToDrag: Math.round(glideRatio * 10) / 10,
    stallSpeed,
    cruiseSpeed,
    maxSpeed: Math.round(cruiseSpeed * 1.3),
    rateOfClimb,
    descentRate,
    ceiling: Math.round(500 * (thrust / aircraft.weight)),
    turnRadius,
    turnRate,
    bankAngle,
    stabilityFactor: 0.15,
    cgPosition: 25,
    momentCoefficient: 0.01,
    glideRatio,
    efficiency: Math.round(efficiency * 100),
    range,
    endurance,
    currentDraw: Math.round(currentDraw * 10) / 10,
    motorEfficiency,
    propEfficiency,
  };
}

// Flight envelope calculation
export function calculateFlightEnvelope(aircraft: Aircraft): {
  minSpeed: number;
  maxSpeed: number;
  maxAltitude: number;
  maxRange: number;
  maxEndurance: number;
} {
  const minSpeed = calculateStallSpeed(aircraft.weight, aircraft.wingArea);
  const maxSpeed = calculateCruiseSpeed(aircraft, 1.0);
  const maxAltitude = Math.round(500 * (aircraft.motor.kv * aircraft.battery.voltage) / aircraft.weight);
  const maxRange = maxSpeed * 20; // Rough estimate
  const maxEndurance = 30; // minutes
  
  return { minSpeed, maxSpeed, maxAltitude, maxRange, maxEndurance };
}
