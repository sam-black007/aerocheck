import { describe, it, expect } from 'vitest';
import { 
  SUITABILITY_COLORS, 
  SUITABILITY_BG, 
  WEATHER_ICONS,
  AIRCRAFT_DEFAULTS,
  type AircraftType 
} from '../types';

describe('Types and Constants', () => {
  describe('Suitability Colors', () => {
    it('has colors for all levels', () => {
      expect(SUITABILITY_COLORS.excellent).toBeDefined();
      expect(SUITABILITY_COLORS.good).toBeDefined();
      expect(SUITABILITY_COLORS.marginal).toBeDefined();
      expect(SUITABILITY_COLORS.poor).toBeDefined();
      expect(SUITABILITY_COLORS.unsafe).toBeDefined();
    });

    it('returns text color class names', () => {
      expect(SUITABILITY_COLORS.excellent).toContain('text-');
      expect(SUITABILITY_COLORS.unsafe).toContain('text-');
    });
  });

  describe('Suitability Background Colors', () => {
    it('has background colors for all levels', () => {
      expect(SUITABILITY_BG.excellent).toBeDefined();
      expect(SUITABILITY_BG.unsafe).toBeDefined();
    });

    it('returns background color class names', () => {
      expect(SUITABILITY_BG.excellent).toContain('bg-');
      expect(SUITABILITY_BG.good).toContain('bg-');
    });
  });

  describe('Weather Icons', () => {
    it('has icons for weather conditions', () => {
      expect(WEATHER_ICONS.clear).toBeDefined();
      expect(WEATHER_ICONS.clouds).toBeDefined();
      expect(WEATHER_ICONS.rain).toBeDefined();
      expect(WEATHER_ICONS.snow).toBeDefined();
      expect(WEATHER_ICONS.thunderstorm).toBeDefined();
    });

    it('returns emoji icons', () => {
      expect(WEATHER_ICONS.clear).toMatch(/[\u{1F300}-\u{1F9FF}]/u);
    });
  });

  describe('Aircraft Defaults', () => {
    const aircraftTypes: AircraftType[] = [
      'fixed-wing', 'quadcopter', 'hexacopter', 'vtol', 'helicopter'
    ];

    it('has defaults for all aircraft types', () => {
      aircraftTypes.forEach(type => {
        expect(AIRCRAFT_DEFAULTS[type]).toBeDefined();
      });
    });

    it('fixed-wing has wingspan and wing area', () => {
      const defaults = AIRCRAFT_DEFAULTS['fixed-wing'];
      expect(defaults.wingspan).toBeGreaterThan(0);
      expect(defaults.wingArea).toBeGreaterThan(0);
      expect(defaults.weight).toBeGreaterThan(0);
    });

    it('copters have zero wing area', () => {
      expect(AIRCRAFT_DEFAULTS['quadcopter'].wingArea).toBe(0);
      expect(AIRCRAFT_DEFAULTS['hexacopter'].wingArea).toBe(0);
    });

    it('helicopter has zero wingspan', () => {
      expect(AIRCRAFT_DEFAULTS['helicopter'].wingspan).toBe(0);
    });

    it('all have valid weights', () => {
      Object.values(AIRCRAFT_DEFAULTS).forEach(defaults => {
        expect(defaults.weight).toBeGreaterThan(0);
      });
    });
  });
});
