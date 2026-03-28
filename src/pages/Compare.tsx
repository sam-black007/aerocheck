import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plane, Scale, Zap, Gauge, Award } from 'lucide-react';
import { getAllAircraft } from '../lib/db';
import { calculateSuitabilityScore } from '../lib/calculations';
import { calculateAdvancedPhysics } from '../lib/advanced-physics';
import { getDefaultWeather } from '../lib/weather';
import type { Aircraft } from '../types';

export default function ComparePage() {
  const [models, setModels] = useState<Aircraft[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const weather = useMemo(() => getDefaultWeather(), []);

  useEffect(() => {
    void loadModels();
  }, []);

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
      setSelected(selected.filter((entry) => entry !== id));
      return;
    }

    if (selected.length < 4) {
      setSelected([...selected, id]);
    }
  }

  const selectedModels = useMemo(() => models.filter((model) => selected.includes(model.id)), [models, selected]);

  const comparisonData = useMemo(
    () =>
      selectedModels.map((model) => {
        const basic = calculateSuitabilityScore(model, weather);
        const advanced = calculateAdvancedPhysics(model, weather);

        return {
          id: model.id,
          name: model.name,
          type: model.type,
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
      }),
    [selectedModels, weather]
  );

  const bestModel = comparisonData.reduce<(typeof comparisonData)[number] | null>(
    (best, model) => {
      if (!best || model.suitability > best.suitability) {
        return model;
      }

      return best;
    },
    null
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Compare Models</h1>
        <p className="mt-1 text-slate-400">Compare aircraft performance side by side</p>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Scale className="h-5 w-5 text-sky-400" />
          Select Models to Compare (up to 4)
        </h2>
        <div className="flex flex-wrap gap-3">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => toggleModel(model.id)}
              className={`rounded-lg px-4 py-2 font-medium transition-all ${
                selected.includes(model.id)
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {selected.includes(model.id) ? 'Selected | ' : ''}
              {model.name}
            </button>
          ))}
          {models.length === 0 && <p className="text-slate-500">No models saved. Create models first.</p>}
        </div>
      </div>

      {selectedModels.length < 2 ? (
        <div className="card p-12 text-center">
          <Plane className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <h3 className="mb-2 text-lg font-medium text-white">Select at least 2 models</h3>
          <p className="text-slate-400">Choose models from above to see a comparison.</p>
        </div>
      ) : (
        <>
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Zap className="h-5 w-5 text-amber-400" />
              Performance Metrics
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Legend />
                  <Bar dataKey="cruiseSpeed" name="Cruise (mph)" fill="#0ea5e9" />
                  <Bar dataKey="stallSpeed" name="Stall (mph)" fill="#f59e0b" />
                  <Bar dataKey="rateOfClimb" name="Climb (fpm)" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Gauge className="h-5 w-5 text-green-400" />
              Efficiency and Range
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Legend />
                  <Bar dataKey="flightTime" name="Flight Time (min)" fill="#8b5cf6" />
                  <Bar dataKey="range" name="Range (mi)" fill="#ec4899" />
                  <Bar dataKey="efficiency" name="Efficiency (%)" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedModels.map((model) => {
              const data = comparisonData.find((entry) => entry.id === model.id);
              if (!data) {
                return null;
              }

              return (
                <div key={model.id} className="card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20">
                      <Plane className="h-5 w-5 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{model.name}</h3>
                      <p className="text-xs text-slate-400">{model.type}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-400">Wing Loading</span>
                      <span className="font-mono text-white">{data.wingLoading} oz/sq ft</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-400">Thrust/Weight</span>
                      <span className="font-mono text-white">{data.thrustToWeight}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-400">Glide Ratio</span>
                      <span className="font-mono text-white">{data.glideRatio}:1</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-400">Suitability</span>
                      <span
                        className={`font-mono ${
                          data.suitability >= 75 ? 'text-green-400' : data.suitability >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        {data.suitability}/100
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-700 pt-4">
                    <div className="gauge">
                      <div
                        className={`gauge-fill ${
                          data.suitability >= 75 ? 'bg-green-500' : data.suitability >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${data.suitability}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {bestModel && (
            <div className="card border-sky-500/20 bg-gradient-to-r from-sky-500/10 to-green-500/10 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Recommendation</h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-500/20">
                  <Award className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{bestModel.name}</div>
                  <p className="text-slate-400">Best overall suitability score: {bestModel.suitability}/100</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
