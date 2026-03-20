import type { AircraftType } from '../types';

// Extended aircraft types with physics properties
export interface AircraftTypeConfig {
  type: AircraftType;
  label: string;
  icon: string;
  category: 'fixed-wing' | 'rotor' | 'special';
  defaultSpecs: {
    wingspan: number;
    wingArea: number;
    weight: number;
    minSpeed: number;      // mph
    maxSpeed: number;      // mph
    stallSpeed: number;    // mph
    glideRatio: number;
    turnRadius: number;    // feet
    rateOfClimb: number;   // fpm
  };
  physics: {
    liftCoefficient: number;
    dragCoefficient: number;
    aspectRatio: number;
    wingLoading: { min: number; max: number; optimal: number };
  };
}

export const AIRCRAFT_CONFIGS: Record<string, AircraftTypeConfig> = {
  'fixed-wing': {
    type: 'fixed-wing',
    label: 'Fixed Wing',
    icon: '🛩️',
    category: 'fixed-wing',
    defaultSpecs: {
      wingspan: 48,
      wingArea: 300,
      weight: 1200,
      minSpeed: 25,
      maxSpeed: 80,
      stallSpeed: 20,
      glideRatio: 8,
      turnRadius: 30,
      rateOfClimb: 800,
    },
    physics: {
      liftCoefficient: 0.5,
      dragCoefficient: 0.03,
      aspectRatio: 6,
      wingLoading: { min: 8, max: 25, optimal: 15 },
    },
  },
  'quadcopter': {
    type: 'quadcopter',
    label: 'Quadcopter',
    icon: '🛸',
    category: 'rotor',
    defaultSpecs: {
      wingspan: 24,
      wingArea: 0,
      weight: 800,
      minSpeed: 0,
      maxSpeed: 50,
      stallSpeed: 0,
      glideRatio: 0,
      turnRadius: 15,
      rateOfClimb: 1000,
    },
    physics: {
      liftCoefficient: 1.2,
      dragCoefficient: 0.15,
      aspectRatio: 1,
      wingLoading: { min: 0, max: 0, optimal: 0 },
    },
  },
  'hexacopter': {
    type: 'hexacopter',
    label: 'Hexacopter',
    icon: '🚀',
    category: 'rotor',
    defaultSpecs: {
      wingspan: 30,
      wingArea: 0,
      weight: 1500,
      minSpeed: 0,
      maxSpeed: 45,
      stallSpeed: 0,
      glideRatio: 0,
      turnRadius: 20,
      rateOfClimb: 900,
    },
    physics: {
      liftCoefficient: 1.1,
      dragCoefficient: 0.14,
      aspectRatio: 1,
      wingLoading: { min: 0, max: 0, optimal: 0 },
    },
  },
  'vtol': {
    type: 'vtol',
    label: 'VTOL',
    icon: '✈️',
    category: 'fixed-wing',
    defaultSpecs: {
      wingspan: 40,
      wingArea: 200,
      weight: 2000,
      minSpeed: 0,
      maxSpeed: 70,
      stallSpeed: 30,
      glideRatio: 6,
      turnRadius: 35,
      rateOfClimb: 600,
    },
    physics: {
      liftCoefficient: 0.6,
      dragCoefficient: 0.04,
      aspectRatio: 5,
      wingLoading: { min: 10, max: 30, optimal: 18 },
    },
  },
  'helicopter': {
    type: 'helicopter',
    label: 'Helicopter',
    icon: '🚁',
    category: 'rotor',
    defaultSpecs: {
      wingspan: 0,
      wingArea: 0,
      weight: 500,
      minSpeed: 0,
      maxSpeed: 60,
      stallSpeed: 0,
      glideRatio: 0,
      turnRadius: 25,
      rateOfClimb: 700,
    },
    physics: {
      liftCoefficient: 1.0,
      dragCoefficient: 0.12,
      aspectRatio: 1,
      wingLoading: { min: 0, max: 0, optimal: 0 },
    },
  },
};

// NEW AIRCRAFT TYPES

