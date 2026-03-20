import { describe, it, expect } from 'vitest';
import {
  calculateWingLoading,
  calculateThrust,
  calculateFlightTime,
  calculateEstimatedSpeed,
  calculateTakeoffDistance,
  calculateMaxAltitude,
  calculateDensityAltitude,
  calculateTrueAirspeed,
  calculateSuitabilityScore,
  simulateWeather,
  generateAircraftId,
  convertWeight,
  convertTemp,
  convertWind,
} from '../lib/calculations';
import type { Aircraft, WeatherConditions } from '../types';

describe('Flight Calculations', () => {
  const testAircraft: Aircraft = {
    id: 'test-1',
    name: 'Test Plane',
    type: 'fixed-wing',
    wingspan: 48,
    wingArea: 300,
    weight: 1200,
    motor: { kv: 1000, maxVoltage: 14.8, maxCurrent: 50, weight: 150 },
    prop: { diameter: 10, pitch: 4 },
    battery: { cells: 3, capacity: 5000, dischargeRate: 50, voltage: 11.1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testWeather: WeatherConditions = {
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

  describe('calculateWingLoading', () => {
    it('calculates wing loading correctly', () => {
      const loading = calculateWingLoading(1200, 300);
      expect(loading).toBeCloseTo(576, 0);
    });

    it('returns 0 for zero wing area', () => {
      const loading = calculateWingLoading(1200, 0);
      expect(loading).toBe(0);
    });

    it('handles small wing areas', () => {
      const loading = calculateWingLoading(500, 50);
      expect(loading).toBe(144);
    });
  });

  describe('calculateThrust', () => {
    it('calculates thrust for valid inputs', () => {
      const thrust = calculateThrust(14800, 10, 4, 14.8, 1000);
      expect(thrust).toBeGreaterThan(0);
      expect(thrust).toBeLessThan(500);
    });

    it('caps thrust at reasonable maximum', () => {
      const thrust = calculateThrust(50000, 20, 10, 22.2, 2200);
      expect(thrust).toBeLessThanOrEqual(500);
    });
  });

  describe('calculateFlightTime', () => {
    it('calculates flight time correctly', () => {
      const time = calculateFlightTime(1200, 5000, 50, 20);
      expect(time).toBeGreaterThan(0);
    });

    it('returns reasonable flight times', () => {
      const time = calculateFlightTime(800, 3000, 30, 15);
      expect(time).toBeGreaterThan(5);
      expect(time).toBeLessThan(60);
    });
  });

  describe('calculateEstimatedSpeed', () => {
    it('calculates airspeed', () => {
      const speed = calculateEstimatedSpeed(1000, 14.8, 4);
      expect(speed).toBeGreaterThan(0);
    });

    it('returns reasonable speeds', () => {
      const speed = calculateEstimatedSpeed(1200, 22.2, 6);
      expect(speed).toBeGreaterThan(30);
      expect(speed).toBeLessThan(200);
    });
  });

  describe('calculateTakeoffDistance', () => {
    it('returns Infinity for insufficient thrust', () => {
      const distance = calculateTakeoffDistance(2000, 1000);
      expect(distance).toBe(Infinity);
    });

    it('calculates reasonable distances', () => {
      const distance = calculateTakeoffDistance(1000, 2000);
      expect(distance).toBe(25);
    });
  });

  describe('calculateMaxAltitude', () => {
    it('returns 0 for insufficient thrust', () => {
      const alt = calculateMaxAltitude(500, 1000);
      expect(alt).toBe(0);
    });

    it('calculates reasonable altitude', () => {
      const alt = calculateMaxAltitude(2000, 1000);
      expect(alt).toBe(1000);
    });
  });

  describe('calculateDensityAltitude', () => {
    it('calculates density altitude', () => {
      const da = calculateDensityAltitude(1000, 15, 1013);
      expect(da).toBeGreaterThan(0);
    });

    it('increases with higher temperature', () => {
      const da1 = calculateDensityAltitude(1000, 15, 1013);
      const da2 = calculateDensityAltitude(1000, 25, 1013);
      expect(da2).toBeGreaterThan(da1);
    });
  });

  describe('calculateTrueAirspeed', () => {
    it('calculates true airspeed', () => {
      const tas = calculateTrueAirspeed(60, 1000);
      expect(tas).toBeGreaterThan(60);
    });

    it('increases at higher density altitude', () => {
      const tas1 = calculateTrueAirspeed(60, 1000);
      const tas2 = calculateTrueAirspeed(60, 5000);
      expect(tas2).toBeGreaterThan(tas1);
    });
  });

  describe('calculateSuitabilityScore', () => {
    it('returns excellent score for good conditions', () => {
      const result = calculateSuitabilityScore(testAircraft, testWeather);
      expect(result.suitabilityScore).toBeGreaterThanOrEqual(75);
      expect(result.suitabilityLevel).toMatch(/excellent|good/);
    });

    it('adds warnings for high wind', () => {
      const highWindWeather = { ...testWeather, windSpeed: 30 };
      const result = calculateSuitabilityScore(testAircraft, highWindWeather);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('adds warnings for high wing loading', () => {
      const heavyAircraft = { ...testAircraft, weight: 5000 };
      const result = calculateSuitabilityScore(heavyAircraft, testWeather);
      expect(result.warnings.some(w => w.includes('wing loading'))).toBe(true);
    });

    it('includes recommendations', () => {
      const result = calculateSuitabilityScore(testAircraft, testWeather);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('simulateWeather', () => {
    it('simulates weather changes', () => {
      const simulated = simulateWeather(testWeather, { temperature: 30 }, 2000);
      expect(simulated.temperature).toBe(30);
      expect(simulated.densityAltitude).toBeGreaterThan(2000);
    });

    it('calculates true airspeed', () => {
      const simulated = simulateWeather(testWeather, {}, 3000);
      expect(simulated.trueAirspeed).toBeGreaterThan(0);
    });
  });

  describe('Utility functions', () => {
    it('generates unique IDs', () => {
      const id1 = generateAircraftId();
      const id2 = generateAircraftId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^ac_/);
    });

    it('converts weight correctly', () => {
      const oz = convertWeight(1000, 'oz');
      expect(oz).toBeCloseTo(35.27, 1);
    });

    it('converts temperature correctly', () => {
      const f = convertTemp(0, 'F');
      expect(f).toBe(32);
      
      const c = convertTemp(32, 'C');
      expect(c).toBe(0);
    });

    it('converts wind speed correctly', () => {
      const kmh = convertWind(10, 'kmh');
      expect(kmh).toBeCloseTo(16.09, 1);
      
      const mps = convertWind(10, 'mps');
      expect(mps).toBeCloseTo(4.47, 1);
    });
  });
});
