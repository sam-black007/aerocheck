import { useState } from 'react';
import { Cloud, Wind, Thermometer, Mountain, Gauge, Droplets, Eye } from 'lucide-react';
import { getDefaultWeather, getWeatherIcon } from '../lib/weather';
import { simulateWeather } from '../lib/calculations';
import type { WeatherConditions, SimulatedWeather } from '../types';

export default function SimulatorPage() {
  const baseWeather = getDefaultWeather();
  
  const [weather, setWeather] = useState<WeatherConditions>({ ...baseWeather });
  const [altitude, setAltitude] = useState(0);
  const [simulated, setSimulated] = useState<SimulatedWeather>(
    simulateWeather(baseWeather, {}, 0)
  );

  function updateWeather(updates: Partial<WeatherConditions>) {
    const newWeather = { ...weather, ...updates };
    setWeather(newWeather);
    setSimulated(simulateWeather(newWeather, {}, altitude));
  }

  function updateAltitude(newAlt: number) {
    setAltitude(newAlt);
    setSimulated(simulateWeather(weather, {}, newAlt));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Weather Simulator</h1>
        <p className="text-slate-400 mt-1">Test flight conditions under different weather scenarios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-400" />
              Weather Controls
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                  Temperature: {weather.temperature}°C
                </label>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  value={weather.temperature}
                  onChange={e => updateWeather({ temperature: parseInt(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>-20°C</span>
                  <span>50°C</span>
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Wind className="w-4 h-4 text-sky-400" />
                  Wind Speed: {weather.windSpeed} mph
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={weather.windSpeed}
                  onChange={e => updateWeather({ windSpeed: parseInt(e.target.value) })}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Calm</span>
                  <span>50 mph</span>
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Humidity: {weather.humidity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weather.humidity}
                  onChange={e => updateWeather({ humidity: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-400" />
                  Visibility: {weather.visibility} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={weather.visibility}
                  onChange={e => updateWeather({ visibility: parseInt(e.target.value) })}
                  className="w-full accent-green-500"
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-purple-400" />
                  Altitude: {altitude} ft
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={altitude}
                  onChange={e => updateAltitude(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Sea Level</span>
                  <span>10,000 ft</span>
                </div>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="card p-6">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-secondary text-sm"
                onClick={() => {
                  updateWeather({ temperature: 22, windSpeed: 5, humidity: 50 });
                  updateAltitude(0);
                }}
              >
                Perfect Day
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={() => {
                  updateWeather({ temperature: 35, windSpeed: 15, humidity: 70 });
                  updateAltitude(0);
                }}
              >
                Hot & Windy
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={() => {
                  updateWeather({ temperature: 5, windSpeed: 20, humidity: 40 });
                  updateAltitude(2000);
                }}
              >
                Cold Mountain
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={() => {
                  updateWeather({ temperature: 15, windSpeed: 30, humidity: 80 });
                  updateAltitude(0);
                }}
              >
                Storm Warning
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Current Conditions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Simulated Conditions
            </h2>
            
            <div className="text-center mb-6">
              <span className="text-6xl">{getWeatherIcon(simulated)}</span>
              <p className="text-xl text-white mt-2 capitalize">{simulated.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-sm">Temperature</span>
                </div>
                <span className={`stat-value ${
                  simulated.temperature < 5 || simulated.temperature > 35 
                    ? 'text-amber-400' 
                    : 'text-green-400'
                }`}>
                  {simulated.temperature}°C
                </span>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Wind className="w-4 h-4" />
                  <span className="text-sm">Wind</span>
                </div>
                <span className={`stat-value ${
                  simulated.windSpeed > 20 ? 'text-red-400' :
                  simulated.windSpeed > 10 ? 'text-amber-400' : 'text-green-400'
                }`}>
                  {simulated.windSpeed} mph
                </span>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Droplets className="w-4 h-4" />
                  <span className="text-sm">Humidity</span>
                </div>
                <span className="stat-value text-cyan-400">{simulated.humidity}%</span>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Visibility</span>
                </div>
                <span className="stat-value text-green-400">{simulated.visibility} km</span>
              </div>
            </div>
          </div>

          {/* Density Altitude */}
          <div className="card p-6 bg-gradient-to-br from-purple-900/30 to-sky-900/30">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Mountain className="w-5 h-5 text-purple-400" />
              Density Altitude
            </h2>
            
            <div className="text-center">
              <div className="text-5xl font-bold font-mono text-white mb-2">
                {simulated.densityAltitude.toLocaleString()} ft
              </div>
              <p className="text-sm text-slate-400">
                {simulated.densityAltitude < 3000 
                  ? 'Standard conditions - optimal performance'
                  : simulated.densityAltitude < 6000
                  ? 'Reduced air density - expect longer takeoffs'
                  : 'High altitude - significant power loss expected'}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">True Airspeed</span>
                <span className="font-mono text-white">{simulated.trueAirspeed} mph</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pressure Altitude</span>
                <span className="font-mono text-white">{altitude} ft</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Altitude Gain</span>
                <span className={`font-mono ${
                  simulated.densityAltitude > altitude ? 'text-amber-400' : 'text-green-400'
                }`}>
                  +{Math.round(simulated.densityAltitude - altitude)} ft
                </span>
              </div>
            </div>
          </div>

          {/* Performance Impact */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-sky-400" />
              Performance Impact
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Takeoff Distance</span>
                <span className={`font-mono ${
                  simulated.densityAltitude > 3000 ? 'text-amber-400' : 'text-green-400'
                }`}>
                  +{Math.round((simulated.densityAltitude / 1000) * 15)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Climb Rate</span>
                <span className="font-mono text-red-400">
                  -{Math.min(50, Math.round(simulated.densityAltitude / 200))}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Flight Time</span>
                <span className="font-mono text-amber-400">
                  -{Math.round(simulated.temperature > 30 ? 10 : 5)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
