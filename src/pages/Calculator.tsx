import { useState, useEffect } from 'react';
import { Plane, Save, Calculator, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { getAllAircraft, saveAircraft } from '../lib/db';
import { calculateSuitabilityScore, generateAircraftId } from '../lib/calculations';
import { getDefaultWeather, getWeatherIcon } from '../lib/weather';
import type { Aircraft, AircraftType, FlightCalculations } from '../types';

const AIRCRAFT_TYPES: { value: AircraftType; label: string; icon: string }[] = [
  { value: 'fixed-wing', label: 'Fixed Wing', icon: '🛩️' },
  { value: 'quadcopter', label: 'Quadcopter', icon: '🛸' },
  { value: 'hexacopter', label: 'Hexacopter', icon: '🚀' },
  { value: 'vtol', label: 'VTOL', icon: '✈️' },
  { value: 'helicopter', label: 'Helicopter', icon: '🚁' },
];

export default function CalculatorPage() {
  const [aircraft, setAircraft] = useState<Partial<Aircraft>>({
    name: '',
    type: 'fixed-wing',
    wingspan: 48,
    wingArea: 300,
    weight: 1200,
    motor: { kv: 1000, maxVoltage: 22.2, maxCurrent: 50, weight: 150 },
    prop: { diameter: 10, pitch: 4 },
    battery: { cells: 4, capacity: 5000, dischargeRate: 50, voltage: 14.8 },
  });
  
  const [calculations, setCalculations] = useState<FlightCalculations | null>(null);
  const [savedModels, setSavedModels] = useState<Aircraft[]>([]);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    loadSavedModels();
  }, []);

  useEffect(() => {
    if (aircraft.weight && aircraft.motor && aircraft.battery && aircraft.prop) {
      const fullAircraft: Aircraft = {
        id: 'temp',
        name: aircraft.name || 'Unnamed',
        type: aircraft.type || 'fixed-wing',
        wingspan: aircraft.wingspan || 48,
        wingArea: aircraft.wingArea || 300,
        weight: aircraft.weight || 1200,
        motor: aircraft.motor,
        prop: aircraft.prop,
        battery: aircraft.battery,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const result = calculateSuitabilityScore(fullAircraft, getDefaultWeather());
      setCalculations(result);
    }
  }, [aircraft]);

  async function loadSavedModels() {
    try {
      const models = await getAllAircraft();
      setSavedModels(models);
    } catch (e) {
      console.error('Failed to load models', e);
    }
  }

  function loadModel(model: Aircraft) {
    setAircraft(model);
  }

  async function handleSave() {
    const now = new Date().toISOString();
    const newAircraft: Aircraft = {
      ...(aircraft as Aircraft),
      id: generateAircraftId(),
      createdAt: now,
      updatedAt: now,
    };
    
    try {
      await saveAircraft(newAircraft);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
      loadSavedModels();
    } catch (e) {
      console.error('Failed to save', e);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Flight Calculator</h1>
          <p className="text-slate-400 mt-1">Calculate flight characteristics for your model</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-400" />
              Aircraft Specifications
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Model Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="My Awesome Plane"
                  value={aircraft.name}
                  onChange={e => setAircraft({ ...aircraft, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Aircraft Type</label>
                <select 
                  className="input"
                  value={aircraft.type}
                  onChange={e => setAircraft({ ...aircraft, type: e.target.value as AircraftType })}
                >
                  {AIRCRAFT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Total Weight (grams)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.weight}
                  onChange={e => setAircraft({ ...aircraft, weight: parseFloat(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="label">Wingspan (inches)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.wingspan}
                  onChange={e => setAircraft({ ...aircraft, wingspan: parseFloat(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="label">Wing Area (sq inches)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.wingArea}
                  onChange={e => setAircraft({ ...aircraft, wingArea: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Motor Specs */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Motor Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">KV Rating</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.motor?.kv}
                  onChange={e => setAircraft({ 
                    ...aircraft, 
                    motor: { ...aircraft.motor!, kv: parseFloat(e.target.value) }
                  })}
                />
              </div>
              <div>
                <label className="label">Max Voltage (V)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={aircraft.motor?.maxVoltage}
                  onChange={e => setAircraft({ 
                    ...aircraft, 
                    motor: { ...aircraft.motor!, maxVoltage: parseFloat(e.target.value) }
                  })}
                />
              </div>
              <div>
                <label className="label">Max Current (A)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.motor?.maxCurrent}
                  onChange={e => setAircraft({ 
                    ...aircraft, 
                    motor: { ...aircraft.motor!, maxCurrent: parseFloat(e.target.value) }
                  })}
                />
              </div>
              <div>
                <label className="label">Weight (g)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.motor?.weight}
                  onChange={e => setAircraft({ 
                    ...aircraft, 
                    motor: { ...aircraft.motor!, weight: parseFloat(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Propeller */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Propeller</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Diameter (inches)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={aircraft.prop?.diameter}
                  onChange={e => setAircraft({ 
                    ...aircraft, 
                    prop: { ...aircraft.prop!, diameter: parseFloat(e.target.value) }
                  })}
                />
              </div>
              <div>
                <label className="label">Pitch (inches)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={aircraft.prop?.pitch}
                  onChange={e => setAircraft({ 
                    ...aircraft, 
                    prop: { ...aircraft.prop!, pitch: parseFloat(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Battery */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Battery</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Cell Count (S)</label>
                <select 
                  className="input"
                  value={aircraft.battery?.cells}
                  onChange={e => {
                    const cells = parseInt(e.target.value);
                    setAircraft({ 
                      ...aircraft, 
                      battery: { ...aircraft.battery!, cells, voltage: cells * 3.7 }
                    });
                  }}
                >
                  <option value="2">2S</option>
                  <option value="3">3S</option>
                  <option value="4">4S</option>
                  <option value="5">5S</option>
                  <option value="6">6S</option>
                </select>
              </div>
              <div>
                <label className="label">Capacity (mAh)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.battery?.capacity}
                  onChange={e => setAircraft({ 
                    ...aircraft, 
                    battery: { ...aircraft.battery!, capacity: parseFloat(e.target.value) }
                  })}
                />
              </div>
              <div>
                <label className="label">Discharge Rate (C)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.battery?.dischargeRate}
                  onChange={e => setAircraft({ 
                    ...aircraft, 
                    battery: { ...aircraft.battery!, dischargeRate: parseFloat(e.target.value) }
                  })}
                />
              </div>
              <div>
                <label className="label">Voltage (V)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input bg-slate-700"
                  value={aircraft.battery?.voltage}
                  disabled
                />
              </div>
            </div>
          </div>

          <button 
            className={`btn-primary w-full flex items-center justify-center gap-2 ${savedMessage ? 'bg-green-500' : ''}`}
            onClick={handleSave}
          >
            {savedMessage ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Model
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="card p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-sky-400" />
              Flight Analysis
            </h2>
            
            {calculations && (
              <div className="space-y-4">
                {/* Score */}
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">{getWeatherIcon(getDefaultWeather())}</div>
                  <div className={`text-4xl font-bold ${
                    calculations.suitabilityLevel === 'excellent' ? 'text-green-400' :
                    calculations.suitabilityLevel === 'good' ? 'text-lime-400' :
                    calculations.suitabilityLevel === 'marginal' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {calculations.suitabilityScore}
                  </div>
                  <div className={`text-sm font-medium ${
                    calculations.suitabilityLevel === 'excellent' ? 'text-green-400' :
                    calculations.suitabilityLevel === 'good' ? 'text-lime-400' :
                    calculations.suitabilityLevel === 'marginal' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {calculations.suitabilityLevel.toUpperCase()} CONDITIONS
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Wing Loading</span>
                      <span className="font-mono text-white">{calculations.wingLoading.toFixed(1)} oz/ft²</span>
                    </div>
                    <div className="gauge mt-2">
                      <div 
                        className={`gauge-fill ${
                          calculations.wingLoading <= 20 ? 'bg-green-500' :
                          calculations.wingLoading <= 35 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, calculations.wingLoading * 2)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Thrust/Weight</span>
                      <span className="font-mono text-white">{calculations.thrustToWeight.toFixed(2)}</span>
                    </div>
                    <div className="gauge mt-2">
                      <div 
                        className={`gauge-fill ${
                          calculations.thrustToWeight >= 0.5 ? 'bg-green-500' :
                          calculations.thrustToWeight >= 0.3 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, calculations.thrustToWeight * 150)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400">Est. Speed</div>
                      <div className="font-mono text-lg text-sky-400">{calculations.estimatedSpeed.toFixed(0)} mph</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400">Flight Time</div>
                      <div className="font-mono text-lg text-sky-400">{calculations.flightTime} min</div>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {calculations.warnings.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Warnings
                    </div>
                    <ul className="text-xs text-amber-300 space-y-1">
                      {calculations.warnings.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {calculations.recommendations.length > 0 && (
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3">
                    <div className="text-sky-400 text-sm font-medium mb-2">Recommendations</div>
                    <ul className="text-xs text-sky-300 space-y-1">
                      {calculations.recommendations.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Saved Models */}
          {savedModels.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Saved Models</h3>
              <div className="space-y-2">
                {savedModels.map(model => (
                  <button
                    key={model.id}
                    className="w-full text-left p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                    onClick={() => loadModel(model)}
                  >
                    <div className="font-medium text-white text-sm">{model.name}</div>
                    <div className="text-xs text-slate-400">{model.type} • {model.weight}g</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
