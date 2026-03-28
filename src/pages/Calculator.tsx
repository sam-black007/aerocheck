import { useState, useMemo } from 'react';
import {
  Plane, Calculator, Battery, Zap, Gauge, Wind, Droplets, AlertTriangle,
  CheckCircle, XCircle, Info, Activity, Target, Flame, Timer, Mountain, 
  TrendingUp, Zap as ZapIcon, ChevronDown, Settings, Crosshair, Radio,
  Navigation, Compass, Eye, Thermometer, ArrowUp, ArrowDown
} from 'lucide-react';

const RC_AIRCRAFT_TYPES = [
  // Fixed Wing
  { id: 'parkflyer', name: 'Park Flyer', category: 'Fixed Wing', wingLoading: 6, speed: 25, difficulty: 1, desc: 'Trainer & slow flyer' },
  { id: 'sport', name: 'Sport Plane', category: 'Fixed Wing', wingLoading: 12, speed: 55, difficulty: 2, desc: '3D & aerobatics' },
  { id: 'scale', name: 'Scale Model', category: 'Fixed Wing', wingLoading: 16, speed: 45, difficulty: 3, desc: 'Realistic replicas' },
  { id: 'warbird', name: 'Warbird', category: 'Fixed Wing', wingLoading: 22, speed: 70, difficulty: 3, desc: 'WWII style aircraft' },
  { id: 'jet', name: 'Jet Turbine', category: 'Fixed Wing', wingLoading: 28, speed: 120, difficulty: 4, desc: 'EDF & turbine jets' },
  { id: 'glider', name: 'Glider/Sailplane', category: 'Fixed Wing', wingLoading: 5, speed: 30, difficulty: 2, desc: 'Thermal soaring' },
  { id: 'pylon', name: 'Pylon Racer', category: 'Fixed Wing', wingLoading: 20, speed: 100, difficulty: 4, desc: 'Racing aircraft' },
  { id: 'vtol', name: 'VTOL', category: 'Fixed Wing', wingLoading: 18, speed: 50, difficulty: 3, desc: 'Vertical takeoff' },
  
  // Rotary Wing
  { id: 'quad', name: 'Quadcopter', category: 'Multirotor', wingLoading: 0, speed: 40, difficulty: 2, desc: '4-motor drone' },
  { id: 'hexa', name: 'Hexacopter', category: 'Multirotor', wingLoading: 0, speed: 35, difficulty: 3, desc: '6-motor heavy lift' },
  { id: 'octo', name: 'Octocopter', category: 'Multirotor', wingLoading: 0, speed: 30, difficulty: 4, desc: '8-motor cinema drone' },
  { id: 'tricopter', name: 'Tricopter', category: 'Multirotor', wingLoading: 0, speed: 35, difficulty: 2, desc: '3-motor Y-config' },
  { id: 'helicopter', name: 'Helicopter', category: 'Rotary', wingLoading: 0, speed: 45, difficulty: 4, desc: 'CP/FP heli' },
  
  // Specialty
  { id: 'rocket', name: 'Rocket', category: 'Specialty', wingLoading: 40, speed: 200, difficulty: 3, desc: 'Rocket-powered' },
  { id: 'blimp', name: 'Blimp/Airship', category: 'Specialty', wingLoading: 0, speed: 15, difficulty: 1, desc: 'Indoor/outdoor' },
  { id: 'delta', name: 'Delta Wing', category: 'Fixed Wing', wingLoading: 10, speed: 50, difficulty: 2, desc: 'Flying wing style' },
  { id: 'biplane', name: 'Biplane', category: 'Fixed Wing', wingLoading: 14, speed: 45, difficulty: 2, desc: 'Double wing' },
  { id: 'flyingwing', name: 'Flying Wing', category: 'Fixed Wing', wingLoading: 8, speed: 40, difficulty: 3, desc: 'Stealth design' },
  { id: 'hotair', name: 'Hot Air Balloon', category: 'Specialty', wingLoading: 0, speed: 5, difficulty: 1, desc: 'Thermal craft' },
  { id: 'ornithopter', name: 'Ornithopter', category: 'Specialty', wingLoading: 5, speed: 15, difficulty: 4, desc: 'Flapping wing' },
];

