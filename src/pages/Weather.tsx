import { useEffect, useState, useCallback } from 'react';
import {
  Sun, Moon, CloudRain, Wind, Droplets, Eye, Thermometer, Gauge, Cloud,
  Navigation, MapPin, Search, RefreshCw, AlertTriangle, Plane, Compass,
  CloudLightning, Snowflake, CloudFog, Wind as WindIcon, Sunset, Sunrise,
  ChevronRight, ChevronLeft, Info, ArrowUp, ArrowDown, Clock, Zap
} from 'lucide-react';
import { fetchCompleteWeatherBriefing, type WeatherBriefingComplete } from '../lib/forecast-api';
import { fetchLocationBriefing, fetchLocationBriefingByCoordinates } from '../lib/live-weather';
import { readCachedCurrentLocation, requestCurrentLocation } from '../lib/current-location';
import { getSettings } from '../lib/db';
import { getWindDirectionName } from '../lib/weather';
import { WEATHER_CODES } from '../types';

function getWeatherIcon(code: number, hour?: number): string {
  const isNight = hour !== undefined && (hour < 6 || hour > 20);
  const weather = WEATHER_CODES[code] || { icon: '☁️', description: 'Unknown' };
  return isNight ? weather.nightIcon || weather.icon : weather.icon;
}

function getUVIndexLevel(uv: number): { label: string; color: string; advice: string } {
  if (uv <= 2) return { label: 'Low', color: 'text-green-400', advice: 'Safe for outdoor activities' };
  if (uv <= 5) return { label: 'Moderate', color: 'text-yellow-400', advice: 'Wear sunscreen if outdoors for extended periods' };
  if (uv <= 7) return { label: 'High', color: 'text-orange-400', advice: 'Reduce sun exposure, wear protective clothing' };
  if (uv <= 10) return { label: 'Very High', color: 'text-red-400', advice: 'Avoid sun exposure during midday hours' };
  return { label: 'Extreme', color: 'text-purple-400', advice: 'Extra protection required, stay indoors if possible' };
}

