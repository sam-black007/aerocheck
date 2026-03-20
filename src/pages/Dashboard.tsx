import { useState, useEffect } from 'react';
import { Plane, Wind, Thermometer, Gauge, AlertTriangle, TrendingUp, Clock, MapPin, CloudRain } from 'lucide-react';
import { getDefaultWeather, getWeatherIcon, getWindDirectionName } from '../lib/weather';
import { getAllAircraft, getAllFlights } from '../lib/db';
import { calculateSuitabilityScore } from '../lib/calculations';
import type { Aircraft, FlightLog, WeatherConditions } from '../types';

export default function Dashboard() {
  const [weather] = useState<WeatherConditions>(getDefaultWeather());
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const ac = await getAllAircraft();
      const fl = await getAllFlights();
      setAircraft(ac);
      setFlights(fl);
      if (ac.length > 0) {
        setSelectedAircraft(ac[0]);
      }
    } catch (e) {
      console.error('Failed to load data', e);
    }
  }

  const flightScore = selectedAircraft 
    ? calculateSuitabilityScore(selectedAircraft, weather)
    : null;

  const totalFlightTime = flights.reduce((sum, f) => sum + f.duration, 0);
  const avgRating = flights.length > 0 
    ? (flights.reduce((sum, f) => sum + f.rating, 0) / flights.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your flying conditions</p>
        </div>
        <div className="badge badge-info">
          <Plane className="w-3 h-3 mr-1" />
          {aircraft.length} Models
        </div>
      </div>

      {/* Weather Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-sky-400" />
              Current Weather
            </h2>
            <span className="text-4xl">{getWeatherIcon(weather)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-sm">Temperature</span>
              </div>
              <span className="stat-value text-amber-400">{weather.temperature}°C</span>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Wind className="w-4 h-4" />
                <span className="text-sm">Wind Speed</span>
              </div>
              <span className="stat-value text-sky-400">{weather.windSpeed} mph</span>
              <span className="text-xs text-slate-500">{getWindDirectionName(weather.windDirection)}</span>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Gauge className="w-4 h-4" />
                <span className="text-sm">Humidity</span>
              </div>
              <span className="stat-value text-cyan-400">{weather.humidity}%</span>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Visibility</span>
              </div>
              <span className="stat-value text-green-400">{weather.visibility} km</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 mt-4 capitalize">{weather.description}</p>
        </div>

        {/* Flight Conditions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-sky-400" />
            Flight Conditions
          </h2>
          
          {selectedAircraft ? (
            <>
              <div className="mb-6">
                <label className="label">Select Model</label>
                <select 
                  className="input"
                  value={selectedAircraft.id}
                  onChange={(e) => {
                    const ac = aircraft.find(a => a.id === e.target.value);
                    setSelectedAircraft(ac || null);
                  }}
                >
                  {aircraft.map(ac => (
                    <option key={ac.id} value={ac.id}>{ac.name}</option>
                  ))}
                </select>
              </div>
              
              {flightScore && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Suitability Score</span>
                      <span className={`font-bold ${
                        flightScore.suitabilityLevel === 'excellent' ? 'text-green-400' :
                        flightScore.suitabilityLevel === 'good' ? 'text-lime-400' :
                        flightScore.suitabilityLevel === 'marginal' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {flightScore.suitabilityScore}/100
                      </span>
                    </div>
                    <div className="gauge">
                      <div 
                        className={`gauge-fill ${
                          flightScore.suitabilityLevel === 'excellent' ? 'bg-green-500' :
                          flightScore.suitabilityLevel === 'good' ? 'bg-lime-500' :
                          flightScore.suitabilityLevel === 'marginal' ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${flightScore.suitabilityScore}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      flightScore.suitabilityLevel === 'excellent' ? 'text-green-400' :
                      flightScore.suitabilityLevel === 'good' ? 'text-lime-400' :
                      flightScore.suitabilityLevel === 'marginal' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {flightScore.suitabilityLevel.toUpperCase()} CONDITIONS
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Wing Loading</div>
                      <div className="font-mono text-lg text-white">{flightScore.wingLoading.toFixed(1)} oz/ft²</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Thrust/Weight</div>
                      <div className="font-mono text-lg text-white">{flightScore.thrustToWeight.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Est. Speed</div>
                      <div className="font-mono text-lg text-white">{flightScore.estimatedSpeed.toFixed(0)} mph</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Flight Time</div>
                      <div className="font-mono text-lg text-white">{flightScore.flightTime} min</div>
                    </div>
                  </div>
                  
                  {flightScore.warnings.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Warnings
                      </div>
                      <ul className="text-xs text-amber-300 space-y-1">
                        {flightScore.warnings.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Add a model in the Model Library to check flight conditions</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Plane className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{aircraft.length}</div>
              <div className="text-xs text-slate-400">Total Models</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{flights.length}</div>
              <div className="text-xs text-slate-400">Total Flights</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalFlightTime}</div>
              <div className="text-xs text-slate-400">Flight Minutes</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{avgRating}</div>
              <div className="text-xs text-slate-400">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Flights */}
      {flights.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Flights</h2>
          <div className="space-y-3">
            {flights.slice(-5).reverse().map(flight => (
              <div key={flight.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{flight.aircraftName}</div>
                    <div className="text-xs text-slate-400">{flight.date} • {flight.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sky-400">{flight.duration} min</div>
                  <div className="text-xs text-slate-400">{'⭐'.repeat(flight.rating)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
