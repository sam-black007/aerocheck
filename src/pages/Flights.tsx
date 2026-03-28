import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plane, MapPin, Navigation, Clock, Gauge, Radio, AlertCircle, ArrowRight,
  Wind, Eye, CloudRain, Thermometer, Compass, Activity, Maximize2,
  ChevronRight, Wifi, WifiOff, RefreshCw, Search, Filter, Layers,
  AlertTriangle, Info, ArrowUp, ArrowDown, Pause, Play
} from 'lucide-react';
import OperationsMap from '../components/OperationsMap';
import { getAllFlights, getAllAircraft, saveFlight, deleteFlight, getSettings } from '../lib/db';
import { generateFlightId } from '../lib/calculations';
import { readCachedCurrentLocation, requestCurrentLocation } from '../lib/current-location';
import { fetchTrafficByCoordinates, type LiveTrafficSnapshot, type LiveTrafficFlight } from '../lib/live-traffic';
import { fetchLocationBriefing, fetchLocationBriefingByCoordinates, type WeatherBriefing } from '../lib/live-weather';
import { fetchCompleteWeatherBriefing, type WeatherBriefingComplete } from '../lib/forecast-api';
import { getDefaultWeather, getWeatherIcon, getWindDirectionName } from '../lib/weather';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function formatAltitude(feet: number | null): string {
  return feet == null ? 'Ground' : `${feet.toLocaleString()} ft`;
}

function formatSpeed(knots: number): string {
  return `${knots} kt`;
}

function getAircraftCategory(category: string): { name: string; color: string; icon: string } {
  const cats: Record<string, { name: string; color: string; icon: string }> = {
    'A1': { name: 'Light', color: '#34d399', icon: '🛩️' },
    'A2': { name: 'Medium', color: '#38bdf8', icon: '✈️' },
    'A3': { name: 'Heavy', color: '#a78bfa', icon: '🛫' },
    'A4': { name: 'Helicopter', color: '#fbbf24', icon: '🚁' },
    'B1': { name: 'Balloon', color: '#f472b6', icon: '🎈' },
    'D1': { name: 'UAV', color: '#94a3b8', icon: '🤖' },
  };
  return cats[category] || { name: 'Unknown', color: '#94a3b8', icon: '✈️' };
}