export const NEW_AIRCRAFT_TYPES: AircraftTypeConfig[] = [
  {
    type: 'sailplane',
    label: 'Sailplane/Glider',
    icon: '🪂',
    category: 'fixed-wing',
    defaultSpecs: {
      wingspan: 72,
      wingArea: 400,
      weight: 600,
      minSpeed: 15,
      maxSpeed: 100,
      stallSpeed: 12,
      glideRatio: 15,
      turnRadius: 50,
      rateOfClimb: 300,
    },
    physics: {
      liftCoefficient: 0.7,
      dragCoefficient: 0.02,
      aspectRatio: 15,
      wingLoading: { min: 3, max: 12, optimal: 6 },
    },
  },
  {
    type: 'deltawing',
    label: 'Delta Wing',
    icon: '🔺',
    category: 'fixed-wing',
    defaultSpecs: {
      wingspan: 36,
      wingArea: 250,
      weight: 900,
      minSpeed: 30,
      maxSpeed: 90,
      stallSpeed: 25,
      glideRatio: 7,
      turnRadius: 40,
      rateOfClimb: 500,
    },
    physics: {
      liftCoefficient: 0.4,
      dragCoefficient: 0.035,
      aspectRatio: 4,
      wingLoading: { min: 8, max: 20, optimal: 12 },
    },
  },
  {
    type: 'biplane',
    label: 'Biplane',
    icon: '🦅',
    category: 'fixed-wing',
    defaultSpecs: {
      wingspan: 42,
      wingArea: 350,
      weight: 1400,
      minSpeed: 25,
      maxSpeed: 75,
      stallSpeed: 20,
      glideRatio: 7,
      turnRadius: 35,
      rateOfClimb: 600,
    },
    physics: {
      liftCoefficient: 0.55,
      dragCoefficient: 0.04,
      aspectRatio: 4,
      wingLoading: { min: 10, max: 22, optimal: 14 },
    },
  },
  {
    type: 'flyingwing',
    label: 'Flying Wing',
    icon: '🦋',
    category: 'fixed-wing',
    defaultSpecs: {
      wingspan: 54,
      wingArea: 280,
      weight: 700,
      minSpeed: 20,
      maxSpeed: 85,
      stallSpeed: 18,
      glideRatio: 12,
      turnRadius: 45,
      rateOfClimb: 400,
    },
    physics: {
      liftCoefficient: 0.45,
      dragCoefficient: 0.025,
      aspectRatio: 10,
      wingLoading: { min: 5, max: 15, optimal: 9 },
    },
  },
  {
    type: 'parkflyer',
    label: 'Park Flyer',
    icon: '🐦',
    category: 'fixed-wing',
    defaultSpecs: {
      wingspan: 36,
      wingArea: 200,
      weight: 400,
      minSpeed: 15,
      maxSpeed: 45,
      stallSpeed: 12,
      glideRatio: 6,
      turnRadius: 20,
      rateOfClimb: 500,
    },
    physics: {
      liftCoefficient: 0.6,
      dragCoefficient: 0.05,
      aspectRatio: 5,
      wingLoading: { min: 4, max: 15, optimal: 8 },
    },
  },
  {
    type: 'warbird',
    label: 'Warbird',
    icon: '🛩️',
    category: 'fixed-wing',
    defaultSpecs: {
      wingspan: 52,
      wingArea: 320,
      weight: 1800,
      minSpeed: 35,
      maxSpeed: 100,
      stallSpeed: 28,
      glideRatio: 8,
      turnRadius: 50,
      rateOfClimb: 900,
    },
    physics: {
      liftCoefficient: 0.5,
      dragCoefficient: 0.035,
      aspectRatio: 6,
      wingLoading: { min: 12, max: 28, optimal: 18 },
    },
  },
  {
    type: 'jet',
    label: 'Jet Turbine',
    icon: '✈️',
    category: 'fixed-wing',
    defaultSpecs: {
      wingspan: 44,
      wingArea: 280,
      weight: 2500,
      minSpeed: 40,
      maxSpeed: 150,
      stallSpeed: 35,
      glideRatio: 6,
      turnRadius: 60,
      rateOfClimb: 1500,
    },
    physics: {
      liftCoefficient: 0.4,
      dragCoefficient: 0.03,
      aspectRatio: 5,
      wingLoading: { min: 15, max: 35, optimal: 22 },
    },
  },
  {
    type: 'tricopter',
    label: 'Tricopter',
    icon: '🛼',
    category: 'rotor',
    defaultSpecs: {
      wingspan: 18,
      wingArea: 0,
      weight: 400,
      minSpeed: 0,
      maxSpeed: 40,
      stallSpeed: 0,
      glideRatio: 0,
      turnRadius: 12,
      rateOfClimb: 800,
    },
    physics: {
      liftCoefficient: 1.3,
      dragCoefficient: 0.18,
      aspectRatio: 1,
      wingLoading: { min: 0, max: 0, optimal: 0 },
    },
  },
  {
    type: 'octocopter',
    label: 'Octocopter',
    icon: '🎯',
    category: 'rotor',
    defaultSpecs: {
      wingspan: 40,
      wingArea: 0,
      weight: 3000,
      minSpeed: 0,
      maxSpeed: 35,
      stallSpeed: 0,
      glideRatio: 0,
      turnRadius: 30,
      rateOfClimb: 600,
    },
    physics: {
      liftCoefficient: 1.0,
      dragCoefficient: 0.12,
      aspectRatio: 1,
      wingLoading: { min: 0, max: 0, optimal: 0 },
    },
  },
  {
    type: 'hotairballoon',
    label: 'Hot Air Balloon',
    icon: '🎈',
    category: '特种',
    defaultSpecs: {
      wingspan: 0,
      wingArea: 0,
      weight: 500,
      minSpeed: 0,
      maxSpeed: 15,
      stallSpeed: 0,
      glideRatio: 3,
      turnRadius: 0,
      rateOfClimb: 200,
    },
    physics: {
      liftCoefficient: 0.8,
      dragCoefficient: 0.1,
      aspectRatio: 1,
      wingLoading: { min: 0, max: 0, optimal: 0 },
    },
  },
];

// Combine all aircraft types
export const ALL_AIRCRAFT_TYPES = [
  ...Object.values(AIRCRAFT_CONFIGS),
  ...NEW_AIRCRAFT_TYPES,
];

// Get aircraft config by type
export function getAircraftConfig(type: AircraftType): AircraftTypeConfig {
  return (
    AIRCRAFT_CONFIGS[type] ||
    NEW_AIRCRAFT_TYPES.find(t => t.type === type) || {
      type,
      label: type,
      icon: '✈️',
      category: 'fixed-wing',
      defaultSpecs: {
        wingspan: 48,
        wingArea: 300,
        weight: 1000,
        minSpeed: 20,
        maxSpeed: 70,
        stallSpeed: 18,
        glideRatio: 7,
        turnRadius: 30,
        rateOfClimb: 700,
      },
      physics: {
        liftCoefficient: 0.5,
        dragCoefficient: 0.04,
        aspectRatio: 5,
        wingLoading: { min: 8, max: 25, optimal: 15 },
      },
    }
  );
}

// Get aircraft by category
export function getAircraftByCategory(category: string): AircraftTypeConfig[] {
  return ALL_AIRCRAFT_TYPES.filter(t => t.category === category);
}
