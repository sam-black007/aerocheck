import { describe, it, expect } from 'vitest';
import { 
  getDefaultWeather, 
  getWeatherIcon, 
  getWindDirectionName 
} from '../lib/weather';

describe('Weather Utils', () => {
  describe('getDefaultWeather', () => {
    it('returns valid weather conditions', () => {
      const weather = getDefaultWeather();
      
      expect(weather).toHaveProperty('temperature');
      expect(weather).toHaveProperty('humidity');
      expect(weather).toHaveProperty('windSpeed');
      expect(weather).toHaveProperty('windDirection');
      expect(weather).toHaveProperty('pressure');
      expect(weather).toHaveProperty('visibility');
      expect(weather).toHaveProperty('cloudCeiling');
      expect(weather).toHaveProperty('precipitation');
    });

    it('has reasonable default values', () => {
      const weather = getDefaultWeather();
      
      expect(weather.temperature).toBe(22);
      expect(weather.humidity).toBe(55);
      expect(weather.windSpeed).toBe(8);
      expect(weather.pressure).toBe(1013);
      expect(weather.visibility).toBe(10);
    });
  });

  describe('getWeatherIcon', () => {
    it('returns rain icon for precipitation', () => {
      const icon = getWeatherIcon({ precipitation: 5 } as any);
      expect(icon).toBe('🌧️');
    });

    it('returns wind icon for high wind', () => {
      const icon = getWeatherIcon({ 
        precipitation: 0, 
        windSpeed: 30 
      } as any);
      expect(icon).toBe('💨');
    });

    it('returns cloud icon for low ceiling', () => {
      const icon = getWeatherIcon({
        precipitation: 0,
        windSpeed: 10,
        cloudCeiling: 500
      } as any);
      expect(icon).toBe('☁️');
    });

    it('returns snow icon for cold temp', () => {
      const icon = getWeatherIcon({
        precipitation: 0,
        windSpeed: 10,
        cloudCeiling: 10000,
        temperature: -5
      } as any);
      expect(icon).toBe('❄️');
    });

    it('returns default sun icon', () => {
      const icon = getWeatherIcon({
        precipitation: 0,
        windSpeed: 5,
        cloudCeiling: 10000,
        temperature: 20
      } as any);
      expect(icon).toBe('☀️');
    });
  });

  describe('getWindDirectionName', () => {
    it('returns correct directions', () => {
      expect(getWindDirectionName(0)).toBe('N');
      expect(getWindDirectionName(90)).toBe('E');
      expect(getWindDirectionName(180)).toBe('S');
      expect(getWindDirectionName(270)).toBe('W');
    });

    it('handles intermediate directions', () => {
      expect(getWindDirectionName(45)).toBe('NE');
      expect(getWindDirectionName(135)).toBe('SE');
      expect(getWindDirectionName(225)).toBe('SW');
      expect(getWindDirectionName(315)).toBe('NW');
    });

    it('wraps around for 360+', () => {
      expect(getWindDirectionName(360)).toBe('N');
      expect(getWindDirectionName(400)).toBe('N');
    });
  });
});
