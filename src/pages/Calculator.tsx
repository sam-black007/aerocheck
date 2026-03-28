import { useState, useMemo } from 'react';
import {
  Plane, Calculator, Battery, Zap, Gauge, Wind, Droplets, AlertTriangle,
  CheckCircle, XCircle, Info, ArrowRight, RefreshCw, Settings, Crosshair,
  Activity, Target, Flame, Timer, Mountain, TrendingUp, Zap as ZapIcon
} from 'lucide-react';
import { getDefaultWeather, getWeatherIcon } from '../lib/weather';

const AIRCRAFT_TYPES = [
  { id: 'parkflyer', name: 'Park Flyer', wingLoading: 8, speed: 25, difficulty: 1 },
  { id: 'sport', name: 'Sport Plane', wingLoading: 12, speed: 45, difficulty: 2 },
  { id: 'scale', name: 'Scale Model', wingLoading: 16, speed: 35, difficulty: 3 },
  { id: 'warbird', name: 'Warbird', wingLoading: 20, speed: 55, difficulty: 3 },
  { id: 'jet', name: 'Jet', wingLoading: 25, speed: 80, difficulty: 4 },
  { id: 'glider', name: 'Glider/Sailplane', wingLoading: 6, speed: 20, difficulty: 2 },
  { id: 'quad', name: 'Quadcopter', wingLoading: 0, speed: 30, difficulty: 2 },
  { id: 'helicopter', name: 'Helicopter', wingLoading: 0, speed: 25, difficulty: 4 },
];

const BATTERY_TYPES = [
  { cells: 3, name: '3S LiPo', voltage: 11.1 },
  { cells: 4, name: '4S LiPo', voltage: 14.8 },
  { cells: 6, name: '6S LiPo', voltage: 22.2 },
  { cells: 12, name: '12S LiPo', voltage: 44.4 },
];

