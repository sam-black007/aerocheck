import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plane, Scale, Zap, Gauge } from 'lucide-react';
import { getAllAircraft } from '../lib/db';
import { calculateSuitabilityScore } from '../lib/calculations';
import { calculateAdvancedPhysics } from '../lib/advanced-physics';
import { getDefaultWeather } from '../lib/weather';
import type { Aircraft } from '../types';

export default function ComparePage() {
  const [models, setModels] = useState<Aircraft[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    loadModels();
  });

  async function loadModels() {
    try {
      const data = await getAllAircraft();
      setModels(data);
      if (data.length >= 2) {
        setSelected([data[0].id, data[1].id]);
      }
    } catch (e) {
      console.error('Failed to load models', e);
    } finally {
      setLoading(false);
    }
  }

  function toggleModel(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else if (selected.length < 4) {
      setSelected([...selected, id]);
    }
  }

  const selectedModels = models.filter(m => selected.includes(m.id));
  const weather = getDefaultWeather();

  const comparisonData = selectedModels.map(model => {
    const basic = calculateSuitabilityScore(model, weather);
    const advanced = calculateAdvancedPhysics(model, weather);
    
    return {
      name: model.name,
      wingLoading: Math.round(basic.wingLoading),
      thrustToWeight: Math.round(basic.thrustToWeight * 100) / 100,
      cruiseSpeed: advanced.cruiseSpeed,
      stallSpeed: advanced.stallSpeed,
      rateOfClimb: advanced.rateOfClimb,
      glideRatio: advanced.glideRatio,
      flightTime: basic.flightTime,
      suitability: basic.suitabilityScore,
      efficiency: advanced.efficiency,
      range: advanced.range,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Compare Models</h1>
        <p className="text-slate-400 mt-1">Compare aircraft performance side by side</p>
      </div>

      {/* Model Selection */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-sky-400" />
          Select Models to Compare (up to 4)
        </h2>
        <div className="flex flex-wrap gap-3">
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => toggleModel(model.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selected.includes(model.id)
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {selected.includes(model.id) && <span className="mr-2">✓</span>}
              {model.name}
            </button>
          ))}
          {models.length === 0 && (
            <p className="text-slate-500">No models saved. Create models first.</p>
          )}
        </div>
      </div>

      {selectedModels.length < 2 ? (
        <div className="card p-12 text-center">
          <Plane className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-white mb-2">Select at least 2 models</h3>
          <p className="text-slate-400">Choose models from above to see a comparison</p>
        </div>
      ) : (
        <>
          {/* Performance Comparison */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Performance Metrics
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Legend />
                  <Bar dataKey="cruiseSpeed" name="Cruise (mph)" fill="#0ea5e9" />
                  <Bar dataKey="stallSpeed" name="Stall (mph)" fill="#f59e0b" />
                  <Bar dataKey="rateOfClimb" name="Climb (fpm)" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Efficiency Comparison */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-green-400" />
              Efficiency & Range
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Legend />
                  <Bar dataKey="flightTime" name="Flight Time (min)" fill="#8b5cf6" />
                  <Bar dataKey="range" name="Range (mi)" fill="#ec4899" />
                  <Bar dataKey="efficiency" name="Efficiency (%)" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side by Side Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedModels.map((model, i) => {
              const data = comparisonData[i];
              return (
                <div key={model.id} className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                      <Plane className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{model.name}</h3>
                      <p className="text-xs text-slate-400">{model.type}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Wing Loading</span>
                      <span className="font-mono text-white">{data.wingLoading} oz/ft²</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Thrust/Weight</span>
                      <span className="font-mono text-white">{data.thrustToWeight}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Glide Ratio</span>
                      <span className="font-mono text-white">{data.glideRatio}:1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Suitability</span>
                      <span className={`font-mono ${
                        data.suitability >= 75 ? 'text-green-400' :
                        data.suitability >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {data.suitability}/100
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="gauge">
                      <div
                        className={`gauge-fill ${
                          data.suitability >= 75 ? 'bg-green-500' :
                          data.suitability >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${data.suitability}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Winner */}
          <div className="card p-6 bg-gradient-to-r from-sky-500/10 to-green-500/10 border-sky-500/20">
            <h2 className="text-lg font-semibold text-white mb-4">Recommendation</h2>
            {(() => {
              const best = comparisonData.reduce((prev, curr) =>
                curr.suitability > prev.suitability ? curr : prev
              );
              return (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Award className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{best.name}</div>
                    <p className="text-slate-400">
                      Best overall suitability score: {best.suitability}/100
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}

function Award(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