const BATTERY_TYPES = [
  { cells: 1, name: '1S LiPo', voltage: 3.7, capacity: [500, 1000, 1500] },
  { cells: 2, name: '2S LiPo', voltage: 7.4, capacity: [500, 1000, 2200, 3000, 5000] },
  { cells: 3, name: '3S LiPo', voltage: 11.1, capacity: [1000, 2200, 3300, 4000, 5000, 6000] },
  { cells: 4, name: '4S LiPo', voltage: 14.8, capacity: [1300, 2200, 4000, 5000, 6000, 8000] },
  { cells: 6, name: '6S LiPo', voltage: 22.2, capacity: [2200, 4000, 5000, 6000, 8000, 10000] },
  { cells: 8, name: '8S LiPo', voltage: 29.6, capacity: [4000, 5000, 8000, 10000, 12000] },
  { cells: 12, name: '12S LiPo', voltage: 44.4, capacity: [5000, 8000, 10000, 16000] },
  { cells: 16, name: '16S HV LiPo', voltage: 59.2, capacity: [8000, 12000, 16000] },
];

const PROPELLER_SIZES = [
  { diameter: 5, pitch: 3, name: '5x3" Slow Fly', type: 'sf' },
  { diameter: 6, pitch: 4, name: '6x4" Slow Fly', type: 'sf' },
  { diameter: 7, pitch: 5, name: '7x5" Sport', type: 'sport' },
  { diameter: 8, pitch: 4, name: '8x4" Slow Fly', type: 'sf' },
  { diameter: 8, pitch: 6, name: '8x6" Sport', type: 'sport' },
  { diameter: 9, pitch: 6, name: '9x6" Sport', type: 'sport' },
  { diameter: 10, pitch: 4, name: '10x4" Slow Fly', type: 'sf' },
  { diameter: 10, pitch: 6, name: '10x6" Sport', type: 'sport' },
  { diameter: 10, pitch: 7, name: '10x7" Sport', type: 'sport' },
  { diameter: 11, pitch: 7, name: '11x7" Sport', type: 'sport' },
  { diameter: 12, pitch: 6, name: '12x6" Sport', type: 'sport' },
  { diameter: 12, pitch: 8, name: '12x8" Scale', type: 'scale' },
  { diameter: 13, pitch: 8, name: '13x8" Scale', type: 'scale' },
  { diameter: 14, pitch: 7, name: '14x7" Scale', type: 'scale' },
  { diameter: 15, pitch: 8, name: '15x8" Scale', type: 'scale' },
  { diameter: 16, pitch: 10, name: '16x10" Scale', type: 'scale' },
  { diameter: 18, pitch: 10, name: '18x10" Giant Scale', type: 'giant' },
  { diameter: 20, pitch: 10, name: '20x10" Giant Scale', type: 'giant' },
  { diameter: 22, pitch: 12, name: '22x12" Giant Scale', type: 'giant' },
];

