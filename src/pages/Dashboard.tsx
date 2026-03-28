import { useEffect, useState } from 'react';
import { Plane, Wind, Thermometer, Gauge, AlertTriangle, TrendingUp, Clock, MapPin, CloudRain } from 'lucide-react';
import { getDefaultWeather, getWeatherIcon, getWindDirectionName } from '../lib/weather';
import { getAllAircraft, getAllFlights, getSettings } from '../lib/db';
import { calculateSuitabilityScore } from '../lib/calculations';
import { fetchLocationBriefing } from '../lib/live-weather';
import type { Aircraft, FlightLog, WeatherConditions } from '../types';

export default function Dashboard() {
  const [weather, setWeather] = useState<WeatherConditions>(getDefaultWeather());
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [weatherLocation, setWeatherLocation] = useState('Offline demo');
  const [weatherSource, setWeatherSource] = useState('Open-Meteo');
  const [weatherDetail, setWeatherDetail] = useState('Global weather grid');
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const [ac, fl, settings] = await Promise.all([
        getAllAircraft(),
        getAllFlights(),
        getSettings(),
      ]);

      setAircraft(ac);
      setFlights(fl);

      if (ac.length > 0) {
        setSelectedAircraft(ac[0]);
      }

      const locationQuery = settings?.defaultLocation?.trim() || 'New York, NY';

      try {
        const briefing = await fetchLocationBriefing(locationQuery);
        setWeather(briefing.weather);
        setWeatherLocation(briefing.location.name);
        setWeatherSource(briefing.source);
        setWeatherDetail(briefing.sourceDetail);
        setWeatherError(null);
      } catch (weatherIssue) {
        console.error('Failed to load live weather', weatherIssue);
        setWeather(getDefaultWeather());
        setWeatherLocation('Offline demo');
        setWeatherSource('Fallback weather');
        setWeatherDetail('Default briefing values');
        setWeatherError('Live weather unavailable');
      } finally {
        setWeatherLoading(false);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
      setWeatherLoading(false);
    }
  }

  const flightScore = selectedAircraft
    ? calculateSuitabilityScore(selectedAircraft, weather)
    : null;

  const totalFlightTime = flights.reduce((sum, flight) => sum + flight.duration, 0);
  const avgRating =
    flights.length > 0
      ? (flights.reduce((sum, flight) => sum + flight.rating, 0) / flights.length).toFixed(1)
      : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="hero-panel px-6 py-7 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="section-kicker">Mission control</div>
            <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-[0.12em] text-white">
              Field Overview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Watch the current field picture, your aircraft roster, and the model readiness score from a single operations board.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className={`badge ${weatherError ? 'badge-warning' : 'badge-info'}`}>
                <MapPin className="mr-1 h-3 w-3" />
                {weatherLoading ? 'Loading weather...' : weatherLocation}
              </span>
              <span className="data-chip">{weatherSource}</span>
              <span className="data-chip">{weatherDetail}</span>
              <span className="data-chip">{aircraft.length} aircraft profiles</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="section-kicker">Current outlook</div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-5xl">{getWeatherIcon(weather)}</div>
                <div className="mt-3 text-4xl font-bold text-white">{weather.temperature} deg C</div>
                <div className="mt-2 text-sm text-slate-300">{weather.description}</div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="metric-tile min-w-[9rem]">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Wind</div>
                  <div className="mt-2 font-mono text-xl text-white">{weather.windSpeed} mph</div>
                </div>
                <div className="metric-tile min-w-[9rem]">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Visibility</div>
                  <div className="mt-2 font-mono text-xl text-white">{weather.visibility} km</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr,1fr]">
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <CloudRain className="h-5 w-5 text-sky-400" />
              Current Weather
            </h2>
            <span className="text-4xl">{getWeatherIcon(weather)}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="stat-card">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Thermometer className="h-4 w-4" />
                <span className="text-sm">Temperature</span>
              </div>
              <span className="stat-value text-amber-400">{weather.temperature} deg C</span>
            </div>

            <div className="stat-card">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Wind className="h-4 w-4" />
                <span className="text-sm">Wind Speed</span>
              </div>
              <span className="stat-value text-sky-400">{weather.windSpeed} mph</span>
              <span className="text-xs text-slate-500">{getWindDirectionName(weather.windDirection)}</span>
            </div>

            <div className="stat-card">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Gauge className="h-4 w-4" />
                <span className="text-sm">Humidity</span>
              </div>
              <span className="stat-value text-cyan-400">{weather.humidity}%</span>
            </div>

            <div className="stat-card">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Visibility</span>
              </div>
              <span className="stat-value text-green-400">{weather.visibility} km</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="capitalize">{weather.description}</span>
            <span>{weatherLoading ? 'Refreshing live conditions...' : 'Weather ready for review'}</span>
            {weatherError && <span className="text-amber-400">{weatherError}</span>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
            <Gauge className="h-5 w-5 text-sky-400" />
            Flight Conditions
          </h2>

          {selectedAircraft ? (
            <>
              <div className="mb-6">
                <label className="label">Select Model</label>
                <select
                  className="input"
                  value={selectedAircraft.id}
                  onChange={(event) => {
                    const aircraftMatch = aircraft.find((entry) => entry.id === event.target.value);
                    setSelectedAircraft(aircraftMatch || null);
                  }}
                >
                  {aircraft.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </div>

              {flightScore && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-400">Suitability Score</span>
                      <span
                        className={`font-bold ${
                          flightScore.suitabilityLevel === 'excellent'
                            ? 'text-green-400'
                            : flightScore.suitabilityLevel === 'good'
                              ? 'text-lime-400'
                              : flightScore.suitabilityLevel === 'marginal'
                                ? 'text-amber-400'
                                : 'text-red-400'
                        }`}
                      >
                        {flightScore.suitabilityScore}/100
                      </span>
                    </div>
                    <div className="gauge">
                      <div
                        className={`gauge-fill ${
                          flightScore.suitabilityLevel === 'excellent'
                            ? 'bg-green-500'
                            : flightScore.suitabilityLevel === 'good'
                              ? 'bg-lime-500'
                              : flightScore.suitabilityLevel === 'marginal'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${flightScore.suitabilityScore}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        flightScore.suitabilityLevel === 'excellent'
                          ? 'text-green-400'
                          : flightScore.suitabilityLevel === 'good'
                            ? 'text-lime-400'
                            : flightScore.suitabilityLevel === 'marginal'
                              ? 'text-amber-400'
                              : 'text-red-400'
                      }`}
                    >
                      {flightScore.suitabilityLevel.toUpperCase()} CONDITIONS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <div className="text-xs text-slate-400">Wing Loading</div>
                      <div className="font-mono text-lg text-white">{flightScore.wingLoading.toFixed(1)} oz/sq ft</div>
                    </div>
                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <div className="text-xs text-slate-400">Thrust/Weight</div>
                      <div className="font-mono text-lg text-white">{flightScore.thrustToWeight.toFixed(2)}</div>
                    </div>
                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <div className="text-xs text-slate-400">Est. Speed</div>
                      <div className="font-mono text-lg text-white">{flightScore.estimatedSpeed.toFixed(0)} mph</div>
                    </div>
                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <div className="text-xs text-slate-400">Flight Time</div>
                      <div className="font-mono text-lg text-white">{flightScore.flightTime} min</div>
                    </div>
                  </div>

                  {flightScore.warnings.length > 0 && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        Warnings
                      </div>
                      <ul className="space-y-1 text-xs text-amber-300">
                        {flightScore.warnings.map((warning, index) => (
                          <li key={index}>- {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Plane className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>Add a model in the Model Library to check flight conditions</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20">
              <Plane className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{aircraft.length}</div>
              <div className="text-xs text-slate-400">Total Models</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{flights.length}</div>
              <div className="text-xs text-slate-400">Total Flights</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalFlightTime}</div>
              <div className="text-xs text-slate-400">Flight Minutes</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
              <Gauge className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{avgRating}</div>
              <div className="text-xs text-slate-400">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {flights.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Recent Flights</h2>
          <div className="space-y-3">
            {flights
              .slice(-5)
              .reverse()
              .map((flight) => (
                <div
                  key={flight.id}
                  className="flex flex-col gap-3 rounded-lg bg-slate-700/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20">
                      <Plane className="h-4 w-4 text-sky-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{flight.aircraftName}</div>
                      <div className="text-xs text-slate-400">
                        {flight.date} | {flight.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-sky-400">{flight.duration} min</div>
                    <div className="text-xs text-slate-400">Rating {flight.rating}/5</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