function getWindLevel(speed: number): { label: string; color: string; rcAdvice: string } {
  if (speed <= 8) return { label: 'Light', color: 'text-green-400', rcAdvice: 'Excellent for all RC aircraft' };
  if (speed <= 15) return { label: 'Moderate', color: 'text-lime-400', rcAdvice: 'Good for most RC aircraft, avoid lightweight' };
  if (speed <= 22) return { label: 'Strong', color: 'text-amber-400', rcAdvice: 'Experienced pilots only, heavy aircraft recommended' };
  if (speed <= 30) return { label: 'Strong', color: 'text-orange-400', rcAdvice: 'Not recommended for RC flying' };
  return { label: 'Severe', color: 'text-red-400', rcAdvice: 'Do not fly RC aircraft' };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDayLength(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default function WeatherPage() {
  const [briefing, setBriefing] = useState<WeatherBriefingComplete | null>(null);
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showHourly, setShowHourly] = useState(false);

  const loadWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompleteWeatherBriefing(lat, lon);
      setBriefing(data);
      setLocationName(name);
    } catch (err) {
      console.error('Weather load failed:', err);
      setError('Failed to load weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedLocation();
  }, [loadWeather]);

  async function loadSavedLocation() {
    try {
      const settings = await getSettings();
      const defaultLocation = settings?.defaultLocation?.trim() || 'New York, NY';
      const briefing = await fetchLocationBriefing(defaultLocation);
      await loadWeather(briefing.location.lat, briefing.location.lon, briefing.location.name);
    } catch (err) {
      await loadWeather(40.7128, -74.0060, 'New York, NY');
    }
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const currentLocation = await requestCurrentLocation();
      const loc = await fetchLocationBriefingByCoordinates(currentLocation.lat, currentLocation.lon);
      await loadWeather(currentLocation.lat, currentLocation.lon, loc.location.name);
    } catch (err) {
      setError('Could not get current location.');
    } finally {
      setLocating(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    try {
      const loc = await fetchLocationBriefing(searchQuery);
      await loadWeather(loc.location.lat, loc.location.lon, loc.location.name);
      setSearchQuery('');
    } catch (err) {
      setError('Location not found.');
    }
  }

  const selectedForecast = briefing?.daily[selectedDay];
  const windLevel = briefing ? getWindLevel(briefing.current.windSpeed) : null;
  const uvLevel = briefing?.daily[0] ? getUVIndexLevel(briefing.daily[0].uvIndex) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="hero-panel px-6 py-7 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr,0.8fr]">
          <div>
            <div className="section-kicker">Weather Intelligence</div>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-wider text-white">
              Aviation Weather
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Comprehensive weather briefing with 7-day forecast, aviation data, and RC flight recommendations.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="data-chip">Open-Meteo API</span>
              {briefing && <span className="data-chip">{locationName}</span>}
              <span className="badge-info">7-Day Forecast</span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,8rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  className="input pl-11"
                  placeholder="Search city or airport..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button className="btn-primary" onClick={handleSearch} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn-secondary" onClick={handleUseCurrentLocation} disabled={locating}>
                {locating ? 'Locating...' : 'Use My Location'}
              </button>
            </div>
          </div>

          {briefing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="cockpit-panel p-5 text-center">
                <div className="section-kicker">Current Conditions</div>
                <div className="mt-3 text-6xl">{getWeatherIcon(briefing.current.precipitation > 0 ? 63 : briefing.current.cloudCeiling < 5000 ? 2 : 0, new Date().getHours())}</div>
                <div className="digital-display mt-2 text-5xl">{briefing.current.temperature}°C</div>
                <div className="mt-2 text-slate-400">{briefing.current.description}</div>
              </div>

              <div className="cockpit-panel p-5">
                <div className="section-kicker">RC Conditions</div>
                <div className="mt-3">
                  <div className={`text-2xl font-bold ${windLevel?.color}`}>{windLevel?.label}</div>
                  <div className="mt-2 text-sm text-slate-400">{windLevel?.rcAdvice}</div>
                </div>
              </div>

              <div className="gauge-panel">
                <div className="section-kicker">Wind</div>
                <div className="speed-display mt-2 text-3xl">{briefing.current.windSpeed} mph</div>
                <div className="mt-1 text-sm text-slate-400">{getWindDirectionName(briefing.current.windDirection)}</div>
              </div>

              <div className="gauge-panel">
                <div className="section-kicker">Visibility</div>
                <div className="digital-display mt-2 text-3xl">{briefing.current.visibility} km</div>
                <div className="mt-1 text-sm text-slate-400">Ceiling: {briefing.current.cloudCeiling} ft</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {briefing && (
        <>
          <section className="card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="section-kicker">7-Day Outlook</div>
                <h2 className="mt-1 text-xl font-semibold text-white">Weather Forecast</h2>
              </div>
              <button className="btn-gauge" onClick={() => setShowHourly(!showHourly)}>
                {showHourly ? 'Show Daily' : 'Show Hourly'}
              </button>
            </div>

            {!showHourly ? (
              <div className="grid gap-4 overflow-x-auto pb-2 sm:grid-cols-7">
                {briefing.daily.map((day, i) => (
                  <button
                    key={day.date}
                    className={`weather-forecast-card text-center transition-all ${selectedDay === i ? 'ring-2 ring-sky-400/50' : ''}`}
                    onClick={() => setSelectedDay(i)}
                  >
                    <div className="text-sm font-semibold text-slate-300">{day.dayName}</div>
                    <div className="text-xs text-slate-500">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div className="my-3 text-4xl">{day.icon}</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold text-white">{day.tempMax}°</span>
                      <span className="text-slate-500">{day.tempMin}°</span>
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
                      <Droplets className="h-3 w-3" />
                      {day.precipitationProbability}%
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-500">
                      <WindIcon className="h-3 w-3" />
                      {day.windSpeed} mph
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {briefing.hourly.slice(0, 72).map((hour, i) => (
                    <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center hover:bg-white/[0.05]">
                      <div className="text-xs text-slate-500">{hour.hour}</div>
                      <div className="my-2 text-2xl">{hour.icon}</div>
                      <div className="font-semibold text-white">{hour.temperature}°</div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-500">
                        <WindIcon className="h-3 w-3" />
                        {hour.windSpeed} mph
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-500">
                        <Droplets className="h-3 w-3" />
                        {hour.precipitationProbability}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {selectedForecast && (
            <section className="grid gap-6 lg:grid-cols-[1fr,1fr]">
              <div className="card p-6">
                <div className="section-kicker">{selectedForecast.dayName}</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {selectedForecast.date === briefing.daily[0]?.date ? 'Today' : selectedForecast.dayName}'s Forecast
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="gauge-panel">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                      <Thermometer className="h-4 w-4" />
                      Temperature
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <div className="digital-display text-3xl">{selectedForecast.tempMax}°</div>
                        <div className="text-sm text-slate-400">High</div>
                      </div>
                      <div>
                        <div className="digital-display text-2xl text-slate-400">{selectedForecast.tempMin}°</div>
                        <div className="text-sm text-slate-500">Low</div>
                      </div>
                    </div>
                  </div>

                  <div className="gauge-panel">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                      <Wind className="h-4 w-4" />
                      Wind
                    </div>
                    <div className="mt-3">
                      <div className="digital-display text-3xl">{selectedForecast.windSpeed} mph</div>
                      <div className="text-sm text-slate-400">{getWindDirectionName(selectedForecast.windDirection)}</div>
                    </div>
                  </div>

                  <div className="gauge-panel">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                      <Droplets className="h-4 w-4" />
                      Precipitation
                    </div>
                    <div className="mt-3">
                      <div className="digital-display text-3xl">{selectedForecast.precipitation.toFixed(1)} mm</div>
                      <div className="text-sm text-slate-400">{selectedForecast.precipitationProbability}% chance</div>
                    </div>
                  </div>

                  <div className="gauge-panel">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                      <Sun className="h-4 w-4" />
                      UV Index
                    </div>
                    <div className="mt-3">
                      <div className={`text-3xl font-bold ${getUVIndexLevel(selectedForecast.uvIndex).color}`}>
                        {selectedForecast.uvIndex.toFixed(1)}
                      </div>
                      <div className="text-sm text-slate-400">{getUVIndexLevel(selectedForecast.uvIndex).label}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-500/5 p-4">
                  <div className="section-kicker mb-2">Sun Times</div>
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <Sunrise className="mx-auto h-8 w-8 text-amber-400" />
                      <div className="mt-2 font-mono text-lg text-white">{formatTime(selectedForecast.sunrise)}</div>
                      <div className="text-xs text-slate-500">Sunrise</div>
                    </div>
                    <div className="text-center">
                      <Sunset className="mx-auto h-8 w-8 text-orange-400" />
                      <div className="mt-2 font-mono text-lg text-white">{formatTime(selectedForecast.sunset)}</div>
                      <div className="text-xs text-slate-500">Sunset</div>
                    </div>
                    <div className="text-center">
                      <Clock className="mx-auto h-8 w-8 text-sky-400" />
                      <div className="mt-2 font-mono text-lg text-white">{formatDayLength(selectedForecast.dayLength)}</div>
                      <div className="text-xs text-slate-500">Daylight</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="section-kicker">Aviation Data</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">METAR & TAF</h2>

                <div className="mt-6">
                  <div className="section-kicker mb-2">METAR</div>
                  <div className="metar-display">{briefing.aviationData.metar}</div>
                </div>

                <div className="mt-4">
                  <div className="section-kicker mb-2">TAF</div>
                  <div className="metar-display">{briefing.aviationData.taf}</div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="gauge-panel">
                    <div className="section-kicker">Density Altitude</div>
                    <div className="altitude-display mt-2 text-2xl">{briefing.aviationData.densityAltitude} ft</div>
                  </div>
                  <div className="gauge-panel">
                    <div className="section-kicker">Ceiling</div>
                    <div className="altitude-display mt-2 text-2xl">{briefing.aviationData.ceiling} ft</div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-amber-400" />
                    <div>
                      <div className="font-semibold text-amber-300">RC Flight Recommendation</div>
                      <div className="mt-1 text-sm text-amber-200/80">{windLevel?.rcAdvice}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="card p-6">
            <div className="section-kicker">Cloud Analysis</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Cloud Layers & Coverage</h2>

            <div className="mt-6">
              {briefing.cloudLayers.length > 0 ? (
                <div className="space-y-4">
                  {briefing.cloudLayers.map((layer, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-20 text-right">
                        <div className="font-mono text-lg text-white">{layer.altitude.toLocaleString()} ft</div>
                        <div className="text-xs text-slate-500">Altitude</div>
                      </div>
                      <div className="flex-1">
                        <div className="h-6 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400/30 to-sky-400/60 transition-all"
                            style={{ width: `${layer.coverage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-24">
                        <span className="rounded-lg bg-sky-500/20 px-3 py-1 text-sm text-sky-300">
                          {layer.coverage}% {layer.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-sky-400/20 bg-sky-500/5 p-6 text-center">
                  <Cloud className="mx-auto h-10 w-10 text-sky-400/50" />
                  <div className="mt-3 text-slate-400">Clear skies expected - excellent visibility</div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {error && (
        <div className="fixed bottom-6 right-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 shadow-xl">
          <div className="flex items-center gap-3 text-red-300">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