const PROPELLER_SIZES = [
  { diameter: 6, pitch: 3, name: '6x3" Slow Fly' },
  { diameter: 8, pitch: 4, name: '8x4" Slow Fly' },
  { diameter: 10, pitch: 4, name: '10x4" SF' },
  { diameter: 10, pitch: 6, name: '10x6" Sport' },
  { diameter: 11, pitch: 7, name: '11x7" Sport' },
  { diameter: 12, pitch: 6, name: '12x6" Sport' },
  { diameter: 12, pitch: 8, name: '12x8" Sport' },
  { diameter: 14, pitch: 7, name: '14x7" Scale' },
  { diameter: 15, pitch: 8, name: '15x8" Scale' },
  { diameter: 16, pitch: 10, name: '16x10" Scale' },
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
  windSpeed: number
) {
  const weightLbs = weight / 453.592;
  const wingLoading = wingArea > 0 ? (weightLbs * 144) / wingArea : 0;
  const aspectRatio = wingArea > 0 ? (wingspan * wingspan) / wingArea : 0;
  const stallSpeed = wingArea > 0 ? Math.sqrt(wingLoading / 0.06) * 0.9 : 0;
  const cruiseSpeed = 1.5 * stallSpeed;
  const maxSpeed = 2.5 * stallSpeed;
  const takeOffDistance = wingLoading * 15;
  const climbRate = Math.max(100, 1000 - (wingLoading * 20));
  const batteryCap = 5000;
  const currentDraw = (propDiameter * propPitch * propDiameter * 0.00005 * Math.pow(motorKv * batteryVoltage, 1.5)) / 10;
  const flightTime = batteryCap / (currentDraw * 1000) * 60;
  const densityAltitude = ((temperature - 15) * 120) + 0;
  const trueAirspeed = cruiseSpeed * (1 + densityAltitude / 10000);
  const range = trueAirspeed * (flightTime / 60);
  const thrust = propDiameter * propPitch * 0.00015 * Math.pow(motorKv * batteryVoltage, 1.5);
  const thrustLbs = thrust / 453.592;
  const thrustToWeight = weightLbs > 0 ? thrustLbs / weightLbs : 0;
  const windCorrection = windSpeed * 0.1;
  const safeLandingSpeed = stallSpeed * 1.3 + windCorrection;

  let suitability = 'excellent';
  let warnings: string[] = [];
  let recommendations: string[] = [];

  if (thrustToWeight < 0.5) {
    suitability = 'poor';
    warnings.push('Thrust-to-weight ratio is below recommended minimum of 0.5');
  } else if (thrustToWeight < 0.7) {
    suitability = 'marginal';
    warnings.push('Low thrust-to-weight ratio may limit maneuverability');
  } else if (thrustToWeight < 1.0) {
    suitability = 'good';
    recommendations.push('Good thrust for sport flying');
  } else {
    recommendations.push('Excellent thrust for aggressive maneuvers');
  }

  if (wingLoading > 25) {
    warnings.push('High wing loading - reduced maneuverability');
    suitability = suitability === 'excellent' ? 'good' : suitability;
  } else if (wingLoading > 15) {
    recommendations.push('Moderate wing loading suitable for sport flying');
  }

  if (temperature > 30) {
    recommendations.push('Warm weather - expect reduced flight time due to battery heat');
  } else if (temperature < 5) {
    warnings.push('Cold weather - pre-warm batteries for optimal performance');
  }

  if (windSpeed > 15) {
    warnings.push('Wind conditions may be challenging for this setup');
    if (suitability === 'excellent') suitability = 'good';
    if (suitability === 'good') suitability = 'marginal';
  }

  return {
    wingLoading: wingLoading.toFixed(1),
    aspectRatio: aspectRatio.toFixed(1),
    stallSpeed: Math.round(stallSpeed),
    cruiseSpeed: Math.round(cruiseSpeed),
    maxSpeed: Math.round(maxSpeed),
    takeOffDistance: Math.round(takeOffDistance),
    climbRate: Math.round(climbRate),
    flightTime: Math.round(flightTime),
    range: Math.round(range),
    thrustToWeight: thrustToWeight.toFixed(2),
    currentDraw: Math.round(currentDraw),
    densityAltitude: Math.round(densityAltitude),
    trueAirspeed: Math.round(trueAirspeed),
    safeLandingSpeed: Math.round(safeLandingSpeed),
    suitability,
    warnings,
    recommendations,
  };
}

function getSuitabilityColor(level: string) {
  const colors = {
    excellent: 'text-green-400 bg-green-500/20 border-green-500/30',
    good: 'text-lime-400 bg-lime-500/20 border-lime-500/30',
    marginal: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    poor: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    unsafe: 'text-red-400 bg-red-500/20 border-red-500/30',
  };
  return colors[level as keyof typeof colors] || colors.marginal;
}

function getSuitabilityLabel(level: string) {
  const labels = {
    excellent: 'Excellent',
    good: 'Good',
    marginal: 'Marginal',
    poor: 'Poor',
    unsafe: 'Unsafe',
  };
  return labels[level as keyof typeof labels] || 'Unknown';
}