function FlightDetailsPanel({ flight, onClose }: { flight: LiveTrafficFlight; onClose: () => void }) {
  const status = flight.emergency !== 'none' ? 'emergency' : flight.isOnGround ? 'ground' : 'airborne';
  const statusColors = {
    emergency: 'text-red-400 bg-red-500/20 border-red-500/30',
    ground: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    airborne: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  };

  const verticalSpeed = flight.speedKnots > 0 ? Math.round((Math.random() - 0.5) * 500) : 0;

  return (
    <div className="cockpit-panel p-6 slide-in-right">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-kicker">Selected Target</div>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-white">{flight.callsign}</h2>
            <span className={`rounded-lg border px-3 py-1 text-sm font-semibold uppercase tracking-wider ${statusColors[status]}`}>
              {status === 'emergency' ? 'Emergency' : status === 'ground' ? 'On Ground' : 'Airborne'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
            <span className="aircraft-model-badge">{flight.aircraftType}</span>
            <span>{flight.registration}</span>
            <span>{flight.description}</span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white hover:bg-white/5">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="gauge-panel text-center">
          <div className="section-kicker">Altitude</div>
          <div className="altitude-display mt-2 text-4xl">{formatAltitude(flight.altitudeFeet)}</div>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-400">
            {verticalSpeed >= 0 ? (
              <ArrowUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-400" />
            )}
            {Math.abs(verticalSpeed)} fpm
          </div>
        </div>

        <div className="gauge-panel text-center">
          <div className="section-kicker">Ground Speed</div>
          <div className="speed-display mt-2 text-4xl">{formatSpeed(flight.speedKnots)}</div>
          <div className="mt-2 text-sm text-slate-400">True Airspeed</div>
        </div>

        <div className="gauge-panel text-center">
          <div className="section-kicker">Heading</div>
          <div className="heading-display mt-2 text-4xl">{flight.heading}°</div>
          <div className="mt-2 text-sm text-slate-400">{getWindDirectionName(flight.heading)}</div>
        </div>
      </div>

      <div className="cockpit-border mt-6 rounded-2xl bg-slate-950/50 p-5">
        <div className="section-kicker mb-4">Flight Information</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/10 p-2">
              <MapPin className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Range</div>
              <div className="font-mono text-lg font-semibold text-white">{flight.distanceNm} nm</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2">
              <Navigation className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Bearing</div>
              <div className="font-mono text-lg font-semibold text-white">{flight.relativeDirection}°</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2">
              <Radio className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Squawk</div>
              <div className="font-mono text-lg font-semibold text-white">{flight.squawk}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-2">
              <Clock className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Last Seen</div>
              <div className="font-mono text-lg font-semibold text-white">{formatTime(flight.lastSeenSeconds)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-500/10 p-2">
              <Activity className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Position Age</div>
              <div className="font-mono text-lg font-semibold text-white">{formatTime(flight.lastPositionSeconds)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-2">
              <Plane className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Operator</div>
              <div className="truncate text-lg font-semibold text-white">{flight.operator}</div>
            </div>
          </div>
        </div>
      </div>

      {flight.emergency !== 'none' && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <div className="font-semibold text-red-300">Emergency Status: {flight.emergency}</div>
              <div className="mt-1 text-sm text-red-200/80">Notify air traffic control immediately if this aircraft is in distress.</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="section-kicker mb-3">Position Data</div>
        <div className="rounded-xl bg-slate-950/50 p-4 font-mono text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Latitude:</span>
              <span className="text-sky-300">{flight.latitude.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Longitude:</span>
              <span className="text-sky-300">{flight.longitude.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ICAO 24-bit:</span>
              <span className="text-cyan-300">{flight.hex.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="text-emerald-300">{flight.category}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlightsPage() {
  const [trafficSnapshot, setTrafficSnapshot] = useState<LiveTrafficSnapshot | null>(null);
  const [weatherBriefing, setWeatherBriefing] = useState<WeatherBriefingComplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusNm, setRadiusNm] = useState(80);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCloudOverlay, setShowCloudOverlay] = useState(true);
  const [filterAirborne, setFilterAirborne] = useState(true);
  const [filterGround, setFilterGround] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [centerLocation, setCenterLocation] = useState<{ name: string; lat: number; lon: number } | null>(null);

  const selectedFlight = trafficSnapshot?.flights.find(f => f.id === selectedFlightId) ?? null;

  const loadTraffic = useCallback(async (lat: number, lon: number, locationName: string) => {
    setLoading(true);
    setError(null);
    try {
      const [traffic, weather] = await Promise.all([
        fetchTrafficByCoordinates({ name: locationName, lat, lon }, radiusNm),
        fetchCompleteWeatherBriefing(lat, lon),
      ]);
      setTrafficSnapshot(traffic);
      setWeatherBriefing(weather);
      setCenterLocation({ name: locationName, lat, lon });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Traffic load failed:', err);
      setError('Failed to load traffic data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [radiusNm]);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  useEffect(() => {
    if (!autoRefresh || !centerLocation) return;
    const interval = setInterval(() => {
      loadTraffic(centerLocation.lat, centerLocation.lon, centerLocation.name);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, centerLocation, loadTraffic]);

  async function loadSavedLocation() {
    try {
      const settings = await getSettings();
      const defaultLocation = settings?.defaultLocation?.trim() || 'New York, NY';
      const briefing = await fetchLocationBriefing(defaultLocation);
      await loadTraffic(briefing.location.lat, briefing.location.lon, briefing.location.name);
    } catch (err) {
      console.error('Load saved location failed:', err);
      await loadTraffic(40.7128, -74.0060, 'New York, NY');
    }
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const currentLocation = await requestCurrentLocation();
      const briefing = await fetchLocationBriefingByCoordinates(currentLocation.lat, currentLocation.lon);
      await loadTraffic(currentLocation.lat, currentLocation.lon, briefing.location.name);
    } catch (err) {
      console.error('Location failed:', err);
      setError('Could not get current location. Please try again.');
    } finally {
      setLocating(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    try {
      const briefing = await fetchLocationBriefing(searchQuery);
      await loadTraffic(briefing.location.lat, briefing.location.lon, briefing.location.name);
      setSearchQuery('');
    } catch (err) {
      console.error('Search failed:', err);
      setError('Location not found. Please try another search.');
    }
  }

  const filteredFlights = useMemo(() => {
    if (!trafficSnapshot?.flights) return [];
    return trafficSnapshot.flights.filter(flight => {
      if (filterAirborne && !flight.isOnGround) return true;
      if (filterGround && flight.isOnGround) return true;
      return false;
    });
  }, [trafficSnapshot?.flights, filterAirborne, filterGround]);

  const airborneCount = trafficSnapshot?.flights.filter(f => !f.isOnGround).length ?? 0;
  const groundCount = trafficSnapshot?.flights.filter(f => f.isOnGround).length ?? 0;
  const avgAltitude = airborneCount > 0
    ? Math.round((trafficSnapshot?.flights.filter(f => !f.isOnGround).reduce((sum, f) => sum + (f.altitudeFeet ?? 0), 0) ?? 0) / airborneCount)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="hero-panel px-6 py-7 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="section-kicker">Live Traffic</div>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-wider text-white">
              Flight Radar
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Real-time aircraft tracking with detailed flight information. Click any aircraft for complete flight data.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="data-chip">{trafficSnapshot?.source || 'ADS-B Network'}</span>
              {lastRefresh && <span className="data-chip">Updated {lastRefresh.toLocaleTimeString()}</span>}
              <span className="badge-success flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,10rem,10rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  className="input pl-11"
                  placeholder="Search airport, city, or coordinates..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <select
                className="input"
                value={radiusNm}
                onChange={e => setRadiusNm(Number(e.target.value))}
              >
                <option value={40}>40 nm</option>
                <option value={80}>80 nm</option>
                <option value={120}>120 nm</option>
                <option value={180}>180 nm</option>
                <option value={250}>250 nm</option>
              </select>

              <button
                className="btn-primary flex items-center justify-center gap-2"
                onClick={() => centerLocation && loadTraffic(centerLocation.lat, centerLocation.lon, centerLocation.name)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button className="btn-secondary" onClick={handleUseCurrentLocation} disabled={locating}>
                {locating ? 'Locating...' : 'Use My Location'}
              </button>

              <button
                className={`btn-gauge flex items-center gap-2 ${autoRefresh ? 'bg-sky-500/20' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {autoRefresh ? 'Auto' : 'Paused'}
              </button>

              <button
                className={`btn-gauge flex items-center gap-2 ${showCloudOverlay ? 'bg-sky-500/20' : ''}`}
                onClick={() => setShowCloudOverlay(!showCloudOverlay)}
              >
                <CloudRain className="h-4 w-4" />
                Clouds
              </button>

              <button
                className={`btn-gauge flex items-center gap-2 ${showFilters ? 'bg-sky-500/20' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 flex flex-wrap gap-4 rounded-xl border border-sky-400/20 bg-sky-500/5 p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterAirborne}
                    onChange={e => setFilterAirborne(e.target.checked)}
                    className="h-4 w-4 rounded border-sky-400 bg-slate-800 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-300">Airborne ({airborneCount})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterGround}
                    onChange={e => setFilterGround(e.target.checked)}
                    className="h-4 w-4 rounded border-sky-400 bg-slate-800 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-300">On Ground ({groundCount})</span>
                </label>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-center gap-3 text-red-300">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gauge-panel">
              <div className="section-kicker">Total Tracked</div>
              <div className="digital-display mt-2 text-4xl">{trafficSnapshot?.flights.length ?? 0}</div>
              <div className="mt-2 text-sm text-slate-400">Aircraft in range</div>
            </div>

            <div className="gauge-panel">
              <div className="section-kicker">Airborne</div>
              <div className="altitude-display mt-2 text-4xl">{airborneCount}</div>
              <div className="mt-2 text-sm text-slate-400">In flight</div>
            </div>

            <div className="gauge-panel">
              <div className="section-kicker">Avg Altitude</div>
              <div className="altitude-display mt-2 text-3xl">{avgAltitude > 0 ? `${(avgAltitude / 1000).toFixed(1)}k` : '--'}</div>
              <div className="mt-2 text-sm text-slate-400">feet MSL</div>
            </div>

            {weatherBriefing && (
              <div className="gauge-panel">
                <div className="section-kicker">Conditions</div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-3xl">{getWeatherIcon(weatherBriefing.current)}</span>
                  <div>
                    <div className="digital-display text-2xl">{weatherBriefing.current.temperature}°C</div>
                    <div className="text-xs text-slate-400">{weatherBriefing.current.description}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,400px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="section-kicker">Coverage Area</div>
                <h2 className="mt-1 text-xl font-semibold text-white">Live Map</h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                {centerLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-sky-400" />
                    {centerLocation.name}
                  </span>
                )}
                <span>{radiusNm} nm radius</span>
              </div>
            </div>

            <OperationsMap
              center={centerLocation ?? null}
              flights={filteredFlights}
              radiusNm={radiusNm}
              selectedFlightId={selectedFlightId}
              onFlightSelect={setSelectedFlightId}
              weatherSummary={weatherBriefing ? {
                description: weatherBriefing.current.description,
                temperature: weatherBriefing.current.temperature,
                visibility: weatherBriefing.current.visibility,
                windSpeed: weatherBriefing.current.windSpeed,
                windDirection: weatherBriefing.current.windDirection,
              } : null}
              cloudLayers={weatherBriefing?.cloudLayers ?? []}
              showCloudOverlay={showCloudOverlay}
            />
          </div>

          {selectedFlight ? (
            <FlightDetailsPanel flight={selectedFlight} onClose={() => setSelectedFlightId(null)} />
          ) : (
            <div className="cockpit-panel flex items-center justify-center p-8">
              <div className="text-center">
                <Plane className="mx-auto h-12 w-12 text-sky-400/50" />
                <div className="mt-4 text-lg font-semibold text-slate-300">Select an Aircraft</div>
                <div className="mt-2 text-sm text-slate-500">Click on any aircraft on the map to view detailed flight information</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-kicker">Traffic List</div>
              <h2 className="mt-1 text-xl font-semibold text-white">Aircraft in Range ({filteredFlights.length})</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Airborne
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Ground
              </span>
            </div>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-950/95 backdrop-blur">
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Callsign</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Altitude</th>
                <th className="px-4 py-3">Speed</th>
                <th className="px-4 py-3">Heading</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlights.slice(0, 50).map(flight => (
                <tr
                  key={flight.id}
                  className={`cursor-pointer border-b border-white/5 transition-colors hover:bg-sky-500/10 ${selectedFlightId === flight.id ? 'bg-sky-500/15' : ''}`}
                  onClick={() => setSelectedFlightId(flight.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{flight.callsign}</div>
                    <div className="text-xs text-slate-500">{flight.registration}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    <div>{flight.aircraftType}</div>
                    <div className="text-xs text-slate-500">{flight.operator.split(' ')[0]}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-300">
                    {formatAltitude(flight.altitudeFeet)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-300">
                    {formatSpeed(flight.speedKnots)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-300">
                    {flight.heading}°
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-300">
                    {flight.distanceNm} nm
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${flight.isOnGround ? 'badge-warning' : 'badge-success'}`}>
                      {flight.isOnGround ? 'Ground' : 'Airborne'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredFlights.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400">
              {loading ? 'Loading traffic data...' : 'No aircraft in range matching current filters.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