const MOTOR_SIZES = [
  { size: '1806', kv: 3000, weight: 18, maxProp: '5x3', desc: 'Tiny whoop' },
  { size: '2204', kv: 2300, weight: 25, maxProp: '5x3', desc: 'Micro quad' },
  { size: '2206', kv: 1800, weight: 32, maxProp: '6x4', desc: 'Racing micro' },
  { size: '2306', kv: 1700, weight: 38, maxProp: '7x4', desc: 'Freestyle' },
  { size: '2806', kv: 1300, weight: 55, maxProp: '8x4', desc: 'Light freestyle' },
  { size: '2208', kv: 1100, weight: 45, maxProp: '8x4', desc: 'Sport flying' },
  { size: '2812', kv: 1000, weight: 75, maxProp: '10x5', desc: 'Sport plane' },
  { size: '3520', kv: 800, weight: 120, maxProp: '12x6', desc: 'Scale plane' },
  { size: '4130', kv: 650, weight: 180, maxProp: '14x7', desc: 'Heavy sport' },
  { size: '5035', kv: 400, weight: 280, maxProp: '18x10', desc: 'Giant scale' },
  { size: '6354', kv: 300, weight: 450, maxProp: '22x12', desc: 'Extra large' },
  { size: '8060', kv: 200, weight: 650, maxProp: '26x14', desc: 'Huge aircraft' },
];

function calculateFlightData(
  weight: number,
  wingspan: number,
  wingArea: number,
  motorKv: number,
  batteryVoltage: number,
  propDiameter: number,
  propPitch: number,
  temperature: number,
  windSpeed: number,
  humidity: number,
  altitude: number
) {
  const weightLbs = weight / 453.592;
  const wingLoading = wingArea > 0 ? (weightLbs * 144) / wingArea : 0;
  const aspectRatio = wingArea > 0 ? (wingspan * wingspan) / wingArea : 8;
  const stallSpeed = wingArea > 0 ? Math.sqrt(wingLoading / 0.06) * 0.85 : 15;
  const cruiseSpeed = 1.5 * stallSpeed;
  const maxSpeed = 2.5 * stallSpeed;
  const takeOffDistance = wingLoading * 18;
  const landingDistance = takeOffDistance * 0.6;
  const climbRate = Math.max(100, 1200 - (wingLoading * 25));
  const batteryCap = 5000;
  const currentDraw = (propDiameter * propPitch * propDiameter * 0.00003 * Math.pow(motorKv * batteryVoltage, 1.4)) / 8;
  const flightTime = batteryCap / (currentDraw * 1000) * 60 * 0.85;
  const densityAltitude = altitude + ((temperature - 15) * 100);
  const densityRatio = 1 - (densityAltitude / 30000);
  const trueAirspeed = cruiseSpeed * Math.sqrt(densityRatio);
  const range = trueAirspeed * (flightTime / 60) * 0.8;
  const thrust = propDiameter * propPitch * 0.00012 * Math.pow(motorKv * batteryVoltage * densityRatio, 1.5);
  const thrustLbs = thrust / 453.592;
  const thrustToWeight = weightLbs > 0 ? thrustLbs / weightLbs : 1;
  const windCorrection = windSpeed * 0.15;
  const safeLandingSpeed = stallSpeed * 1.25 + windCorrection;
  const headwindComponent = windSpeed * 0.7;
  const effectiveRange = range * (1 - headwindComponent / 100);
  const batteryTimeMin = Math.min(flightTime, 10);
  const motorTemp = temperature + (currentDraw / 100) * 5;
  const escTemp = temperature + (currentDraw / 80) * 8;

  let suitability = 'excellent';
  let warnings: string[] = [];
  let recommendations: string[] = [];

  if (thrustToWeight < 0.4) {
    suitability = 'poor';
    warnings.push('Thrust-to-weight ratio is critically low (< 0.4)');
  } else if (thrustToWeight < 0.6) {
    suitability = 'marginal';
    warnings.push('Low thrust-to-weight ratio - limited maneuverability');
  } else if (thrustToWeight < 0.8) {
    suitability = 'good';
    recommendations.push('Adequate power for sport flying');
  } else if (thrustToWeight < 1.0) {
    suitability = 'good';
    recommendations.push('Good thrust for sport and basic 3D');
  } else if (thrustToWeight < 1.5) {
    suitability = 'excellent';
    recommendations.push('Excellent power for 3D and aggressive flying');
  } else {
    suitability = 'excellent';
    recommendations.push('Extreme power - expert pilots only!');
  }

  if (wingLoading > 30) {
    warnings.push('Very high wing loading - not recommended');
    suitability = suitability === 'excellent' ? 'good' : suitability;
  } else if (wingLoading > 20) {
    warnings.push('High wing loading - requires experienced pilot');
    if (suitability === 'excellent') suitability = 'good';
  } else if (wingLoading > 12) {
    recommendations.push('Moderate wing loading - good for sport');
  } else if (wingLoading > 5) {
    recommendations.push('Low wing loading - excellent slow flight');
  }

  if (temperature > 35) {
    warnings.push('High temperature - monitor motor/ESC heat');
    recommendations.push('Consider smaller prop for cooler operations');
  } else if (temperature < 5) {
    warnings.push('Cold weather - pre-warm batteries to 25°C');
    recommendations.push('Expect 20% less flight time in cold');
  }

  if (humidity > 80) {
    warnings.push('High humidity - avoid flying in rain/moisture');
  }

  if (altitude > 3000) {
    warnings.push('High altitude - reduced performance');
    recommendations.push('Use larger prop or higher KV motor');
  }

  if (windSpeed > 20) {
    warnings.push('Strong wind conditions - expert pilots only');
    if (suitability === 'excellent') suitability = 'good';
  } else if (windSpeed > 12) {
    warnings.push('Moderate wind - experienced pilots recommended');
    if (suitability === 'good') suitability = 'marginal';
  } else if (windSpeed <= 5) {
    recommendations.push('Calm conditions - perfect for training');
  }

  if (flightTime < 4) {
    warnings.push('Very short flight time - bring spare batteries');
  } else if (flightTime < 6) {
    recommendations.push('Consider larger battery for more flight time');
  }

  return {
    wingLoading: wingLoading.toFixed(1),
    aspectRatio: aspectRatio.toFixed(1),
    stallSpeed: Math.round(stallSpeed),
    cruiseSpeed: Math.round(cruiseSpeed),
    maxSpeed: Math.round(maxSpeed),
    takeOffDistance: Math.round(takeOffDistance),
    landingDistance: Math.round(landingDistance),
    climbRate: Math.round(climbRate),
    flightTime: Math.round(flightTime),
    range: Math.round(effectiveRange),
    thrustToWeight: thrustToWeight.toFixed(2),
    currentDraw: Math.round(currentDraw),
    densityAltitude: Math.round(densityAltitude),
    densityRatio: (densityRatio * 100).toFixed(1),
    trueAirspeed: Math.round(trueAirspeed),
    safeLandingSpeed: Math.round(safeLandingSpeed),
    batteryTimeMin: Math.round(batteryTimeMin),
    motorTemp: Math.round(motorTemp),
    escTemp: Math.round(escTemp),
    suitability,
    warnings,
    recommendations,
  };
}