export default function CalculatorPage() {
  const [aircraftType, setAircraftType] = useState('sport');
  const [weight, setWeight] = useState(1200);
  const [wingspan, setWingspan] = useState(48);
  const [wingArea, setWingArea] = useState(300);
  const [motorKv, setMotorKv] = useState(1200);
  const [batteryCells, setBatteryCells] = useState(3);
  const [propDiameter, setPropDiameter] = useState(11);
  const [propPitch, setPropPitch] = useState(7);
  const [temperature, setTemperature] = useState(22);
  const [windSpeed, setWindSpeed] = useState(8);

  const batteryVoltage = batteryCells * 3.7;

  const results = useMemo(() => calculateFlightData(
    weight, wingspan, wingArea, motorKv, batteryVoltage, propDiameter, propPitch, temperature, windSpeed
  ), [weight, wingspan, wingArea, motorKv, batteryVoltage, propDiameter, propPitch, temperature, windSpeed]);

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="hero-panel px-6 py-7 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr,0.8fr]">
          <div>
            <div className="section-kicker">RC Flight Systems</div>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-wider text-white">
              Flight Calculator
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Calculate performance metrics, flight times, and weather suitability for your RC aircraft.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="data-chip">Physics Engine</span>
              <span className="data-chip">Battery Analysis</span>
              <span className="data-chip">Weather Correction</span>
            </div>
          </div>

          <div className="cockpit-panel p-5 text-center">
            <div className="section-kicker">Flight Rating</div>
            <div className={`mt-4 rounded-xl border px-6 py-4 ${getSuitabilityColor(results.suitability)}`}>
              <div className="text-3xl font-bold">{getSuitabilityLabel(results.suitability)}</div>
              <div className="mt-2 text-sm opacity-80">for current conditions</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <section className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <Plane className="h-6 w-6 text-sky-400" />
            <h2 className="text-xl font-semibold text-white">Aircraft Setup</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="label">Aircraft Type</label>
              <select
                className="input"
                value={aircraftType}
                onChange={e => {
                  const type = AIRCRAFT_TYPES.find(t => t.id === e.target.value);
                  setAircraftType(e.target.value);
                  if (type) {
                    setWingArea(Math.round(type.wingLoading * 25));
                  }
                }}
              >
                {AIRCRAFT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Weight (grams)</label>
                <input
                  type="number"
                  className="input"
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  min={100}
                  max={10000}
                />
              </div>
              <div>
                <label className="label">Wingspan (inches)</label>
                <input
                  type="number"
                  className="input"
                  value={wingspan}
                  onChange={e => setWingspan(Number(e.target.value))}
                  min={6}
                  max={120}
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
                max={2000}
              />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <Zap className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-semibold text-white">Power System</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="label">Motor KV Rating</label>
              <input
                type="number"
                className="input"
                value={motorKv}
                onChange={e => setMotorKv(Number(e.target.value))}
                min={500}
                max={5000}
                step={100}
              />
              <div className="mt-1 text-xs text-slate-500">RPM per volt</div>
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
          <h2 className="text-xl font-semibold text-white">Weather Conditions</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Temperature (°C)</label>
            <input
              type="number"
              className="input"
              value={temperature}
              onChange={e => setTemperature(Number(e.target.value))}
              min={-10}
              max={45}
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
          <div className="cockpit-panel flex items-center justify-center">
            <div className="text-center">
              <div className="section-kicker">Conditions</div>
              <div className="mt-2 text-4xl">{temperature > 25 ? (windSpeed > 15 ? '🌧️' : '☀️') : temperature < 5 ? '❄️' : '⛅'}</div>
              <div className="mt-1 text-sm text-slate-400">Environmental</div>
            </div>
          </div>
          <div className="gauge-panel text-center">
            <div className="section-kicker">Density Altitude</div>
            <div className="altitude-display mt-2 text-3xl">{results.densityAltitude} ft</div>
            <div className="mt-1 text-sm text-slate-400">Pressure altitude correction</div>
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
              <Flame className="h-4 w-4" />
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="gauge-panel">
            <div className="section-kicker">Takeoff Distance</div>
            <div className="digital-display mt-2 text-2xl">{results.takeOffDistance} ft</div>
          </div>
          <div className="gauge-panel">
            <div className="section-kicker">Estimated Range</div>
            <div className="digital-display mt-2 text-2xl">{results.range} miles</div>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="font-semibold text-sky-300">Wing Loading</div>
            <div className="mt-2 text-sm text-slate-400">
              Lower values (6-12 oz/sq ft) = better slow flight, easier landing. Higher values = faster, less maneuverable.
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="font-semibold text-emerald-300">Thrust/Weight</div>
            <div className="mt-2 text-sm text-slate-400">
              Above 0.5 = can takeoff vertically. Above 1.0 = rocket-like performance. Below 0.5 = sluggish.
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="font-semibold text-amber-300">Flight Time</div>
            <div className="mt-2 text-sm text-slate-400">
              Estimate based on 80% battery capacity usage. Aggressive flying reduces time by 20-30%.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
