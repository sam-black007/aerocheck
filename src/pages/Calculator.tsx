import { useEffect, useState } from 'react';
import { Plane, Save, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import { getAllAircraft, saveAircraft } from '../lib/db';
import { calculateSuitabilityScore, generateAircraftId } from '../lib/calculations';
import { calculateAdvancedPhysics, calculateFlightEnvelope, type AdvancedPhysics } from '../lib/advanced-physics';
import { getDefaultWeather, getWeatherIcon } from '../lib/weather';
import { AIRCRAFT_DEFAULTS } from '../types';
import type { Aircraft, AircraftType, FlightCalculations } from '../types';

const AIRCRAFT_TYPE_OPTIONS: Array<{ value: AircraftType; label: string }> = [
  { value: 'fixed-wing', label: 'Fixed Wing' },
  { value: 'quadcopter', label: 'Quadcopter' },
  { value: 'hexacopter', label: 'Hexacopter' },
  { value: 'vtol', label: 'VTOL' },
  { value: 'helicopter', label: 'Helicopter' },
  { value: 'sailplane', label: 'Sailplane' },
  { value: 'deltawing', label: 'Delta Wing' },
  { value: 'biplane', label: 'Biplane' },
  { value: 'flyingwing', label: 'Flying Wing' },
  { value: 'parkflyer', label: 'Park Flyer' },
  { value: 'warbird', label: 'Warbird' },
  { value: 'jet', label: 'Jet Turbine' },
  { value: 'tricopter', label: 'Tricopter' },
  { value: 'octocopter', label: 'Octocopter' },
  { value: 'hotairballoon', label: 'Hot Air Balloon' },
];

const INITIAL_AIRCRAFT: Partial<Aircraft> = {
  name: '',
  type: 'fixed-wing',
  wingspan: 48,
  wingArea: 300,
  weight: 1200,
  motor: { kv: 1000, maxVoltage: 22.2, maxCurrent: 50, weight: 150 },
  prop: { diameter: 10, pitch: 4 },
  battery: { cells: 4, capacity: 5000, dischargeRate: 50, voltage: 14.8 },
};

export default function CalculatorPage() {
  const [aircraft, setAircraft] = useState<Partial<Aircraft>>(INITIAL_AIRCRAFT);
  const [calculations, setCalculations] = useState<FlightCalculations | null>(null);
  const [advancedPhysics, setAdvancedPhysics] = useState<AdvancedPhysics | null>(null);
  const [flightEnvelope, setFlightEnvelope] = useState<ReturnType<typeof calculateFlightEnvelope> | null>(null);
  const [savedModels, setSavedModels] = useState<Aircraft[]>([]);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    void loadSavedModels();
  }, []);

  useEffect(() => {
    if (aircraft.weight && aircraft.motor && aircraft.battery && aircraft.prop) {
      const fullAircraft: Aircraft = {
        id: 'preview',
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

      setCalculations(calculateSuitabilityScore(fullAircraft, getDefaultWeather()));
      setAdvancedPhysics(calculateAdvancedPhysics(fullAircraft, getDefaultWeather()));
      setFlightEnvelope(calculateFlightEnvelope(fullAircraft));
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

  function handleTypeChange(nextType: AircraftType) {
    const defaults = AIRCRAFT_DEFAULTS[nextType];
    setAircraft((current) => ({
      ...current,
      type: nextType,
      wingspan: defaults.wingspan ?? current.wingspan ?? 0,
      wingArea: defaults.wingArea ?? current.wingArea ?? 0,
      weight: defaults.weight ?? current.weight ?? 0,
    }));
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
      await loadSavedModels();
    } catch (e) {
      console.error('Failed to save model', e);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="hero-panel px-6 py-7 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div>
            <div className="section-kicker">Performance design</div>
            <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-[0.12em] text-white">
              Flight Calculator
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Build a model profile, then review aerodynamic performance, energy margins, and the mission envelope in one pass.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="data-chip">15 aircraft classes</span>
              <span className="data-chip">Advanced physics active</span>
              <span className="data-chip">Standard atmosphere baseline</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="section-kicker">Quick read</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Suitability</div>
                <div className="mt-2 font-mono text-3xl text-white">{calculations?.suitabilityScore ?? '--'}</div>
                <div className="mt-1 text-xs text-slate-400">{calculations?.suitabilityLevel || 'Awaiting setup'}</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Cruise</div>
                <div className="mt-2 font-mono text-3xl text-white">{advancedPhysics?.cruiseSpeed ?? '--'}</div>
                <div className="mt-1 text-xs text-slate-400">mph estimated</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Stall</div>
                <div className="mt-2 font-mono text-3xl text-white">{advancedPhysics?.stallSpeed ?? '--'}</div>
                <div className="mt-1 text-xs text-slate-400">mph floor</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Climb</div>
                <div className="mt-2 font-mono text-3xl text-white">{advancedPhysics?.rateOfClimb ?? '--'}</div>
                <div className="mt-1 text-xs text-slate-400">fpm estimate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr,0.8fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Plane className="h-5 w-5 text-sky-400" />
              Aircraft Specifications
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">Model Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="My Awesome Plane"
                  value={aircraft.name}
                  onChange={(event) => setAircraft({ ...aircraft, name: event.target.value })}
                />
              </div>

              <div>
                <label className="label">Aircraft Type</label>
                <select className="input" value={aircraft.type} onChange={(event) => handleTypeChange(event.target.value as AircraftType)}>
                  {AIRCRAFT_TYPE_OPTIONS.map((typeOption) => (
                    <option key={typeOption.value} value={typeOption.value}>
                      {typeOption.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Total Weight (grams)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.weight}
                  onChange={(event) => setAircraft({ ...aircraft, weight: parseFloat(event.target.value) })}
                />
              </div>

              <div>
                <label className="label">Wingspan (inches)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.wingspan}
                  onChange={(event) => setAircraft({ ...aircraft, wingspan: parseFloat(event.target.value) })}
                />
              </div>

              <div>
                <label className="label">Wing Area (sq inches)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.wingArea}
                  onChange={(event) => setAircraft({ ...aircraft, wingArea: parseFloat(event.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Motor Specifications</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="label">KV Rating</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.motor?.kv}
                  onChange={(event) =>
                    setAircraft({
                      ...aircraft,
                      motor: { ...aircraft.motor!, kv: parseFloat(event.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Max Voltage (V)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={aircraft.motor?.maxVoltage}
                  onChange={(event) =>
                    setAircraft({
                      ...aircraft,
                      motor: { ...aircraft.motor!, maxVoltage: parseFloat(event.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Max Current (A)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.motor?.maxCurrent}
                  onChange={(event) =>
                    setAircraft({
                      ...aircraft,
                      motor: { ...aircraft.motor!, maxCurrent: parseFloat(event.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Weight (g)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.motor?.weight}
                  onChange={(event) =>
                    setAircraft({
                      ...aircraft,
                      motor: { ...aircraft.motor!, weight: parseFloat(event.target.value) },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Propeller</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">Diameter (inches)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={aircraft.prop?.diameter}
                  onChange={(event) =>
                    setAircraft({
                      ...aircraft,
                      prop: { ...aircraft.prop!, diameter: parseFloat(event.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Pitch (inches)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={aircraft.prop?.pitch}
                  onChange={(event) =>
                    setAircraft({
                      ...aircraft,
                      prop: { ...aircraft.prop!, pitch: parseFloat(event.target.value) },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Battery</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="label">Cell Count (S)</label>
                <select
                  className="input"
                  value={aircraft.battery?.cells}
                  onChange={(event) => {
                    const cells = parseInt(event.target.value, 10);
                    setAircraft({
                      ...aircraft,
                      battery: { ...aircraft.battery!, cells, voltage: Number((cells * 3.7).toFixed(1)) },
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
                  onChange={(event) =>
                    setAircraft({
                      ...aircraft,
                      battery: { ...aircraft.battery!, capacity: parseFloat(event.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Discharge Rate (C)</label>
                <input
                  type="number"
                  className="input"
                  value={aircraft.battery?.dischargeRate}
                  onChange={(event) =>
                    setAircraft({
                      ...aircraft,
                      battery: { ...aircraft.battery!, dischargeRate: parseFloat(event.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Voltage (V)</label>
                <input type="number" step="0.1" className="input bg-slate-700" value={aircraft.battery?.voltage} disabled />
              </div>
            </div>
          </div>

          <button className={`btn-primary flex w-full items-center justify-center gap-2 ${savedMessage ? 'bg-green-500' : ''}`} onClick={handleSave}>
            {savedMessage ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Model
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="card p-6 xl:sticky xl:top-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Calculator className="h-5 w-5 text-sky-400" />
              Flight Analysis
            </h2>

            {calculations && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mb-2 text-5xl font-bold">{getWeatherIcon(getDefaultWeather())}</div>
                  <div
                    className={`text-4xl font-bold ${
                      calculations.suitabilityLevel === 'excellent'
                        ? 'text-green-400'
                        : calculations.suitabilityLevel === 'good'
                          ? 'text-lime-400'
                          : calculations.suitabilityLevel === 'marginal'
                            ? 'text-amber-400'
                            : 'text-red-400'
                    }`}
                  >
                    {calculations.suitabilityScore}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      calculations.suitabilityLevel === 'excellent'
                        ? 'text-green-400'
                        : calculations.suitabilityLevel === 'good'
                          ? 'text-lime-400'
                          : calculations.suitabilityLevel === 'marginal'
                            ? 'text-amber-400'
                            : 'text-red-400'
                    }`}
                  >
                    {calculations.suitabilityLevel.toUpperCase()} CONDITIONS
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg bg-slate-700/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Wing Loading</span>
                      <span className="font-mono text-white">{calculations.wingLoading.toFixed(1)} oz/sq ft</span>
                    </div>
                    <div className="gauge mt-2">
                      <div
                        className={`gauge-fill ${
                          calculations.wingLoading <= 20 ? 'bg-green-500' : calculations.wingLoading <= 35 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, calculations.wingLoading * 2)}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-700/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Thrust/Weight</span>
                      <span className="font-mono text-white">{calculations.thrustToWeight.toFixed(2)}</span>
                    </div>
                    <div className="gauge mt-2">
                      <div
                        className={`gauge-fill ${
                          calculations.thrustToWeight >= 0.5
                            ? 'bg-green-500'
                            : calculations.thrustToWeight >= 0.3
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, calculations.thrustToWeight * 150)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 text-center">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Cruise</div>
                      <div className="font-mono text-lg text-sky-300">{advancedPhysics?.cruiseSpeed ?? calculations.estimatedSpeed.toFixed(0)} mph</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 text-center">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Flight Time</div>
                      <div className="font-mono text-lg text-sky-300">{calculations.flightTime} min</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 text-center">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Stall</div>
                      <div className="font-mono text-lg text-white">{advancedPhysics?.stallSpeed ?? '--'} mph</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 text-center">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Climb</div>
                      <div className="font-mono text-lg text-white">{advancedPhysics?.rateOfClimb ?? '--'} fpm</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 text-center">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Glide</div>
                      <div className="font-mono text-lg text-white">{advancedPhysics?.glideRatio ?? '--'}:1</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 text-center">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Motor Eff.</div>
                      <div className="font-mono text-lg text-white">{advancedPhysics?.motorEfficiency ?? '--'}%</div>
                    </div>
                  </div>
                </div>

                {calculations.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      Warnings
                    </div>
                    <ul className="space-y-1 text-xs text-amber-300">
                      {calculations.warnings.map((warning, index) => (
                        <li key={index}>- {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {calculations.recommendations.length > 0 && (
                  <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
                    <div className="mb-2 text-sm font-medium text-sky-400">Recommendations</div>
                    <ul className="space-y-1 text-xs text-sky-300">
                      {calculations.recommendations.map((recommendation, index) => (
                        <li key={index}>- {recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="section-kicker">Envelope</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Min speed</div>
                <div className="mt-2 font-mono text-lg text-white">{flightEnvelope?.minSpeed ?? '--'} mph</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Max speed</div>
                <div className="mt-2 font-mono text-lg text-white">{flightEnvelope?.maxSpeed ?? '--'} mph</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Max altitude</div>
                <div className="mt-2 font-mono text-lg text-white">{flightEnvelope?.maxAltitude ?? '--'} ft</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Range</div>
                <div className="mt-2 font-mono text-lg text-white">{flightEnvelope?.maxRange ?? '--'} mi</div>
              </div>
            </div>
          </div>

          {savedModels.length > 0 && (
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-medium text-slate-300">Saved Models</h3>
              <div className="space-y-2">
                {savedModels.map((model) => (
                  <button
                    key={model.id}
                    className="w-full rounded-[18px] border border-white/10 bg-white/[0.04] p-3 text-left transition-colors hover:bg-white/[0.08]"
                    onClick={() => loadModel(model)}
                  >
                    <div className="text-sm font-medium text-white">{model.name}</div>
                    <div className="text-xs text-slate-400">
                      {model.type} | {model.weight}g
                    </div>
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