function getSuitabilityColor(level: string) {
  const colors: Record<string, string> = {
    excellent: 'text-green-400 bg-green-500/20 border-green-500/30',
    good: 'text-lime-400 bg-lime-500/20 border-lime-500/30',
    marginal: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    poor: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    unsafe: 'text-red-400 bg-red-500/20 border-red-500/30',
  };
  return colors[level] || colors.marginal;
}

function getSuitabilityLabel(level: string) {
  const labels: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    marginal: 'Marginal',
    poor: 'Poor',
    unsafe: 'Unsafe',
  };
  return labels[level] || 'Unknown';
}

export default function CalculatorPage() {
  const [aircraftType, setAircraftType] = useState('sport');
  const [weight, setWeight] = useState(1200);
  const [wingspan, setWingspan] = useState(48);
  const [wingArea, setWingArea] = useState(350);
  const [motorKv, setMotorKv] = useState(1000);
  const [batteryCells, setBatteryCells] = useState(4);
  const [batteryCap, setBatteryCap] = useState(5000);
  const [propDiameter, setPropDiameter] = useState(12);
  const [propPitch, setPropPitch] = useState(8);
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(55);
  const [windSpeed, setWindSpeed] = useState(5);
  const [altitude, setAltitude] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedType = RC_AIRCRAFT_TYPES.find(t => t.id === aircraftType);
  const batteryVoltage = batteryCells * 3.7;

  const results = useMemo(() => calculateFlightData(
    weight, wingspan, wingArea, motorKv, batteryVoltage, propDiameter, propPitch,
    temperature, windSpeed, humidity, altitude
  ), [weight, wingspan, wingArea, motorKv, batteryVoltage, propDiameter, propPitch, temperature, windSpeed, humidity, altitude]);

  const handleTypeChange = (typeId: string) => {
    const type = RC_AIRCRAFT_TYPES.find(t => t.id === typeId);
    if (type) {
      setAircraftType(typeId);
      if (type.wingLoading > 0) {
        setWingArea(Math.round(type.wingLoading * 20));
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="hero-panel px-6 py-7 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr,0.7fr]">
          <div>
            <div className="section-kicker">RC Flight Systems</div>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-wider text-white">
              Flight Calculator
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Calculate performance metrics, battery flight times, and weather suitability for your RC aircraft. Supports all aircraft types.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="data-chip">Physics Engine</span>
              <span className="data-chip">Battery Analysis</span>
              <span className="data-chip">Weather Correction</span>
              <span className="data-chip">Altitude Density</span>
            </div>
          </div>

          <div className="cockpit-panel p-5 text-center">
            <div className="section-kicker">Flight Rating</div>
            <div className={`mt-4 rounded-xl border px-6 py-4 ${getSuitabilityColor(results.suitability)}`}>
              <div className="text-3xl font-bold">{getSuitabilityLabel(results.suitability)}</div>
              <div className="mt-2 text-sm opacity-80">for current conditions</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="gauge-panel">
                <div className="text-xs text-slate-500">T/W Ratio</div>
                <div className={`font-mono text-lg font-bold ${parseFloat(results.thrustToWeight) >= 0.7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {results.thrustToWeight}
                </div>
              </div>
              <div className="gauge-panel">
                <div className="text-xs text-slate-500">Flight Time</div>
                <div className="font-mono text-lg font-bold text-sky-400">
                  {results.flightTime} min
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="h-6 w-6 text-sky-400" />
              <h2 className="text-xl font-semibold text-white">Aircraft Selection</h2>
            </div>
            <button
              className="btn-gauge flex items-center gap-2"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Aircraft Type</label>
              <select
                className="input"
                value={aircraftType}
                onChange={e => handleTypeChange(e.target.value)}
              >
                {Object.entries(
                  RC_AIRCRAFT_TYPES.reduce((acc, type) => {
                    if (!acc[type.category]) acc[type.category] = [];
                    acc[type.category].push(type);
                    return acc;
                  }, {} as Record<string, typeof RC_AIRCRAFT_TYPES>)
                ).map(([category, types]) => (
                  <optgroup key={category} label={category}>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.desc}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {selectedType && (
              <div className="rounded-xl border border-sky-400/20 bg-sky-500/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sky-300">{selectedType.name}</div>
                    <div className="text-sm text-slate-400">{selectedType.desc}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-slate-500">Difficulty</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(d => (
                        <div key={d} className={`h-2 w-3 rounded ${d <= selectedType.difficulty ? 'bg-sky-400' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Weight (grams)</label>
                <input
                  type="number"
                  className="input"
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  min={10}
                  max={50000}
                />
              </div>
              <div>
                <label className="label">Wingspan (inches)</label>
                <input
                  type="number"
                  className="input"
                  value={wingspan}
                  onChange={e => setWingspan(Number(e.target.value))}
                  min={3}
                  max={300}
                />
              </div>
            </div>

            <div>
              <label className="label">Wing Area (sq inches)</label>
              <input
                type="number"
                className="input"
                value={wingArea}
                onChange={e => setWingArea(Number(e.target.value))}
                min={1}
                max={5000}
              />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <Zap className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-semibold text-white">Power System</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Motor KV Rating</label>
              <select
                className="input"
                value={motorKv}
                onChange={e => setMotorKv(Number(e.target.value))}
              >
                {MOTOR_SIZES.map(m => (
                  <option key={`${m.size}-${m.kv}`} value={m.kv}>
                    {m.size} - {m.kv} KV ({m.desc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Battery Configuration</label>
              <div className="grid grid-cols-4 gap-2">
                {BATTERY_TYPES.map(bat => (
                  <button
                    key={bat.cells}
                    className={`rounded-xl border p-3 text-center transition-all ${batteryCells === bat.cells ? 'border-sky-400 bg-sky-500/20 text-sky-300' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}
                    onClick={() => setBatteryCells(bat.cells)}
                  >
                    <div className="font-mono font-semibold">{bat.cells}S</div>
                    <div className="text-xs">{bat.voltage}V</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Battery Capacity (mAh)</label>
              <select
                className="input"
                value={batteryCap}
                onChange={e => setBatteryCap(Number(e.target.value))}
              >
                {(BATTERY_TYPES.find(b => b.cells === batteryCells)?.capacity || [5000]).map(cap => (
                  <option key={cap} value={cap}>{cap} mAh</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Propeller Size</label>
              <select
                className="input"
                value={`${propDiameter}x${propPitch}`}
                onChange={e => {
                  const [d, p] = e.target.value.split('x').map(Number);
                  setPropDiameter(d);
                  setPropPitch(p);
                }}
              >
                {PROPELLER_SIZES.map(prop => (
                  <option key={`${prop.diameter}x${prop.pitch}`} value={`${prop.diameter}x${prop.pitch}`}>
                    {prop.diameter}x{prop.pitch}" - {prop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      </div>

      <section className="card p-6">
        <div className="mb-6 flex items-center gap-3">
          <Wind className="h-6 w-6 text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">Weather & Environment</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label">Temperature (°C)</label>
            <input
              type="number"
              className="input"
              value={temperature}
              onChange={e => setTemperature(Number(e.target.value))}
              min={-20}
              max={50}
            />
          </div>
          <div>
            <label className="label">Humidity (%)</label>
            <input
              type="number"
              className="input"
              value={humidity}
              onChange={e => setHumidity(Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="label">Wind Speed (mph)</label>
            <input
              type="number"
              className="input"
              value={windSpeed}
              onChange={e => setWindSpeed(Number(e.target.value))}
              min={0}
              max={50}
            />
          </div>
          <div>
            <label className="label">Altitude (ft)</label>
            <input
              type="number"
              className="input"
              value={altitude}
              onChange={e => setAltitude(Number(e.target.value))}
              min={0}
              max={15000}
            />
          </div>
          <div className="cockpit-panel flex items-center justify-center">
            <div className="text-center">
              <div className="section-kicker">Density Alt</div>
              <div className="altitude-display mt-2 text-2xl">{results.densityAltitude} ft</div>
              <div className="text-xs text-slate-500">{results.densityRatio}% density</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-6 flex items-center gap-3">
          <Activity className="h-6 w-6 text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">Performance Metrics</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="gauge-panel text-center">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <Mountain className="h-4 w-4" />
              Wing Loading
            </div>
            <div className="digital-display mt-3 text-3xl">{results.wingLoading}</div>
            <div className="text-sm text-slate-400">oz/sq ft</div>
          </div>

          <div className="gauge-panel text-center">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <TrendingUp className="h-4 w-4" />
              Thrust/Weight
            </div>
            <div className={`mt-3 text-3xl font-bold ${parseFloat(results.thrustToWeight) >= 0.7 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {results.thrustToWeight}
            </div>
            <div className="text-sm text-slate-400">ratio</div>
          </div>

          <div className="gauge-panel text-center">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <Gauge className="h-4 w-4" />
              Stall Speed
            </div>
            <div className="altitude-display mt-3 text-3xl">{results.stallSpeed}</div>
            <div className="text-sm text-slate-400">mph</div>
          </div>

          <div className="gauge-panel text-center">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <Gauge className="h-4 w-4" />
              Cruise Speed
            </div>
            <div className="speed-display mt-3 text-3xl">{results.cruiseSpeed}</div>
            <div className="text-sm text-slate-400">mph</div>
          </div>

          <div className="gauge-panel text-center">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <Target className="h-4 w-4" />
              Max Speed
            </div>
            <div className="speed-display mt-3 text-3xl">{results.maxSpeed}</div>
            <div className="text-sm text-slate-400">mph</div>
          </div>

          <div className="gauge-panel text-center">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <ArrowUp className="h-4 w-4" />
              Climb Rate
            </div>
            <div className="altitude-display mt-3 text-3xl">{results.climbRate}</div>
            <div className="text-sm text-slate-400">ft/min</div>
          </div>

          <div className="gauge-panel text-center">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <ZapIcon className="h-4 w-4" />
              Current Draw
            </div>
            <div className="digital-display mt-3 text-3xl">{results.currentDraw}</div>
            <div className="text-sm text-slate-400">amps</div>
          </div>

          <div className="gauge-panel text-center">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              <Timer className="h-4 w-4" />
              Flight Time
            </div>
            <div className="digital-display mt-3 text-3xl">{results.flightTime}</div>
            <div className="text-sm text-slate-400">minutes</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="gauge-panel">
            <div className="section-kicker">Takeoff Distance</div>
            <div className="digital-display mt-2 text-xl">{results.takeOffDistance} ft</div>
          </div>
          <div className="gauge-panel">
            <div className="section-kicker">Landing Distance</div>
            <div className="digital-display mt-2 text-xl">{results.landingDistance} ft</div>
          </div>
          <div className="gauge-panel">
            <div className="section-kicker">Estimated Range</div>
            <div className="digital-display mt-2 text-xl">{results.range} miles</div>
          </div>
          <div className="gauge-panel">
            <div className="section-kicker">Motor Temp Est.</div>
            <div className="digital-display mt-2 text-xl text-amber-400">{results.motorTemp}°C</div>
          </div>
        </div>
      </section>

      {(results.warnings.length > 0 || results.recommendations.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {results.warnings.length > 0 && (
            <div className="card border-orange-500/30 bg-orange-500/5 p-5">
              <div className="mb-4 flex items-center gap-2 text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold">Warnings</h3>
              </div>
              <ul className="space-y-2">
                {results.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-orange-200">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.recommendations.length > 0 && (
            <div className="card border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="mb-4 flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <h3 className="font-semibold">Recommendations</h3>
              </div>
              <ul className="space-y-2">
                {results.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-200">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <Info className="h-5 w-5 text-sky-400" />
          <h2 className="text-lg font-semibold text-white">Understanding the Metrics</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="font-semibold text-sky-300">Wing Loading</div>
            <div className="mt-2 text-sm text-slate-400">
              Lower values (6-12 oz/sq ft) = better slow flight, easier landing. Higher values = faster, less maneuverable.
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="font-semibold text-emerald-300">Thrust/Weight</div>
            <div className="mt-2 text-sm text-slate-400">
              Above 0.5 = can takeoff. Above 1.0 = rocket-like. Below 0.5 = sluggish performance.
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="font-semibold text-amber-300">Flight Time</div>
            <div className="mt-2 text-sm text-slate-400">
              Estimate based on 85% battery usage. Aggressive flying reduces time by 20-30%.
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="font-semibold text-cyan-300">Density Altitude</div>
            <div className="mt-2 text-sm text-slate-400">
              High altitude = less air density = reduced performance. Every 1000ft = ~3% power loss.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
